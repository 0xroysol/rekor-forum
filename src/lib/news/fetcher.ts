import Parser from "rss-parser";
import prisma from "@/lib/prisma";
import { rewriteNews } from "./gemini";

const RSS_FEEDS = [
  { url: "https://www.trthaber.com/spor_articles.rss", source: "TRT Spor", category: "genel" },
  { url: "https://www.hurriyet.com.tr/rss/spor", source: "Hürriyet Spor", category: "genel" },
];

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: false }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ['enclosure', 'enclosure', { keepArray: false }],
    ]
  }
});

function slugify(title: string): string {
  const map: Record<string, string> = { ş: "s", Ş: "s", ç: "c", Ç: "c", ğ: "g", Ğ: "g", ü: "u", Ü: "u", ö: "o", Ö: "o", ı: "i", İ: "i" };
  return title.replace(/[şŞçÇğĞüÜöÖıİ]/g, c => map[c] || c).toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function extractImage(item: any): string | null {
  // 1. media:content
  if (item.mediaContent?.$.url) return item.mediaContent.$.url;
  // 2. enclosure
  if (item.enclosure?.url) return item.enclosure.url;
  // 3. media:thumbnail
  if (item.mediaThumbnail?.$.url) return item.mediaThumbnail.$.url;
  // 4. img in content/description
  const content = item['content:encoded'] || item.content || item.description || '';
  const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
  if (imgMatch?.[1]) return imgMatch[1];
  return null;
}

function detectCategory(title: string, summary: string): string {
  const text = (title + " " + summary).toLowerCase();
  if (text.includes("transfer") || text.includes("imza") || text.includes("kadro")) return "transfer";
  if (text.includes("nba") || text.includes("basketbol") || text.includes("euroleague")) return "basketbol";
  if (text.includes("premier") || text.includes("la liga") || text.includes("serie a") || text.includes("bundesliga") || text.includes("ligue 1") || text.includes("champions") || text.includes("europa")) return "dunya";
  if (text.includes("süper lig") || text.includes("fenerbahçe") || text.includes("galatasaray") || text.includes("beşiktaş") || text.includes("trabzonspor")) return "futbol";
  return "genel";
}

export async function fetchAndCreateNews(maxItems: number = 5): Promise<number> {
  let created = 0;
  console.log(`[News] Starting fetch, max ${maxItems} items from ${RSS_FEEDS.length} feeds`);

  for (const feed of RSS_FEEDS) {
    if (created >= maxItems) break;

    try {
      console.log(`[News] Parsing ${feed.source}: ${feed.url}`);
      const rss = await parser.parseURL(feed.url);
      const items = rss.items?.slice(0, 10) || [];
      console.log(`[News] ${feed.source}: ${items.length} items found`);

      for (const item of items) {
        if (created >= maxItems) break;

        const sourceUrl = item.link || "";
        if (!sourceUrl || !item.title) continue;

        // Duplicate check
        const existing = await prisma.news.findFirst({
          where: { OR: [{ sourceUrl }, { title: { contains: item.title.slice(0, 30) } }] },
        });
        if (existing) continue;

        // Extract image
        const imageUrl = extractImage(item);

        // Rewrite with Gemini
        const summary = item.contentSnippet || item.description?.replace(/<[^>]*>/g, "").slice(0, 300) || "";
        console.log(`[News] Rewriting: ${item.title.slice(0, 60)}...`);
        const rewritten = await rewriteNews(item.title, summary);

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

        created++;
        // Small delay between Gemini calls
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (e) {
      console.error(`RSS fetch error for ${feed.source}:`, e);
    }
  }

  return created;
}
