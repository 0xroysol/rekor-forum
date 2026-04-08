import prisma from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canlı Skorlar - Rekor Forum",
  description: "Futbol, basketbol ve diğer sporların canlı maç sonuçları.",
  openGraph: { title: "Canlı Skorlar - Rekor Forum", siteName: "Rekor Forum" },
};

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const statusConfig: Record<
  string,
  { label: string; borderColor: string; textColor: string; bgColor: string }
> = {
  live: {
    label: "CANLI",
    borderColor: "border-l-[#1f844e]",
    textColor: "text-[#1f844e]",
    bgColor: "bg-[#1f844e]/10",
  },
  finished: {
    label: "BITTI",
    borderColor: "border-l-[#64748b]",
    textColor: "text-[#64748b]",
    bgColor: "bg-[#64748b]/10",
  },
  upcoming: {
    label: "YAKINLA",
    borderColor: "border-l-[#3b82f6]",
    textColor: "text-[#3b82f6]",
    bgColor: "bg-[#3b82f6]/10",
  },
};

export default async function CanliSkorlarPage() {
  const matches = await prisma.liveMatch.findMany({
    orderBy: [{ status: "asc" }, { startTime: "asc" }],
  });

  const grouped = matches.reduce<Record<string, typeof matches>>(
    (acc, match) => {
      if (!acc[match.league]) {
        acc[match.league] = [];
      }
      acc[match.league].push(match);
      return acc;
    },
    {}
  );

  const leagueNames = Object.keys(grouped);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Page Title */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#e2e8f0]">Canli Skorlar</h1>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1f844e] opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#1f844e]" />
          </span>
          <span className="text-sm text-[#64748b]">
            Canli guncelleme aktif
          </span>
        </div>
      </div>

      {leagueNames.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-[#1e293b] bg-[#131820] py-12">
          <span className="text-4xl">&#9917;</span>
          <p className="text-[#94a3b8]">Su anda aktif mac bulunmuyor.</p>
          <p className="text-sm text-[#64748b]">
            Maclar basladiginda burada gorunecektir.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {leagueNames.map((league) => (
            <div key={league}>
              {/* League Header */}
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">&#127942;</span>
                <h2 className="text-lg font-semibold text-[#e2e8f0]">
                  {league}
                </h2>
                <span className="rounded-md bg-[#1a2130] px-2 py-0.5 text-xs text-[#64748b]">
                  {grouped[league].length} mac
                </span>
              </div>

              {/* Match Cards */}
              <div className="flex flex-col gap-3">
                {grouped[league].map((match) => {
                  const config =
                    statusConfig[match.status] || statusConfig.upcoming;

                  return (
                    <div
                      key={match.id}
                      className={`flex items-center gap-4 rounded-xl border border-[#1e293b] border-l-2 ${config.borderColor} bg-[#131820] px-4 py-3`}
                    >
                      {/* Status */}
                      <div className="flex w-16 flex-col items-center gap-1">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${config.bgColor} ${config.textColor} ${
                            match.status === "live"
                              ? "animate-pulse border-[#1f844e]"
                              : match.status === "finished"
                                ? "border-[#64748b]"
                                : "border-[#3b82f6]"
                          }`}
                        >
                          {config.label}
                        </span>
                        {match.status === "live" && (
                          <span className="text-xs font-medium text-[#1f844e]">
                            {match.minute}&apos;
                          </span>
                        )}
                        {match.status === "upcoming" && (
                          <span className="text-xs text-[#64748b]">
                            {formatTime(match.startTime)}
                          </span>
                        )}
                      </div>

                      {/* Teams & Score */}
                      <div className="flex flex-1 flex-col gap-2">
                        {/* Home Team */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-sm font-medium ${
                              match.status === "finished" &&
                              match.homeScore > match.awayScore
                                ? "text-[#e2e8f0]"
                                : "text-[#94a3b8]"
                            }`}
                          >
                            {match.homeTeam}
                          </span>
                          <span
                            className={`min-w-[2rem] text-center text-lg font-bold ${
                              match.status === "live"
                                ? "text-[#1f844e]"
                                : "text-[#e2e8f0]"
                            }`}
                          >
                            {match.homeScore}
                          </span>
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-sm font-medium ${
                              match.status === "finished" &&
                              match.awayScore > match.homeScore
                                ? "text-[#e2e8f0]"
                                : "text-[#94a3b8]"
                            }`}
                          >
                            {match.awayTeam}
                          </span>
                          <span
                            className={`min-w-[2rem] text-center text-lg font-bold ${
                              match.status === "live"
                                ? "text-[#1f844e]"
                                : "text-[#e2e8f0]"
                            }`}
                          >
                            {match.awayScore}
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

      {/* Bottom Note */}
      <div className="mt-8 rounded-xl border border-[#1e293b] bg-[#131820] px-4 py-3 text-center">
        <p className="text-xs text-[#64748b]">
          Skorlar otomatik olarak guncellenmektedir. Sayfa yenilemenize gerek
          yoktur.
        </p>
      </div>
    </div>
  );
}
