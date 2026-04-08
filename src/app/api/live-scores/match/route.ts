import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.API_SPORTS_KEY || "";

// Cache: finished = 1 hour, live = 5 min
const cache = new Map<string, { data: unknown; ts: number }>();
const LIVE_TTL = 300_000; // 5 min
const FINISHED_TTL = 3600_000; // 1 hour

async function fetchApi(base: string, endpoint: string) {
  if (!API_KEY) return null;
  try {
    const res = await fetch(`${base}${endpoint}`, {
      headers: { "x-apisports-key": API_KEY },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.response || [];
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const sport = searchParams.get("sport") || "football";
  const status = searchParams.get("status") || ""; // ft, live, upcoming

  if (!id) {
    return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  }

  const cacheKey = `${sport}_${id}`;

  // Check cache
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!;
    const ttl = status === "ft" ? FINISHED_TTL : LIVE_TTL;
    if (Date.now() - cached.ts < ttl) {
      return NextResponse.json(cached.data);
    }
  }

  // Strip fb_ or bb_ prefix from the id
  const rawId = id.replace(/^(fb_|bb_)/, "");

  let result;

  if (sport === "football") {
    const base = "https://v3.football.api-sports.io";
    const [events, statistics, lineups] = await Promise.all([
      fetchApi(base, `/fixtures/events?fixture=${rawId}`),
      fetchApi(base, `/fixtures/statistics?fixture=${rawId}`),
      fetchApi(base, `/fixtures/lineups?fixture=${rawId}`),
    ]);

    result = {
      sport: "football",
      events: (events || []).map((e: Record<string, unknown>) => ({
        time: (e.time as Record<string, unknown>)?.elapsed,
        extra: (e.time as Record<string, unknown>)?.extra,
        team: (e.team as Record<string, unknown>)?.name,
        teamLogo: (e.team as Record<string, unknown>)?.logo,
        player: (e.player as Record<string, unknown>)?.name,
        assist: (e.assist as Record<string, unknown>)?.name,
        type: e.type, // "Goal", "Card", "subst", "Var"
        detail: e.detail, // "Normal Goal", "Yellow Card", "Red Card", "Substitution 1", "Penalty", "Missed Penalty"
      })),
      statistics: (statistics || []).map((team: Record<string, unknown>) => ({
        team: (team.team as Record<string, unknown>)?.name,
        teamLogo: (team.team as Record<string, unknown>)?.logo,
        stats: ((team.statistics as Array<Record<string, unknown>>) || []).map((s) => ({
          type: s.type,
          value: s.value,
        })),
      })),
      lineups: (lineups || []).map((team: Record<string, unknown>) => ({
        team: (team.team as Record<string, unknown>)?.name,
        teamLogo: (team.team as Record<string, unknown>)?.logo,
        formation: team.formation,
        coach: (team.coach as Record<string, unknown>)?.name,
        startXI: ((team.startXI as Array<Record<string, unknown>>) || []).map((p) => {
          const player = p.player as Record<string, unknown>;
          return { id: player?.id, name: player?.name, number: player?.number, pos: player?.pos };
        }),
        substitutes: ((team.substitutes as Array<Record<string, unknown>>) || []).map((p) => {
          const player = p.player as Record<string, unknown>;
          return { id: player?.id, name: player?.name, number: player?.number, pos: player?.pos };
        }),
      })),
    };
  } else {
    // Basketball
    const base = "https://v1.basketball.api-sports.io";
    const stats = await fetchApi(base, `/statistics?id=${rawId}`);
    result = {
      sport: "basketball",
      events: [],
      statistics: (stats || []).map((team: Record<string, unknown>) => ({
        team: (team.team as Record<string, unknown>)?.name,
        teamLogo: (team.team as Record<string, unknown>)?.logo,
        stats: Object.entries(team).filter(([k]) => !["team", "group"].includes(k)).map(([type, value]) => ({ type, value })),
      })),
      lineups: [],
    };
  }

  // Cache result
  cache.set(cacheKey, { data: result, ts: Date.now() });

  return NextResponse.json(result);
}
