import prisma from "@/lib/prisma";
import { getAllMatches } from "@/lib/sports/provider";

const SUPER_LIG_KEYWORDS = ["süper lig", "super lig", "trendyol"];
const CL_KEYWORDS = ["champions league", "şampiyonlar ligi"];
const EL_KEYWORDS = ["europa league", "avrupa ligi", "conference league", "konferans ligi"];

function isTrackedLeague(league: string): boolean {
  const lower = league.toLowerCase();
  return (
    SUPER_LIG_KEYWORDS.some((k) => lower.includes(k)) ||
    CL_KEYWORDS.some((k) => lower.includes(k)) ||
    EL_KEYWORDS.some((k) => lower.includes(k))
  );
}

function slugify(title: string): string {
  const map: Record<string, string> = {
    ş: "s", Ş: "s", ç: "c", Ç: "c", ğ: "g", Ğ: "g",
    ü: "u", Ü: "u", ö: "o", Ö: "o", ı: "i", İ: "i",
  };
  return title
    .replace(/[şŞçÇğĞüÜöÖıİ]/g, (c) => map[c] || c)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function createMatchThreads(): Promise<number> {
  let created = 0;

  try {
    const matches = await getAllMatches();
    const upcoming = matches.filter(
      (m) => m.sport === "football" && m.status === "upcoming" && isTrackedLeague(m.league)
    );

    if (upcoming.length === 0) return 0;

    // Find an ADMIN user to be the author
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    if (!admin) {
      console.error("[MatchThreads] No ADMIN user found");
      return 0;
    }

    // Find the "futbol" or general category
    const category = await prisma.category.findFirst({
      where: { OR: [{ slug: "futbol" }, { slug: "genel" }] },
      select: { id: true },
      orderBy: { position: "asc" },
    });
    if (!category) {
      console.error("[MatchThreads] No suitable category found");
      return 0;
    }

    // Find or create "CANLI" prefix
    let prefix = await prisma.prefix.findFirst({
      where: { label: "CANLI" },
      select: { id: true },
    });
    if (!prefix) {
      prefix = await prisma.prefix.create({
        data: { label: "CANLI", color: "#ef4444" },
        select: { id: true },
      });
    }

    for (const match of upcoming) {
      const title = `${match.homeTeam} vs ${match.awayTeam} - ${match.league}`;
      const searchTitle = `${match.homeTeam}%${match.awayTeam}`;

      // Check if thread already exists (search by team names)
      const existing = await prisma.thread.findFirst({
        where: {
          OR: [
            { title: { contains: match.homeTeam } },
            { title: { contains: match.awayTeam } },
          ],
          createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
        },
        select: { id: true },
      });

      if (existing) continue;

      const matchDate = new Date(match.startTime);
      const timeStr = matchDate.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
      const dateStr = matchDate.toLocaleDateString("tr-TR", { day: "2-digit", month: "long" });

      const content = `<h2>${match.homeTeam} vs ${match.awayTeam}</h2>
<p><strong>Lig:</strong> ${match.league}</p>
<p><strong>Tarih:</strong> ${dateStr} - ${timeStr}</p>
<hr/>
<p>Maç tartışması, tahminlerinizi ve yorumlarınızı bu konu altında paylaşabilirsiniz.</p>`;

      const slug = slugify(title) + "-" + Date.now().toString(36);

      await prisma.$transaction(async (tx) => {
        const thread = await tx.thread.create({
          data: {
            title,
            slug,
            categoryId: category.id,
            authorId: admin.id,
            prefixId: prefix!.id,
          },
        });

        await tx.post.create({
          data: {
            threadId: thread.id,
            authorId: admin.id,
            content,
          },
        });
      });

      created++;
      console.log(`[MatchThreads] Created thread: ${title}`);
    }
  } catch (error) {
    console.error("[MatchThreads] Error:", error);
  }

  return created;
}
