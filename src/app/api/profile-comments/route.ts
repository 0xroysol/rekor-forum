import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET /api/profile-comments?username=xxx&cursor=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  if (!username) return NextResponse.json({ error: "username gerekli" }, { status: 400 });

  const profile = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!profile) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  const cursor = searchParams.get("cursor");
  const comments = await prisma.profileComment.findMany({
    where: {
      profileId: profile.id,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      author: { select: { id: true, username: true, displayName: true, avatar: true, role: true } },
    },
  });

  return NextResponse.json({ comments });
}

// POST /api/profile-comments
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! }, select: { id: true, isBanned: true, banExpiresAt: true } });
  if (!dbUser) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  // Ban check with auto-expire
  if (dbUser.isBanned) {
    if (dbUser.banExpiresAt && dbUser.banExpiresAt < new Date()) {
      await prisma.user.update({ where: { id: dbUser.id }, data: { isBanned: false, banReason: null, banExpiresAt: null } });
    } else {
      return NextResponse.json({ error: "Hesabınız yasaklanmıştır" }, { status: 403 });
    }
  }

  const { profileUsername, content } = await request.json();
  if (!profileUsername || !content?.trim()) return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  if (content.length > 200) return NextResponse.json({ error: "Maksimum 200 karakter" }, { status: 400 });

  const profile = await prisma.user.findUnique({ where: { username: profileUsername }, select: { id: true } });
  if (!profile) return NextResponse.json({ error: "Profil bulunamadı" }, { status: 404 });

  const comment = await prisma.profileComment.create({
    data: { authorId: dbUser.id, profileId: profile.id, content: content.trim() },
    include: { author: { select: { id: true, username: true, displayName: true, avatar: true, role: true } } },
  });

  return NextResponse.json({ comment }, { status: 201 });
}

// DELETE /api/profile-comments?id=xxx
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! }, select: { id: true, role: true } });
  if (!dbUser) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const comment = await prisma.profileComment.findUnique({ where: { id }, select: { profileId: true } });
  if (!comment) return NextResponse.json({ error: "Yorum bulunamadı" }, { status: 404 });

  // Profile owner or admin can delete
  if (comment.profileId !== dbUser.id && dbUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  await prisma.profileComment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
