import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({ select: { slug: true } });
  const threads = await prisma.thread.findMany({
    orderBy: { lastPostAt: "desc" },
    take: 500,
    select: { slug: true, lastPostAt: true },
  });

  const baseUrl = "https://rekorforum.com";

  let xml = '<?xml version="1.0" encoding="UTF-8"?>';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

  // Homepage
  xml += `<url><loc>${baseUrl}</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>`;

  // Categories
  for (const cat of categories) {
    xml += `<url><loc>${baseUrl}/forum/${cat.slug}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`;
  }

  // Threads
  for (const thread of threads) {
    xml += `<url><loc>${baseUrl}/konu/${thread.slug}</loc><lastmod>${thread.lastPostAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`;
  }

  xml += '</urlset>';

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
