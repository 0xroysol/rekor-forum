"use client";

import { useState, useEffect, useCallback } from "react";

interface TickerMatch {
  league: string;
  match: string;
  minute: string;
  live: boolean;
}

export function LiveTicker() {
  const [scores, setScores] = useState<TickerMatch[]>([]);

  const fetchScores = useCallback(async () => {
    try {
      const res = await fetch("/api/live-scores?type=all");
      const data = await res.json();
      const matches = data.matches || data || [];

      const mapped: TickerMatch[] = matches.slice(0, 15).map((m: Record<string, unknown>) => {
        // Handle both old (LiveMatch DB) and new (API-Sports) format
        const sport = m.sport as string | undefined;
        const status = m.status as string;
        const homeScore = m.homeScore as number | null;
        const awayScore = m.awayScore as number | null;
        const homeTeam = m.homeTeam as string;
        const awayTeam = m.awayTeam as string;
        const league = m.league as string;
        const minute = m.minute as string | null;
        const startTime = m.startTime as string;

        const isLive = status === "live" || status === "ht";
        let minuteStr: string;
        if (isLive) {
          minuteStr = minute ? `${minute}'` : "CANLI";
        } else if (status === "ft" || status === "finished") {
          minuteStr = "MS";
        } else {
          try {
            minuteStr = new Date(startTime).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });
          } catch {
            minuteStr = "";
          }
        }

        return {
          league: sport === "basketball" ? `🏀 ${league}` : league,
          match: `${homeTeam} ${homeScore ?? "-"} - ${awayScore ?? "-"} ${awayTeam}`,
          minute: minuteStr,
          live: isLive,
        };
      });

      if (mapped.length > 0) {
        setScores(mapped);
      }
    } catch {
      // Keep existing scores on error
    }
  }, []);

  useEffect(() => {
    fetchScores();
    const interval = setInterval(fetchScores, 60_000);
    return () => clearInterval(interval);
  }, [fetchScores]);

  if (scores.length === 0) {
    return (
      <div className="overflow-hidden border-t bg-bg-deep" style={{ borderColor: "#1e293b" }}>
        <div className="flex items-center">
          <div className="z-10 flex shrink-0 items-center gap-1.5 bg-red px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            CANLI
          </div>
          <div className="flex-1 py-1.5 px-4">
            <span className="text-xs" style={{ color: "#64748b" }}>Skorlar yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }

  const doubled = [...scores, ...scores];

  return (
    <div className="overflow-hidden border-t bg-bg-deep" style={{ borderColor: "#1e293b" }}>
      <div className="flex items-center">
        <div className="z-10 flex shrink-0 items-center gap-1.5 bg-red px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          CANLI
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="animate-ticker flex w-max items-center py-1.5">
            {doubled.map((score, i) => (
              <span
                key={i}
                className="flex shrink-0 items-center gap-2 text-xs"
                style={{ borderRight: "1px solid #1e293b", paddingRight: "16px", marginRight: "16px" }}
              >
                <span className="rounded px-1 py-0.5 text-[10px] font-medium" style={{ backgroundColor: "#1a2130", color: "#64748b" }}>
                  {score.league}
                </span>
                <span style={{ color: "#94a3b8" }}>{score.match}</span>
                <span style={{ color: score.live ? "#ef4444" : "#64748b" }} className="font-medium">
                  {score.minute}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
