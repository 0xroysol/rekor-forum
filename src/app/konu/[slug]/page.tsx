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

const REACTION_EMOJIS = ["👍", "👎", "❤️", "😂", "🔥"];

function formatDate(date: Date): string {
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRoleBadge(role: string) {
  switch (role) {
    case "ADMIN":
      return { label: "Admin", color: "#ef4444" };
    case "MOD":
      return { label: "Moderator", color: "#e8a935" };
    default:
      return null;
  }
}

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const thread = await prisma.thread.findUnique({
    where: { slug },
    include: {
      category: { include: { parent: true } },
      prefix: true,
      author: true,
      posts: {
        include: {
          author: {
            include: {
              rank: true,
              badges: { include: { badge: true } },
            },
          },
          reactions: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!thread) {
    notFound();
  }

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
        {/* Casino Warning */}
        {thread.category.isCasino && (
          <div
            className="mb-4 rounded-lg px-4 py-3 flex items-center gap-3 border"
            style={{
              backgroundColor: "#ef444420",
              borderColor: "#ef444440",
            }}
          >
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#ef4444" }}>
                18+ Sorumlu Oyun
              </p>
              <p className="text-xs text-white/50">
                Bu bolum casino ve bahis icerikleri icermektedir. Kumar
                bagimlilik yapabilir. 18 yasindan kucukseniz bu bolumu terk
                ediniz.
              </p>
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-white/40 mb-4">
          <Link href="/" className="hover:text-white transition-colors">
            Forum
          </Link>
          <span>/</span>
          {thread.category.parent && (
            <>
              <span>{thread.category.parent.name}</span>
              <span>/</span>
            </>
          )}
          <Link
            href={`/forum/${thread.category.slug}`}
            className="hover:text-white transition-colors"
          >
            {thread.category.name}
          </Link>
          <span>/</span>
          <span className="text-white/70 truncate max-w-xs">{thread.title}</span>
        </nav>

        {/* Thread Title */}
        <div className="mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            {thread.prefix && (
              <span
                className="px-2.5 py-1 rounded text-xs font-bold uppercase text-white"
                style={{
                  backgroundColor: getPrefixColor(thread.prefix.label),
                }}
              >
                {thread.prefix.label}
              </span>
            )}
            <h1 className="text-2xl font-bold text-white">{thread.title}</h1>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
            <span>
              Yazan:{" "}
              <span className="text-white/70">{thread.author.username}</span>
            </span>
            <span>{formatDate(thread.createdAt)}</span>
            <span>{thread.viewCount.toLocaleString("tr-TR")} goruntulenme</span>
            <span>{thread.replyCount} yanit</span>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {thread.posts.map((post, idx) => {
            const roleBadge = getRoleBadge(post.author.role);
            const reactionCounts = REACTION_EMOJIS.map((emoji) => ({
              emoji,
              count: post.reactions.filter((r) => r.emoji === emoji).length,
            }));

            return (
              <article
                key={post.id}
                className="rounded-lg overflow-hidden border border-white/5"
                style={{ backgroundColor: "#0d1017" }}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Author Panel */}
                  <div
                    className="md:w-48 flex-shrink-0 p-4 flex flex-row md:flex-col items-center md:items-center gap-3 md:gap-2 border-b md:border-b-0 md:border-r border-white/5"
                    style={{ backgroundColor: "#131820" }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
                      style={{
                        backgroundColor: "#1f844e30",
                        color: "#1f844e",
                      }}
                    >
                      {post.author.avatar ? (
                        <img
                          src={post.author.avatar}
                          alt={post.author.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        post.author.username.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="text-center">
                      {/* Username */}
                      <div className="text-white font-semibold text-sm">
                        {post.author.displayName || post.author.username}
                      </div>

                      {/* Role Badge */}
                      {roleBadge && (
                        <span
                          className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white mt-1"
                          style={{ backgroundColor: roleBadge.color }}
                        >
                          {roleBadge.label}
                        </span>
                      )}

                      {/* Rank */}
                      {post.author.rank && (
                        <div className="mt-1 text-xs" style={{ color: post.author.rank.color }}>
                          {post.author.rank.icon} {post.author.rank.name}
                        </div>
                      )}

                      {/* User Badges */}
                      {post.author.badges.length > 0 && (
                        <div className="flex items-center justify-center gap-1 mt-1 flex-wrap">
                          {post.author.badges.slice(0, 3).map((ub) => (
                            <span
                              key={ub.id}
                              className="text-sm"
                              title={ub.badge.name}
                            >
                              {ub.badge.icon}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="mt-2 text-[11px] text-white/30 space-y-0.5 hidden md:block">
                        <div>Mesaj: {post.author.postCount}</div>
                        <div>
                          Katilim:{" "}
                          {post.author.createdAt.toLocaleDateString("tr-TR", {
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="flex-1 flex flex-col">
                    {/* Post Header */}
                    <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
                      <span className="text-xs text-white/30">
                        {idx === 0 ? "Konu Baslangici" : `#${idx + 1}`}{" "}
                        &middot; {formatDate(post.createdAt)}
                      </span>
                      {post.editedAt && (
                        <span className="text-[10px] text-white/20">
                          Duzenlendi: {formatDate(post.editedAt)}
                        </span>
                      )}
                    </div>

                    {/* Post Body */}
                    <div className="px-4 py-4 flex-1 text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </div>

                    {/* Reactions */}
                    <div className="px-4 py-2.5 border-t border-white/5 flex items-center gap-2">
                      {reactionCounts.map(({ emoji, count }) => (
                        <button
                          key={emoji}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors hover:bg-white/10"
                          style={{
                            backgroundColor: count > 0 ? "#1f844e20" : "transparent",
                            border:
                              count > 0
                                ? "1px solid #1f844e40"
                                : "1px solid transparent",
                          }}
                        >
                          <span>{emoji}</span>
                          {count > 0 && (
                            <span className="text-white/60">{count}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Reply Editor */}
        <div className="mt-6 rounded-lg overflow-hidden" style={{ backgroundColor: "#131820" }}>
          <div
            className="px-4 py-2.5 font-bold text-sm text-white uppercase tracking-wide border-b border-white/5"
            style={{ backgroundColor: "#0d1017" }}
          >
            Yanit Yaz
          </div>
          <div className="p-4">
            <textarea
              placeholder="Yanitinizi buraya yazin..."
              rows={6}
              className="w-full rounded-lg border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#1f844e] transition-colors resize-y"
              style={{ backgroundColor: "#0d1017" }}
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-white/30">
                Markdown desteklenmektedir
              </div>
              <button
                className="px-6 py-2.5 rounded-lg text-white font-semibold text-sm transition-all hover:brightness-110"
                style={{ backgroundColor: "#1f844e" }}
              >
                Yanit Gonder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
