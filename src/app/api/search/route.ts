import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const tag = searchParams.get("tag");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = 20;
    const skip = (page - 1) * limit;

    if (!q && !tag) {
      return NextResponse.json(
        { error: "Arama sorgusu veya etiket gerekli" },
        { status: 400 }
      );
    }

    // Build thread filter
    const threadWhere: Record<string, unknown> = {};

    if (q) {
      threadWhere.OR = [
        { title: { contains: q, mode: "insensitive" } },
      ];
    }

    if (tag) {
      threadWhere.tags = {
        some: {
          tag: {
            name: tag,
          },
        },
      };
    }

    const [threads, total] = await Promise.all([
      prisma.thread.findMany({
        where: threadWhere,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          prefix: true,
          category: true,
          _count: {
            select: { posts: true },
          },
        },
        orderBy: { lastPostAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.thread.count({ where: threadWhere }),
    ]);

    // Search users if query provided
    let users: { id: string; username: string; avatar: string | null }[] = [];
    if (q) {
      users = await prisma.user.findMany({
        where: {
          username: { contains: q, mode: "insensitive" },
        },
        select: {
          id: true,
          username: true,
          avatar: true,
        },
        take: 5,
      });
    }

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      threads,
      users,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu" },
      { status: 500 }
    );
  }
}
