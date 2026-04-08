import type { SportMatch } from "./types";

const API_BASE = "https://v3.football.api-sports.io";
const API_KEY = process.env.API_SPORTS_KEY || "";

const TRACKED_LEAGUES = [203, 204, 2, 3, 39, 140, 135, 78, 61]; // 203=Süper Lig, 204=1.Lig
const SEASON = 2025;

function mapStatus(short: string): SportMatch["status"] {
  if (["1H", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE"].includes(short)) return "live";
  if (short === "HT") return "ht";
  if (["FT", "AET", "PEN"].includes(short)) return "ft";
  if (["PST", "CANC", "ABD", "AWD", "WO"].includes(short)) return "postponed";
  return "upcoming"; // NS, TBD
}

interface ApiFixture {
  fixture: { id: number; date: string; status: { short: string; elapsed: number | null } };
  league: { id: number; name: string; logo: string };
  teams: { home: { name: string; logo: string }; away: { name: string; logo: string } };
  goals: { home: number | null; away: number | null };
}

function parseFixture(f: ApiFixture): SportMatch {
  return {
    id: `fb_${f.fixture.id}`,
    sport: "football",
    league: f.league.name,
    leagueLogo: f.league.logo,
    homeTeam: f.teams.home.name,
    awayTeam: f.teams.away.name,
    homeLogo: f.teams.home.logo,
    awayLogo: f.teams.away.logo,
    homeScore: f.goals.home,
    awayScore: f.goals.away,
    minute: f.fixture.status.elapsed ? `${f.fixture.status.elapsed}` : null,
    status: mapStatus(f.fixture.status.short),
    startTime: f.fixture.date,
  };
}

async function apiFetch(endpoint: string): Promise<ApiFixture[]> {
  if (!API_KEY) return [];
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { "x-apisports-key": API_KEY },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.response || []) as ApiFixture[];
  } catch {
    return [];
  }
}

export async function getFootballLiveMatches(): Promise<SportMatch[]> {
  const fixtures = await apiFetch("/fixtures?live=all");
  return fixtures
    .filter((f) => TRACKED_LEAGUES.includes(f.league.id))
    .map(parseFixture);
}

export async function getFootballMatchesByDate(date: string): Promise<SportMatch[]> {
  // Fetch all tracked leagues for the date
  const promises = TRACKED_LEAGUES.map((leagueId) =>
    apiFetch(`/fixtures?league=${leagueId}&season=${SEASON}&date=${date}`)
  );
  const results = await Promise.all(promises);
  return results.flat().map(parseFixture);
}

export async function getFootballRecentResults(days: number = 3): Promise<SportMatch[]> {
  const matches: SportMatch[] = [];
  for (let i = 1; i <= days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayMatches = await getFootballMatchesByDate(dateStr);
    matches.push(...dayMatches.filter((m) => m.status === "ft"));
  }
  return matches;
}
