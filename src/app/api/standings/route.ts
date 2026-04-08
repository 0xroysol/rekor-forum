import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.API_SPORTS_KEY || "";
let cache: { data: unknown; timestamp: number; league: string } | null = null;
const CACHE_TTL = 300_000; // 5 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get("league") || "203";
  const season = searchParams.get("season") || "2025";

  if (cache && cache.league === league && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  if (!API_KEY) {
    return NextResponse.json({ standings: [] });
  }

  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/standings?league=${league}&season=${season}`,
      { headers: { "x-apisports-key": API_KEY } }
    );
    const data = await res.json();
    const standings = data.response?.[0]?.league?.standings?.[0] || [];

    const result = {
      standings: standings.map((t: Record<string, unknown>) => {
        const team = t.team as Record<string, unknown>;
        const all = t.all as Record<string, unknown>;
        return {
          rank: t.rank,
          teamName: team.name,
          teamLogo: team.logo,
          played: all.played,
          won: all.win,
          drawn: all.draw,
          lost: all.lose,
          goalsFor: (all.goals as Record<string, number>)?.for,
          goalsAgainst: (all.goals as Record<string, number>)?.against,
          points: t.points,
          form: t.form,
        };
      }),
    };

    cache = { data: result, timestamp: Date.now(), league };
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ standings: [] });
  }
}
