import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const statusConfig: Record<string, { label: string; border: string; text: string; bg: string }> = {
  live: {
    label: "CANLI",
    border: "border-[#1f844e]",
    text: "text-[#1f844e]",
    bg: "bg-[#1f844e]/10",
  },
  finished: {
    label: "BITTI",
    border: "border-gray-600",
    text: "text-gray-400",
    bg: "bg-gray-500/10",
  },
  upcoming: {
    label: "YAKINLA",
    border: "border-[#3b82f6]",
    text: "text-[#3b82f6]",
    bg: "bg-[#3b82f6]/10",
  },
};

export default async function CanliSkorlarPage() {
  const matches = await prisma.liveMatch.findMany({
    orderBy: [{ status: "asc" }, { startTime: "asc" }],
  });

  // Group matches by league
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
    <div className="min-h-screen bg-[#080a0f]">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Canli Skorlar</h1>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1f844e] opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-[#1f844e]" />
            </span>
            <span className="text-sm text-gray-400">
              Canli guncelleme aktif
            </span>
          </div>
        </div>

        {leagueNames.length === 0 ? (
          <Card className="border-none bg-[#131820] ring-white/5">
            <CardContent className="flex flex-col items-center gap-2 py-12">
              <span className="text-4xl">&#9917;</span>
              <p className="text-gray-400">
                Su anda aktif mac bulunmuyor.
              </p>
              <p className="text-sm text-gray-500">
                Maclar basladiginda burada gorunecektir.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            {leagueNames.map((league) => (
              <div key={league}>
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-lg">&#127942;</span>
                  <h2 className="text-lg font-semibold text-white">
                    {league}
                  </h2>
                  <Badge
                    variant="secondary"
                    className="bg-white/5 text-gray-400"
                  >
                    {grouped[league].length} mac
                  </Badge>
                </div>

                <div className="flex flex-col gap-3">
                  {grouped[league].map((match) => {
                    const config =
                      statusConfig[match.status] || statusConfig.upcoming;

                    return (
                      <Card
                        key={match.id}
                        className={`border-l-2 ${config.border} border-none bg-[#131820] ring-white/5`}
                      >
                        <CardContent className="flex items-center gap-4 py-3">
                          {/* Status */}
                          <div className="flex w-16 flex-col items-center gap-1">
                            {match.status === "live" ? (
                              <>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${config.bg} ${config.text}`}
                                >
                                  {config.label}
                                </span>
                                <span className="text-xs font-medium text-[#1f844e]">
                                  {match.minute}&apos;
                                </span>
                              </>
                            ) : match.status === "finished" ? (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${config.bg} ${config.text}`}
                              >
                                {config.label}
                              </span>
                            ) : (
                              <>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${config.bg} ${config.text}`}
                                >
                                  {config.label}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatTime(match.startTime)}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Teams & Score */}
                          <div className="flex flex-1 items-center">
                            <div className="flex flex-1 flex-col gap-2">
                              {/* Home Team */}
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-sm font-medium ${
                                    match.status === "finished" &&
                                    match.homeScore > match.awayScore
                                      ? "text-white"
                                      : "text-gray-300"
                                  }`}
                                >
                                  {match.homeTeam}
                                </span>
                                <span
                                  className={`min-w-[2rem] text-center text-lg font-bold ${
                                    match.status === "live"
                                      ? "text-[#1f844e]"
                                      : "text-white"
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
                                      ? "text-white"
                                      : "text-gray-300"
                                  }`}
                                >
                                  {match.awayTeam}
                                </span>
                                <span
                                  className={`min-w-[2rem] text-center text-lg font-bold ${
                                    match.status === "live"
                                      ? "text-[#1f844e]"
                                      : "text-white"
                                  }`}
                                >
                                  {match.awayScore}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Auto-refresh note */}
        <div className="mt-8 rounded-lg bg-[#131820] px-4 py-3 text-center ring-1 ring-white/5">
          <p className="text-xs text-gray-500">
            Skorlar otomatik olarak guncellenmektedir. Sayfa yenilemenize gerek
            yoktur.
          </p>
        </div>
      </div>
    </div>
  );
}
