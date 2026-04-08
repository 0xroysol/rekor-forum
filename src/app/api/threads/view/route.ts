import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const { slug } = body;

  if (!slug) {
    return NextResponse.json({ error: "slug gerekli" }, { status: 400 });
  }

  await prisma.thread.updateMany({
    where: { slug },
    data: { viewCount: { increment: 1 } },
  });

  return NextResponse.json({ ok: true });
}
