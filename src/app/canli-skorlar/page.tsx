"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { SportMatch } from "@/lib/sports/types";
import { MatchDetailPanel } from "@/components/match-detail";

// ── Config ──
const SIDEBAR_LEAGUES = [
  { flag: "🇹🇷", name: "Süper Lig", apiName: "Süper Lig", order: 1 },
  { flag: "🇹🇷", name: "1. Lig", apiName: "1. Lig", order: 9 },
  { flag: "🏆", name: "Şampiyonlar Ligi", apiName: "UEFA Champions League", order: 2 },
  { flag: "🏆", name: "Avrupa Ligi", apiName: "UEFA Europa League", order: 3 },
  { flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", name: "Premier League", apiName: "Premier League", order: 4 },
  { flag: "🇪🇸", name: "La Liga", apiName: "La Liga", order: 5 },
  { flag: "🇮🇹", name: "Serie A", apiName: "Serie A", order: 6 },
  { flag: "🇩🇪", name: "Bundesliga", apiName: "Bundesliga", order: 7 },
  { flag: "🇫🇷", name: "Ligue 1", apiName: "Ligue 1", order: 8 },
];

const ALL_LEAGUE_ORDERS: Record<string, number> = {};
[...SIDEBAR_LEAGUES, { apiName: "BSL", order: 10 }, { apiName: "Euroleague", order: 11 }, { apiName: "NBA", order: 12 }]
  .forEach(l => { ALL_LEAGUE_ORDERS[l.apiName.toLowerCase()] = l.order; });

function leagueOrder(name: string): number {
  const lower = name.toLowerCase();
  for (const [key, ord] of Object.entries(ALL_LEAGUE_ORDERS)) {
    if (lower.includes(key)) return ord;
  }
  return 99;
}

function formatTime(d: string) { return new Date(d).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }); }
function formatDate(d: Date) { return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long", timeZone: "Europe/Istanbul" }); }
function dk(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function loadFavs(): Set<string> { if (typeof window === "undefined") return new Set(); try { return new Set(JSON.parse(localStorage.getItem("fav_matches")||"[]")); } catch { return new Set(); } }
function saveFavs(f: Set<string>) { localStorage.setItem("fav_matches", JSON.stringify([...f])); }

// Sport tabs config
type SportTab = "favorites" | "football" | "basketball";
const SPORT_TABS: { key: SportTab; icon: string; label: string; active: boolean }[] = [
  { key: "favorites", icon: "⭐", label: "Favoriler", active: true },
  { key: "football", icon: "⚽", label: "Futbol", active: true },
  { key: "basketball", icon: "🏀", label: "Basketbol", active: true },
];
const COMING_SOON = [
  { icon: "🎾", label: "Tenis" }, { icon: "🏒", label: "Hokey" }, { icon: "⛳", label: "Golf" },
  { icon: "⚾", label: "Beyzbol" }, { icon: "🎱", label: "Snooker" }, { icon: "🏐", label: "Voleybol" },
];

export default function CanliSkorlarPage() {
  const [matches, setMatches] = useState<SportMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [date, setDate] = useState(() => new Date());
  const [sportTab, setSportTab] = useState<SportTab>("football");
  const [league, setLeague] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [mobSidebar, setMobSidebar] = useState(false);
  const [favs, setFavs] = useState<Set<string>>(() => loadFavs());
  const [selected, setSelected] = useState<SportMatch | null>(null);
  const [mobDetail, setMobDetail] = useState(false);
  const [goalIds, setGoalIds] = useState<Set<string>>(new Set());
  const prevScores = useRef<Map<string, string>>(new Map());

  const toggleFav = (id: string) => { setFavs(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); saveFavs(n); return n; }); };
  const toggleCol = (k: string) => { setCollapsed(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; }); };
  const selectMatch = (m: SportMatch) => { setSelected(prev => prev?.id === m.id ? null : m); if (window.innerWidth < 1280) setMobDetail(true); };

  // Adaptive polling
  const hasLive = matches.some(m => m.status === "live" || m.status === "ht");
  const fetchData = useCallback(async () => {
    try {
      const r = await fetch("/api/live-scores");
      const d = await r.json();
      const newMatches = d.matches || [];

      // Goal detection
      const newGoals = new Set<string>();
      for (const m of newMatches) {
        if (m.status !== "live" && m.status !== "ht") continue;
        const scoreKey = `${m.homeScore ?? 0}-${m.awayScore ?? 0}`;
        const prev = prevScores.current.get(m.id);
        if (prev && prev !== scoreKey) newGoals.add(m.id);
        prevScores.current.set(m.id, scoreKey);
      }
      if (newGoals.size > 0) {
        setGoalIds(newGoals);
        setTimeout(() => setGoalIds(new Set()), 2500);
      }

      setMatches(newMatches);
      setLastUpdated(d.lastUpdated || "");
    } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); const i = setInterval(fetchData, hasLive ? 120_000 : 300_000); return () => clearInterval(i); }, [fetchData, hasLive]);

  const today = dk(date);
  const liveCount = matches.filter(m => m.status === "live" || m.status === "ht").length;

  // Filtered matches based on sport tab
  const filtered = useMemo(() => {
    if (sportTab === "favorites") {
      return matches.filter(m => favs.has(m.id) && (m.status === "live" || m.status === "ht" || dk(new Date(m.startTime)) === today));
    }
    const sportKey = sportTab === "football" ? "football" : "basketball";
    let list = matches.filter(m => { if (m.sport !== sportKey) return false; if (m.status === "live" || m.status === "ht") return true; return dk(new Date(m.startTime)) === today; });
    if (league) {
      const li = SIDEBAR_LEAGUES.find(l => l.name === league);
      if (li) list = list.filter(m => m.league.toLowerCase().includes(li.apiName.toLowerCase()) || m.league.toLowerCase().includes(li.name.toLowerCase()));
    }
    return list;
  }, [matches, sportTab, today, league, favs]);

  // League groups — within each: live → upcoming → finished
  const leagueGroups = useMemo(() => {
    const map: Record<string, SportMatch[]> = {};
    for (const m of filtered) { (map[m.league] ??= []).push(m); }
    const so = (s: string) => s === "live" || s === "ht" ? 0 : s === "upcoming" ? 1 : 2;
    for (const lg of Object.keys(map)) map[lg].sort((a, b) => { const d = so(a.status) - so(b.status); return d !== 0 ? d : new Date(a.startTime).getTime() - new Date(b.startTime).getTime(); });
    return Object.entries(map).sort(([aL, aM], [bL, bM]) => {
      const al = aM.some(m => m.status === "live" || m.status === "ht") ? 0 : 1;
      const bl = bM.some(m => m.status === "live" || m.status === "ht") ? 0 : 1;
      if (al !== bl) return al - bl;
      const au = aM.some(m => m.status === "upcoming") ? 0 : 1;
      const bu = bM.some(m => m.status === "upcoming") ? 0 : 1;
      if (au !== bu) return au - bu;
      return leagueOrder(aL) - leagueOrder(bL);
    });
  }, [filtered]);

  // Counts for sport tabs
  const fbCount = matches.filter(m => m.sport === "football" && (dk(new Date(m.startTime)) === today || m.status === "live" || m.status === "ht")).length;
  const bbCount = matches.filter(m => m.sport === "basketball" && (dk(new Date(m.startTime)) === today || m.status === "live" || m.status === "ht")).length;
  const favCount = matches.filter(m => favs.has(m.id)).length;

  // Sidebar helpers
  const lmc = (n: string) => matches.filter(m => (dk(new Date(m.startTime)) === today || m.status === "live" || m.status === "ht") && m.sport === "football" && m.league.toLowerCase().includes(n.toLowerCase())).length;
  const lhl = (n: string) => matches.some(m => (m.status === "live" || m.status === "ht") && m.league.toLowerCase().includes(n.toLowerCase()));

  const shift = (d: number) => { const n = new Date(date); n.setDate(n.getDate() + d); setDate(n); };
  const isToday = dk(date) === dk(new Date());
  const selLeague = (n: string | null) => { setLeague(n); setMobSidebar(false); };

  return (
    <div className="flex" style={{ minHeight: "calc(100vh - 120px)" }}>
      {/* ═══ Left Sidebar — Football leagues only ═══ */}
      <aside className="hidden lg:block flex-shrink-0 overflow-y-auto" style={{ width: 220, backgroundColor: "#131820", borderRight: "1px solid #1e293b" }}>
        <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #1e293b" }}>
          <span className="text-[13px] font-semibold" style={{ color: "#e2e8f0" }}>⚽ Ligler</span>
        </div>
        {SIDEBAR_LEAGUES.map(l => {
          const c = lmc(l.apiName); const live = lhl(l.apiName); const act = league === l.name;
          return (
            <button key={l.name} onClick={() => selLeague(act ? null : l.name)}
              className="w-full flex items-center gap-2 px-4 py-1.5 text-left transition-colors hover:bg-[#1e2738]"
              style={{ backgroundColor: act ? "#1a2130" : "transparent", borderLeft: act ? "2px solid #1f844e" : "2px solid transparent", opacity: sportTab !== "football" && sportTab !== "favorites" ? 0.35 : 1 }}>
              <span className="text-[13px]">{l.flag}</span>
              <span className="flex-1 text-[12px] truncate" style={{ color: act ? "#e2e8f0" : "#94a3b8" }}>{l.name}</span>
              {live && <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#ef4444" }} />}
              {c > 0 && <span className="text-[10px]" style={{ color: "#64748b" }}>{c}</span>}
            </button>
          );
        })}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobSidebar(false)} />
          <aside className="absolute left-0 top-0 bottom-0 overflow-y-auto" style={{ width: 260, backgroundColor: "#131820" }}>
            <div className="px-4 py-3" style={{ borderBottom: "1px solid #1e293b" }}>
              <span className="text-[13px] font-semibold" style={{ color: "#e2e8f0" }}>⚽ Ligler</span>
            </div>
            {SIDEBAR_LEAGUES.map(l => (
              <button key={l.name} onClick={() => selLeague(league === l.name ? null : l.name)}
                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-[#1e2738]"
                style={{ backgroundColor: league === l.name ? "#1a2130" : "transparent", borderLeft: league === l.name ? "2px solid #1f844e" : "2px solid transparent" }}>
                <span>{l.flag}</span>
                <span className="flex-1 text-[13px]" style={{ color: league === l.name ? "#e2e8f0" : "#94a3b8" }}>{l.name}</span>
              </button>
            ))}
          </aside>
        </div>
      )}

      {/* ═══ Main ═══ */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-3 h-8" style={{ borderBottom: "1px solid #1e293b" }}>
          <div className="flex items-center gap-2">
            {liveCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "#1f844e" }}>
                <span className="relative flex h-1.5 w-1.5"><span className="absolute h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: "#1f844e" }} /><span className="relative h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#1f844e" }} /></span>
                {liveCount} canlı
              </span>
            )}
            <button onClick={() => setMobSidebar(true)} className="lg:hidden text-[11px] px-2 py-0.5 rounded" style={{ color: "#94a3b8", border: "1px solid #1e293b" }}>{league || "Ligler"}</button>
          </div>
          {lastUpdated && <span className="text-[10px]" style={{ color: "#64748b" }}>{new Date(lastUpdated).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Istanbul" })}</span>}
        </div>

        {/* ═══ Sport Tab Bar — Flashscore style ═══ */}
        <div className="flex items-center overflow-x-auto" style={{ backgroundColor: "#131820", borderBottom: "1px solid #1e293b" }}>
          {SPORT_TABS.map(t => {
            const count = t.key === "favorites" ? favCount : t.key === "football" ? fbCount : bbCount;
            const isActive = sportTab === t.key;
            return (
              <button key={t.key} onClick={() => { setSportTab(t.key); if (t.key !== "football") setLeague(null); setSelected(null); }}
                className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium whitespace-nowrap transition-colors hover:bg-[#1e2738]"
                style={{ color: isActive ? "#e2e8f0" : "#64748b", borderBottom: isActive ? "2px solid #1f844e" : "2px solid transparent", letterSpacing: "0.3px" }}>
                <span>{t.icon}</span>
                <span className="uppercase">{t.label}</span>
                {count > 0 && <span className="text-[10px]" style={{ color: isActive ? "#94a3b8" : "#64748b" }}>({count})</span>}
              </button>
            );
          })}
          {/* Coming soon sports */}
          {COMING_SOON.map(s => (
            <div key={s.label} className="flex items-center gap-1 px-3 py-2 whitespace-nowrap" style={{ opacity: 0.35, cursor: "default" }}>
              <span className="text-[12px]">{s.icon}</span>
              <span className="text-[11px] uppercase" style={{ color: "#64748b", letterSpacing: "0.3px" }}>{s.label}</span>
              <span className="text-[9px] italic" style={{ color: "#64748b" }}>Yakında</span>
            </div>
          ))}
        </div>

        {/* Date Nav */}
        <div className="flex items-center justify-center gap-1.5 px-3 py-2" style={{ borderBottom: "1px solid #1e293b" }}>
          <button onClick={() => shift(-1)} className="px-1.5 py-0.5 text-[13px] rounded hover:bg-[#1e2738]" style={{ color: "#94a3b8", border: "1px solid #1e293b" }}>←</button>
          <button onClick={() => shift(-1)} className="px-2 py-0.5 text-[11px] rounded hover:bg-[#1e2738]" style={{ color: "#94a3b8", border: "1px solid #1e293b" }}>Dün</button>
          <button onClick={() => setDate(new Date())} className="px-3 py-0.5 text-[11px] font-semibold rounded" style={{ backgroundColor: isToday ? "#1f844e" : "#131820", color: isToday ? "#fff" : "#94a3b8", border: isToday ? "none" : "1px solid #1e293b" }}>Bugün</button>
          <button onClick={() => shift(1)} className="px-2 py-0.5 text-[11px] rounded hover:bg-[#1e2738]" style={{ color: "#94a3b8", border: "1px solid #1e293b" }}>Yarın</button>
          <button onClick={() => shift(1)} className="px-1.5 py-0.5 text-[13px] rounded hover:bg-[#1e2738]" style={{ color: "#94a3b8", border: "1px solid #1e293b" }}>→</button>
          <span className="ml-2 text-[11px] hidden sm:inline" style={{ color: "#64748b" }}>{formatDate(date)}</span>
        </div>

        {/* Mobile league chips (only for football) */}
        {sportTab === "football" && (
          <div className="flex gap-1 overflow-x-auto px-2 py-1.5 lg:hidden" style={{ borderBottom: "1px solid #1e293b" }}>
            <button onClick={() => selLeague(null)} className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: !league ? "#1f844e" : "#1a2130", color: !league ? "#fff" : "#94a3b8" }}>Tümü</button>
            {SIDEBAR_LEAGUES.map(l => (
              <button key={l.name} onClick={() => selLeague(league === l.name ? null : l.name)} className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap" style={{ backgroundColor: league === l.name ? "#1f844e" : "#1a2130", color: league === l.name ? "#fff" : "#94a3b8" }}>{l.flag} {l.name}</button>
            ))}
          </div>
        )}

        {/* ═══ Match List ═══ */}
        {loading ? (
          <div>{[1, 2, 3, 4, 5, 6].map(i => (<div key={i} className="h-10 animate-pulse" style={{ backgroundColor: i % 2 ? "#0d1017" : "#131820", borderBottom: "1px solid #1e293b" }} />))}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-3xl block mb-2 opacity-20">{sportTab === "favorites" ? "⭐" : sportTab === "football" ? "⚽" : "🏀"}</span>
            <p className="text-[13px]" style={{ color: "#94a3b8" }}>{sportTab === "favorites" ? "Favori maçınız yok" : "Bugün maç bulunmuyor"}</p>
            <p className="text-[11px] mt-1" style={{ color: "#64748b" }}>{sportTab === "favorites" ? "Maçları favorilere eklemek için ☆ ikonuna tıklayın" : "Farklı bir tarih veya lig seçin"}</p>
          </div>
        ) : (
          leagueGroups.map(([lg, lm]) => {
            const lgCol = collapsed.has(`lg_${lg}`);
            const logo = lm[0]?.leagueLogo;
            const sidebarItem = SIDEBAR_LEAGUES.find(l => lg.toLowerCase().includes(l.apiName.toLowerCase()) || lg.toLowerCase().includes(l.name.toLowerCase()));
            const flag = sidebarItem?.flag || (lm[0]?.sport === "basketball" ? "🏀" : "");
            const lgHasLive = lm.some(m => m.status === "live" || m.status === "ht");

            return (
              <div key={lg}>
                <button onClick={() => toggleCol(`lg_${lg}`)} className="w-full flex items-center gap-1.5 px-3 h-8 text-left" style={{ backgroundColor: "#1a2130", borderBottom: "1px solid #1e293b" }}>
                  {lgHasLive && <span className="relative flex h-2 w-2 flex-shrink-0"><span className="absolute h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: "#ef4444" }} /><span className="relative h-2 w-2 rounded-full" style={{ backgroundColor: "#ef4444" }} /></span>}
                  {flag && <span className="text-[13px] flex-shrink-0">{flag}</span>}
                  {logo && <img src={logo} alt="" className="h-4 w-4 object-contain flex-shrink-0" />}
                  <span className="text-[12px] font-semibold flex-1" style={{ color: "#e2e8f0" }}>{lg}</span>
                  <span className="text-[10px]" style={{ color: "#64748b" }}>{lm.length}</span>
                  <span className="text-[8px] ml-1" style={{ color: "#64748b", transform: lgCol ? "rotate(-90deg)" : "rotate(0)", transition: "transform 150ms" }}>▼</span>
                </button>
                {!lgCol && lm.map(m => (
                  <MRow key={m.id} m={m} fav={favs.has(m.id)} onFav={() => toggleFav(m.id)} active={selected?.id === m.id} onSelect={() => selectMatch(m)} hasGoal={goalIds.has(m.id)} />
                ))}
              </div>
            );
          })
        )}
      </main>

      {/* ═══ Right Sidebar — Match Detail ═══ */}
      <aside className="hidden xl:flex flex-col flex-shrink-0" style={{ width: 380, backgroundColor: "#131820", borderLeft: "1px solid #1e293b" }}>
        {selected ? (
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid #1e293b" }}>
              <button onClick={() => setSelected(null)} className="flex items-center justify-center h-6 w-6 rounded hover:bg-[#1e2738] text-[16px] font-bold transition-colors" style={{ color: "#94a3b8" }}>✕</button>
              <span className="text-[11px] font-medium" style={{ color: "#94a3b8" }}>{selected.league}</span>
            </div>
            <div className="px-4 py-4 text-center" style={{ borderBottom: "1px solid #1e293b" }}>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center flex-1">
                  {selected.homeLogo && <img src={selected.homeLogo} alt="" className="h-8 w-8 mx-auto mb-1 object-contain" />}
                  <div className="text-[12px] font-medium" style={{ color: "#e2e8f0" }}>{selected.homeTeam}</div>
                </div>
                <div>
                  <div className="font-mono text-[24px] font-bold" style={{ color: selected.status === "live" || selected.status === "ht" ? "#ef4444" : "#e2e8f0" }}>
                    {selected.status === "upcoming" ? "-:-" : `${selected.homeScore ?? 0}:${selected.awayScore ?? 0}`}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: selected.status === "live" ? "#ef4444" : selected.status === "ht" ? "#e8a935" : selected.status === "ft" ? "#1f844e" : "#64748b" }}>
                    {selected.status === "live" ? `${selected.minute}'` : selected.status === "ht" ? "Devre Arası" : selected.status === "ft" ? "Maç Sonu" : formatTime(selected.startTime)}
                  </div>
                </div>
                <div className="text-center flex-1">
                  {selected.awayLogo && <img src={selected.awayLogo} alt="" className="h-8 w-8 mx-auto mb-1 object-contain" />}
                  <div className="text-[12px] font-medium" style={{ color: "#e2e8f0" }}>{selected.awayTeam}</div>
                </div>
              </div>
            </div>
            <MatchDetailPanel matchId={selected.id} sport={selected.sport} status={selected.status} homeTeam={selected.homeTeam} awayTeam={selected.awayTeam} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[12px] text-center px-6" style={{ color: "#64748b" }}>Detayları görmek için<br />bir maça tıklayın</p>
          </div>
        )}
      </aside>

      {/* Mobile Detail Bottom Sheet */}
      {mobDetail && selected && (
        <div className="fixed inset-0 z-50 xl:hidden flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setMobDetail(false); setSelected(null); }} />
          <div className="relative rounded-t-2xl overflow-hidden" style={{ backgroundColor: "#131820", maxHeight: "75vh" }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #1e293b" }}>
              <button onClick={() => { setMobDetail(false); setSelected(null); }} className="text-[16px]" style={{ color: "#64748b" }}>✕</button>
              <span className="text-[12px]" style={{ color: "#64748b" }}>{selected.league}</span>
            </div>
            <div className="px-4 py-3 text-center" style={{ borderBottom: "1px solid #1e293b" }}>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center flex-1">{selected.homeLogo && <img src={selected.homeLogo} alt="" className="h-7 w-7 mx-auto mb-1 object-contain" />}<div className="text-[12px] font-medium" style={{ color: "#e2e8f0" }}>{selected.homeTeam}</div></div>
                <div><div className="font-mono text-[22px] font-bold" style={{ color: selected.status === "live" || selected.status === "ht" ? "#ef4444" : "#e2e8f0" }}>{selected.status === "upcoming" ? "-:-" : `${selected.homeScore ?? 0}:${selected.awayScore ?? 0}`}</div></div>
                <div className="text-center flex-1">{selected.awayLogo && <img src={selected.awayLogo} alt="" className="h-7 w-7 mx-auto mb-1 object-contain" />}<div className="text-[12px] font-medium" style={{ color: "#e2e8f0" }}>{selected.awayTeam}</div></div>
              </div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "calc(75vh - 120px)" }}>
              <MatchDetailPanel matchId={selected.id} sport={selected.sport} status={selected.status} homeTeam={selected.homeTeam} awayTeam={selected.awayTeam} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Match Row ──
function MRow({ m, fav, onFav, active, onSelect, hasGoal }: { m: SportMatch; fav: boolean; onFav: () => void; active: boolean; onSelect: () => void; hasGoal?: boolean }) {
  const live = m.status === "live"; const ht = m.status === "ht"; const ft = m.status === "ft"; const up = m.status === "upcoming"; const post = m.status === "postponed";
  const hw = ft && (m.homeScore ?? 0) > (m.awayScore ?? 0); const aw = ft && (m.awayScore ?? 0) > (m.homeScore ?? 0);
  const liveBg = (live || ht) ? "rgba(239,68,68,0.03)" : undefined;
  return (
    <div className="flex items-center h-10 px-1 transition-colors hover:bg-[#1e2738] cursor-pointer" style={{ borderBottom: "1px solid #1e293b", backgroundColor: active ? "#1a2130" : liveBg, borderLeft: live || ht ? "2px solid #ef4444" : hasGoal ? "2px solid #1f844e" : "2px solid transparent" }} onClick={onSelect}>
      <button onClick={e => { e.stopPropagation(); onFav(); }} className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-[#1a2130]"><span style={{ color: fav ? "#e8a935" : "#64748b", fontSize: "12px" }}>{fav ? "★" : "☆"}</span></button>
      <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 48 }}>
        {live && <span className="flex items-center gap-0.5 text-[11px] font-bold" style={{ color: "#ef4444" }}>{m.minute}&apos;<span className="h-1.5 w-1.5 rounded-full animate-pulse inline-block" style={{ backgroundColor: "#ef4444" }} /></span>}
        {ht && <span className="text-[11px] font-bold" style={{ color: "#e8a935" }}>DA</span>}
        {ft && <span className="text-[11px] font-semibold" style={{ color: "#1f844e" }}>MS</span>}
        {up && <span className="text-[11px]" style={{ color: "#94a3b8" }}>{formatTime(m.startTime)}</span>}
        {post && <span className="text-[10px]" style={{ color: "#64748b" }}>ERT</span>}
      </div>
      <div className="flex-1 flex items-center justify-end gap-1 min-w-0 pr-1"><span className="text-[13px] truncate" style={{ color: hw ? "#e2e8f0" : "#94a3b8", fontWeight: hw ? 700 : 500 }}>{m.homeTeam}</span>{m.homeLogo && <img src={m.homeLogo} alt="" className="h-4 w-4 object-contain flex-shrink-0" />}</div>
      <div className={`flex-shrink-0 flex items-center justify-center gap-0.5 font-mono font-bold rounded ${hasGoal ? "goal-flash" : ""}`} style={{ width: 52, fontSize: live || ht ? "15px" : "14px", color: live || ht ? "#ef4444" : ft ? "#e2e8f0" : "#64748b" }}>
        {hasGoal && <span className="goal-text text-[10px]" style={{ color: "#1f844e", position: "absolute", left: -2, top: -8 }}>⚽</span>}
        {up ? <span className="text-[12px]" style={{ color: "#64748b" }}>-:-</span> : <>{m.homeScore ?? 0}:{m.awayScore ?? 0}</>}
      </div>
      <div className="flex-1 flex items-center gap-1 min-w-0 pl-1">{m.awayLogo && <img src={m.awayLogo} alt="" className="h-4 w-4 object-contain flex-shrink-0" />}<span className="text-[13px] truncate" style={{ color: aw ? "#e2e8f0" : "#94a3b8", fontWeight: aw ? 700 : 500 }}>{m.awayTeam}</span></div>
      <span className="flex-shrink-0 text-[10px] pr-1" style={{ color: active ? "#e2e8f0" : "#64748b" }}>›</span>
    </div>
  );
}
