"use client";

import { useState, useEffect, useCallback } from "react";
import type { SportMatch } from "@/lib/sports/types";

const statusConfig: Record<string, { label: string; borderColor: string; textColor: string; bgColor: string }> = {
  live: { label: "CANLI", borderColor: "#1f844e", textColor: "#1f844e", bgColor: "rgba(31,132,78,0.1)" },
  ht: { label: "D.ARASI", borderColor: "#e8a935", textColor: "#e8a935", bgColor: "rgba(232,169,53,0.1)" },
  ft: { label: "BİTTİ", borderColor: "#64748b", textColor: "#64748b", bgColor: "rgba(100,116,139,0.1)" },
  upcoming: { label: "YAKINDA", borderColor: "#3b82f6", textColor: "#3b82f6", bgColor: "rgba(59,130,246,0.1)" },
  postponed: { label: "ERTELENDİ", borderColor: "#ef4444", textColor: "#ef4444", bgColor: "rgba(239,68,68,0.1)" },
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  });
}

export default function CanliSkorlarPage() {
  const [matches, setMatches] = useState<SportMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [sportTab, setSportTab] = useState<"all" | "football" | "basketball">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "ft" | "upcoming">("all");

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch("/api/live-scores?type=all");
      const data = await res.json();
      setMatches(data.matches || []);
      setLastUpdated(data.lastUpdated || "");
    } catch {
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 60_000);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  // Filter matches
  const filtered = matches.filter((m) => {
    if (sportTab !== "all" && m.sport !== sportTab) return false;
    if (statusFilter !== "all" && m.status !== statusFilter && !(statusFilter === "live" && m.status === "ht")) return false;
    return true;
  });

  // Group by league
  const grouped = filtered.reduce<Record<string, SportMatch[]>>((acc, m) => {
    if (!acc[m.league]) acc[m.league] = [];
    acc[m.league].push(m);
    return acc;
  }, {});

  const liveCount = matches.filter((m) => m.status === "live" || m.status === "ht").length;

  return (
    <div className="mx-auto max-w-4xl px-5 py-5">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: "#e2e8f0" }}>Canlı Skorlar</h1>
        <div className="flex items-center gap-2">
          {liveCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "#1f844e" }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: "#1f844e" }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: "#1f844e" }} />
              </span>
              {liveCount} canlı maç
            </span>
          )}
          {lastUpdated && (
            <span className="text-xs" style={{ color: "#64748b" }}>
              Son güncelleme: {new Date(lastUpdated).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" })}
            </span>
          )}
        </div>
      </div>

      {/* Sport Tabs */}
      <div className="mb-4 flex items-center gap-1">
        {[
          { key: "all" as const, label: "Tümü" },
          { key: "football" as const, label: "⚽ Futbol" },
          { key: "basketball" as const, label: "🏀 Basketbol" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setSportTab(t.key)}
            className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              backgroundColor: sportTab === t.key ? "#1a2130" : "transparent",
              color: sportTab === t.key ? "#e2e8f0" : "#64748b",
            }}
          >
            {t.label}
          </button>
        ))}
        <div className="flex-1" />
        {/* Status filter */}
        {[
          { key: "all" as const, label: "Tümü" },
          { key: "live" as const, label: "Canlı" },
          { key: "ft" as const, label: "Biten" },
          { key: "upcoming" as const, label: "Yaklaşan" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
            style={{
              backgroundColor: statusFilter === f.key ? "#1a2130" : "transparent",
              color: statusFilter === f.key ? "#e2e8f0" : "#64748b",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: "#131820" }} />
          ))}
        </div>
      )}

      {/* No matches */}
      {!loading && filtered.length === 0 && (
        <div className="rounded-xl px-6 py-12 text-center" style={{ backgroundColor: "#131820", border: "1px solid #1e293b" }}>
          <span className="text-4xl block mb-3">⚽</span>
          <p style={{ color: "#94a3b8" }}>Şu an gösterilecek maç bulunmuyor.</p>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>Maçlar başladığında burada görünecektir.</p>
        </div>
      )}

      {/* Match list grouped by league */}
      {!loading && Object.entries(grouped).length > 0 && (
        <div className="space-y-5">
          {Object.entries(grouped).map(([league, leagueMatches]) => (
            <div key={league}>
              {/* League header */}
              <div className="mb-2 flex items-center gap-2">
                {leagueMatches[0]?.leagueLogo && (
                  <img src={leagueMatches[0].leagueLogo} alt="" className="h-5 w-5 object-contain" />
                )}
                <span className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>{league}</span>
                <span className="rounded-md px-1.5 py-0.5 text-[11px]" style={{ backgroundColor: "#1a2130", color: "#64748b" }}>
                  {leagueMatches.length} maç
                </span>
              </div>

              {/* Matches */}
              <div className="space-y-2">
                {leagueMatches.map((match) => {
                  const config = statusConfig[match.status] || statusConfig.upcoming;
                  return (
                    <div
                      key={match.id}
                      className="flex items-center gap-4 rounded-xl px-4 py-3"
                      style={{
                        backgroundColor: "#131820",
                        border: "1px solid #1e293b",
                        borderLeftWidth: "3px",
                        borderLeftColor: config.borderColor,
                      }}
                    >
                      {/* Status */}
                      <div className="flex w-16 flex-col items-center gap-1 flex-shrink-0">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{
                            backgroundColor: config.bgColor,
                            color: config.textColor,
                            ...(match.status === "live" ? { animation: "pulse 2s infinite" } : {}),
                          }}
                        >
                          {config.label}
                        </span>
                        {match.status === "live" && match.minute && (
                          <span className="text-xs font-medium" style={{ color: "#1f844e" }}>{match.minute}&apos;</span>
                        )}
                        {match.status === "upcoming" && (
                          <span className="text-xs" style={{ color: "#64748b" }}>{formatTime(match.startTime)}</span>
                        )}
                      </div>

                      {/* Teams & Score */}
                      <div className="flex flex-1 flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {match.homeLogo && <img src={match.homeLogo} alt="" className="h-5 w-5 object-contain" />}
                            <span className="text-sm font-medium" style={{ color: match.status === "ft" && (match.homeScore ?? 0) > (match.awayScore ?? 0) ? "#e2e8f0" : "#94a3b8" }}>
                              {match.homeTeam}
                            </span>
                          </div>
                          <span className="min-w-[2rem] text-center text-lg font-bold" style={{ color: match.status === "live" || match.status === "ht" ? "#1f844e" : "#e2e8f0" }}>
                            {match.homeScore ?? "-"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {match.awayLogo && <img src={match.awayLogo} alt="" className="h-5 w-5 object-contain" />}
                            <span className="text-sm font-medium" style={{ color: match.status === "ft" && (match.awayScore ?? 0) > (match.homeScore ?? 0) ? "#e2e8f0" : "#94a3b8" }}>
                              {match.awayTeam}
                            </span>
                          </div>
                          <span className="min-w-[2rem] text-center text-lg font-bold" style={{ color: match.status === "live" || match.status === "ht" ? "#1f844e" : "#e2e8f0" }}>
                            {match.awayScore ?? "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Auto-refresh note */}
      <div className="mt-6 rounded-xl px-4 py-3 text-center" style={{ backgroundColor: "#131820", border: "1px solid #1e293b" }}>
        <p className="text-xs" style={{ color: "#64748b" }}>
          Skorlar her 60 saniyede otomatik güncellenir. Sayfa yenilemenize gerek yoktur.
        </p>
      </div>
    </div>
  );
}
