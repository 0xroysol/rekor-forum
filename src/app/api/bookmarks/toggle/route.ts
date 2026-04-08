import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json(
        { error: "Giriş yapmanız gerekiyor" },
        { status: 401 }
      );

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });
    if (!dbUser)
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 }
      );

    const { threadId } = await request.json();

    if (!threadId) {
      return NextResponse.json(
        { error: "threadId gerekli" },
        { status: 400 }
      );
    }

    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_threadId: {
          userId: dbUser.id,
          threadId,
        },
      },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return NextResponse.json({ bookmarked: false });
    } else {
      await prisma.bookmark.create({
        data: { userId: dbUser.id, threadId },
      });
      return NextResponse.json({ bookmarked: true });
    }
  } catch (error) {
    console.error("Bookmark toggle error:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu" },
      { status: 500 }
    );
  }
}
