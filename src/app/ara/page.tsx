"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const PREFIX_COLORS: Record<string, string> = {
  CANLI: "#ef4444",
  KUPON: "#1f844e",
  BANKO: "#e8a935",
  "TAKTİK": "#3b82f6",
  ANALİZ: "#8b5cf6",
  ANALIZ: "#8b5cf6",
  SLOT: "#ec4899",
  SORU: "#06b6d4",
  VIP: "#a855f7",
  TAHMIN: "#8b5cf6",
  BONUS: "#f59e0b",
  SONUC: "#6b7280",
};

function getPrefixColor(label: string): string {
  const key = label.replace(/[\[\]]/g, "").toUpperCase();
  return PREFIX_COLORS[key] || "#6b7280";
}

interface Thread {
  id: string;
  title: string;
  slug: string;
  replyCount: number;
  viewCount: number;
  lastPostAt: string;
  createdAt: string;
  author: { id: string; username: string; avatar: string | null };
  prefix: { id: string; label: string } | null;
  category: { id: string; name: string; slug: string } | null;
  _count: { posts: number };
}

interface UserResult {
  id: string;
  username: string;
  avatar: string | null;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const tag = searchParams.get("tag") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  const [threads, setThreads] = useState<Thread[]>([]);
  const [users, setUsers] = useState<UserResult[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(pageParam);
  const [loading, setLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    if (!q && !tag) {
      setThreads([]);
      setUsers([]);
      setTotal(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (tag) params.set("tag", tag);
      params.set("page", String(page));

      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads || []);
        setUsers(data.users || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [q, tag, page]);

  useEffect(() => {
    setPage(pageParam);
  }, [pageParam]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  function goToPage(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (tag) params.set("tag", tag);
    params.set("page", String(p));
    router.push(`/ara?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-[#64748b] mb-5">
        <Link href="/" className="hover:text-[#e2e8f0] transition-colors">
          Forum
        </Link>
        <span className="text-[#64748b]">&rsaquo;</span>
        <span className="text-[#94a3b8]">Arama</span>
      </nav>

      {/* Search Header */}
      <div className="border border-[#1e293b] bg-[#131820] p-4 mb-4" style={{ borderRadius: "12px" }}>
        {tag ? (
          <h1 className="text-lg font-semibold text-[#e2e8f0]">
            &#127991;&#65039; Etiket: {tag}
          </h1>
        ) : (
          <h1 className="text-lg font-semibold text-[#e2e8f0]">
            &ldquo;{q}&rdquo; için arama sonuçları
          </h1>
        )}
        <p className="text-[#94a3b8] text-sm mt-1">
          {total} sonuç bulundu
        </p>
      </div>

      {/* Filters (placeholder, not functional yet) */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-xs text-[#64748b] uppercase tracking-wide font-medium">Filtreler:</span>
        <button className="px-3 py-1 rounded-md border border-[#1e293b] text-xs text-[#94a3b8] bg-[#131820] hover:bg-[#1e2738] transition-colors">
          Kategori
        </button>
        <button className="px-3 py-1 rounded-md border border-[#1e293b] text-xs text-[#94a3b8] bg-[#131820] hover:bg-[#1e2738] transition-colors">
          Prefix
        </button>
        <button className="px-3 py-1 rounded-md border border-[#1e293b] text-xs text-[#94a3b8] bg-[#131820] hover:bg-[#1e2738] transition-colors">
          Tarih
        </button>
      </div>

      {/* User Results (only on first page with text query) */}
      {users.length > 0 && page === 1 && (
        <div className="border border-[#1e293b] bg-[#131820] mb-4 overflow-hidden" style={{ borderRadius: "12px" }}>
          <div className="px-4 py-2.5 text-xs text-[#64748b] uppercase tracking-wide font-medium bg-[#1a2130] border-b border-[#1e293b]">
            Kullanıcılar
          </div>
          <div className="flex flex-wrap gap-2 p-4">
            {users.map((u) => (
              <Link
                key={u.id}
                href={`/profil/${u.username}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#1e293b] hover:bg-[#1e2738] transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[#1a2130] border border-[#1e293b] flex items-center justify-center text-xs font-semibold text-accent-green flex-shrink-0">
                  {u.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-[#e2e8f0]">{u.username}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="py-12 text-center text-[#64748b] text-sm">
          Aranıyor...
        </div>
      )}

      {/* Thread Results */}
      {!loading && threads.length > 0 && (
        <div className="overflow-hidden border border-[#1e293b]" style={{ borderRadius: "12px" }}>
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2.5 bg-[#1a2130]">
            <div className="col-span-6 text-xs text-[#64748b] uppercase tracking-wide font-medium">
              Konu
            </div>
            <div className="col-span-2 text-center text-xs text-[#64748b] uppercase tracking-wide font-medium hidden md:block">
              Yanıt
            </div>
            <div className="col-span-2 text-center text-xs text-[#64748b] uppercase tracking-wide font-medium hidden md:block">
              Görüntülenme
            </div>
            <div className="col-span-2 text-right text-xs text-[#64748b] uppercase tracking-wide font-medium hidden lg:block">
              Son Mesaj
            </div>
          </div>

          {threads.map((thread) => (
            <div
              key={thread.id}
              className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-[#1e293b] items-center bg-[#131820] hover:bg-[#1e2738] transition-colors"
            >
              <div className="col-span-12 md:col-span-6 flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#1a2130] border border-[#1e293b] flex items-center justify-center text-xs font-semibold text-accent-green flex-shrink-0">
                  {thread.author.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {thread.prefix && (
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium border bg-transparent"
                        style={{
                          borderColor: getPrefixColor(thread.prefix.label),
                          color: getPrefixColor(thread.prefix.label),
                        }}
                      >
                        {thread.prefix.label}
                      </span>
                    )}
                    <Link
                      href={`/konu/${thread.slug}`}
                      className="text-[#e2e8f0] font-medium text-sm hover:underline truncate"
                    >
                      {thread.title}
                    </Link>
                  </div>
                  <div className="text-[#64748b] text-xs mt-0.5">
                    {thread.author.username} &middot; {thread.category?.name} &middot;{" "}
                    {new Date(thread.createdAt).toLocaleDateString("tr-TR")}
                  </div>
                </div>
              </div>
              <div className="col-span-2 text-center text-[#94a3b8] text-sm hidden md:block">
                {thread.replyCount}
              </div>
              <div className="col-span-2 text-center text-[#94a3b8] text-sm hidden md:block">
                {thread.viewCount}
              </div>
              <div className="col-span-2 text-right text-[#64748b] text-xs hidden lg:block">
                {new Date(thread.lastPostAt).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && threads.length === 0 && (q || tag) && (
        <div className="border border-[#1e293b] bg-[#131820] px-4 py-12 text-center text-[#64748b] text-sm" style={{ borderRadius: "12px" }}>
          Sonuç bulunamadı. Farklı anahtar kelimeler deneyebilirsiniz.
        </div>
      )}

      {/* No Query */}
      {!loading && !q && !tag && (
        <div className="border border-[#1e293b] bg-[#131820] px-4 py-12 text-center text-[#64748b] text-sm" style={{ borderRadius: "12px" }}>
          Arama yapmak için bir kelime veya etiket girin.
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1.5">
          {page > 1 && (
            <button
              onClick={() => goToPage(page - 1)}
              className="px-3 py-1.5 rounded text-sm text-[#94a3b8] bg-[#131820] border border-[#1e293b] hover:bg-[#1e2738] transition-colors"
            >
              &laquo; Önceki
            </button>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .map((p, idx, arr) => (
              <span key={p} className="flex items-center gap-1.5">
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="text-[#64748b] text-sm">...</span>
                )}
                <button
                  onClick={() => goToPage(p)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-accent-green text-white"
                      : "text-[#94a3b8] bg-[#131820] border border-[#1e293b] hover:bg-[#1e2738]"
                  }`}
                >
                  {p}
                </button>
              </span>
            ))}
          {page < totalPages && (
            <button
              onClick={() => goToPage(page + 1)}
              className="px-3 py-1.5 rounded text-sm text-[#94a3b8] bg-[#131820] border border-[#1e293b] hover:bg-[#1e2738] transition-colors"
            >
              Sonraki &raquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AraPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-5 py-5">
          <div className="py-12 text-center text-[#64748b] text-sm">
            Yükleniyor...
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
