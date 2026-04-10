"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";

interface TickerMatch {
  id: string;
  league: string;
  text: string;
  minute: string;
  live: boolean;
  homeScore: number;
  awayScore: number;
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });
}

export function LiveTicker() {
  const { dbUser, loading: authLoading } = useAuth();
  const [items, setItems] = useState<TickerMatch[]>([]);
  const [goalIds, setGoalIds] = useState<Set<string>>(new Set());
  const prevScores = useRef<Map<string, { h: number; a: number }>>(new Map());

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/live-scores");
      const data = await res.json();
      const matches = data.matches || [];

      const tickerItems: TickerMatch[] = [];
      const newGoals = new Set<string>();

      for (const m of matches) {
        if (m.sport !== "football") continue;
        const status = m.status as string;
        const isLive = status === "live" || status === "ht";
        const isUpcoming = status === "upcoming";
        if (!isLive && !isUpcoming) continue;

        const id = m.id as string;
        const hs = (m.homeScore ?? 0) as number;
        const as_ = (m.awayScore ?? 0) as number;

        // Goal detection
        if (isLive) {
          const prev = prevScores.current.get(id);
          if (prev && (prev.h !== hs || prev.a !== as_)) {
            newGoals.add(id);
          }
          prevScores.current.set(id, { h: hs, a: as_ });
        }

        tickerItems.push({
          id,
          league: m.league,
          text: isLive
            ? `${m.homeTeam} ${hs} - ${as_} ${m.awayTeam}`
            : `${m.homeTeam} - ${m.awayTeam}`,
          minute: isLive ? (status === "ht" ? "DA" : m.minute ? `${m.minute}'` : "CANLI") : formatTime(m.startTime),
          live: isLive,
          homeScore: hs,
          awayScore: as_,
        });
      }

      setItems(tickerItems.slice(0, 20));

      if (newGoals.size > 0) {
        setGoalIds(newGoals);
        setTimeout(() => setGoalIds(new Set()), 2500);
      }
    } catch {}
  }, []);

  const hasLive = items.some(i => i.live);
  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, hasLive ? 120_000 : 300_000);
    return () => clearInterval(i);
  }, [fetchData, hasLive]);

  // Not logged in: show login banner instead of ticker
  if (!authLoading && !dbUser) {
    return (
      <div className="border-t flex items-center justify-center h-8 text-xs" style={{ borderColor: "#1e293b", backgroundColor: "#0d1017" }}>
        <span style={{ color: "#64748b" }}>📡 Canlı skor takibi için </span>
        <Link href="/giris" className="ml-1 font-medium hover:underline" style={{ color: "var(--accent-green)" }}>giriş yapın</Link>
      </div>
    );
  }

  if (items.length === 0) return null;

  const repeated = [...items, ...items, ...items, ...items];

  return (
    <div className="overflow-hidden border-t bg-bg-deep" style={{ borderColor: "#1e293b" }}>
      <div className="flex items-center">
        <div className="z-10 flex shrink-0 items-center gap-1.5 bg-red px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          CANLI
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="animate-ticker flex w-max items-center py-1.5">
            {repeated.map((item, i) => {
              const hasGoal = goalIds.has(item.id);
              return (
                <span
                  key={i}
                  className="flex shrink-0 items-center gap-2 text-xs"
                  style={{ borderRight: "1px solid #1e293b", paddingRight: "16px", marginRight: "16px" }}
                >
                  <span className="rounded px-1 py-0.5 text-[10px] font-medium" style={{ backgroundColor: "#1a2130", color: "#64748b" }}>
                    {item.league}
                  </span>
                  <span style={{ color: "#94a3b8" }}>{item.text}</span>
                  <span
                    className={hasGoal ? "goal-flash" : ""}
                    style={{
                      color: item.live ? "#ef4444" : "#64748b",
                      fontWeight: item.live ? 700 : 500,
                      display: "inline-block",
                      borderRadius: "4px",
                      padding: "0 2px",
                    }}
                  >
                    {item.minute}
                  </span>
                  {hasGoal && (
                    <span className="goal-text" style={{ color: "var(--accent-green)", fontWeight: 700, fontSize: "11px" }}>
                      ⚽ GOL!
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
