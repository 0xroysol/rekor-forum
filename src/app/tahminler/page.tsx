"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

interface SportMatch {
  id: string;
  sport: "football" | "basketball";
  league: string;
  leagueLogo?: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "live" | "ft" | "upcoming" | "ht" | "postponed";
  startTime: string;
}

interface LeaderboardUser {
  id: string;
  username: string;
  avatar: string | null;
  predictionPoints: number;
}

interface PredictionEntry {
  matchId: string;
  homeScore: number;
  awayScore: number;
  points: number;
}

type PredictionInputs = Record<string, { home: string; away: string }>;

export default function TahminlerPage() {
  const [matches, setMatches] = useState<SportMatch[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [savedPredictions, setSavedPredictions] = useState<PredictionEntry[]>([]);
  const [inputs, setInputs] = useState<PredictionInputs>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [matchRes, predRes] = await Promise.all([
        fetch("/api/live-scores"),
        fetch("/api/predictions"),
      ]);

      const matchData = await matchRes.json();
      const allMatches: SportMatch[] = Array.isArray(matchData) ? matchData : matchData.matches || [];
      // Filter: upcoming football only
      const upcoming = allMatches.filter(
        (m) => m.sport === "football" && m.status === "upcoming"
      );
      setMatches(upcoming);

      if (predRes.ok) {
        const predData = await predRes.json();
        setLeaderboard(predData.leaderboard || []);
        setSavedPredictions(predData.predictions || []);
        setIsLoggedIn(true);

        // Pre-fill inputs with existing predictions
        const prefilled: PredictionInputs = {};
        for (const p of predData.predictions || []) {
          prefilled[p.matchId] = {
            home: String(p.homeScore),
            away: String(p.awayScore),
          };
        }
        setInputs(prefilled);
      } else {
        setIsLoggedIn(false);
      }
    } catch {
      setError("Veriler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group matches by league
  const grouped = matches.reduce<Record<string, SportMatch[]>>((acc, m) => {
    if (!acc[m.league]) acc[m.league] = [];
    acc[m.league].push(m);
    return acc;
  }, {});

  function handleInput(matchId: string, side: "home" | "away", value: string) {
    const num = value.replace(/\D/g, "").slice(0, 2);
    setInputs((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        home: prev[matchId]?.home || "",
        away: prev[matchId]?.away || "",
        [side]: num,
      },
    }));
    setSubmitted(false);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const predictions = Object.entries(inputs)
      .filter(([, v]) => v.home !== "" && v.away !== "")
      .map(([matchId, v]) => ({
        matchId,
        homeScore: parseInt(v.home, 10),
        awayScore: parseInt(v.away, 10),
      }));

    if (predictions.length === 0) {
      setError("En az bir maç için tahmin girmelisiniz.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ predictions }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Tahminler kaydedilemedi.");
      } else {
        setSubmitted(true);
        // Refresh saved predictions
        const predRes = await fetch("/api/predictions");
        if (predRes.ok) {
          const predData = await predRes.json();
          setSavedPredictions(predData.predictions || []);
          setLeaderboard(predData.leaderboard || []);
        }
      }
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  function isSaved(matchId: string): boolean {
    return submitted && inputs[matchId]?.home !== "" && inputs[matchId]?.away !== "";
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-10">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-green border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-6">
      <h1 className="mb-6 text-2xl font-bold">Skor Tahmini</h1>

      {isLoggedIn === false && (
        <div className="mb-6 rounded-xl p-6 text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <p className="mb-3 text-text-secondary">Tahmin yapabilmek için giriş yapmanız gerekiyor.</p>
          <Link
            href="/giris"
            className="inline-block rounded-lg px-5 py-2.5 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--accent-green)" }}
          >
            Giriş Yap
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Matches */}
        <div className="flex-1 space-y-6">
          {Object.keys(grouped).length === 0 && (
            <div className="rounded-xl p-8 text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <p className="text-text-muted">Yaklaşan maç bulunamadı.</p>
            </div>
          )}

          {Object.entries(grouped).map(([league, leagueMatches]) => (
            <div key={league} className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: "var(--bg-elevated)", borderBottom: "1px solid var(--border-color)" }}>
                {leagueMatches[0]?.leagueLogo && (
                  <Image src={leagueMatches[0].leagueLogo} alt="" width={20} height={20} className="rounded" unoptimized />
                )}
                <span className="text-sm font-semibold">{league}</span>
              </div>

              <div className="divide-y" style={{ borderColor: "var(--border-color)" }}>
                {leagueMatches.map((match) => {
                  const saved = isSaved(match.id);
                  const hasPrediction = savedPredictions.some((p) => p.matchId === match.id);
                  const matchDate = new Date(match.startTime);

                  return (
                    <div
                      key={match.id}
                      className="flex items-center gap-2 px-4 py-3 transition-colors"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: saved ? "rgba(31, 132, 78, 0.08)" : "transparent",
                      }}
                    >
                      {/* Date/Time */}
                      <div className="hidden w-16 shrink-0 text-xs text-text-muted sm:block">
                        <div>{matchDate.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" })}</div>
                        <div>{matchDate.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>

                      {/* Home team */}
                      <div className="flex flex-1 items-center justify-end gap-2">
                        <span className="text-right text-sm font-medium truncate max-w-[120px]">{match.homeTeam}</span>
                        {match.homeLogo && (
                          <Image src={match.homeLogo} alt="" width={24} height={24} className="shrink-0 rounded" unoptimized />
                        )}
                      </div>

                      {/* Score inputs */}
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={inputs[match.id]?.home ?? ""}
                          onChange={(e) => handleInput(match.id, "home", e.target.value)}
                          disabled={!isLoggedIn}
                          className="w-10 rounded-md border px-1 py-1.5 text-center text-sm font-medium disabled:opacity-40"
                          style={{
                            backgroundColor: "var(--bg-elevated)",
                            borderColor: saved || hasPrediction ? "var(--accent-green)" : "var(--border-color)",
                            color: "var(--text-primary)",
                          }}
                          placeholder="-"
                        />
                        <span className="text-xs text-text-muted">-</span>
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={inputs[match.id]?.away ?? ""}
                          onChange={(e) => handleInput(match.id, "away", e.target.value)}
                          disabled={!isLoggedIn}
                          className="w-10 rounded-md border px-1 py-1.5 text-center text-sm font-medium disabled:opacity-40"
                          style={{
                            backgroundColor: "var(--bg-elevated)",
                            borderColor: saved || hasPrediction ? "var(--accent-green)" : "var(--border-color)",
                            color: "var(--text-primary)",
                          }}
                          placeholder="-"
                        />
                      </div>

                      {/* Away team */}
                      <div className="flex flex-1 items-center gap-2">
                        {match.awayLogo && (
                          <Image src={match.awayLogo} alt="" width={24} height={24} className="shrink-0 rounded" unoptimized />
                        )}
                        <span className="text-sm font-medium truncate max-w-[120px]">{match.awayTeam}</span>
                      </div>

                      {/* Saved indicator */}
                      {(saved || hasPrediction) && (
                        <span className="hidden text-xs font-medium sm:block" style={{ color: "var(--accent-green)" }}>
                          ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Submit button */}
          {isLoggedIn && matches.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "var(--accent-green)" }}
              >
                {submitting ? "Kaydediliyor..." : "Tahminleri Kaydet"}
              </button>
              {submitted && (
                <span className="text-sm font-medium" style={{ color: "var(--accent-green)" }}>
                  Tahminleriniz kaydedildi!
                </span>
              )}
              {error && (
                <span className="text-sm text-red">{error}</span>
              )}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="rounded-xl overflow-hidden sticky top-20" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="px-4 py-3" style={{ backgroundColor: "var(--bg-elevated)", borderBottom: "1px solid var(--border-color)" }}>
              <h2 className="text-sm font-semibold">&#127942; Liderlik Tablosu</h2>
            </div>

            {leaderboard.length === 0 ? (
              <div className="p-4 text-center text-sm text-text-muted">
                Henüz sıralama oluşmadı.
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border-color)" }}>
                {leaderboard.map((u, i) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-bg-hover"
                  >
                    <span className="w-6 text-center text-xs font-bold" style={{ color: i < 3 ? "var(--gold)" : "var(--text-muted)" }}>
                      {i + 1}
                    </span>
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: "var(--bg-elevated)" }}>
                      {u.avatar ? (
                        <Image src={u.avatar} alt="" width={28} height={28} className="h-full w-full object-cover rounded-full" unoptimized />
                      ) : (
                        <span className="text-xs font-medium text-text-muted">{u.username[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <Link href={`/profil/${u.username}`} className="flex-1 truncate text-sm font-medium hover:underline">
                      {u.username}
                    </Link>
                    <span className="text-sm font-semibold" style={{ color: "var(--accent-green)" }}>
                      {u.predictionPoints}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
