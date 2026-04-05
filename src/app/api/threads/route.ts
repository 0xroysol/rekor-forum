import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    const threads = await prisma.thread.findMany({
      where: categoryId ? { categoryId } : undefined,
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
        prefix: true,
        _count: {
          select: { posts: true },
        },
      },
      orderBy: [{ isPinned: "desc" }, { lastPostAt: "desc" }],
    });

    return NextResponse.json(threads);
  } catch (error) {
    console.error("Failed to fetch threads:", error);
    return NextResponse.json(
      { error: "Failed to fetch threads" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, categoryId, prefixId, authorId } = body;

    if (!title || !content || !categoryId || !authorId) {
      return NextResponse.json(
        { error: "title, content, categoryId, and authorId are required" },
        { status: 400 }
      );
    }

    const slug = slugify(title) + "-" + Date.now().toString(36);

    const thread = await prisma.thread.create({
      data: {
        title,
        slug,
        categoryId,
        authorId,
        prefixId: prefixId || null,
        posts: {
          create: {
            content,
            authorId,
          },
        },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        prefix: true,
        posts: true,
      },
    });

    await prisma.user.update({
      where: { id: authorId },
      data: { postCount: { increment: 1 } },
    });

    return NextResponse.json(thread, { status: 201 });
  } catch (error) {
    console.error("Failed to create thread:", error);
    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 }
    );
  }
}
