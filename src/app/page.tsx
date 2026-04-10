import Link from "next/link";
import prisma from "@/lib/prisma";
import { BRAND } from "@/config/brand";

const NEWS_CATEGORY_ICONS: Record<string, string> = {
  futbol: "⚽",
  basketbol: "🏀",
  transfer: "🔄",
  dunya: "🌍",
  genel: "📰",
};

function newsRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "az önce";
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

export default async function Home() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [categories, totalThreads, totalPosts, onlineUsers, trendThreads, topUsers, onlineUsersList, recentKuponThreads, latestNews, todayMatchThreads] =
    await Promise.all([
      prisma.category.findMany({
        where: { parentId: { not: null } },
        include: {
          parent: true,
          _count: { select: { threads: true } },
          threads: {
            orderBy: { lastPostAt: "desc" },
            take: 1,
            include: { author: true },
          },
        },
        orderBy: { position: "asc" },
      }),
      prisma.thread.count(),
      prisma.post.count(),
      prisma.user.count({ where: { isOnline: true } }),
      // Trend: most replies in last 7 days
      prisma.thread.findMany({
        where: { lastPostAt: { gte: sevenDaysAgo } },
        orderBy: { replyCount: "desc" },
        take: 5,
        include: { author: true, category: true },
      }),
      prisma.user.findMany({
        orderBy: { reputation: "desc" },
        take: 5,
        include: { rank: true },
      }),
      prisma.user.findMany({
        where: { isOnline: true },
        take: 12,
      }),
      prisma.thread.findMany({
        where: {
          prefix: { label: { in: ["KUPON", "BANKO"] } },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { author: true, prefix: true },
      }),
      prisma.news.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, slug: true, category: true, createdAt: true },
      }),
      prisma.thread.findMany({
        where: {
          createdAt: { gte: todayStart },
          prefix: { label: "CANLI" },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, slug: true, replyCount: true, isPinned: true },
      }),
    ]);

  // Group sub-categories by parent
  const grouped = new Map<
    string,
    { parent: { id: string; name: string; color: string; icon: string }; children: typeof categories }
  >();

  for (const cat of categories) {
    if (!cat.parent) continue;
    const key = cat.parent.id;
    if (!grouped.has(key)) {
      grouped.set(key, {
        parent: {
          id: cat.parent.id,
          name: cat.parent.name,
          color: cat.parent.color,
          icon: cat.parent.icon,
        },
        children: [],
      });
    }
    grouped.get(key)!.children.push(cat);
  }

  const parentCategories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { position: "asc" },
  });

  const totalUsers = await prisma.user.count();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#080a0f" }}>
      <div className="mx-auto max-w-7xl px-5 py-5 space-y-4">

        {/* Welcome Banner */}
        <div
          className="relative overflow-hidden p-5 sm:p-8"
          style={{
            background: `linear-gradient(135deg, #1a2130, ${BRAND.accent}26, #131820)`,
            border: "1px solid #1e293b",
            borderRadius: "12px",
          }}
        >
          {/* Decorative radial glow */}
          <div
            className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 opacity-30"
            style={{ background: `radial-gradient(circle, ${BRAND.accent}4D 0%, transparent 70%)` }}
          />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-[20px] sm:text-[26px] font-bold" style={{ color: "#e2e8f0" }}>
                {BRAND.name}&apos;a Hoş Geldiniz!
              </h2>
              <p className="mt-1 sm:mt-1.5 text-[13px] sm:text-[14px]" style={{ color: "#94a3b8" }}>
                {BRAND.description}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Link
                href="/konu/olustur"
                className="px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:brightness-110"
                style={{ backgroundColor: BRAND.accent, borderRadius: "8px" }}
              >
                Yeni Konu Aç
              </Link>
              <Link
                href="/canli-skorlar"
                className="px-4 py-2 text-sm font-medium transition-all duration-150 hover:bg-bg-hover"
                style={{ color: "#94a3b8", border: "1px solid #1e293b", borderRadius: "8px" }}
              >
                📡 Canlı Skorlar
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content + Sidebar */}
        <div className="flex gap-4">

          {/* Main Content */}
          <main className="flex-1 min-w-0 space-y-4">
            {Array.from(grouped.values()).map((group) => (
              <section key={group.parent.id}>
                {/* Parent category label - subtle text, not a banner */}
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-base">{group.parent.icon}</span>
                  <h2
                    className="uppercase"
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#64748b",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {group.parent.name}
                  </h2>
                </div>

                {/* Sub-categories card */}
                <div
                  className="overflow-hidden"
                  style={{
                    backgroundColor: "#131820",
                    border: "1px solid #1e293b",
                    borderRadius: "12px",
                  }}
                >
                  {group.children.map((cat, idx) => {
                    const lastThread = cat.threads[0];
                    const postCount = cat._count.threads * 8; // approximate posts per thread
                    return (
                      <div
                        key={cat.id}
                        className="flex items-center gap-4 px-4 py-3.5 transition-colors duration-150 hover:bg-bg-hover"
                        style={{
                          borderBottom:
                            idx < group.children.length - 1
                              ? "1px solid #1e293b"
                              : undefined,
                        }}
                      >
                        {/* Icon - 44x44 box */}
                        <div
                          className="flex-shrink-0 flex items-center justify-center"
                          style={{
                            width: "44px",
                            height: "44px",
                            backgroundColor: cat.color + "22",
                            borderRadius: "10px",
                            fontSize: "22px",
                          }}
                        >
                          {cat.icon}
                        </div>

                        {/* Name & Description */}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/forum/${cat.slug}`}
                            className="font-medium text-sm transition-colors duration-150 hover:text-accent-green"
                            style={{ color: "#e2e8f0" }}
                          >
                            {cat.name}
                          </Link>
                          <p
                            className="text-xs mt-0.5 truncate"
                            style={{ color: "#64748b" }}
                          >
                            {cat.description}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="hidden md:flex items-center gap-5 text-xs">
                          <div className="text-center" style={{ minWidth: "48px" }}>
                            <div className="font-semibold" style={{ color: "#e2e8f0" }}>
                              {cat._count.threads}
                            </div>
                            <div style={{ color: "#64748b" }}>Konu</div>
                          </div>
                          <div className="text-center" style={{ minWidth: "48px" }}>
                            <div className="font-semibold" style={{ color: "#e2e8f0" }}>
                              {postCount}
                            </div>
                            <div style={{ color: "#64748b" }}>Mesaj</div>
                          </div>
                        </div>

                        {/* Last Activity */}
                        <div className="hidden lg:block w-44 text-xs">
                          {lastThread ? (
                            <div>
                              <Link
                                href={`/konu/${lastThread.slug}`}
                                className="truncate block transition-colors duration-150 hover:text-accent-green"
                                style={{ color: "#94a3b8" }}
                              >
                                {lastThread.title}
                              </Link>
                              <div className="mt-0.5" style={{ color: "#64748b" }}>
                                {lastThread.author.username} · {lastThread.lastPostAt.toLocaleDateString("tr-TR")}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: "#64748b" }}>Henüz konu yok</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

            {/* Standalone parent categories with no children */}
            {parentCategories
              .filter((p) => !grouped.has(p.id))
              .map((cat) => (
                <section key={cat.id}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-base">{cat.icon}</span>
                    <h2
                      className="uppercase"
                      style={{ fontSize: "13px", fontWeight: 600, color: "#64748b", letterSpacing: "0.5px" }}
                    >
                      {cat.name}
                    </h2>
                  </div>
                  <div
                    className="px-4 py-6 text-center text-sm"
                    style={{
                      backgroundColor: "#131820",
                      border: "1px solid #1e293b",
                      borderRadius: "12px",
                      color: "#64748b",
                    }}
                  >
                    Bu kategoride henüz alt forum bulunmuyor.
                  </div>
                </section>
              ))}
          </main>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-72 flex-shrink-0 space-y-4">

            {/* Forum Stats */}
            <div style={{ backgroundColor: "#131820", border: "1px solid #1e293b", borderRadius: "12px", overflow: "hidden" }}>
              <div className="px-4 py-3" style={{ borderBottom: "1px solid #1e293b" }}>
                <span className="text-[13px] font-semibold" style={{ color: "#94a3b8" }}>
                  📊 Forum İstatistikleri
                </span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#64748b" }}>Toplam Üye</span>
                  <span className="font-semibold" style={{ color: "#e2e8f0" }}>{totalUsers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#64748b" }}>Toplam Konu</span>
                  <span className="font-semibold" style={{ color: "#e2e8f0" }}>{totalThreads}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#64748b" }}>Toplam Mesaj</span>
                  <span className="font-semibold" style={{ color: "#e2e8f0" }}>{totalPosts}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#64748b" }}>Çevrimiçi</span>
                  <span className="font-semibold" style={{ color: BRAND.accent }}>{onlineUsers}</span>
                </div>
              </div>
            </div>

            {/* Bugünün Maç Tartışmaları */}
            {todayMatchThreads.length > 0 && (
              <div style={{ backgroundColor: "#131820", border: "1px solid #1e293b", borderRadius: "12px", overflow: "hidden" }}>
                <div className="px-4 py-3" style={{ borderBottom: "1px solid #1e293b" }}>
                  <span className="text-[13px] font-semibold" style={{ color: "#94a3b8" }}>
                    ⚽ Bugünün Maç Tartışmaları
                  </span>
                </div>
                <div>
                  {todayMatchThreads.map((thread, idx) => (
                    <div
                      key={thread.id}
                      className="px-4 py-2.5 transition-colors duration-150 hover:bg-bg-hover"
                      style={{ borderBottom: idx < todayMatchThreads.length - 1 ? "1px solid #1e293b" : undefined }}
                    >
                      <Link
                        href={`/konu/${thread.slug}`}
                        className="flex items-center gap-1.5 text-xs font-medium truncate transition-colors duration-150 hover:text-accent-green"
                        style={{ color: "#e2e8f0" }}
                      >
                        {thread.isPinned && <span>📌</span>}
                        {thread.title}
                      </Link>
                      <div className="text-[11px] mt-0.5 flex items-center gap-2" style={{ color: "#64748b" }}>
                        <span>{thread.replyCount} yanıt</span>
                      </div>
                    </div>
                  ))}
                  <Link
                    href="/forum/super-lig-tartismalari"
                    className="block px-4 py-2 text-center text-[12px] font-medium transition-colors hover:bg-bg-hover"
                    style={{ color: BRAND.accent, borderTop: "1px solid #1e293b" }}
                  >
                    Tüm Maç Tartışmaları →
                  </Link>
                </div>
              </div>
            )}

            {/* Trend Konular */}
            <div style={{ backgroundColor: "#131820", border: "1px solid #1e293b", borderRadius: "12px", overflow: "hidden" }}>
              <div className="px-4 py-3" style={{ borderBottom: "1px solid #1e293b" }}>
                <span className="text-[13px] font-semibold" style={{ color: "#94a3b8" }}>
                  🔥 Trend Konular
                </span>
              </div>
              <div>
                {trendThreads.map((thread, idx) => (
                  <div
                    key={thread.id}
                    className="px-4 py-2.5 transition-colors duration-150 hover:bg-bg-hover"
                    style={{
                      borderBottom: idx < trendThreads.length - 1 ? "1px solid #1e293b" : undefined,
                    }}
                  >
                    <Link
                      href={`/konu/${thread.slug}`}
                      className="text-xs font-medium block truncate transition-colors duration-150 hover:text-accent-green"
                      style={{ color: "#e2e8f0" }}
                    >
                      {thread.title}
                    </Link>
                    <div className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                      {thread.author.username} · {thread.viewCount.toLocaleString("tr-TR")} görüntülenme
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* En İyi Üyeler */}
            <div style={{ backgroundColor: "#131820", border: "1px solid #1e293b", borderRadius: "12px", overflow: "hidden" }}>
              <div className="px-4 py-3" style={{ borderBottom: "1px solid #1e293b" }}>
                <span className="text-[13px] font-semibold" style={{ color: "#94a3b8" }}>
                  🏆 En İyi Üyeler
                </span>
              </div>
              <div>
                {topUsers.map((user, idx) => (
                  <div
                    key={user.id}
                    className="px-4 py-2.5 flex items-center gap-2.5 transition-colors duration-150 hover:bg-bg-hover"
                    style={{
                      borderBottom: idx < topUsers.length - 1 ? "1px solid #1e293b" : undefined,
                    }}
                  >
                    <span className="text-xs font-bold flex-shrink-0" style={{ color: "#e8a935", width: "16px" }}>
                      {idx + 1}
                    </span>
                    <div
                      className="flex-shrink-0 flex items-center justify-center rounded-full text-[10px] font-bold"
                      style={{ width: "24px", height: "24px", backgroundColor: `${BRAND.accent}30`, color: BRAND.accent }}
                    >
                      {user.username.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/profil/${user.username}`}
                        className="text-xs font-medium truncate block transition-colors duration-150 hover:text-accent-green"
                        style={{ color: "#e2e8f0" }}
                      >
                        {user.username}
                      </Link>
                      <div className="text-[11px]" style={{ color: "#64748b" }}>
                        {user.rank ? `${user.rank.icon} ${user.rank.name}` : ""} · {user.reputation} itibar
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Son Kuponlar */}
            <div style={{ backgroundColor: "#131820", border: "1px solid #1e293b", borderRadius: "12px", overflow: "hidden" }}>
              <div className="px-4 py-3" style={{ borderBottom: "1px solid #1e293b" }}>
                <span className="text-[13px] font-semibold" style={{ color: "#94a3b8" }}>
                  🎯 Son Kuponlar
                </span>
              </div>
              <div>
                {recentKuponThreads.length === 0 ? (
                  <div className="px-4 py-4 text-center text-xs" style={{ color: "#64748b" }}>
                    Henüz kupon paylaşımı yok
                  </div>
                ) : (
                  recentKuponThreads.map((thread, idx) => (
                    <div
                      key={thread.id}
                      className="px-4 py-2.5 transition-colors duration-150 hover:bg-bg-hover"
                      style={{
                        borderBottom: idx < recentKuponThreads.length - 1 ? "1px solid #1e293b" : undefined,
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        {thread.prefix && (
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{
                              border: `1px solid ${thread.prefix.color}`,
                              color: thread.prefix.color,
                            }}
                          >
                            {thread.prefix.label}
                          </span>
                        )}
                        <Link
                          href={`/konu/${thread.slug}`}
                          className="text-xs font-medium truncate transition-colors duration-150 hover:text-accent-green"
                          style={{ color: "#e2e8f0" }}
                        >
                          {thread.title}
                        </Link>
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>
                        {thread.author.username} · {thread.createdAt.toLocaleDateString("tr-TR")}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Son Haberler */}
            <div style={{ backgroundColor: "#131820", border: "1px solid #1e293b", borderRadius: "12px", overflow: "hidden" }}>
              <div className="px-4 py-3" style={{ borderBottom: "1px solid #1e293b" }}>
                <span className="text-[13px] font-semibold" style={{ color: "#94a3b8" }}>📰 Son Haberler</span>
              </div>
              <div>
                {latestNews.length === 0 ? (
                  <div className="px-4 py-4 text-center text-xs" style={{ color: "#64748b" }}>
                    Henüz haber yok
                  </div>
                ) : (
                  latestNews.map((news, idx) => (
                    <div
                      key={news.id}
                      className="px-4 py-2.5 transition-colors duration-150 hover:bg-bg-hover"
                      style={{
                        borderBottom: idx < latestNews.length - 1 ? "1px solid #1e293b" : undefined,
                      }}
                    >
                      <Link
                        href={`/haberler/${news.slug}`}
                        className="text-xs font-medium block truncate transition-colors duration-150 hover:text-accent-green"
                        style={{ color: "#e2e8f0" }}
                      >
                        {news.title}
                      </Link>
                      <div className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>
                        {NEWS_CATEGORY_ICONS[news.category] ?? "📰"} {newsRelativeTime(news.createdAt)}
                      </div>
                    </div>
                  ))
                )}
                <Link
                  href="/haberler"
                  className="block px-4 py-2 text-center text-[12px] font-medium transition-colors hover:bg-bg-hover"
                  style={{ color: BRAND.accent, borderTop: "1px solid #1e293b" }}
                >
                  Tüm Haberler →
                </Link>
              </div>
            </div>

            {/* Çevrimiçi Üyeler */}
            <div style={{ backgroundColor: "#131820", border: "1px solid #1e293b", borderRadius: "12px", overflow: "hidden" }}>
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid #1e293b" }}>
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: BRAND.accent }} />
                <span className="text-[13px] font-semibold" style={{ color: "#94a3b8" }}>
                  Çevrimiçi Üyeler ({onlineUsers})
                </span>
              </div>
              <div className="p-3 flex flex-wrap gap-1.5">
                {onlineUsersList.map((user) => (
                  <Link
                    key={user.id}
                    href={`/profil/${user.username}`}
                    className="text-[11px] px-2 py-1 rounded-md transition-colors duration-150 hover:bg-bg-hover"
                    style={{ color: BRAND.accent, backgroundColor: `${BRAND.accent}15` }}
                  >
                    {user.username}
                  </Link>
                ))}
                {onlineUsersList.length === 0 && (
                  <span className="text-xs" style={{ color: "#64748b" }}>Şu an kimse çevrimiçi değil</span>
                )}
              </div>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}
