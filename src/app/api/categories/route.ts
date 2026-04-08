import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { parentId: { not: null } },
    include: { parent: { select: { name: true } } },
    orderBy: { position: "asc" },
  });

  return NextResponse.json(
    categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentName: c.parent?.name || null,
    }))
  );
}
