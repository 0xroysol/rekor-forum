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
  const categoryId = searchParams.get("categoryId") || "";
  const status = searchParams.get("status") || "";
  const sort = searchParams.get("sort") || "newest";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { author: { username: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (status === "locked") where.isLocked = true;
  if (status === "pinned") where.isPinned = true;

  const orderBy: Record<string, string> = sort === "oldest" ? { createdAt: "asc" } : sort === "replies" ? { replyCount: "desc" } : sort === "views" ? { viewCount: "desc" } : { createdAt: "desc" };

  const [threads, total] = await Promise.all([
    prisma.thread.findMany({
      where,
      include: { author: { select: { username: true } }, category: { select: { name: true } }, prefix: true },
      orderBy,
      skip: (page - 1) * 20,
      take: 20,
    }),
    prisma.thread.count({ where }),
  ]);

  return NextResponse.json({ threads, total, page, totalPages: Math.ceil(total / 20) });
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const body = await request.json();
  const { action, threadIds, threadId, categoryId } = body;

  const ids = threadIds || (threadId ? [threadId] : []);
  if (!ids.length) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  if (action === "pin") {
    for (const id of ids) {
      const t = await prisma.thread.findUnique({ where: { id }, select: { isPinned: true } });
      await prisma.thread.update({ where: { id }, data: { isPinned: !t?.isPinned } });
    }
  } else if (action === "lock") {
    for (const id of ids) {
      const t = await prisma.thread.findUnique({ where: { id }, select: { isLocked: true } });
      await prisma.thread.update({ where: { id }, data: { isLocked: !t?.isLocked } });
    }
  } else if (action === "delete") {
    for (const id of ids) {
      const postIds = (await prisma.post.findMany({ where: { threadId: id }, select: { id: true } })).map(p => p.id);
      if (postIds.length) await prisma.reaction.deleteMany({ where: { postId: { in: postIds } } });
      await prisma.bookmark.deleteMany({ where: { threadId: id } });
      await prisma.threadTag.deleteMany({ where: { threadId: id } });
      await prisma.post.deleteMany({ where: { threadId: id } });
      await prisma.thread.delete({ where: { id } });
    }
  } else if (action === "move" && categoryId) {
    await prisma.thread.updateMany({ where: { id: { in: ids } }, data: { categoryId } });
  } else if (action === "edit") {
    const { title, content, prefixId } = body;
    const id = ids[0];
    if (title) await prisma.thread.update({ where: { id }, data: { title, categoryId: categoryId || undefined, prefixId: prefixId || null } });
    if (content) {
      const firstPost = await prisma.post.findFirst({ where: { threadId: id }, orderBy: { createdAt: "asc" } });
      if (firstPost) await prisma.post.update({ where: { id: firstPost.id }, data: { content, editedAt: new Date() } });
    }
  }

  return NextResponse.json({ ok: true });
}
