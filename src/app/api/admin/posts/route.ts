import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

async function getAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "MOD")) return null;
  return dbUser;
}

export async function GET(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const dateRange = searchParams.get("dateRange") || "";
  const sort = searchParams.get("sort") || "newest";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { content: { contains: search, mode: "insensitive" } },
      { author: { username: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (dateRange === "today") {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    where.createdAt = { gte: start };
  } else if (dateRange === "week") {
    const start = new Date(); start.setDate(start.getDate() - 7);
    where.createdAt = { gte: start };
  } else if (dateRange === "month") {
    const start = new Date(); start.setDate(start.getDate() - 30);
    where.createdAt = { gte: start };
  }

  const orderBy = sort === "oldest" ? { createdAt: "asc" as const } : { createdAt: "desc" as const };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        author: { select: { username: true } },
        thread: { select: { title: true, slug: true } },
        _count: { select: { reactions: true } },
      },
      orderBy,
      skip: (page - 1) * 30,
      take: 30,
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({ posts, total, page, totalPages: Math.ceil(total / 30) });
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const body = await request.json();
  const { action, postIds, postId, content, userId, message } = body;

  const ids = postIds || (postId ? [postId] : []);

  if (action === "delete") {
    for (const id of ids) {
      await prisma.post.update({ where: { id }, data: { content: "[Bu mesaj bir moderatör tarafından silindi.]", editedAt: new Date() } });
    }
  } else if (action === "edit" && postId && content) {
    await prisma.post.update({ where: { id: postId }, data: { content, editedAt: new Date() } });
  } else if (action === "warn" && userId && message) {
    await prisma.notification.create({
      data: { userId, type: "mod_warning", content: `Moderatör uyarısı: ${message}` },
    });
  }

  return NextResponse.json({ ok: true });
}
