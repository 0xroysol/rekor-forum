import { NextRequest, NextResponse } from "next/server";
import { fetchAndCreateNews } from "@/lib/news/fetcher";
import { createMatchThreads } from "@/lib/news/match-threads";

export const maxDuration = 60;

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
    const [newsCount, threadCount] = await Promise.all([
      fetchAndCreateNews(2),
      createMatchThreads().catch((err) => {
        console.error("Match thread creation error:", err);
        return 0;
      }),
    ]);
    return NextResponse.json({ success: true, newsCreated: newsCount, threadsCreated: threadCount });
  } catch (error) {
    console.error("News fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
