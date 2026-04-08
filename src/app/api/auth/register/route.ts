import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const { supabaseId, email, username } = body;

  if (!supabaseId || !email || !username) {
    return NextResponse.json(
      { error: "Eksik alanlar" },
      { status: 400 }
    );
  }

  // Check if username is taken
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json(
      { error: "Bu kullanıcı adı zaten kullanılıyor" },
      { status: 409 }
    );
  }

  // Check if email is taken
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return NextResponse.json(
      { error: "Bu e-posta adresi zaten kayıtlı" },
      { status: 409 }
    );
  }

  // Find the default "Çaylak" rank
  const defaultRank = await prisma.rank.findFirst({
    where: { minPosts: 0, special: false },
    orderBy: { position: "asc" },
  });

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      username,
      displayName: username,
      isOnline: true,
      lastSeen: new Date(),
      ...(defaultRank ? { rankId: defaultRank.id } : {}),
    },
    include: { rank: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
