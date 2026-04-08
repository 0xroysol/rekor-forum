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

const USERS_PER_PAGE = 20;

export async function GET(request: NextRequest) {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Giris yapmalsiniz." }, { status: 401 });
    }
    if (!isModOrAdmin(dbUser)) {
      return NextResponse.json({ error: "Bu islem icin yetkiniz yok." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);

    const where = search
      ? { username: { contains: search, mode: "insensitive" as const } }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          role: true,
          postCount: true,
          title: true,
          createdAt: true,
          rank: {
            select: { id: true, name: true, icon: true, color: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * USERS_PER_PAGE,
        take: USERS_PER_PAGE,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        totalPages: Math.ceil(total / USERS_PER_PAGE),
        total,
      },
    });
  } catch (error) {
    console.error("Admin users hatasi:", error);
    return NextResponse.json({ error: "Sunucu hatasi olustu." }, { status: 500 });
  }
}
