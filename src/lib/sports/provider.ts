import type { SportMatch } from "./types";
import { getFootballLiveMatches, getFootballMatchesByDate, getFootballRecentResults } from "./football";
import { getBasketballLiveMatches, getBasketballMatchesByDate, getBasketballRecentResults } from "./basketball";

// In-memory cache
let cache: { data: SportMatch[]; timestamp: number; type: string } | null = null;
const CACHE_TTL = 60_000; // 60 seconds

function getCacheKey(type: string) {
  return type;
}

function getFromCache(type: string): SportMatch[] | null {
  if (cache && cache.type === type && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }
  return null;
}

function setCache(type: string, data: SportMatch[]) {
  cache = { data, timestamp: Date.now(), type };
}

export async function getLiveMatches(): Promise<SportMatch[]> {
  const cached = getFromCache("live");
  if (cached) return cached;

  const [football, basketball] = await Promise.all([
    getFootballLiveMatches(),
    getBasketballLiveMatches(),
  ]);
  const result = [...football, ...basketball];
  setCache("live", result);
  return result;
}

export async function getTodayMatches(): Promise<SportMatch[]> {
  const cached = getFromCache("today");
  if (cached) return cached;

  const today = new Date().toISOString().split("T")[0];
  const [football, basketball] = await Promise.all([
    getFootballMatchesByDate(today),
    getBasketballMatchesByDate(today),
  ]);
  const result = [...football, ...basketball];
  setCache("today", result);
  return result;
}

export async function getRecentResults(): Promise<SportMatch[]> {
  const cached = getFromCache("recent");
  if (cached) return cached;

  const [football, basketball] = await Promise.all([
    getFootballRecentResults(3),
    getBasketballRecentResults(3),
  ]);
  const result = [...football, ...basketball];
  setCache("recent", result);
  return result;
}

export async function getAllMatches(): Promise<SportMatch[]> {
  const cached = getFromCache("all");
  if (cached) return cached;

  const [live, today, recent] = await Promise.all([
    getLiveMatches(),
    getTodayMatches(),
    getRecentResults(),
  ]);

  // Merge and deduplicate by id
  const map = new Map<string, SportMatch>();
  for (const m of [...live, ...today, ...recent]) {
    map.set(m.id, m);
  }

  // Sort: live first, then upcoming by time, then finished
  const result = Array.from(map.values()).sort((a, b) => {
    const order = { live: 0, ht: 0, upcoming: 1, ft: 2, postponed: 3 };
    const diff = (order[a.status] ?? 9) - (order[b.status] ?? 9);
    if (diff !== 0) return diff;
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  setCache("all", result);
  return result;
}
