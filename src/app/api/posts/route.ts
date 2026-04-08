import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { onPostCreated } from "@/lib/utils/gamification";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("threadId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  if (!threadId) {
    return NextResponse.json({ error: "threadId gerekli" }, { status: 400 });
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { threadId },
      include: {
        author: {
          include: {
            rank: true,
            badges: { include: { badge: true } },
          },
        },
        reactions: true,
      },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
    }),
    prisma.post.count({ where: { threadId } }),
  ]);

  return NextResponse.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
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
  const { threadId, content } = body;

  if (!threadId || !content || content.trim().length === 0) {
    return NextResponse.json({ error: "İçerik boş olamaz" }, { status: 400 });
  }

  // Check thread exists and not locked
  const thread = await prisma.thread.findUnique({ where: { id: threadId }, select: { id: true, isLocked: true, authorId: true, title: true, slug: true } });
  if (!thread) {
    return NextResponse.json({ error: "Konu bulunamadı" }, { status: 404 });
  }
  if (thread.isLocked) {
    return NextResponse.json({ error: "Bu konu kilitlenmiştir" }, { status: 403 });
  }

  const post = await prisma.$transaction(async (tx) => {
    const newPost = await tx.post.create({
      data: { threadId, content, authorId: dbUser.id },
      include: {
        author: { include: { rank: true, badges: { include: { badge: true } } } },
        reactions: true,
      },
    });

    await tx.thread.update({
      where: { id: threadId },
      data: { replyCount: { increment: 1 }, lastPostAt: new Date() },
    });

    await tx.user.update({
      where: { id: dbUser.id },
      data: { postCount: { increment: 1 } },
    });

    // Notify thread owner about the reply
    if (thread.authorId !== dbUser.id) {
      await tx.notification.create({
        data: {
          userId: thread.authorId,
          type: "reply",
          content: `${dbUser.username} konunuza yanıt verdi: ${thread.title}`,
          relatedThreadId: threadId,
          relatedUserId: dbUser.id,
        },
      });
    }

    return newPost;
  });

  // Gamification: reputation, rank, badges
  onPostCreated(dbUser.id).catch(() => {});

  return NextResponse.json(post, { status: 201 });
}
