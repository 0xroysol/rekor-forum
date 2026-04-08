"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { SportMatch } from "@/lib/sports/types";
import { MatchDetailPanel } from "@/components/match-detail";

// ── League config ──
const PINNED_LEAGUES = [
  { section: "football", label: "Futbol", items: [
    { flag: "🇹🇷", name: "Süper Lig", apiName: "Süper Lig", leagueId: "203", order: 1 },
    { flag: "🇹🇷", name: "1. Lig", apiName: "1. Lig", leagueId: "204", order: 9 },
    { flag: "🏆", name: "Şampiyonlar Ligi", apiName: "UEFA Champions League", leagueId: "2", order: 2 },
    { flag: "🏆", name: "Avrupa Ligi", apiName: "UEFA Europa League", leagueId: "3", order: 3 },
    { flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", name: "Premier League", apiName: "Premier League", leagueId: "39", order: 4 },
    { flag: "🇪🇸", name: "La Liga", apiName: "La Liga", leagueId: "140", order: 5 },
    { flag: "🇮🇹", name: "Serie A", apiName: "Serie A", leagueId: "135", order: 6 },
    { flag: "🇩🇪", name: "Bundesliga", apiName: "Bundesliga", leagueId: "78", order: 7 },
    { flag: "🇫🇷", name: "Ligue 1", apiName: "Ligue 1", leagueId: "61", order: 8 },
  ]},
  { section: "basketball", label: "🏀 Basketbol", items: [
    { flag: "🇹🇷", name: "BSL", apiName: "BSL", leagueId: "79", order: 10 },
    { flag: "🏆", name: "EuroLeague", apiName: "Euroleague", leagueId: "120", order: 11 },
    { flag: "🇺🇸", name: "NBA", apiName: "NBA", leagueId: "12", order: 12 },
  ]},
];
const ALL_ITEMS = PINNED_LEAGUES.flatMap((s) => s.items);

function leagueOrder(name: string): number {
  return ALL_ITEMS.find((l) => name.toLowerCase().includes(l.apiName.toLowerCase()) || name.toLowerCase().includes(l.name.toLowerCase()))?.order ?? 99;
}
function formatTime(d: string) { return new Date(d).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }); }
function formatDate(d: Date) { return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long", timeZone: "Europe/Istanbul" }); }
function dk(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function loadFavs(): Set<string> { if (typeof window === "undefined") return new Set(); try { return new Set(JSON.parse(localStorage.getItem("fav_matches")||"[]")); } catch { return new Set(); } }
function saveFavs(f: Set<string>) { localStorage.setItem("fav_matches", JSON.stringify([...f])); }

interface Standing { rank: number; teamName: string; teamLogo: string; played: number; won: number; drawn: number; lost: number; points: number; }

function groupByLeague(ms: SportMatch[]): [string, SportMatch[]][] {
  const map: Record<string, SportMatch[]> = {};
  for (const m of ms) { (map[m.league] ??= []).push(m); }
  return Object.entries(map).sort(([a],[b]) => leagueOrder(a) - leagueOrder(b));
}

export default function CanliSkorlarPage() {
  const [matches, setMatches] = useState<SportMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [date, setDate] = useState(() => new Date());
  const [sport, setSport] = useState<"football"|"basketball">("football");
  const [league, setLeague] = useState<string|null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [standings, setStandings] = useState<Standing[]>([]);
  const [stLeague, setStLeague] = useState("Süper Lig");
  const [mobSidebar, setMobSidebar] = useState(false);
  const [favs, setFavs] = useState<Set<string>>(() => loadFavs());
  const [selected, setSelected] = useState<SportMatch|null>(null);
  const [mobDetail, setMobDetail] = useState(false);

  const toggleFav = (id: string) => { setFavs(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); saveFavs(n); return n; }); };
  const toggleCol = (k: string) => { setCollapsed(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; }); };

  const selectMatch = (m: SportMatch) => {
    setSelected(prev => prev?.id === m.id ? null : m);
    if (window.innerWidth < 1280) setMobDetail(true);
  };

  // Fetch
  const fetch_ = useCallback(async () => {
    try { const r = await fetch("/api/live-scores?type=all"); const d = await r.json(); setMatches(d.matches||[]); setLastUpdated(d.lastUpdated||""); } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch_(); const i = setInterval(fetch_, 60_000); return () => clearInterval(i); }, [fetch_]);

  // Standings
  useEffect(() => {
    const li = ALL_ITEMS.find(l => l.name === stLeague);
    if (!li || ["79","120","12"].includes(li.leagueId)) { setStandings([]); return; }
    fetch(`/api/standings?league=${li.leagueId}&season=2025`).then(r=>r.json()).then(d=>setStandings(d.standings||[])).catch(()=>setStandings([]));
  }, [stLeague]);

  const today = dk(date);
  const filtered = useMemo(() => {
    let list = matches.filter(m => { if (m.sport !== sport) return false; if (m.status==="live"||m.status==="ht") return true; return dk(new Date(m.startTime))===today; });
    if (league) { const li = ALL_ITEMS.find(l=>l.name===league); if (li) list = list.filter(m=>m.league.toLowerCase().includes(li.apiName.toLowerCase())||m.league.toLowerCase().includes(li.name.toLowerCase())); }
    return list;
  }, [matches, sport, today, league]);

  const favMs = useMemo(() => filtered.filter(m=>favs.has(m.id)), [filtered,favs]);
  const liveMs = useMemo(() => filtered.filter(m=>(m.status==="live"||m.status==="ht")&&!favs.has(m.id)), [filtered,favs]);
  const upMs = useMemo(() => filtered.filter(m=>m.status==="upcoming"&&!favs.has(m.id)).sort((a,b)=>new Date(a.startTime).getTime()-new Date(b.startTime).getTime()), [filtered,favs]);
  const ftMs = useMemo(() => filtered.filter(m=>(m.status==="ft"||m.status==="postponed")&&!favs.has(m.id)), [filtered,favs]);

  const fbCount = matches.filter(m=>m.sport==="football"&&(dk(new Date(m.startTime))===today||(m.status==="live"||m.status==="ht"))).length;
  const bbCount = matches.filter(m=>m.sport==="basketball"&&(dk(new Date(m.startTime))===today||(m.status==="live"||m.status==="ht"))).length;
  const liveCount = matches.filter(m=>m.status==="live"||m.status==="ht").length;
  const lmc = (n: string) => matches.filter(m=>dk(new Date(m.startTime))===today&&m.sport===sport&&m.league.toLowerCase().includes(n.toLowerCase())).length;
  const lhl = (n: string) => matches.some(m=>(m.status==="live"||m.status==="ht")&&m.league.toLowerCase().includes(n.toLowerCase()));

  const shift = (d: number) => { const n = new Date(date); n.setDate(n.getDate()+d); setDate(n); };
  const isToday = dk(date) === dk(new Date());
  const selLeague = (n: string|null) => { setLeague(n); if (n) setStLeague(n); setMobSidebar(false); };

  // Section renderer
  const renderSection = (title: string, dot: string|null, ms: SportMatch[], color: string, borderColor?: string) => {
    if (!ms.length) return null;
    const k = title; const col = collapsed.has(k); const groups = groupByLeague(ms);
    return (
      <div key={k}>
        <button onClick={() => toggleCol(k)} className="w-full flex items-center gap-2 px-3 h-9 text-left" style={{ borderBottom: "1px solid #1e293b" }}>
          {dot === "pulse" ? <span className="relative flex h-2 w-2"><span className="absolute h-full w-full animate-ping rounded-full opacity-75" style={{backgroundColor:"#ef4444"}}/><span className="relative h-2 w-2 rounded-full" style={{backgroundColor:"#ef4444"}}/></span> : dot ? <span className="text-[11px]">{dot}</span> : null}
          <span className="text-[13px] font-bold flex-1" style={{color}}>{title}</span>
          <span className="text-[11px]" style={{color:"#64748b"}}>({ms.length})</span>
          <span className="text-[9px]" style={{color:"#64748b",transform:col?"rotate(-90deg)":"rotate(0)",transition:"transform 150ms"}}>▼</span>
        </button>
        {!col && groups.map(([lg,lm]) => {
          const logo = lm[0]?.leagueLogo;
          const lgCol = collapsed.has(`lg_${lg}`);
          return (
            <div key={lg}>
              <button onClick={() => toggleCol(`lg_${lg}`)} className="w-full flex items-center gap-1.5 px-3 h-8 text-left" style={{backgroundColor:"#1a2130"}}>
                {logo && <img src={logo} alt="" className="h-3.5 w-3.5 object-contain"/>}
                <span className="text-[12px] font-semibold uppercase tracking-wide flex-1" style={{color:"#94a3b8",letterSpacing:"0.3px"}}>{lg}</span>
                <span className="text-[10px]" style={{color:"#64748b"}}>{lm.length}</span>
                <span className="text-[8px] ml-1" style={{color:"#64748b",transform:lgCol?"rotate(-90deg)":"rotate(0)",transition:"transform 150ms"}}>▼</span>
              </button>
              {!lgCol && lm.map(m => (
                <MRow key={m.id} m={m} fav={favs.has(m.id)} onFav={()=>toggleFav(m.id)} active={selected?.id===m.id} onSelect={()=>selectMatch(m)} />
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex" style={{minHeight:"calc(100vh - 120px)"}}>
      {/* Left Sidebar */}
      <aside className="hidden lg:block flex-shrink-0 overflow-y-auto" style={{width:220,backgroundColor:"#131820",borderRight:"1px solid #1e293b"}}>
        <div className="px-4 py-2.5" style={{borderBottom:"1px solid #1e293b"}}><span className="text-[13px] font-semibold" style={{color:"#e2e8f0"}}>⭐ Liglerim</span></div>
        {PINNED_LEAGUES.map(s => (
          <div key={s.section}>
            {s.section==="basketball" && <div className="px-4 py-1.5" style={{borderTop:"1px solid #1e293b"}}><span className="text-[10px] font-semibold uppercase tracking-wider" style={{color:"#64748b"}}>{s.label}</span></div>}
            {s.items.map(l => {
              const c=lmc(l.apiName); const live=lhl(l.apiName); const act=league===l.name; const dim=s.section!==sport;
              return <button key={l.name} onClick={()=>selLeague(act?null:l.name)} className="w-full flex items-center gap-2 px-4 py-1.5 text-left transition-colors hover:bg-[#1e2738]" style={{backgroundColor:act?"#1a2130":"transparent",borderLeft:act?"2px solid #1f844e":"2px solid transparent",opacity:dim?0.35:1}}>
                <span className="text-[13px]">{l.flag}</span><span className="flex-1 text-[12px] truncate" style={{color:act?"#e2e8f0":"#94a3b8"}}>{l.name}</span>
                {live && <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{backgroundColor:"#ef4444"}}/>}
                {c>0 && <span className="text-[10px]" style={{color:"#64748b"}}>{c}</span>}
              </button>;
            })}
          </div>
        ))}
        <button onClick={()=>selLeague(null)} className="w-full px-4 py-2 text-left text-[12px] font-medium hover:bg-[#1e2738]" style={{color:"#1f844e",borderTop:"1px solid #1e293b"}}>Tüm Ligler</button>
      </aside>
      {mobSidebar && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-black/50" onClick={()=>setMobSidebar(false)}/><aside className="absolute left-0 top-0 bottom-0 overflow-y-auto" style={{width:260,backgroundColor:"#131820"}}><div className="px-4 py-3" style={{borderBottom:"1px solid #1e293b"}}><span className="text-[13px] font-semibold" style={{color:"#e2e8f0"}}>⭐ Liglerim</span></div>{PINNED_LEAGUES.find(s=>s.section===sport)?.items.map(l=><button key={l.name} onClick={()=>selLeague(league===l.name?null:l.name)} className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-[#1e2738]" style={{backgroundColor:league===l.name?"#1a2130":"transparent",borderLeft:league===l.name?"2px solid #1f844e":"2px solid transparent"}}><span>{l.flag}</span><span className="flex-1 text-[13px]" style={{color:league===l.name?"#e2e8f0":"#94a3b8"}}>{l.name}</span></button>)}<button onClick={()=>selLeague(null)} className="w-full px-4 py-2 text-left text-[13px]" style={{color:"#1f844e",borderTop:"1px solid #1e293b"}}>Tüm Ligler</button></aside></div>}

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-3 h-8" style={{borderBottom:"1px solid #1e293b"}}>
          <div className="flex items-center gap-2">
            {liveCount>0 && <span className="flex items-center gap-1 text-[11px] font-medium" style={{color:"#1f844e"}}><span className="relative flex h-1.5 w-1.5"><span className="absolute h-full w-full animate-ping rounded-full opacity-75" style={{backgroundColor:"#1f844e"}}/><span className="relative h-1.5 w-1.5 rounded-full" style={{backgroundColor:"#1f844e"}}/></span>{liveCount} canlı</span>}
            <button onClick={()=>setMobSidebar(true)} className="lg:hidden text-[11px] px-2 py-0.5 rounded" style={{color:"#94a3b8",border:"1px solid #1e293b"}}>{league||"Ligler"}</button>
          </div>
          {lastUpdated && <span className="text-[10px]" style={{color:"#64748b"}}>{new Date(lastUpdated).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit",second:"2-digit",timeZone:"Europe/Istanbul"})}</span>}
        </div>

        {/* Date Nav */}
        <div className="flex items-center justify-center gap-1.5 px-3 py-2" style={{borderBottom:"1px solid #1e293b"}}>
          <button onClick={()=>shift(-1)} className="px-1.5 py-0.5 text-[13px] rounded hover:bg-[#1e2738]" style={{color:"#94a3b8",border:"1px solid #1e293b"}}>←</button>
          <button onClick={()=>shift(-1)} className="px-2 py-0.5 text-[11px] rounded hover:bg-[#1e2738]" style={{color:"#94a3b8",border:"1px solid #1e293b"}}>Dün</button>
          <button onClick={()=>setDate(new Date())} className="px-3 py-0.5 text-[11px] font-semibold rounded" style={{backgroundColor:isToday?"#1f844e":"#131820",color:isToday?"#fff":"#94a3b8",border:isToday?"none":"1px solid #1e293b"}}>Bugün</button>
          <button onClick={()=>shift(1)} className="px-2 py-0.5 text-[11px] rounded hover:bg-[#1e2738]" style={{color:"#94a3b8",border:"1px solid #1e293b"}}>Yarın</button>
          <button onClick={()=>shift(1)} className="px-1.5 py-0.5 text-[13px] rounded hover:bg-[#1e2738]" style={{color:"#94a3b8",border:"1px solid #1e293b"}}>→</button>
          <span className="ml-2 text-[11px] hidden sm:inline" style={{color:"#64748b"}}>{formatDate(date)}</span>
        </div>

        {/* Sport Tabs */}
        <div className="flex" style={{borderBottom:"1px solid #1e293b"}}>
          {(["football","basketball"] as const).map(s=>(
            <button key={s} onClick={()=>{setSport(s);setLeague(null);setSelected(null);}} className="flex-1 px-3 py-2 text-[13px] font-medium text-center" style={{color:sport===s?"#e2e8f0":"#64748b",borderBottom:sport===s?"2px solid #1f844e":"2px solid transparent"}}>
              {s==="football"?`⚽ Futbol (${fbCount})`:`🏀 Basketbol (${bbCount})`}
            </button>
          ))}
        </div>

        {/* Mobile league chips */}
        <div className="flex gap-1 overflow-x-auto px-2 py-1.5 lg:hidden" style={{borderBottom:"1px solid #1e293b"}}>
          <button onClick={()=>selLeague(null)} className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{backgroundColor:!league?"#1f844e":"#1a2130",color:!league?"#fff":"#94a3b8"}}>Tümü</button>
          {PINNED_LEAGUES.find(s=>s.section===sport)?.items.map(l=>(
            <button key={l.name} onClick={()=>selLeague(l.name)} className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap" style={{backgroundColor:league===l.name?"#1f844e":"#1a2130",color:league===l.name?"#fff":"#94a3b8"}}>{l.flag} {l.name}</button>
          ))}
        </div>

        {/* Match List */}
        {loading ? (
          <div>{[1,2,3,4,5,6].map(i=>(<div key={i} className="h-10 animate-pulse" style={{backgroundColor:i%2?"#0d1017":"#131820",borderBottom:"1px solid #1e293b"}}/>))}</div>
        ) : filtered.length===0 ? (
          <div className="py-16 text-center"><span className="text-3xl block mb-2 opacity-20">{sport==="football"?"⚽":"🏀"}</span><p className="text-[13px]" style={{color:"#94a3b8"}}>Bugün maç bulunmuyor</p><p className="text-[11px] mt-1" style={{color:"#64748b"}}>Farklı bir tarih veya lig seçin</p></div>
        ) : (
          <>
            {renderSection("Favorilerim","⭐",favMs,"#e8a935","#e8a935")}
            {renderSection("Canlı","pulse",liveMs,"#ef4444","#ef4444")}
            {renderSection("Başlayacak",null,upMs,"#94a3b8")}
            {renderSection("Biten","✅",ftMs,"#1f844e")}
          </>
        )}
      </main>

      {/* Right Sidebar — Detail or Standings */}
      <aside className="hidden xl:flex flex-col flex-shrink-0" style={{width:320,backgroundColor:"#131820",borderLeft:"1px solid #1e293b"}}>
        {selected ? (
          <div className="flex-1 overflow-y-auto">
            {/* Detail Header */}
            <div className="flex items-center justify-between px-3 py-2" style={{borderBottom:"1px solid #1e293b"}}>
              <button onClick={()=>setSelected(null)} className="text-[14px] hover:text-[#e2e8f0]" style={{color:"#64748b"}}>✕</button>
              <span className="text-[11px]" style={{color:"#64748b"}}>{selected.league}</span>
            </div>
            {/* Score Header */}
            <div className="px-4 py-4 text-center" style={{borderBottom:"1px solid #1e293b"}}>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center flex-1">
                  {selected.homeLogo && <img src={selected.homeLogo} alt="" className="h-8 w-8 mx-auto mb-1 object-contain"/>}
                  <div className="text-[12px] font-medium" style={{color:"#e2e8f0"}}>{selected.homeTeam}</div>
                </div>
                <div>
                  <div className="font-mono text-[24px] font-bold" style={{color:selected.status==="live"||selected.status==="ht"?"#ef4444":"#e2e8f0"}}>
                    {selected.status==="upcoming"?"-:-":`${selected.homeScore??0}:${selected.awayScore??0}`}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{color:selected.status==="live"?"#ef4444":selected.status==="ht"?"#e8a935":selected.status==="ft"?"#1f844e":"#64748b"}}>
                    {selected.status==="live"?`${selected.minute}'`:selected.status==="ht"?"Devre Arası":selected.status==="ft"?"Maç Sonu":formatTime(selected.startTime)}
                  </div>
                </div>
                <div className="text-center flex-1">
                  {selected.awayLogo && <img src={selected.awayLogo} alt="" className="h-8 w-8 mx-auto mb-1 object-contain"/>}
                  <div className="text-[12px] font-medium" style={{color:"#e2e8f0"}}>{selected.awayTeam}</div>
                </div>
              </div>
            </div>
            {/* Detail Panel (tabs + content) */}
            <MatchDetailPanel matchId={selected.id} sport={selected.sport} status={selected.status} homeTeam={selected.homeTeam} awayTeam={selected.awayTeam} />
          </div>
        ) : (
          /* Standings */
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 py-2.5" style={{borderBottom:"1px solid #1e293b"}}>
              <span className="text-[13px] font-semibold" style={{color:"#94a3b8"}}>📊 Puan Durumu</span>
              <span className="block text-[11px] mt-0.5" style={{color:"#64748b"}}>{stLeague}</span>
            </div>
            {standings.length>0 ? (
              <table className="w-full text-[11px]">
                <thead className="sticky top-0" style={{backgroundColor:"#131820"}}><tr style={{color:"#64748b",borderBottom:"1px solid #1e293b"}}><th className="px-2 py-1 text-left font-medium">#</th><th className="px-1 py-1 text-left font-medium">Takım</th><th className="px-1 py-1 text-center font-medium">O</th><th className="px-1 py-1 text-center font-medium">G</th><th className="px-1 py-1 text-center font-medium">B</th><th className="px-1 py-1 text-center font-medium">M</th><th className="px-1 py-1 text-center font-medium">P</th></tr></thead>
                <tbody>{standings.map(t=>{let bc="transparent";if(t.rank<=4)bc="#1f844e";else if(t.rank<=6)bc="#3b82f6";else if(t.rank>=standings.length-2)bc="#ef4444";return(<tr key={t.rank} className="hover:bg-[#1e2738]" style={{borderBottom:"1px solid #1e293b"}}><td className="px-2 py-1" style={{borderLeft:`2px solid ${bc}`,color:"#64748b"}}>{t.rank}</td><td className="px-1 py-1"><div className="flex items-center gap-1">{t.teamLogo&&<img src={t.teamLogo} alt="" className="h-3 w-3 object-contain"/>}<span className="truncate text-[11px]" style={{color:"#e2e8f0",maxWidth:120}}>{t.teamName}</span></div></td><td className="px-1 py-1 text-center" style={{color:"#94a3b8"}}>{t.played}</td><td className="px-1 py-1 text-center" style={{color:"#94a3b8"}}>{t.won}</td><td className="px-1 py-1 text-center" style={{color:"#94a3b8"}}>{t.drawn}</td><td className="px-1 py-1 text-center" style={{color:"#94a3b8"}}>{t.lost}</td><td className="px-1 py-1 text-center font-semibold" style={{color:"#e2e8f0"}}>{t.points}</td></tr>);})}</tbody>
              </table>
            ) : (
              <div className="px-4 py-8 text-center"><p className="text-[11px]" style={{color:"#64748b"}}>{sport==="basketball"?"Basketbol puan durumu yakında":"Bir lig seçin"}</p></div>
            )}
          </div>
        )}
      </aside>

      {/* Mobile Detail Bottom Sheet */}
      {mobDetail && selected && (
        <div className="fixed inset-0 z-50 xl:hidden flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={()=>{setMobDetail(false);setSelected(null);}}/>
          <div className="relative rounded-t-2xl overflow-hidden" style={{backgroundColor:"#131820",maxHeight:"75vh"}}>
            <div className="flex items-center justify-between px-4 py-3" style={{borderBottom:"1px solid #1e293b"}}>
              <button onClick={()=>{setMobDetail(false);setSelected(null);}} className="text-[16px]" style={{color:"#64748b"}}>✕</button>
              <span className="text-[12px]" style={{color:"#64748b"}}>{selected.league}</span>
            </div>
            <div className="px-4 py-3 text-center" style={{borderBottom:"1px solid #1e293b"}}>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center flex-1">{selected.homeLogo&&<img src={selected.homeLogo} alt="" className="h-7 w-7 mx-auto mb-1 object-contain"/>}<div className="text-[12px] font-medium" style={{color:"#e2e8f0"}}>{selected.homeTeam}</div></div>
                <div><div className="font-mono text-[22px] font-bold" style={{color:selected.status==="live"||selected.status==="ht"?"#ef4444":"#e2e8f0"}}>{selected.status==="upcoming"?"-:-":`${selected.homeScore??0}:${selected.awayScore??0}`}</div></div>
                <div className="text-center flex-1">{selected.awayLogo&&<img src={selected.awayLogo} alt="" className="h-7 w-7 mx-auto mb-1 object-contain"/>}<div className="text-[12px] font-medium" style={{color:"#e2e8f0"}}>{selected.awayTeam}</div></div>
              </div>
            </div>
            <div className="overflow-y-auto" style={{maxHeight:"calc(75vh - 120px)"}}>
              <MatchDetailPanel matchId={selected.id} sport={selected.sport} status={selected.status} homeTeam={selected.homeTeam} awayTeam={selected.awayTeam}/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Compact Match Row (40px) ──
function MRow({m,fav,onFav,active,onSelect}:{m:SportMatch;fav:boolean;onFav:()=>void;active:boolean;onSelect:()=>void}) {
  const live=m.status==="live"; const ht=m.status==="ht"; const ft=m.status==="ft"; const up=m.status==="upcoming"; const post=m.status==="postponed";
  const hw=ft&&(m.homeScore??0)>(m.awayScore??0); const aw=ft&&(m.awayScore??0)>(m.homeScore??0);
  return (
    <div className="flex items-center h-10 px-1 transition-colors hover:bg-[#1e2738] cursor-pointer" style={{borderBottom:"1px solid #1e293b",backgroundColor:active?"#1a2130":undefined,borderLeft:live||ht?`2px solid #ef4444`:"2px solid transparent"}} onClick={onSelect}>
      <button onClick={e=>{e.stopPropagation();onFav();}} className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-[#1a2130]"><span style={{color:fav?"#e8a935":"#64748b",fontSize:"12px"}}>{fav?"★":"☆"}</span></button>
      <div className="flex-shrink-0 flex items-center justify-center" style={{width:48}}>
        {live&&<span className="flex items-center gap-0.5 text-[11px] font-bold" style={{color:"#ef4444"}}>{m.minute}&apos;<span className="h-1.5 w-1.5 rounded-full animate-pulse inline-block" style={{backgroundColor:"#ef4444"}}/></span>}
        {ht&&<span className="text-[11px] font-bold" style={{color:"#e8a935"}}>DA</span>}
        {ft&&<span className="text-[11px] font-semibold" style={{color:"#1f844e"}}>MS</span>}
        {up&&<span className="text-[11px]" style={{color:"#94a3b8"}}>{formatTime(m.startTime)}</span>}
        {post&&<span className="text-[10px]" style={{color:"#64748b"}}>ERT</span>}
      </div>
      <div className="flex-1 flex items-center justify-end gap-1 min-w-0 pr-1"><span className="text-[13px] truncate" style={{color:hw?"#e2e8f0":"#94a3b8",fontWeight:hw?700:500}}>{m.homeTeam}</span>{m.homeLogo&&<img src={m.homeLogo} alt="" className="h-4 w-4 object-contain flex-shrink-0"/>}</div>
      <div className="flex-shrink-0 flex items-center justify-center font-mono text-[14px] font-bold" style={{width:48,color:live||ht?"#ef4444":ft?"#e2e8f0":"#64748b"}}>{up?<span className="text-[12px]" style={{color:"#64748b"}}>-:-</span>:<>{m.homeScore??0}:{m.awayScore??0}</>}</div>
      <div className="flex-1 flex items-center gap-1 min-w-0 pl-1">{m.awayLogo&&<img src={m.awayLogo} alt="" className="h-4 w-4 object-contain flex-shrink-0"/>}<span className="text-[13px] truncate" style={{color:aw?"#e2e8f0":"#94a3b8",fontWeight:aw?700:500}}>{m.awayTeam}</span></div>
      <span className="flex-shrink-0 text-[10px] pr-1" style={{color:active?"#e2e8f0":"#64748b"}}>›</span>
    </div>
  );
}
