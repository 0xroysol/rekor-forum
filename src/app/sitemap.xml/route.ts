import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({ select: { slug: true } });
  const threads = await prisma.thread.findMany({
    orderBy: { lastPostAt: "desc" },
    take: 500,
    select: { slug: true, lastPostAt: true },
  });
  const news = await prisma.news.findMany({
    where: { isPublished: true },
    orderBy: { updatedAt: "desc" },
    take: 500,
    select: { slug: true, updatedAt: true },
  });
  const users = await prisma.user.findMany({
    take: 500,
    select: { username: true },
  });

  const baseUrl = "https://rekorforum.com";

  let xml = '<?xml version="1.0" encoding="UTF-8"?>';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

  // Homepage
  xml += `<url><loc>${baseUrl}</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>`;

  // Haberler
  xml += `<url><loc>${baseUrl}/haberler</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`;

  // Categories
  for (const cat of categories) {
    xml += `<url><loc>${baseUrl}/forum/${cat.slug}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`;
  }

  // Threads
  for (const thread of threads) {
    xml += `<url><loc>${baseUrl}/konu/${thread.slug}</loc><lastmod>${thread.lastPostAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`;
  }

  // Published news
  for (const item of news) {
    xml += `<url><loc>${baseUrl}/haberler/${item.slug}</loc><lastmod>${item.updatedAt.toISOString()}</lastmod><changefreq>daily</changefreq><priority>0.7</priority></url>`;
  }

  // User profiles
  for (const user of users) {
    xml += `<url><loc>${baseUrl}/profil/${user.username}</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>`;
  }

  // Legal pages
  const legalPages = ["/kurallar", "/gizlilik", "/kullanim-sartlari", "/kvkk", "/sorumlu-oyun"];
  for (const page of legalPages) {
    xml += `<url><loc>${baseUrl}${page}</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>`;
  }

  // Canli skorlar
  xml += `<url><loc>${baseUrl}/canli-skorlar</loc><changefreq>hourly</changefreq><priority>0.8</priority></url>`;

  // Tahminler
  xml += `<url><loc>${baseUrl}/tahminler</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>`;

  // Takip Ettiklerim
  xml += `<url><loc>${baseUrl}/takip-ettiklerim</loc><changefreq>weekly</changefreq><priority>0.3</priority></url>`;

  // Search
  xml += `<url><loc>${baseUrl}/ara</loc><changefreq>weekly</changefreq><priority>0.4</priority></url>`;

  xml += '</urlset>';

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
