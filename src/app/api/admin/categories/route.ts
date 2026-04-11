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

export async function PATCH(request: Request) {
  const dbUser = await getAuthUser();
  if (!dbUser || !isModOrAdmin(dbUser)) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { id, name, description, icon, color, position, slug } = await request.json();
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (icon !== undefined) data.icon = icon;
  if (color !== undefined) data.color = color;
  if (position !== undefined) data.position = position;
  if (slug !== undefined) data.slug = slug;

  await prisma.category.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}
