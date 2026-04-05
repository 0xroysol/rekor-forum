import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const matches = await prisma.liveMatch.findMany({
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error("Failed to fetch live matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch live matches" },
      { status: 500 }
    );
  }
}
