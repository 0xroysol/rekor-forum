import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Giris yapmalsiniz." }, { status: 401 });
    }
    if (!isModOrAdmin(dbUser)) {
      return NextResponse.json({ error: "Bu islem icin yetkiniz yok." }, { status: 403 });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const [
      totalUsers,
      totalThreads,
      totalPosts,
      pendingReports,
      onlineUsers,
      todayUsers,
      todayThreads,
      todayPosts,
      recentUsers,
      recentReports,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.thread.count(),
      prisma.post.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { lastSeen: { gte: fiveMinutesAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.thread.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.post.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.user.findMany({
        select: {
          id: true,
          username: true,
          avatar: true,
          createdAt: true,
          role: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.report.findMany({
        where: { status: "PENDING" },
        include: {
          reporter: {
            select: { id: true, username: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalThreads,
      totalPosts,
      pendingReports,
      onlineUsers,
      todayUsers,
      todayThreads,
      todayPosts,
      recentUsers,
      recentReports,
    });
  } catch (error) {
    console.error("Admin stats hatasi:", error);
    return NextResponse.json({ error: "Sunucu hatasi olustu." }, { status: 500 });
  }
}
