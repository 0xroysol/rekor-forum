import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return prisma.user.findUnique({ where: { email: user.email! } });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const dbUser = await getAuthUser();
  if (!dbUser) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });
  }

  const post = await prisma.post.findUnique({ where: { id }, select: { authorId: true } });
  if (!post) {
    return NextResponse.json({ error: "Mesaj bulunamadı" }, { status: 404 });
  }

  // Only author, MOD, or ADMIN can edit
  if (post.authorId !== dbUser.id && dbUser.role !== "MOD" && dbUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Bu mesajı düzenleme yetkiniz yok" }, { status: 403 });
  }

  const body = await request.json();
  const { content } = body;

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "İçerik boş olamaz" }, { status: 400 });
  }

  const updated = await prisma.post.update({
    where: { id },
    data: { content, editedAt: new Date() },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const dbUser = await getAuthUser();
  if (!dbUser) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });
  }

  // Only MOD or ADMIN can delete
  if (dbUser.role !== "MOD" && dbUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Silme yetkiniz yok" }, { status: 403 });
  }

  const post = await prisma.post.findUnique({ where: { id }, select: { id: true } });
  if (!post) {
    return NextResponse.json({ error: "Mesaj bulunamadı" }, { status: 404 });
  }

  // Soft delete: replace content
  await prisma.post.update({
    where: { id },
    data: { content: "[Bu mesaj bir moderatör tarafından silindi.]", editedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
