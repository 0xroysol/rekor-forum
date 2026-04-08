import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function GET() {
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

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: dbUser.id },
      include: {
        thread: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
            prefix: true,
            category: true,
            _count: {
              select: { posts: true },
            },
          },
        },
      },
      orderBy: {
        thread: {
          lastPostAt: "desc",
        },
      },
    });

    return NextResponse.json({ bookmarks });
  } catch (error) {
    console.error("Bookmarks fetch error:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu" },
      { status: 500 }
    );
  }
}
