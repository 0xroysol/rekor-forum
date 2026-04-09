import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (q.length < 1) {
    return NextResponse.json({ users: [] });
  }

  const users = await prisma.user.findMany({
    where: { username: { contains: q, mode: "insensitive" } },
    take: 5,
    select: { id: true, username: true, avatar: true, displayName: true },
  });

  return NextResponse.json({ users });
}
