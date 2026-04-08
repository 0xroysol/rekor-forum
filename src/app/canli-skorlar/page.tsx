"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { SportMatch } from "@/lib/sports/types";

// ── League config ──
const PINNED_LEAGUES = [
  { section: "football", label: "Futbol", items: [
    { flag: "🇹🇷", name: "Süper Lig", apiName: "Süper Lig", leagueId: "203" },
    { flag: "🇹🇷", name: "1. Lig", apiName: "1. Lig", leagueId: "204" },
    { flag: "🏆", name: "Şampiyonlar Ligi", apiName: "UEFA Champions League", leagueId: "2" },
    { flag: "🏆", name: "Avrupa Ligi", apiName: "UEFA Europa League", leagueId: "3" },
    { flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", name: "Premier League", apiName: "Premier League", leagueId: "39" },
    { flag: "🇪🇸", name: "La Liga", apiName: "La Liga", leagueId: "140" },
    { flag: "🇮🇹", name: "Serie A", apiName: "Serie A", leagueId: "135" },
    { flag: "🇩🇪", name: "Bundesliga", apiName: "Bundesliga", leagueId: "78" },
    { flag: "🇫🇷", name: "Ligue 1", apiName: "Ligue 1", leagueId: "61" },
  ]},
  { section: "basketball", label: "🏀 Basketbol", items: [
    { flag: "🇹🇷", name: "BSL", apiName: "BSL", leagueId: "79" },
    { flag: "🏆", name: "EuroLeague", apiName: "Euroleague", leagueId: "120" },
    { flag: "🇺🇸", name: "NBA", apiName: "NBA", leagueId: "12" },
  ]},
];

const ALL_LEAGUE_ITEMS = PINNED_LEAGUES.flatMap((s) => s.items);

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });
}

function formatDate(d: Date) {
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long", timeZone: "Europe/Istanbul" });
}

function dateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ── Standings type ──
interface Standing { rank: number; teamName: string; teamLogo: string; played: number; won: number; drawn: number; lost: number; goalsFor: number; goalsAgainst: number; points: number; form: string; }

export default function CanliSkorlarPage() {
  // State
  const [matches, setMatches] = useState<SportMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [sportTab, setSportTab] = useState<"football" | "basketball">("football");
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [collapsedLeagues, setCollapsedLeagues] = useState<Set<string>>(new Set());
  const [standings, setStandings] = useState<Standing[]>([]);
  const [standingsLeague, setStandingsLeague] = useState("Süper Lig");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Fetch matches
  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch("/api/live-scores?type=all");
      const data = await res.json();
      setMatches(data.matches || []);
      setLastUpdated(data.lastUpdated || "");
    } catch { /* keep existing */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 60_000);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  // Fetch standings when league changes
  useEffect(() => {
    const leagueItem = ALL_LEAGUE_ITEMS.find((l) => l.name === standingsLeague || l.apiName === standingsLeague);
    if (!leagueItem || leagueItem.leagueId === "79" || leagueItem.leagueId === "120" || leagueItem.leagueId === "12") {
      setStandings([]);
      return;
    }
    fetch(`/api/standings?league=${leagueItem.leagueId}&season=2025`)
      .then((r) => r.json())
      .then((d) => setStandings(d.standings || []))
      .catch(() => setStandings([]));
  }, [standingsLeague]);

  // Filter matches
  const todayKey = dateKey(selectedDate);
  const filtered = useMemo(() => {
    let list = matches.filter((m) => m.sport === sportTab);
    // Date filter — show all for today, for other dates filter by date
    const matchDate = (m: SportMatch) => {
      const d = new Date(m.startTime);
      return dateKey(d);
    };
    list = list.filter((m) => matchDate(m) === todayKey);
    // League filter
    if (selectedLeague) {
      const leagueItem = ALL_LEAGUE_ITEMS.find((l) => l.name === selectedLeague);
      if (leagueItem) {
        list = list.filter((m) => m.league.toLowerCase().includes(leagueItem.apiName.toLowerCase()) || m.league.toLowerCase().includes(leagueItem.name.toLowerCase()));
      }
    }
    return list;
  }, [matches, sportTab, todayKey, selectedLeague]);

  // Group by league
  const grouped = useMemo(() => {
    const map: Record<string, SportMatch[]> = {};
    for (const m of filtered) {
      if (!map[m.league]) map[m.league] = [];
      map[m.league].push(m);
    }
    // Sort: live matches first
    return Object.entries(map).sort(([, a], [, b]) => {
      const aLive = a.some((m) => m.status === "live" || m.status === "ht") ? 0 : 1;
      const bLive = b.some((m) => m.status === "live" || m.status === "ht") ? 0 : 1;
      return aLive - bLive;
    });
  }, [filtered]);

  // Counts
  const footballCount = matches.filter((m) => m.sport === "football" && dateKey(new Date(m.startTime)) === todayKey).length;
  const basketballCount = matches.filter((m) => m.sport === "basketball" && dateKey(new Date(m.startTime)) === todayKey).length;
  const liveCount = matches.filter((m) => m.status === "live" || m.status === "ht").length;

  // League match counts for sidebar
  const leagueMatchCount = (apiName: string) =>
    matches.filter((m) => dateKey(new Date(m.startTime)) === todayKey && (m.league.toLowerCase().includes(apiName.toLowerCase()))).length;

  // Date navigation
  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };
  const isToday = dateKey(selectedDate) === dateKey(new Date());

  const toggleCollapse = (league: string) => {
    setCollapsedLeagues((prev) => {
      const next = new Set(prev);
      if (next.has(league)) next.delete(league); else next.add(league);
      return next;
    });
  };

  // When selecting a league, also update standings
  const handleLeagueSelect = (leagueName: string | null) => {
    setSelectedLeague(leagueName);
    if (leagueName) setStandingsLeague(leagueName);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="flex" style={{ minHeight: "calc(100vh - 120px)" }}>
      {/* ── Left Sidebar ── */}
      {/* Desktop */}
      <aside className="hidden lg:block flex-shrink-0" style={{ width: 220, backgroundColor: "#131820", borderRight: "1px solid #1e293b" }}>
        <SidebarContent
          selectedLeague={selectedLeague}
          onSelect={handleLeagueSelect}
          leagueMatchCount={leagueMatchCount}
        />
      </aside>
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 overflow-y-auto" style={{ width: 260, backgroundColor: "#131820" }}>
            <SidebarContent selectedLeague={selectedLeague} onSelect={handleLeagueSelect} leagueMatchCount={leagueMatchCount} />
          </aside>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 min-w-0">
        {/* Live indicator */}
        <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "1px solid #1e293b" }}>
          <div className="flex items-center gap-2">
            {liveCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#1f844e" }}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: "#1f844e" }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: "#1f844e" }} />
                </span>
                {liveCount} canlı maç
              </span>
            )}
            {/* Mobile league filter button */}
            <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden rounded-md px-2 py-1 text-xs" style={{ color: "#94a3b8", border: "1px solid #1e293b" }}>
              {selectedLeague || "Tüm Ligler"}
            </button>
          </div>
          {lastUpdated && (
            <span className="text-[11px]" style={{ color: "#64748b" }}>
              Son: {new Date(lastUpdated).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Istanbul" })}
            </span>
          )}
        </div>

        {/* Date Nav */}
        <div className="flex items-center justify-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid #1e293b" }}>
          <button onClick={() => shiftDate(-1)} className="rounded-md px-2 py-1 text-sm transition-colors hover:bg-[#1e2738]" style={{ color: "#94a3b8", border: "1px solid #1e293b" }}>←</button>
          <button onClick={() => shiftDate(-1)} className="rounded-md px-3 py-1 text-xs transition-colors hover:bg-[#1e2738]" style={{ color: "#94a3b8", border: "1px solid #1e293b" }}>Dün</button>
          <button onClick={() => setSelectedDate(new Date())} className="rounded-md px-4 py-1 text-xs font-semibold transition-colors" style={{ backgroundColor: isToday ? "#1f844e" : "#131820", color: isToday ? "#fff" : "#94a3b8", border: isToday ? "none" : "1px solid #1e293b" }}>
            Bugün
          </button>
          <button onClick={() => shiftDate(1)} className="rounded-md px-3 py-1 text-xs transition-colors hover:bg-[#1e2738]" style={{ color: "#94a3b8", border: "1px solid #1e293b" }}>Yarın</button>
          <button onClick={() => shiftDate(1)} className="rounded-md px-2 py-1 text-sm transition-colors hover:bg-[#1e2738]" style={{ color: "#94a3b8", border: "1px solid #1e293b" }}>→</button>
        </div>
        <div className="px-4 py-1 text-center text-xs" style={{ color: "#64748b", borderBottom: "1px solid #1e293b" }}>
          {formatDate(selectedDate)}
        </div>

        {/* Sport Tabs */}
        <div className="flex" style={{ borderBottom: "1px solid #1e293b" }}>
          <button
            onClick={() => { setSportTab("football"); setSelectedLeague(null); }}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-center transition-colors"
            style={{ color: sportTab === "football" ? "#e2e8f0" : "#64748b", borderBottom: sportTab === "football" ? "2px solid #1f844e" : "2px solid transparent" }}
          >
            ⚽ Futbol ({footballCount})
          </button>
          <button
            onClick={() => { setSportTab("basketball"); setSelectedLeague(null); }}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-center transition-colors"
            style={{ color: sportTab === "basketball" ? "#e2e8f0" : "#64748b", borderBottom: sportTab === "basketball" ? "2px solid #1f844e" : "2px solid transparent" }}
          >
            🏀 Basketbol ({basketballCount})
          </button>
        </div>

        {/* Mobile league chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-2 lg:hidden" style={{ borderBottom: "1px solid #1e293b" }}>
          <button onClick={() => handleLeagueSelect(null)} className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ backgroundColor: !selectedLeague ? "#1f844e" : "#1a2130", color: !selectedLeague ? "#fff" : "#94a3b8" }}>Tümü</button>
          {PINNED_LEAGUES.find((s) => s.section === sportTab)?.items.map((l) => (
            <button key={l.name} onClick={() => handleLeagueSelect(l.name)} className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap" style={{ backgroundColor: selectedLeague === l.name ? "#1f844e" : "#1a2130", color: selectedLeague === l.name ? "#fff" : "#94a3b8" }}>
              {l.flag} {l.name}
            </button>
          ))}
        </div>

        {/* Match List */}
        <div>
          {loading ? (
            <div className="space-y-px">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-11 animate-pulse" style={{ backgroundColor: i % 2 === 0 ? "#131820" : "#0d1017" }} />
              ))}
            </div>
          ) : grouped.length === 0 ? (
            <div className="py-16 text-center">
              <span className="text-4xl block mb-3 opacity-30">{sportTab === "football" ? "⚽" : "🏀"}</span>
              <p className="text-sm" style={{ color: "#94a3b8" }}>Bugün maç bulunmuyor</p>
              <p className="text-xs mt-1" style={{ color: "#64748b" }}>Farklı bir tarih seçin veya lig filtresini kaldırın</p>
            </div>
          ) : (
            grouped.map(([league, leagueMatches]) => {
              const collapsed = collapsedLeagues.has(league);
              const logo = leagueMatches[0]?.leagueLogo;
              const hasLive = leagueMatches.some((m) => m.status === "live" || m.status === "ht");
              return (
                <div key={league}>
                  {/* League header */}
                  <button
                    onClick={() => toggleCollapse(league)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left transition-colors hover:brightness-110"
                    style={{ backgroundColor: "#1a2130" }}
                  >
                    {logo && <img src={logo} alt="" className="h-4 w-4 object-contain" />}
                    <span className="text-[13px] font-semibold flex-1" style={{ color: "#e2e8f0" }}>{league}</span>
                    {hasLive && <span className="inline-block h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: "#ef4444" }} />}
                    <span className="text-[11px]" style={{ color: "#64748b" }}>{leagueMatches.length}</span>
                    <span className="text-[10px]" style={{ color: "#64748b", transform: collapsed ? "rotate(-90deg)" : "rotate(0)", transition: "transform 200ms" }}>▼</span>
                  </button>
                  {/* Matches */}
                  {!collapsed && leagueMatches.map((match) => (
                    <MatchRow key={match.id} match={match} />
                  ))}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* ── Right Sidebar — Standings ── */}
      <aside className="hidden xl:block flex-shrink-0" style={{ width: 280, backgroundColor: "#131820", borderLeft: "1px solid #1e293b" }}>
        <div className="px-4 py-3" style={{ borderBottom: "1px solid #1e293b" }}>
          <span className="text-[13px] font-semibold" style={{ color: "#94a3b8" }}>📊 Puan Durumu</span>
          <span className="block text-[11px] mt-0.5" style={{ color: "#64748b" }}>{standingsLeague}</span>
        </div>
        {standings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr style={{ color: "#64748b", borderBottom: "1px solid #1e293b" }}>
                  <th className="px-2 py-1.5 text-left font-medium">#</th>
                  <th className="px-1 py-1.5 text-left font-medium">Takım</th>
                  <th className="px-1 py-1.5 text-center font-medium">O</th>
                  <th className="px-1 py-1.5 text-center font-medium">G</th>
                  <th className="px-1 py-1.5 text-center font-medium">M</th>
                  <th className="px-1 py-1.5 text-center font-medium">P</th>
                </tr>
              </thead>
              <tbody>
                {standings.slice(0, 10).map((t) => {
                  let borderColor = "transparent";
                  if (t.rank <= 4) borderColor = "#1f844e";
                  else if (t.rank <= 6) borderColor = "#3b82f6";
                  else if (t.rank >= standings.length - 2 && standings.length > 10) borderColor = "#ef4444";
                  return (
                    <tr key={t.rank} className="transition-colors hover:bg-[#1e2738]" style={{ borderBottom: "1px solid #1e293b" }}>
                      <td className="px-2 py-1.5" style={{ borderLeft: `2px solid ${borderColor}`, color: "#64748b" }}>{t.rank}</td>
                      <td className="px-1 py-1.5">
                        <div className="flex items-center gap-1">
                          {t.teamLogo && <img src={t.teamLogo} alt="" className="h-3.5 w-3.5 object-contain" />}
                          <span className="truncate" style={{ color: "#e2e8f0", maxWidth: 120 }}>{t.teamName}</span>
                        </div>
                      </td>
                      <td className="px-1 py-1.5 text-center" style={{ color: "#94a3b8" }}>{t.played}</td>
                      <td className="px-1 py-1.5 text-center" style={{ color: "#94a3b8" }}>{t.won}</td>
                      <td className="px-1 py-1.5 text-center" style={{ color: "#94a3b8" }}>{t.lost}</td>
                      <td className="px-1 py-1.5 text-center font-semibold" style={{ color: "#e2e8f0" }}>{t.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {standings.length > 10 && (
              <div className="px-4 py-2 text-center">
                <span className="text-[11px]" style={{ color: "#1f844e" }}>Tümünü Gör →</span>
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-8 text-center">
            <p className="text-xs" style={{ color: "#64748b" }}>
              {sportTab === "basketball" ? "Basketbol puan durumu yakında" : "Bir lig seçin"}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

// ── Sidebar Component ──
function SidebarContent({ selectedLeague, onSelect, leagueMatchCount }: {
  selectedLeague: string | null;
  onSelect: (league: string | null) => void;
  leagueMatchCount: (apiName: string) => number;
}) {
  return (
    <div>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid #1e293b" }}>
        <span className="text-[13px] font-semibold" style={{ color: "#e2e8f0" }}>⭐ Liglerim</span>
      </div>
      {PINNED_LEAGUES.map((section) => (
        <div key={section.section}>
          {section.section === "basketball" && (
            <div className="px-4 py-2" style={{ borderTop: "1px solid #1e293b" }}>
              <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>{section.label}</span>
            </div>
          )}
          {section.items.map((l) => {
            const count = leagueMatchCount(l.apiName);
            const active = selectedLeague === l.name;
            return (
              <button
                key={l.name}
                onClick={() => onSelect(active ? null : l.name)}
                className="w-full flex items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-[#1e2738]"
                style={{
                  backgroundColor: active ? "#1a2130" : "transparent",
                  borderLeft: active ? "2px solid #1f844e" : "2px solid transparent",
                }}
              >
                <span className="text-sm">{l.flag}</span>
                <span className="flex-1 text-[13px] truncate" style={{ color: active ? "#e2e8f0" : "#94a3b8" }}>{l.name}</span>
                {count > 0 && (
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: "#1a2130", color: "#64748b" }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      ))}
      <button
        onClick={() => onSelect(null)}
        className="w-full px-4 py-2.5 text-left text-[13px] font-medium transition-colors hover:bg-[#1e2738]"
        style={{ color: "#1f844e", borderTop: "1px solid #1e293b" }}
      >
        Tüm Ligler
      </button>
    </div>
  );
}

// ── Match Row Component ──
function MatchRow({ match }: { match: SportMatch }) {
  const isLive = match.status === "live";
  const isHT = match.status === "ht";
  const isFT = match.status === "ft";
  const isUpcoming = match.status === "upcoming";
  const isPostponed = match.status === "postponed";

  const homeWin = isFT && (match.homeScore ?? 0) > (match.awayScore ?? 0);
  const awayWin = isFT && (match.awayScore ?? 0) > (match.homeScore ?? 0);

  return (
    <div className="flex items-center h-11 px-2 transition-colors hover:bg-[#1e2738] cursor-pointer" style={{ borderBottom: "1px solid #1e293b" }}>
      {/* Status / Time — 56px */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center" style={{ width: 56 }}>
        {isLive && (
          <>
            <span className="flex items-center gap-1 text-[12px] font-bold" style={{ color: "#ef4444" }}>
              {match.minute}&apos;
              <span className="inline-block h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#ef4444" }} />
            </span>
          </>
        )}
        {isHT && <span className="text-[11px] font-bold" style={{ color: "#e8a935" }}>DA</span>}
        {isFT && <span className="text-[11px] font-semibold" style={{ color: "#1f844e" }}>MS</span>}
        {isUpcoming && <span className="text-[12px]" style={{ color: "#94a3b8" }}>{formatTime(match.startTime)}</span>}
        {isPostponed && <span className="text-[11px]" style={{ color: "#64748b" }}>ERT</span>}
      </div>

      {/* Home team — right aligned */}
      <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0 pr-2">
        <span className="text-[13px] truncate" style={{ color: homeWin ? "#e2e8f0" : "#94a3b8", fontWeight: homeWin ? 700 : 500 }}>
          {match.homeTeam}
        </span>
        {match.homeLogo && <img src={match.homeLogo} alt="" className="h-5 w-5 object-contain flex-shrink-0" />}
      </div>

      {/* Score — center, 60px */}
      <div className="flex-shrink-0 flex items-center justify-center font-mono text-[15px] font-bold" style={{ width: 60, color: isLive || isHT ? "#ef4444" : isFT ? "#e2e8f0" : "#64748b" }}>
        {isUpcoming ? (
          <span className="text-[13px]" style={{ color: "#64748b" }}>- : -</span>
        ) : (
          <>{match.homeScore ?? 0} : {match.awayScore ?? 0}</>
        )}
      </div>

      {/* Away team — left aligned */}
      <div className="flex-1 flex items-center gap-1.5 min-w-0 pl-2">
        {match.awayLogo && <img src={match.awayLogo} alt="" className="h-5 w-5 object-contain flex-shrink-0" />}
        <span className="text-[13px] truncate" style={{ color: awayWin ? "#e2e8f0" : "#94a3b8", fontWeight: awayWin ? 700 : 500 }}>
          {match.awayTeam}
        </span>
      </div>
    </div>
  );
}
