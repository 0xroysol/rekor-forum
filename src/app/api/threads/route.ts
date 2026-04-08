import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/utils/slug";
import { onThreadCreated } from "@/lib/utils/gamification";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");

  const threads = await prisma.thread.findMany({
    where: categoryId ? { categoryId } : undefined,
    include: {
      author: {
        select: { id: true, username: true, displayName: true, avatar: true, role: true },
      },
      prefix: true,
      _count: { select: { posts: true } },
    },
    orderBy: [{ isPinned: "desc" }, { lastPostAt: "desc" }],
  });

  return NextResponse.json(threads);
}

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  const body = await request.json();
  const { title, content, categoryId, prefixId, tags } = body;

  if (!title || title.length < 5) {
    return NextResponse.json({ error: "Başlık en az 5 karakter olmalıdır" }, { status: 400 });
  }
  if (!content || content.length < 10) {
    return NextResponse.json({ error: "İçerik en az 10 karakter olmalıdır" }, { status: 400 });
  }
  if (!categoryId) {
    return NextResponse.json({ error: "Kategori seçmeniz gerekiyor" }, { status: 400 });
  }

  const slug = await generateUniqueSlug(title);

  // Create thread + first post in transaction
  const thread = await prisma.$transaction(async (tx) => {
    const newThread = await tx.thread.create({
      data: {
        title,
        slug,
        categoryId,
        authorId: dbUser.id,
        prefixId: prefixId || null,
        posts: {
          create: {
            content,
            authorId: dbUser.id,
          },
        },
      },
      include: { prefix: true },
    });

    // Update user postCount
    await tx.user.update({
      where: { id: dbUser.id },
      data: { postCount: { increment: 1 } },
    });

    // Create tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags.slice(0, 5)) {
        const trimmed = tagName.trim().toLowerCase();
        if (!trimmed) continue;

        const tagSlug = trimmed.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        const tag = await tx.tag.upsert({
          where: { slug: tagSlug },
          create: { name: trimmed, slug: tagSlug },
          update: {},
        });

        await tx.threadTag.create({
          data: { threadId: newThread.id, tagId: tag.id },
        }).catch(() => {}); // ignore duplicate
      }
    }

    return newThread;
  });

  // Gamification: reputation, rank, badges
  onThreadCreated(dbUser.id).catch(() => {});

  return NextResponse.json({ thread, slug: thread.slug }, { status: 201 });
}
