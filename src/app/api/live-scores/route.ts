import { NextRequest, NextResponse } from "next/server";
import { getLiveMatches, getTodayMatches, getRecentResults, getAllMatches } from "@/lib/sports/provider";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "all";

  try {
    let matches;
    switch (type) {
      case "live":
        matches = await getLiveMatches();
        break;
      case "today":
        matches = await getTodayMatches();
        break;
      case "recent":
        matches = await getRecentResults();
        break;
      default:
        matches = await getAllMatches();
    }

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
