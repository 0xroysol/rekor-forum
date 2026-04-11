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

export async function GET(request: NextRequest) {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const countOnly = searchParams.get("countOnly") === "true";

    const unreadCount = await prisma.notification.count({
      where: { userId: dbUser.id, isRead: false },
    });

    if (countOnly) {
      return NextResponse.json({ unreadCount });
    }

    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const notifications = await prisma.notification.findMany({
      where: { userId: dbUser.id },
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
      take: limit,
    });

    // Resolve thread slugs for notifications with relatedThreadId
    const threadIds = [...new Set(notifications.filter(n => n.relatedThreadId).map(n => n.relatedThreadId!))];
    const threads = threadIds.length > 0
      ? await prisma.thread.findMany({ where: { id: { in: threadIds } }, select: { id: true, slug: true } })
      : [];
    const slugMap = new Map(threads.map(t => [t.id, t.slug]));

    const enriched = notifications.map(n => ({
      ...n,
      relatedThreadSlug: n.relatedThreadId ? slugMap.get(n.relatedThreadId) || null : null,
    }));

    return NextResponse.json({ notifications: enriched, unreadCount });
  } catch (error) {
    console.error("Bildirim listeleme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, type, content, relatedThreadId, relatedUserId } = await request.json();

    if (!userId || !type || !content) {
      return NextResponse.json(
        { error: "userId, type ve content alanları gereklidir." },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        content,
        relatedThreadId: relatedThreadId || null,
        relatedUserId: relatedUserId || null,
      },
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error("Bildirim oluşturma hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
  }
}
