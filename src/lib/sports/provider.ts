import type { SportMatch } from "./types";
import { getFootballLiveMatches, getFootballMatchesByDate } from "./football";
import { getBasketballLiveMatches, getBasketballMatchesByDate } from "./basketball";

// ── Smart cache with variable TTL ──
interface CacheEntry {
  data: SportMatch[];
  timestamp: number;
  hasLive: boolean;
}

let mainCache: CacheEntry | null = null;

// TTL based on content:
// - Has live matches: 2 minutes
// - Only upcoming/finished: 5 minutes
function getCacheTTL(hasLive: boolean): number {
  return hasLive ? 120_000 : 300_000; // 2 min vs 5 min
}

function isCacheValid(): boolean {
  if (!mainCache) return false;
  const ttl = getCacheTTL(mainCache.hasLive);
  return Date.now() - mainCache.timestamp < ttl;
}

export async function getAllMatches(): Promise<SportMatch[]> {
  // Return cache if valid
  if (isCacheValid()) return mainCache!.data;

  const today = new Date().toISOString().split("T")[0];

  // Only 4 API calls total: 2 live + 2 today's fixtures
  const [fbLive, bbLive, fbToday, bbToday] = await Promise.all([
    getFootballLiveMatches(),    // 1 API call
    getBasketballLiveMatches(),  // 1 API call
    getFootballMatchesByDate(today),    // 1 API call
    getBasketballMatchesByDate(today),  // 1 API call
  ]);

  // Merge and deduplicate by id (live data takes priority over today data)
  const map = new Map<string, SportMatch>();
  for (const m of [...fbToday, ...bbToday]) map.set(m.id, m);
  for (const m of [...fbLive, ...bbLive]) map.set(m.id, m); // live overwrites

  const result = Array.from(map.values()).sort((a, b) => {
    const order = { live: 0, ht: 0, upcoming: 1, ft: 2, postponed: 3 };
    const diff = (order[a.status] ?? 9) - (order[b.status] ?? 9);
    if (diff !== 0) return diff;
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  const hasLive = result.some((m) => m.status === "live" || m.status === "ht");

  mainCache = { data: result, timestamp: Date.now(), hasLive };
  return result;
}

// For the ticker — just return cached data, never make extra API calls
export async function getTickerMatches(): Promise<SportMatch[]> {
  return getAllMatches();
}
