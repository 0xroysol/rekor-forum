import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import { BRAND } from "@/config/brand";

const CATEGORY_GRADIENTS: Record<string, { bg: string; icon: string }> = {
  futbol: { bg: "linear-gradient(135deg, #1f844e, #0d4228)", icon: "⚽" },
  basketbol: { bg: "linear-gradient(135deg, #f97316, #7c2d12)", icon: "🏀" },
  transfer: { bg: "linear-gradient(135deg, #3b82f6, #1e3a5f)", icon: "🔄" },
  dunya: { bg: "linear-gradient(135deg, #8b5cf6, #4c1d95)", icon: "🌍" },
  genel: { bg: "linear-gradient(135deg, #64748b, #1e293b)", icon: "📰" },
};

const CATEGORY_COLORS: Record<string, string> = {
  futbol: "#1f844e",
  basketbol: "#f97316",
  transfer: "#3b82f6",
  dunya: "#8b5cf6",
  genel: "#64748b",
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const news = await prisma.news.findUnique({
    where: { slug },
    select: { title: true, summary: true },
  });
  if (!news) return { title: `Haber Bulunamadı - ${BRAND.name}` };
  return {
    title: `${news.title} - ${BRAND.name}`,
    description: news.summary ?? undefined,
  };
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const news = await prisma.news.findUnique({
    where: { slug },
  });

  if (!news || !news.isPublished) {
    notFound();
  }

  const relatedNews = await prisma.news.findMany({
    where: {
      category: news.category,
      isPublished: true,
      id: { not: news.id },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      id: true,
      title: true,
      slug: true,
      imageUrl: true,
      category: true,
      createdAt: true,
    },
  });

  const grad = CATEGORY_GRADIENTS[news.category] ?? CATEGORY_GRADIENTS.genel;
  const badgeColor = CATEGORY_COLORS[news.category] ?? "#64748b";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#080a0f" }}>
      <div className="mx-auto max-w-4xl px-5 py-5 space-y-5">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs" style={{ color: "#64748b" }}>
          <Link href="/" className="hover:text-accent-green transition-colors" style={{ color: "#64748b" }}>
            Ana Sayfa
          </Link>
          <span>›</span>
          <Link href="/haberler" className="hover:text-accent-green transition-colors" style={{ color: "#64748b" }}>
            Haberler
          </Link>
          <span>›</span>
          <span className="truncate" style={{ color: "#94a3b8" }}>
            {news.title}
          </span>
        </nav>

        {/* Hero Image */}
        {news.imageUrl ? (
          <div
            className="relative w-full overflow-hidden"
            style={{ maxHeight: "400px", borderRadius: "12px" }}
          >
            <Image
              src={news.imageUrl}
              alt={news.title}
              width={900}
              height={400}
              className="w-full object-cover"
              style={{ maxHeight: "400px" }}
              priority
            />
          </div>
        ) : (
          <div
            className="flex items-center justify-center"
            style={{
              background: grad.bg,
              height: "280px",
              borderRadius: "12px",
            }}
          >
            <span className="text-6xl">{grad.icon}</span>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ border: `1px solid ${badgeColor}`, color: badgeColor }}
          >
            {news.category.charAt(0).toUpperCase() + news.category.slice(1)}
          </span>
          <span className="text-xs" style={{ color: "#64748b" }}>
            {formatDate(news.createdAt)}
          </span>
          {news.source && (
            <>
              <span style={{ color: "#1e293b" }}>|</span>
              <span className="text-xs" style={{ color: "#64748b" }}>
                Kaynak: {news.source}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold" style={{ color: "#e2e8f0" }}>
          {news.title}
        </h1>

        {/* Content */}
        <article
          className="whitespace-pre-wrap"
          style={{
            fontSize: "15px",
            lineHeight: "1.8",
            color: "#e2e8f0",
            maxWidth: "48rem",
          }}
        >
          {news.content}
        </article>

        {/* Related News */}
        {relatedNews.length > 0 && (
          <section className="pt-6 space-y-4">
            <h2 className="text-base font-semibold" style={{ color: "#94a3b8" }}>
              Benzer Haberler
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {relatedNews.map((item) => {
                const rGrad = CATEGORY_GRADIENTS[item.category] ?? CATEGORY_GRADIENTS.genel;
                return (
                  <Link
                    key={item.id}
                    href={`/haberler/${item.slug}`}
                    className="block transition-all duration-200 hover:-translate-y-px"
                    style={{
                      backgroundColor: "#131820",
                      border: "1px solid #1e293b",
                      borderRadius: "12px",
                      overflow: "hidden",
                    }}
                  >
                    {item.imageUrl ? (
                      <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 33vw"
                        />
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-center"
                        style={{ aspectRatio: "16/9", background: rGrad.bg }}
                      >
                        <span className="text-2xl">{rGrad.icon}</span>
                      </div>
                    )}
                    <div className="p-3">
                      <h3
                        className="text-xs font-semibold line-clamp-2"
                        style={{ color: "#e2e8f0", lineHeight: "1.4" }}
                      >
                        {item.title}
                      </h3>
                      <div className="text-[11px] mt-1" style={{ color: "#64748b" }}>
                        {item.createdAt.toLocaleDateString("tr-TR")}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
