import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import { BRAND } from "@/config/brand";
// CasinoGate removed

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug }, select: { name: true, description: true } });
  if (!category) return { title: `Kategori Bulunamadı - ${BRAND.name}` };
  return {
    title: `${category.name} - ${BRAND.name}`,
    description: category.description,
    openGraph: { title: `${category.name} - ${BRAND.name}`, description: category.description, siteName: BRAND.name },
  };
}

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

const THREADS_PER_PAGE = 20;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; prefix?: string; sort?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1"));
  const prefixFilter = sp.prefix || "";
  const sortBy = sp.sort || "lastPost";

  const category = await prisma.category.findUnique({
    where: { slug },
    include: { parent: true },
  });

  if (!category) {
    notFound();
  }

  // Get available prefixes for filter chips
  const prefixes = await prisma.prefix.findMany();

  // Build where clause
  const normalWhere: Record<string, unknown> = {
    categoryId: category.id,
    isPinned: false,
    ...(prefixFilter ? { prefix: { label: { equals: prefixFilter, mode: "insensitive" as const } } } : {}),
  };

  // Build orderBy
  const orderByMap: Record<string, Record<string, string>> = {
    lastPost: { lastPostAt: "desc" },
    new: { createdAt: "desc" },
    popular: { replyCount: "desc" },
    views: { viewCount: "desc" },
  };
  const orderBy = orderByMap[sortBy] || orderByMap.lastPost;

  // Pinned threads (always show all, no filter)
  const pinnedThreads = await prisma.thread.findMany({
    where: { categoryId: category.id, isPinned: true },
    include: {
      author: true,
      prefix: true,
      _count: { select: { posts: true } },
    },
    orderBy: { lastPostAt: "desc" },
  });

  // Normal threads with pagination + filter + sort
  const [normalThreads, totalNormal] = await Promise.all([
    prisma.thread.findMany({
      where: normalWhere,
      include: {
        author: true,
        prefix: true,
        _count: { select: { posts: true } },
      },
      orderBy,
      skip: (page - 1) * THREADS_PER_PAGE,
      take: THREADS_PER_PAGE,
    }),
    prisma.thread.count({ where: normalWhere }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalNormal / THREADS_PER_PAGE));

  return (
    <div className="mx-auto max-w-7xl px-5 py-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-[#64748b] mb-5">
        <Link href="/" className="hover:text-[#e2e8f0] transition-colors">
          Forum
        </Link>
        <span className="text-[#64748b]">›</span>
        {category.parent && (
          <>
            <span className="text-[#64748b]">{category.parent.name}</span>
            <span className="text-[#64748b]">›</span>
          </>
        )}
        <span className="text-[#94a3b8]">{category.name}</span>
      </nav>

      {/* Casino category indicator removed */}

      {/* Category Info Bar */}
      <div className="border border-[#1e293b] bg-[#131820] p-4 mb-4 flex items-center justify-between" style={{ borderRadius: "12px" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#1a2130] flex items-center justify-center text-lg">
            {category.icon}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#e2e8f0]">{category.name}</h1>
            {category.description && (
              <p className="text-[#94a3b8] text-sm mt-0.5">{category.description}</p>
            )}
          </div>
        </div>
        <Link
          href={`/konu/olustur?kategori=${slug}`}
          className="px-4 py-2 rounded-xl text-white font-medium text-sm bg-accent-green hover:brightness-110 transition-all"
        >
          Yeni Konu
        </Link>
      </div>

      {/* Filter & Sort Bar */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Prefix filters */}
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={`/forum/${slug}?sort=${sortBy}`}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              !prefixFilter
                ? "bg-accent-green/15 text-accent-green border border-accent-green/30"
                : "text-[#64748b] border border-[#1e293b] hover:text-[#94a3b8]"
            }`}
          >
            Tümü
          </Link>
          {prefixes.map((p) => (
            <Link
              key={p.id}
              href={`/forum/${slug}?prefix=${encodeURIComponent(p.label)}&sort=${sortBy}`}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                prefixFilter.toLowerCase() === p.label.toLowerCase()
                  ? "border"
                  : "border border-transparent hover:border-[#1e293b]"
              }`}
              style={{
                borderColor: prefixFilter.toLowerCase() === p.label.toLowerCase() ? p.color : undefined,
                color: p.color,
                backgroundColor: prefixFilter.toLowerCase() === p.label.toLowerCase() ? `${p.color}15` : undefined,
              }}
            >
              {p.label}
            </Link>
          ))}
        </div>

        {/* Sort options */}
        <div className="flex items-center gap-1">
          {[
            { key: "lastPost", label: "Son Yanıt" },
            { key: "new", label: "Yeni" },
            { key: "popular", label: "Popüler" },
            { key: "views", label: "Görüntülenen" },
          ].map((s) => (
            <Link
              key={s.key}
              href={`/forum/${slug}?sort=${s.key}${prefixFilter ? `&prefix=${encodeURIComponent(prefixFilter)}` : ""}`}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                sortBy === s.key
                  ? "bg-[#1a2130] text-[#e2e8f0]"
                  : "text-[#64748b] hover:text-[#94a3b8]"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Thread List Card */}
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

        {/* Pinned Threads */}
        {pinnedThreads.map((thread) => (
          <div
            key={thread.id}
            className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-[#1e293b] items-center bg-[#1a2130] hover:bg-[#1e2738] transition-colors"
          >
            <div className="col-span-12 md:col-span-6 flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#1a2130] border border-[#1e293b] flex items-center justify-center text-xs font-semibold text-accent-green flex-shrink-0">
                {thread.author.username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#64748b] text-xs flex-shrink-0" title="Sabitlenmiş">📌</span>
                  {thread.prefix && (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium border bg-transparent"
                      style={{ borderColor: getPrefixColor(thread.prefix.label), color: getPrefixColor(thread.prefix.label) }}
                    >
                      {thread.prefix.label}
                    </span>
                  )}
                  <Link href={`/konu/${thread.slug}`} className="text-[#e2e8f0] font-medium text-sm hover:underline truncate">
                    {thread.title}
                  </Link>
                </div>
                <div className="text-[#64748b] text-xs mt-0.5">
                  {thread.author.username} · {thread.createdAt.toLocaleDateString("tr-TR")}
                </div>
              </div>
            </div>
            <div className="col-span-2 text-center text-[#94a3b8] text-sm hidden md:block">{thread.replyCount}</div>
            <div className="col-span-2 text-center text-[#94a3b8] text-sm hidden md:block">{thread.viewCount}</div>
            <div className="col-span-2 text-right text-[#64748b] text-xs hidden lg:block">
              {thread.lastPostAt.toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        ))}

        {/* Normal Threads */}
        {normalThreads.map((thread) => (
          <div
            key={thread.id}
            className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-[#1e293b] items-center bg-[#131820] hover:bg-[#1e2738] transition-colors"
          >
            <div className="col-span-12 md:col-span-6 flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#1a2130] flex items-center justify-center text-xs font-semibold text-accent-green flex-shrink-0">
                {thread.author.username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {thread.replyCount > 20 && (
                    <span className="text-xs flex-shrink-0" title="Popüler Konu">🔥</span>
                  )}
                  {thread.isHot && (
                    <span className="text-xs flex-shrink-0" title="Sıcak Konu">🔥</span>
                  )}
                  {thread.prefix && (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium border bg-transparent"
                      style={{ borderColor: getPrefixColor(thread.prefix.label), color: getPrefixColor(thread.prefix.label) }}
                    >
                      {thread.prefix.label}
                    </span>
                  )}
                  <Link href={`/konu/${thread.slug}`} className="text-[#e2e8f0] font-medium text-sm hover:underline truncate">
                    {thread.title}
                  </Link>
                </div>
                <div className="text-[#64748b] text-xs mt-0.5">
                  {thread.author.username} · {thread.createdAt.toLocaleDateString("tr-TR")}
                </div>
              </div>
            </div>
            <div className="col-span-2 text-center text-[#94a3b8] text-sm hidden md:block">{thread.replyCount}</div>
            <div className="col-span-2 text-center text-[#94a3b8] text-sm hidden md:block">{thread.viewCount}</div>
            <div className="col-span-2 text-right text-[#64748b] text-xs hidden lg:block">
              {thread.lastPostAt.toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {pinnedThreads.length === 0 && normalThreads.length === 0 && (
          <div className="px-4 py-12 text-center text-[#64748b] text-sm bg-[#131820]">
            Bu kategoride henüz konu bulunmuyor. İlk konuyu siz açın!
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1.5">
          {page > 1 && (
            <Link
              href={`/forum/${slug}?page=${page - 1}`}
              className="px-3 py-1.5 rounded text-sm text-[#94a3b8] bg-[#131820] border border-[#1e293b] hover:bg-[#1e2738] transition-colors"
            >
              &laquo; Önceki
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .map((p, idx, arr) => (
              <span key={p} className="flex items-center gap-1.5">
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="text-[#64748b] text-sm">...</span>
                )}
                <Link
                  href={`/forum/${slug}?page=${p}`}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-accent-green text-white"
                      : "text-[#94a3b8] bg-[#131820] border border-[#1e293b] hover:bg-[#1e2738]"
                  }`}
                >
                  {p}
                </Link>
              </span>
            ))}
          {page < totalPages && (
            <Link
              href={`/forum/${slug}?page=${page + 1}`}
              className="px-3 py-1.5 rounded text-sm text-[#94a3b8] bg-[#131820] border border-[#1e293b] hover:bg-[#1e2738] transition-colors"
            >
              Sonraki &raquo;
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
