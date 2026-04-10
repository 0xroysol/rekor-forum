import Parser from "rss-parser";
import prisma from "@/lib/prisma";
import { rewriteNews } from "./gemini";

// Only trusted Turkish sports news sources — NO betting/tüyo sites
const RSS_FEEDS = [
  { url: "https://www.trthaber.com/spor_articles.rss", source: "TRT Spor", category: "genel" },
  { url: "https://www.hurriyet.com.tr/rss/spor", source: "Hürriyet Spor", category: "genel" },
  { url: "https://www.fotomac.com.tr/rss/anasayfa.xml", source: "Fotomaç", category: "futbol" },
];

// Words that indicate betting/gambling content — skip these
const BLOCKED_WORDS = [
  "tüyo", "iddaa", "bahis kuponu", "günün bankosu", "kazan",
  "promosyon", "bonus", "freebet", "free spin", "misli",
  "nesine", "bilyoner", "tuttur", "bets10", "canlı bahis",
  "kupon önerisi", "banko maç", "günün kuponu",
];

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: false }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
      ["enclosure", "enclosure", { keepArray: false }],
    ],
  },
});

function slugify(title: string): string {
  const map: Record<string, string> = { ş: "s", Ş: "s", ç: "c", Ç: "c", ğ: "g", Ğ: "g", ü: "u", Ü: "u", ö: "o", Ö: "o", ı: "i", İ: "i" };
  return title.replace(/[şŞçÇğĞüÜöÖıİ]/g, (c) => map[c] || c).toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function extractImage(item: Record<string, unknown>): string | null {
  const mc = item.mediaContent as Record<string, Record<string, string>> | undefined;
  if (mc?.$?.url) return mc.$.url;
  const enc = item.enclosure as Record<string, string> | undefined;
  if (enc?.url) return enc.url;
  const mt = item.mediaThumbnail as Record<string, Record<string, string>> | undefined;
  if (mt?.$?.url) return mt.$.url;
  const content = (item["content:encoded"] || item.content || item.description || "") as string;
  const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
  if (imgMatch?.[1]) return imgMatch[1];
  return null;
}

function isBlockedContent(title: string, summary: string): boolean {
  const text = (title + " " + summary).toLowerCase();
  return BLOCKED_WORDS.some((w) => text.includes(w));
}

function detectCategory(title: string, summary: string): string {
  const text = (title + " " + summary).toLowerCase();
  if (text.includes("transfer") || text.includes("imza") || text.includes("kadro")) return "transfer";
  if (text.includes("nba") || text.includes("basketbol") || text.includes("euroleague")) return "basketbol";
  if (text.includes("premier") || text.includes("la liga") || text.includes("serie a") || text.includes("bundesliga") || text.includes("champions") || text.includes("europa")) return "dunya";
  if (text.includes("süper lig") || text.includes("fenerbahçe") || text.includes("galatasaray") || text.includes("beşiktaş") || text.includes("trabzonspor") || text.includes("futbol")) return "futbol";
  return "genel";
}

// Simple word-overlap similarity for duplicate detection
function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().replace(/[^a-zçğıöşü0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2));
  const wordsB = new Set(b.toLowerCase().replace(/[^a-zçğıöşü0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  for (const w of wordsA) if (wordsB.has(w)) overlap++;
  return overlap / Math.min(wordsA.size, wordsB.size);
}

export async function fetchAndCreateNews(maxItems: number = 5): Promise<number> {
  let created = 0;
  console.log(`[News] Starting fetch, max ${maxItems} items from ${RSS_FEEDS.length} feeds`);

  // Get existing titles for similarity check
  const existingNews = await prisma.news.findMany({
    select: { title: true, sourceUrl: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  for (const feed of RSS_FEEDS) {
    if (created >= maxItems) break;

    try {
      console.log(`[News] Parsing ${feed.source}: ${feed.url}`);
      const rss = await parser.parseURL(feed.url);
      const items = rss.items?.slice(0, 8) || [];
      console.log(`[News] ${feed.source}: ${items.length} items found`);

      for (const item of items) {
        if (created >= maxItems) break;

        const sourceUrl = item.link || "";
        if (!sourceUrl || !item.title) continue;

        // Skip old articles (only last 24 hours)
        if (item.isoDate || item.pubDate) {
          const pubDate = new Date(item.isoDate || item.pubDate || "");
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          if (pubDate < oneDayAgo) continue;
        }

        // Skip betting/gambling content
        const rawDesc = (item as unknown as Record<string, unknown>).description as string | undefined;
        const rawSummary = item.contentSnippet || rawDesc?.replace(/<[^>]*>/g, "").slice(0, 300) || "";
        if (isBlockedContent(item.title, rawSummary)) {
          console.log(`[News] Blocked (betting content): ${item.title.slice(0, 50)}`);
          continue;
        }

        // Duplicate check — exact URL match
        if (existingNews.some((n) => n.sourceUrl === sourceUrl)) continue;

        // Duplicate check — title similarity >70%
        if (existingNews.some((n) => titleSimilarity(n.title, item.title || "") > 0.7)) {
          console.log(`[News] Skipped (similar): ${item.title.slice(0, 50)}`);
          continue;
        }

        // Extract image
        const imageUrl = extractImage(item as unknown as Record<string, unknown>);

        // Rewrite with Gemini
        console.log(`[News] Rewriting: ${item.title.slice(0, 60)}...`);
        const rewritten = await rewriteNews(item.title, rawSummary);

        if (!rewritten) {
          console.log(`[News] Gemini failed for: ${item.title.slice(0, 60)}`);
          continue;
        }

        const category = detectCategory(rewritten.title, rewritten.summary);
        const slug = slugify(rewritten.title) + "-" + Date.now().toString(36);

        await prisma.news.create({
          data: {
            title: rewritten.title,
            slug,
            summary: rewritten.summary,
            content: rewritten.content,
            imageUrl,
            source: feed.source,
            sourceUrl,
            category,
            isPublished: true,
          },
        });

        // Add to existing list for ongoing similarity check
        existingNews.push({ title: rewritten.title, sourceUrl });

        created++;
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch (e) {
      console.error(`RSS fetch error for ${feed.source}:`, e);
    }
  }

  return created;
}
