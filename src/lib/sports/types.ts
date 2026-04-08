export interface SportMatch {
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
  minute: string | null;
  status: "live" | "ft" | "upcoming" | "ht" | "postponed";
  startTime: string;
}
