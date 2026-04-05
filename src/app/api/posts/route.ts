import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get("threadId");

    if (!threadId) {
      return NextResponse.json(
        { error: "threadId query parameter is required" },
        { status: 400 }
      );
    }

    const posts = await prisma.post.findMany({
      where: { threadId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            role: true,
            postCount: true,
            reputation: true,
            rank: true,
            badges: {
              include: {
                badge: true,
              },
            },
          },
        },
        reactions: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { threadId, content, authorId } = body;

    if (!threadId || !content || !authorId) {
      return NextResponse.json(
        { error: "threadId, content, and authorId are required" },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        threadId,
        content,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            role: true,
          },
        },
        reactions: true,
      },
    });

    await prisma.thread.update({
      where: { id: threadId },
      data: {
        replyCount: { increment: 1 },
        lastPostAt: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: authorId },
      data: { postCount: { increment: 1 } },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Failed to create post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
