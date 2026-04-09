"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/providers/auth-provider";

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  imageUrl: string | null;
  category: string;
  source: string | null;
  createdAt: string;
}

const CATEGORIES = [
  { key: "", label: "Tümü" },
  { key: "futbol", label: "⚽ Futbol" },
  { key: "basketbol", label: "🏀 Basketbol" },
  { key: "transfer", label: "🔄 Transfer" },
  { key: "dunya", label: "🌍 Dünya" },
  { key: "genel", label: "💬 Genel" },
];

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

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "az önce";
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

export default function HaberlerPage() {
  const { dbUser } = useAuth();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const isLoggedIn = !!dbUser;

  const fetchNews = useCallback(
    async (pageNum: number, append: boolean) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(pageNum) });
        if (category) params.set("category", category);
        const res = await fetch(`/api/news?${params.toString()}`);
        if (!res.ok) throw new Error("Fetch failed");
        const data = await res.json();
        const items: NewsItem[] = data.news ?? data.items ?? data ?? [];
        if (append) {
          setNews((prev) => [...prev, ...items]);
        } else {
          setNews(items);
        }
        setHasMore(items.length >= 12);
      } catch {
        if (!append) setNews([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [category],
  );

  useEffect(() => {
    setPage(1);
    setImageErrors(new Set());
    fetchNews(1, false);
  }, [category, fetchNews]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchNews(next, true);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#080a0f" }}>
      <div className="mx-auto max-w-7xl px-5 py-5 space-y-5">
        {/* Page Header */}
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#e2e8f0" }}>
            Spor Haberleri
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            En güncel spor haberleri ve gelişmeler
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-150"
              style={{
                backgroundColor:
                  category === cat.key ? "#1f844e" : "#131820",
                color: category === cat.key ? "#fff" : "#94a3b8",
                border: `1px solid ${category === cat.key ? "#1f844e" : "#1e293b"}`,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* News Grid */}
        {!loading && news.length === 0 ? (
          <div
            className="text-center py-16 text-sm"
            style={{
              backgroundColor: "#131820",
              border: "1px solid #1e293b",
              borderRadius: "12px",
              color: "#64748b",
            }}
          >
            Henüz haber yok
          </div>
        ) : (
          <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(isLoggedIn ? news : news.slice(0, 3)).map((item) => {
              const grad = CATEGORY_GRADIENTS[item.category] ?? CATEGORY_GRADIENTS.genel;
              const badgeColor = CATEGORY_COLORS[item.category] ?? "#64748b";
              const showImage = item.imageUrl && !imageErrors.has(item.id);

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
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#1e2738")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#131820")
                  }
                >
                  {/* Image Area */}
                  <div
                    className="relative w-full"
                    style={{ aspectRatio: "16/9" }}
                  >
                    {showImage ? (
                      <Image
                        src={item.imageUrl!}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        onError={() =>
                          setImageErrors((prev) =>
                            new Set(prev).add(item.id),
                          )
                        }
                      />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: grad.bg }}
                      >
                        <span className="text-4xl">{grad.icon}</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          border: `1px solid ${badgeColor}`,
                          color: badgeColor,
                        }}
                      >
                        {item.category.charAt(0).toUpperCase() +
                          item.category.slice(1)}
                      </span>
                      <span
                        className="text-[11px]"
                        style={{ color: "#64748b" }}
                      >
                        {relativeTime(item.createdAt)}
                      </span>
                    </div>
                    <h3
                      className="font-semibold line-clamp-2"
                      style={{
                        fontSize: "15px",
                        color: "#e2e8f0",
                        lineHeight: "1.4",
                      }}
                    >
                      {item.title}
                    </h3>
                    {item.summary && (
                      <p
                        className="mt-1.5 line-clamp-2"
                        style={{
                          fontSize: "13px",
                          color: "#94a3b8",
                          lineHeight: "1.5",
                        }}
                      >
                        {item.summary}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Auth overlay for non-logged-in users */}
          {!isLoggedIn && news.length > 3 && (
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center pb-8" style={{ height: "200px", background: "linear-gradient(transparent, #080a0f 70%)" }}>
              <div className="text-center">
                <p className="text-sm font-medium mb-3" style={{ color: "#e2e8f0" }}>Tüm haberleri okumak için giriş yapın</p>
                <div className="flex items-center justify-center gap-3">
                  <Link href="/giris" className="rounded-lg px-5 py-2 text-sm font-medium text-white hover:brightness-110" style={{ backgroundColor: "#1f844e" }}>Giriş Yap</Link>
                  <Link href="/kayit" className="rounded-lg px-5 py-2 text-sm font-medium hover:bg-[#1e2738]" style={{ color: "#94a3b8", border: "1px solid #1e293b" }}>Kayıt Ol</Link>
                </div>
              </div>
            </div>
          )}
          </div>
        )}

        {/* Load More */}
        {isLoggedIn && hasMore && news.length > 0 && (
          <div className="flex justify-center pt-2 pb-4">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 hover:brightness-110 disabled:opacity-50"
              style={{
                backgroundColor: "#1f844e",
                color: "#fff",
              }}
            >
              {loading ? "Yükleniyor..." : "Daha Fazla Yükle"}
            </button>
          </div>
        )}

        {loading && news.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  backgroundColor: "#131820",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    aspectRatio: "16/9",
                    backgroundColor: "#1a2130",
                  }}
                />
                <div className="p-3.5 space-y-2">
                  <div
                    className="h-3 w-16 rounded"
                    style={{ backgroundColor: "#1a2130" }}
                  />
                  <div
                    className="h-4 w-3/4 rounded"
                    style={{ backgroundColor: "#1a2130" }}
                  />
                  <div
                    className="h-3 w-full rounded"
                    style={{ backgroundColor: "#1a2130" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
