"use client";

import { useState, useEffect, useCallback } from "react";

interface TickerMatch {
  league: string;
  text: string;
  minute: string;
  live: boolean;
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });
}

export function LiveTicker() {
  const [items, setItems] = useState<TickerMatch[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/live-scores");
      const data = await res.json();
      const matches = data.matches || [];

      // Football only: live + today's upcoming
      const tickerItems: TickerMatch[] = [];

      for (const m of matches) {
        if (m.sport !== "football") continue;
        const status = m.status as string;
        const isLive = status === "live" || status === "ht";
        const isUpcoming = status === "upcoming";

        if (!isLive && !isUpcoming) continue; // skip finished

        if (isLive) {
          tickerItems.push({
            league: m.league,
            text: `${m.homeTeam} ${m.homeScore ?? 0} - ${m.awayScore ?? 0} ${m.awayTeam}`,
            minute: status === "ht" ? "DA" : m.minute ? `${m.minute}'` : "CANLI",
            live: true,
          });
        } else {
          tickerItems.push({
            league: m.league,
            text: `${m.homeTeam} - ${m.awayTeam}`,
            minute: formatTime(m.startTime),
            live: false,
          });
        }
      }

      setItems(tickerItems.slice(0, 20));
    } catch {}
  }, []);

  const hasLive = items.some(i => i.live);
  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, hasLive ? 120_000 : 300_000);
    return () => clearInterval(i);
  }, [fetchData, hasLive]);

  if (items.length === 0) return null;

  // Repeat 4x for seamless infinite scroll (translateX(-50%) needs at least 2x)
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
            {repeated.map((item, i) => (
              <span
                key={i}
                className="flex shrink-0 items-center gap-2 text-xs"
                style={{ borderRight: "1px solid #1e293b", paddingRight: "16px", marginRight: "16px" }}
              >
                <span className="rounded px-1 py-0.5 text-[10px] font-medium" style={{ backgroundColor: "#1a2130", color: "#64748b" }}>
                  {item.league}
                </span>
                <span style={{ color: "#94a3b8" }}>{item.text}</span>
                <span style={{ color: item.live ? "#ef4444" : "#64748b" }} className="font-medium">
                  {item.minute}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
