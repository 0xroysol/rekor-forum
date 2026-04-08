import type { SportMatch } from "./types";

const API_BASE = "https://v1.basketball.api-sports.io";
const API_KEY = process.env.API_SPORTS_KEY || "";

const TRACKED_LEAGUES = new Set([79, 120, 12]); // BSL, EuroLeague, NBA

function mapStatus(short: string): SportMatch["status"] {
  if (["Q1", "Q2", "Q3", "Q4", "OT", "BT"].includes(short)) return "live";
  if (short === "HT") return "ht";
  if (["FT", "AOT"].includes(short)) return "ft";
  if (["POST", "CANC", "SUSP"].includes(short)) return "postponed";
  return "upcoming";
}

interface ApiGame {
  id: number;
  date: string;
  status: { short: string; timer: string | null };
  league: { id: number; name: string; logo: string };
  teams: { home: { name: string; logo: string }; away: { name: string; logo: string } };
  scores: { home: { total: number | null }; away: { total: number | null } };
}

function parseGame(g: ApiGame): SportMatch {
  return {
    id: `bb_${g.id}`,
    sport: "basketball",
    league: g.league.name,
    leagueLogo: g.league.logo,
    homeTeam: g.teams.home.name,
    awayTeam: g.teams.away.name,
    homeLogo: g.teams.home.logo,
    awayLogo: g.teams.away.logo,
    homeScore: g.scores.home.total,
    awayScore: g.scores.away.total,
    minute: g.status.timer || g.status.short,
    status: mapStatus(g.status.short),
    startTime: g.date,
  };
}

async function apiFetch(endpoint: string): Promise<ApiGame[]> {
  if (!API_KEY) return [];
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { "x-apisports-key": API_KEY },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.response || []) as ApiGame[];
  } catch {
    return [];
  }
}

// Single request for all live basketball, then filter
export async function getBasketballLiveMatches(): Promise<SportMatch[]> {
  const games = await apiFetch("/games?live=all");
  return games.filter((g) => TRACKED_LEAGUES.has(g.league.id)).map(parseGame);
}

// Single request for all basketball on a date, then filter
export async function getBasketballMatchesByDate(date: string): Promise<SportMatch[]> {
  const games = await apiFetch(`/games?date=${date}`);
  return games.filter((g) => TRACKED_LEAGUES.has(g.league.id)).map(parseGame);
}
