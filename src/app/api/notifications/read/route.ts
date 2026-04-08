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

export async function PATCH(request: NextRequest) {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
    }

    const body = await request.json();

    if (body.all === true) {
      await prisma.notification.updateMany({
        where: { userId: dbUser.id, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ message: "Tüm bildirimler okundu olarak işaretlendi." });
    }

    if (body.id) {
      const notification = await prisma.notification.findUnique({
        where: { id: body.id },
      });

      if (!notification || notification.userId !== dbUser.id) {
        return NextResponse.json({ error: "Bildirim bulunamadı." }, { status: 404 });
      }

      await prisma.notification.update({
        where: { id: body.id },
        data: { isRead: true },
      });

      return NextResponse.json({ message: "Bildirim okundu olarak işaretlendi." });
    }

    return NextResponse.json({ error: "id veya all parametresi gereklidir." }, { status: 400 });
  } catch (error) {
    console.error("Bildirim okuma hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
  }
}
