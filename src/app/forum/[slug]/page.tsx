import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";

const PREFIX_COLORS: Record<string, string> = {
  CANLI: "#ef4444",
  KUPON: "#1f844e",
  BANKO: "#e8a935",
  ANALIZ: "#3b82f6",
  TAHMIN: "#8b5cf6",
  BONUS: "#f59e0b",
  SONUC: "#6b7280",
};

function getPrefixColor(label: string): string {
  const key = label.replace(/[\[\]]/g, "").toUpperCase();
  return PREFIX_COLORS[key] || "#6b7280";
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      parent: true,
      threads: {
        include: {
          author: true,
          prefix: true,
          _count: { select: { posts: true } },
        },
        orderBy: [{ isPinned: "desc" }, { lastPostAt: "desc" }],
      },
    },
  });

  if (!category) {
    notFound();
  }

  const pinnedThreads = category.threads.filter((t) => t.isPinned);
  const normalThreads = category.threads.filter((t) => !t.isPinned);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#080a0f" }}>
      {/* Header */}
      <header
        className="border-b border-white/10"
        style={{ backgroundColor: "#0d1017" }}
      >
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold" style={{ color: "#1f844e" }}>
              REKOR
            </span>
            <span className="text-xl font-semibold text-white/80">Forum</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-white/60">
            <Link href="/" className="hover:text-white transition-colors">
              Ana Sayfa
            </Link>
            <Link
              href="/konu/olustur"
              className="px-4 py-2 rounded-lg text-white font-medium text-sm transition-colors"
              style={{ backgroundColor: "#1f844e" }}
            >
              Yeni Konu
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-white/40 mb-4">
          <Link href="/" className="hover:text-white transition-colors">
            Forum
          </Link>
          <span>/</span>
          {category.parent && (
            <>
              <span>{category.parent.name}</span>
              <span>/</span>
            </>
          )}
          <span className="text-white/70">{category.name}</span>
        </nav>

        {/* Category Header */}
        <div
          className="rounded-lg p-5 mb-6 flex items-center justify-between"
          style={{ backgroundColor: "#131820" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{category.icon}</span>
            <div>
              <h1 className="text-xl font-bold text-white">{category.name}</h1>
              <p className="text-white/50 text-sm mt-0.5">{category.description}</p>
            </div>
          </div>
          <Link
            href="/konu/olustur"
            className="px-5 py-2.5 rounded-lg text-white font-semibold text-sm transition-all hover:brightness-110"
            style={{ backgroundColor: "#1f844e" }}
          >
            + Yeni Konu
          </Link>
        </div>

        {/* Thread List */}
        <div className="rounded-lg overflow-hidden">
          {/* Table Header */}
          <div
            className="grid grid-cols-12 gap-4 px-4 py-2.5 text-xs font-semibold text-white/50 uppercase tracking-wide"
            style={{ backgroundColor: "#0d1017" }}
          >
            <div className="col-span-6">Konu</div>
            <div className="col-span-1 text-center hidden md:block">Yanit</div>
            <div className="col-span-1 text-center hidden md:block">Goruntulenme</div>
            <div className="col-span-4 text-right hidden lg:block">Son Mesaj</div>
          </div>

          {/* Pinned Threads */}
          {pinnedThreads.map((thread) => (
            <div
              key={thread.id}
              className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/5 items-center"
              style={{ backgroundColor: "#131820" }}
            >
              <div className="col-span-12 md:col-span-6 flex items-center gap-3 min-w-0">
                <span className="text-white/40 flex-shrink-0" title="Sabitlenmis">
                  📌
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {thread.prefix && (
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white"
                        style={{
                          backgroundColor: getPrefixColor(thread.prefix.label),
                        }}
                      >
                        {thread.prefix.label}
                      </span>
                    )}
                    <Link
                      href={`/konu/${thread.slug}`}
                      className="text-white font-semibold text-sm hover:underline truncate"
                    >
                      {thread.title}
                    </Link>
                  </div>
                  <div className="text-white/40 text-xs mt-0.5">
                    {thread.author.username} &middot;{" "}
                    {thread.createdAt.toLocaleDateString("tr-TR")}
                  </div>
                </div>
              </div>
              <div className="col-span-1 text-center text-white/60 text-sm hidden md:block">
                {thread.replyCount}
              </div>
              <div className="col-span-1 text-center text-white/60 text-sm hidden md:block">
                {thread.viewCount}
              </div>
              <div className="col-span-4 text-right text-xs text-white/40 hidden lg:block">
                {thread.lastPostAt.toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}

          {/* Normal Threads */}
          {normalThreads.map((thread) => (
            <div
              key={thread.id}
              className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/5 items-center"
              style={{ backgroundColor: "#131820" }}
            >
              <div className="col-span-12 md:col-span-6 flex items-center gap-3 min-w-0">
                {thread.isHot ? (
                  <span className="flex-shrink-0" title="Populer Konu">
                    🔥
                  </span>
                ) : (
                  <span className="text-white/20 flex-shrink-0">💬</span>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {thread.prefix && (
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white"
                        style={{
                          backgroundColor: getPrefixColor(thread.prefix.label),
                        }}
                      >
                        {thread.prefix.label}
                      </span>
                    )}
                    <Link
                      href={`/konu/${thread.slug}`}
                      className="text-white font-medium text-sm hover:underline truncate"
                    >
                      {thread.title}
                    </Link>
                  </div>
                  <div className="text-white/40 text-xs mt-0.5">
                    {thread.author.username} &middot;{" "}
                    {thread.createdAt.toLocaleDateString("tr-TR")}
                  </div>
                </div>
              </div>
              <div className="col-span-1 text-center text-white/60 text-sm hidden md:block">
                {thread.replyCount}
              </div>
              <div className="col-span-1 text-center text-white/60 text-sm hidden md:block">
                {thread.viewCount}
              </div>
              <div className="col-span-4 text-right text-xs text-white/40 hidden lg:block">
                {thread.lastPostAt.toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}

          {category.threads.length === 0 && (
            <div
              className="px-4 py-12 text-center text-white/30 text-sm"
              style={{ backgroundColor: "#131820" }}
            >
              Bu kategoride henuz konu bulunmuyor. Ilk konuyu siz acin!
            </div>
          )}
        </div>

        {/* Pagination Placeholder */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            disabled
            className="px-3 py-1.5 rounded text-sm text-white/30 cursor-not-allowed"
            style={{ backgroundColor: "#131820" }}
          >
            &laquo; Onceki
          </button>
          <span
            className="px-3 py-1.5 rounded text-sm font-semibold text-white"
            style={{ backgroundColor: "#1f844e" }}
          >
            1
          </span>
          <button
            className="px-3 py-1.5 rounded text-sm text-white/60 hover:text-white transition-colors"
            style={{ backgroundColor: "#131820" }}
          >
            2
          </button>
          <button
            className="px-3 py-1.5 rounded text-sm text-white/60 hover:text-white transition-colors"
            style={{ backgroundColor: "#131820" }}
          >
            3
          </button>
          <button
            className="px-3 py-1.5 rounded text-sm text-white/60 hover:text-white transition-colors"
            style={{ backgroundColor: "#131820" }}
          >
            Sonraki &raquo;
          </button>
        </div>
      </div>
    </div>
  );
}
