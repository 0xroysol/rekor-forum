"use client";

import { useState, useEffect } from "react";

interface MatchEvent {
  time: number | null;
  extra: number | null;
  team: string;
  teamLogo: string;
  player: string;
  assist: string | null;
  type: string;
  detail: string;
}

interface TeamStat {
  team: string;
  teamLogo: string;
  stats: { type: string; value: string | number | null }[];
}

interface TeamLineup {
  team: string;
  teamLogo: string;
  formation: string;
  coach: string;
  startXI: { id: number; name: string; number: number; pos: string }[];
  substitutes: { id: number; name: string; number: number; pos: string }[];
}

interface MatchData {
  sport: string;
  events: MatchEvent[];
  statistics: TeamStat[];
  lineups: TeamLineup[];
}

function eventIcon(type: string, detail: string): string {
  if (type === "Goal") {
    if (detail?.includes("Missed Penalty")) return "❌";
    if (detail?.includes("Penalty")) return "⚽";
    if (detail?.includes("Own Goal")) return "🔴";
    return "⚽";
  }
  if (type === "Card") {
    if (detail?.includes("Red") || detail?.includes("Second")) return "🟥";
    return "🟨";
  }
  if (type === "subst") return "🔄";
  if (type === "Var") return "📺";
  return "•";
}

function StatBar({ label, homeVal, awayVal }: { label: string; homeVal: string | number | null; awayVal: string | number | null }) {
  const hNum = typeof homeVal === "number" ? homeVal : parseFloat(String(homeVal || "0").replace("%", "")) || 0;
  const aNum = typeof awayVal === "number" ? awayVal : parseFloat(String(awayVal || "0").replace("%", "")) || 0;
  const total = hNum + aNum || 1;
  const hPct = (hNum / total) * 100;
  const aPct = (aNum / total) * 100;
  const hHigher = hNum >= aNum;

  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="w-10 text-right text-[12px] font-medium" style={{ color: hHigher ? "#e2e8f0" : "#64748b" }}>
        {homeVal ?? 0}
      </span>
      <div className="flex-1 flex h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#1e293b" }}>
        <div className="rounded-l-full transition-all" style={{ width: `${hPct}%`, backgroundColor: hHigher ? "#1f844e" : "#64748b" }} />
        <div className="rounded-r-full transition-all" style={{ width: `${aPct}%`, backgroundColor: !hHigher ? "#1f844e" : "#64748b" }} />
      </div>
      <span className="w-10 text-[12px] font-medium" style={{ color: !hHigher ? "#e2e8f0" : "#64748b" }}>
        {awayVal ?? 0}
      </span>
    </div>
  );
}

// Stat label mapping
const STAT_LABELS: Record<string, string> = {
  "Ball Possession": "Top Sahipliği",
  "Total Shots": "Toplam Şut",
  "Shots on Goal": "İsabetli Şut",
  "Shots off Goal": "İsabetsiz Şut",
  "Corner Kicks": "Korner",
  "Fouls": "Faul",
  "Offsides": "Ofsayt",
  "Yellow Cards": "Sarı Kart",
  "Red Cards": "Kırmızı Kart",
  "Goalkeeper Saves": "Kurtarış",
  "Total passes": "Toplam Pas",
  "Passes accurate": "İsabetli Pas",
  "Passes %": "Pas İsabeti",
  "expected_goals": "Beklenen Gol (xG)",
};

export function MatchDetailPanel({
  matchId,
  sport,
  status,
  homeTeam,
  awayTeam,
}: {
  matchId: string;
  sport: string;
  status: string;
  homeTeam: string;
  awayTeam: string;
}) {
  const [data, setData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<"events" | "stats" | "lineup">("events");

  const isUpcoming = status === "upcoming";

  useEffect(() => {
    if (isUpcoming) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    fetch(`/api/live-scores/match?id=${matchId}&sport=${sport}&status=${status}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [matchId, sport, status, isUpcoming]);

  // Auto-refresh for live matches
  useEffect(() => {
    if (status !== "live" && status !== "ht") return;
    const interval = setInterval(() => {
      fetch(`/api/live-scores/match?id=${matchId}&sport=${sport}&status=${status}`)
        .then((r) => r.json())
        .then((d) => setData(d))
        .catch(() => {});
    }, 60_000);
    return () => clearInterval(interval);
  }, [matchId, sport, status]);

  return (
    <div
      className="overflow-hidden transition-all duration-200"
      style={{ backgroundColor: "#131820", borderBottom: "1px solid #1e293b" }}
    >
      {/* Tabs */}
      <div className="flex" style={{ borderBottom: "1px solid #1e293b" }}>
        {(["events", "stats", "lineup"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 px-3 py-2 text-[12px] font-medium text-center transition-colors"
            style={{
              color: tab === t ? "#e2e8f0" : "#64748b",
              borderBottom: tab === t ? "2px solid #1f844e" : "2px solid transparent",
            }}
          >
            {t === "events" ? "Olaylar" : t === "stats" ? "İstatistik" : "Kadro"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 py-3" style={{ minHeight: 120 }}>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-5 rounded animate-pulse" style={{ backgroundColor: "#1a2130" }} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-xs" style={{ color: "#64748b" }}>İstatistikler yüklenemedi.</p>
            <button
              onClick={() => { setLoading(true); setError(false); fetch(`/api/live-scores/match?id=${matchId}&sport=${sport}&status=${status}`).then((r) => r.json()).then((d) => { setData(d); setLoading(false); }).catch(() => { setError(true); setLoading(false); }); }}
              className="mt-2 text-xs px-3 py-1 rounded-md" style={{ color: "var(--accent-green)", border: "1px solid #1e293b" }}
            >
              Tekrar Dene
            </button>
          </div>
        ) : isUpcoming ? (
          <p className="text-center text-xs py-4" style={{ color: "#64748b" }}>
            {tab === "lineup" ? "Kadro henüz açıklanmadı" : "Maç başladığında burada görünecek"}
          </p>
        ) : (
          <>
            {/* Events Tab */}
            {tab === "events" && (
              <div>
                {!data?.events?.length ? (
                  <p className="text-center text-xs py-4" style={{ color: "#64748b" }}>Bu maç için olay verisi mevcut değil</p>
                ) : (
                  <div className="space-y-0.5">
                    {data.events.map((e, i) => {
                      const isOwnGoal = e.type === "Goal" && e.detail?.includes("Own Goal");
                      const isMissedPen = e.type === "Goal" && e.detail?.includes("Missed Penalty");
                      const isPenGoal = e.type === "Goal" && e.detail?.includes("Penalty") && !isMissedPen && !isOwnGoal;
                      // Own goals: show on the player's OWN team side (like Flashscore)
                      const isHome = e.team === homeTeam;
                      const icon = eventIcon(e.type, e.detail);
                      const min = e.extra ? `${e.time}+${e.extra}'` : `${e.time}'`;
                      const isGoal = e.type === "Goal" && !isMissedPen;

                      const playerDisplay = (
                        <span className="text-[12px] truncate" style={{ color: isOwnGoal ? "#ef4444" : isGoal ? "#e2e8f0" : "#94a3b8", fontWeight: isGoal ? 600 : 400 }}>
                          {e.player}
                          {isOwnGoal && <span style={{ color: "#ef4444" }}> (k.k.)</span>}
                          {isPenGoal && <span style={{ color: "#64748b" }}> (P)</span>}
                          {isMissedPen && <span style={{ color: "#ef4444" }}> (P)</span>}
                          {e.type === "subst" && e.assist && <span style={{ color: "#64748b" }}> ↔ {e.assist}</span>}
                          {isGoal && !isOwnGoal && !isPenGoal && e.assist && <span style={{ color: "#64748b" }}> ({e.assist})</span>}
                        </span>
                      );

                      return (
                        <div key={i} className="flex items-center gap-2 py-1" style={{ borderBottom: "1px solid #1e293b20" }}>
                          {/* Home side */}
                          <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
                            {isHome && <>{playerDisplay}<span>{icon}</span></>}
                          </div>
                          {/* Minute */}
                          <div className="flex-shrink-0 w-12 text-center">
                            <span className="text-[11px] font-mono font-medium" style={{ color: isGoal ? "#1f844e" : "#64748b" }}>{min}</span>
                          </div>
                          {/* Away side */}
                          <div className="flex-1 flex items-center gap-1.5 min-w-0">
                            {!isHome && <><span>{icon}</span>{playerDisplay}</>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Stats Tab */}
            {tab === "stats" && (
              <div>
                {!data?.statistics?.length || data.statistics.length < 2 ? (
                  <p className="text-center text-xs py-4" style={{ color: "#64748b" }}>Bu maç için istatistik mevcut değil</p>
                ) : (
                  <div>
                    {/* Team headers */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        {data.statistics[0].teamLogo && <img src={data.statistics[0].teamLogo} alt="" className="h-4 w-4 object-contain" />}
                        <span className="text-[12px] font-medium" style={{ color: "#e2e8f0" }}>{data.statistics[0].team}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-medium" style={{ color: "#e2e8f0" }}>{data.statistics[1].team}</span>
                        {data.statistics[1].teamLogo && <img src={data.statistics[1].teamLogo} alt="" className="h-4 w-4 object-contain" />}
                      </div>
                    </div>
                    {/* Stat rows */}
                    {data.statistics[0].stats.map((s, i) => {
                      const awayS = data.statistics[1].stats[i];
                      const label = STAT_LABELS[String(s.type)] || String(s.type);
                      return (
                        <div key={i}>
                          <div className="text-center text-[11px] mb-0.5" style={{ color: "#64748b" }}>{label}</div>
                          <StatBar label={label} homeVal={s.value} awayVal={awayS?.value ?? null} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Lineup Tab */}
            {tab === "lineup" && (
              <div>
                {!data?.lineups?.length ? (
                  <p className="text-center text-xs py-4" style={{ color: "#64748b" }}>Kadro verisi mevcut değil</p>
                ) : (
                  <div className="flex gap-4">
                    {data.lineups.map((team, ti) => (
                      <div key={ti} className="flex-1 min-w-0">
                        {/* Team header */}
                        <div className="flex items-center gap-1.5 mb-2">
                          {team.teamLogo && <img src={team.teamLogo} alt="" className="h-4 w-4 object-contain" />}
                          <span className="text-[12px] font-semibold" style={{ color: "#e2e8f0" }}>{team.team}</span>
                          {team.formation && <span className="text-[10px] ml-1" style={{ color: "#64748b" }}>({team.formation})</span>}
                        </div>
                        {/* Start XI */}
                        <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: "#64748b" }}>İlk 11</div>
                        {team.startXI.map((p) => (
                          <div key={p.id || p.name} className="flex items-center gap-1 py-0.5">
                            <span className="w-5 text-right text-[10px]" style={{ color: "#64748b" }}>{p.number}</span>
                            <span className="text-[10px] font-medium rounded px-1" style={{ backgroundColor: "#1a2130", color: p.pos === "G" ? "#e8a935" : p.pos === "D" ? "#3b82f6" : p.pos === "M" ? "#1f844e" : "#ef4444" }}>
                              {p.pos === "G" ? "GK" : p.pos === "D" ? "DF" : p.pos === "M" ? "MF" : "FW"}
                            </span>
                            <span className="text-[12px] truncate" style={{ color: "#94a3b8" }}>{p.name}</span>
                          </div>
                        ))}
                        {/* Subs */}
                        {team.substitutes.length > 0 && (
                          <>
                            <div className="text-[10px] font-semibold uppercase tracking-wide mt-2 mb-1 pt-2" style={{ color: "#64748b", borderTop: "1px solid #1e293b" }}>Yedekler</div>
                            {team.substitutes.slice(0, 7).map((p) => (
                              <div key={p.id || p.name} className="flex items-center gap-1 py-0.5">
                                <span className="w-5 text-right text-[10px]" style={{ color: "#64748b" }}>{p.number}</span>
                                <span className="text-[10px] font-medium rounded px-1" style={{ backgroundColor: "#1a2130", color: "#64748b" }}>
                                  {p.pos === "G" ? "GK" : p.pos === "D" ? "DF" : p.pos === "M" ? "MF" : p.pos === "F" ? "FW" : p.pos || "—"}
                                </span>
                                <span className="text-[12px] truncate" style={{ color: "#64748b" }}>{p.name}</span>
                              </div>
                            ))}
                          </>
                        )}
                        {/* Coach */}
                        {team.coach && (
                          <div className="mt-2 pt-2 flex items-center gap-1" style={{ borderTop: "1px solid #1e293b" }}>
                            <span className="text-[10px]" style={{ color: "#64748b" }}>TD:</span>
                            <span className="text-[12px]" style={{ color: "#94a3b8" }}>{team.coach}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
