import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        { error: "postId gerekli" },
        { status: 400 }
      );
    }

    const reactions = await prisma.reaction.findMany({
      where: { postId },
      include: {
        user: {
          select: { username: true },
        },
      },
    });

    const counts: Record<string, number> = {};
    const users: Record<string, string[]> = {};

    for (const r of reactions) {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1;
      if (!users[r.emoji]) users[r.emoji] = [];
      users[r.emoji].push(r.user.username);
    }

    return NextResponse.json({ counts, users });
  } catch (error) {
    console.error("Reactions fetch error:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu" },
      { status: 500 }
    );
  }
}
