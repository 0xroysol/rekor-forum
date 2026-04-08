import { NextRequest, NextResponse } from "next/server";
import { fetchAndCreateNews } from "@/lib/news/fetcher";

export const maxDuration = 60; // 60 second timeout for cron

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Also check Vercel's automatic cron verification
    const vercelCron = request.headers.get("x-vercel-cron");
    if (!vercelCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const count = await fetchAndCreateNews(5);
    return NextResponse.json({ success: true, created: count });
  } catch (error) {
    console.error("News fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
