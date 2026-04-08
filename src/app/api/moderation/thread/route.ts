import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return prisma.user.findUnique({ where: { email: user.email! } });
}

function isModOrAdmin(user: { role: string }) {
  return user.role === "MOD" || user.role === "ADMIN";
}

export async function POST(request: NextRequest) {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
    }
    if (!isModOrAdmin(dbUser)) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
    }

    const { threadId, action, data } = await request.json();

    if (!threadId || !action) {
      return NextResponse.json({ error: "threadId ve action gereklidir." }, { status: 400 });
    }

    const thread = await prisma.thread.findUnique({ where: { id: threadId } });
    if (!thread) {
      return NextResponse.json({ error: "Konu bulunamadı." }, { status: 404 });
    }

    let updatedThread;
    let message: string;

    switch (action) {
      case "pin": {
        updatedThread = await prisma.thread.update({
          where: { id: threadId },
          data: { isPinned: !thread.isPinned },
        });
        message = updatedThread.isPinned ? "Konu sabitlendi." : "Konu sabitleme kaldırıldı.";
        break;
      }

      case "lock": {
        updatedThread = await prisma.thread.update({
          where: { id: threadId },
          data: { isLocked: !thread.isLocked },
        });
        message = updatedThread.isLocked ? "Konu kilitlendi." : "Konu kilidi açıldı.";
        break;
      }

      case "feature": {
        updatedThread = await prisma.thread.update({
          where: { id: threadId },
          data: { isFeatured: !thread.isFeatured },
        });
        message = updatedThread.isFeatured ? "Konu öne çıkarıldı." : "Konu öne çıkarma kaldırıldı.";
        break;
      }

      case "move": {
        if (!data?.categoryId) {
          return NextResponse.json({ error: "Hedef kategori belirtilmelidir." }, { status: 400 });
        }
        updatedThread = await prisma.thread.update({
          where: { id: threadId },
          data: { categoryId: data.categoryId },
        });
        message = "Konu başarıyla taşındı.";
        break;
      }

      case "delete": {
        updatedThread = await prisma.thread.update({
          where: { id: threadId },
          data: { title: "[Silindi]" },
        });
        await prisma.post.updateMany({
          where: { threadId },
          data: { content: "[Bu konu silindi.]" },
        });
        message = "Konu başarıyla silindi.";
        break;
      }

      default:
        return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
    }

    return NextResponse.json({ thread: updatedThread, message });
  } catch (error) {
    console.error("Moderasyon hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
  }
}
