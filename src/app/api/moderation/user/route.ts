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

    const { userId, action, data } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: "userId ve action gereklidir." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }

    switch (action) {
      case "changeRole": {
        if (dbUser.role !== "ADMIN") {
          return NextResponse.json({ error: "Bu işlem için admin yetkisi gereklidir." }, { status: 403 });
        }
        if (dbUser.id === userId) {
          return NextResponse.json({ error: "Kendi rolünüzü değiştiremezsiniz." }, { status: 400 });
        }
        const validRoles = ["USER", "MOD", "ADMIN"];
        if (!data?.role || !validRoles.includes(data.role)) {
          return NextResponse.json({ error: "Geçersiz rol." }, { status: 400 });
        }
        const updated = await prisma.user.update({
          where: { id: userId },
          data: { role: data.role },
        });
        return NextResponse.json({
          user: { id: updated.id, username: updated.username, role: updated.role },
          message: `Kullanıcı rolü ${data.role} olarak güncellendi.`,
        });
      }

      case "ban": {
        if (dbUser.role !== "ADMIN") {
          return NextResponse.json({ error: "Bu işlem için admin yetkisi gereklidir." }, { status: 403 });
        }
        if (dbUser.id === userId) {
          return NextResponse.json({ error: "Kendinizi yasaklayamazsınız." }, { status: 400 });
        }
        await prisma.user.update({
          where: { id: userId },
          data: { role: "USER", title: "[YASAKLI]", isOnline: false },
        });
        await prisma.notification.create({
          data: {
            userId,
            type: "ban",
            content: "Hesabınız yasaklanmıştır.",
          },
        });
        return NextResponse.json({ message: "Kullanıcı yasaklandı." });
      }

      case "unban": {
        if (dbUser.role !== "ADMIN") {
          return NextResponse.json({ error: "Bu işlem için admin yetkisi gereklidir." }, { status: 403 });
        }
        if (targetUser.title !== "[YASAKLI]") {
          return NextResponse.json({ error: "Bu kullanıcı zaten yasaklı değil." }, { status: 400 });
        }
        await prisma.user.update({
          where: { id: userId },
          data: { title: null },
        });
        await prisma.notification.create({
          data: {
            userId,
            type: "unban",
            content: "Hesabınızın yasağı kaldırılmıştır.",
          },
        });
        return NextResponse.json({ message: "Kullanıcının yasağı kaldırıldı." });
      }

      case "warn": {
        if (!isModOrAdmin(dbUser)) {
          return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
        }
        if (!data?.message) {
          return NextResponse.json({ error: "Uyarı mesajı gereklidir." }, { status: 400 });
        }
        await prisma.notification.create({
          data: {
            userId,
            type: "mod_warning",
            content: data.message,
          },
        });
        return NextResponse.json({ message: "Kullanıcıya uyarı gönderildi." });
      }

      default:
        return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
    }
  } catch (error) {
    console.error("Kullanıcı moderasyon hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
  }
}
