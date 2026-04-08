import { NextResponse } from "next/server";
import { getAllMatches } from "@/lib/sports/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const matches = await getAllMatches();
    return NextResponse.json({
      matches,
      lastUpdated: new Date().toISOString(),
      count: matches.length,
    });
  } catch (error) {
    console.error("Live scores error:", error);
    return NextResponse.json({
      matches: [],
      lastUpdated: new Date().toISOString(),
      count: 0,
      error: "Skorlar şu an güncellenemiyor",
    });
  }
}
