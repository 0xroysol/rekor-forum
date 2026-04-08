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

    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { threads: true } },
        parent: { select: { name: true } },
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Admin categories hatasi:", error);
    return NextResponse.json({ error: "Sunucu hatasi olustu." }, { status: 500 });
  }
}
