import Link from "next/link";
import prisma from "@/lib/prisma";

export default async function Home() {
  const [categories, totalThreads, totalPosts, onlineUsers, recentThreads, popularThreads] =
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
      prisma.thread.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { author: true, category: true },
      }),
      prisma.thread.findMany({
        orderBy: { viewCount: "desc" },
        take: 5,
        include: { author: true },
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

  // Also fetch top-level categories that have no children (standalone)
  const parentCategories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { position: "asc" },
  });

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
            <Link href="/forum" className="hover:text-white transition-colors">
              Forumlar
            </Link>
            <Link href="/konu/olustur" className="hover:text-white transition-colors">
              Yeni Konu
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex gap-6">
          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {Array.from(grouped.values()).map((group) => (
              <section key={group.parent.id} className="mb-6 rounded-lg overflow-hidden">
                {/* Parent category header */}
                <div
                  className="px-4 py-3 flex items-center gap-2"
                  style={{ backgroundColor: group.parent.color }}
                >
                  <span className="text-lg">{group.parent.icon}</span>
                  <h2 className="text-white font-bold text-sm uppercase tracking-wide">
                    {group.parent.name}
                  </h2>
                </div>

                {/* Sub-categories */}
                <div style={{ backgroundColor: "#0d1017" }}>
                  {group.children.map((cat, idx) => {
                    const lastThread = cat.threads[0];
                    const postCount = cat._count.threads * 12; // approximate
                    return (
                      <div
                        key={cat.id}
                        className={`flex items-center gap-4 px-4 py-3 ${
                          idx < group.children.length - 1 ? "border-b border-white/5" : ""
                        }`}
                        style={{ backgroundColor: "#131820" }}
                      >
                        {/* Icon */}
                        <div
                          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                          style={{ backgroundColor: cat.color + "20" }}
                        >
                          {cat.icon}
                        </div>

                        {/* Name & Description */}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/forum/${cat.slug}`}
                            className="text-white font-semibold hover:underline text-sm"
                          >
                            {cat.name}
                          </Link>
                          <p className="text-white/40 text-xs mt-0.5 truncate">
                            {cat.description}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="hidden md:flex items-center gap-6 text-xs text-white/50">
                          <div className="text-center w-16">
                            <div className="text-white font-semibold">
                              {cat._count.threads}
                            </div>
                            <div>Konu</div>
                          </div>
                          <div className="text-center w-16">
                            <div className="text-white font-semibold">
                              {postCount}
                            </div>
                            <div>Mesaj</div>
                          </div>
                        </div>

                        {/* Last thread */}
                        <div className="hidden lg:block w-48 text-xs">
                          {lastThread ? (
                            <div>
                              <Link
                                href={`/konu/${lastThread.slug}`}
                                className="text-white/70 hover:text-white truncate block"
                              >
                                {lastThread.title}
                              </Link>
                              <div className="text-white/40 mt-0.5">
                                {lastThread.author.username} &middot;{" "}
                                {lastThread.lastPostAt.toLocaleDateString("tr-TR")}
                              </div>
                            </div>
                          ) : (
                            <span className="text-white/30">Henuz konu yok</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

            {/* Show standalone parent categories with no children */}
            {parentCategories
              .filter((p) => !grouped.has(p.id))
              .map((cat) => (
                <section key={cat.id} className="mb-6 rounded-lg overflow-hidden">
                  <div
                    className="px-4 py-3 flex items-center gap-2"
                    style={{ backgroundColor: cat.color }}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <h2 className="text-white font-bold text-sm uppercase tracking-wide">
                      {cat.name}
                    </h2>
                  </div>
                  <div
                    className="px-4 py-6 text-center text-white/30 text-sm"
                    style={{ backgroundColor: "#131820" }}
                  >
                    Bu kategoride henuz alt forum bulunmuyor.
                  </div>
                </section>
              ))}
          </main>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-72 flex-shrink-0 space-y-4">
            {/* Forum Stats */}
            <div className="rounded-lg overflow-hidden">
              <div
                className="px-4 py-2.5 font-bold text-sm text-white uppercase tracking-wide"
                style={{ backgroundColor: "#1f844e" }}
              >
                Forum Istatistikleri
              </div>
              <div className="p-4 space-y-3" style={{ backgroundColor: "#131820" }}>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Cevrimici Uye</span>
                  <span className="font-semibold" style={{ color: "#1f844e" }}>
                    {onlineUsers}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Toplam Konu</span>
                  <span className="text-white font-semibold">{totalThreads}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Toplam Mesaj</span>
                  <span className="text-white font-semibold">{totalPosts}</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-lg overflow-hidden">
              <div
                className="px-4 py-2.5 font-bold text-sm text-white uppercase tracking-wide"
                style={{ backgroundColor: "#e8a935" }}
              >
                Son Aktivite
              </div>
              <div className="divide-y divide-white/5" style={{ backgroundColor: "#131820" }}>
                {recentThreads.map((thread) => (
                  <div key={thread.id} className="px-4 py-2.5">
                    <Link
                      href={`/konu/${thread.slug}`}
                      className="text-white/80 hover:text-white text-xs font-medium block truncate"
                    >
                      {thread.title}
                    </Link>
                    <div className="text-white/40 text-[11px] mt-0.5">
                      {thread.author.username} &middot;{" "}
                      {thread.category.name}
                    </div>
                  </div>
                ))}
                {recentThreads.length === 0 && (
                  <div className="px-4 py-4 text-white/30 text-xs text-center">
                    Henuz aktivite yok
                  </div>
                )}
              </div>
            </div>

            {/* Popular Threads */}
            <div className="rounded-lg overflow-hidden">
              <div
                className="px-4 py-2.5 font-bold text-sm uppercase tracking-wide"
                style={{ backgroundColor: "#ef4444", color: "white" }}
              >
                Populer Konular
              </div>
              <div className="divide-y divide-white/5" style={{ backgroundColor: "#131820" }}>
                {popularThreads.map((thread, i) => (
                  <div key={thread.id} className="px-4 py-2.5 flex items-start gap-2">
                    <span
                      className="text-xs font-bold mt-0.5 flex-shrink-0"
                      style={{ color: "#e8a935" }}
                    >
                      #{i + 1}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/konu/${thread.slug}`}
                        className="text-white/80 hover:text-white text-xs font-medium block truncate"
                      >
                        {thread.title}
                      </Link>
                      <div className="text-white/40 text-[11px] mt-0.5">
                        {thread.viewCount.toLocaleString("tr-TR")} goruntulenme
                      </div>
                    </div>
                  </div>
                ))}
                {popularThreads.length === 0 && (
                  <div className="px-4 py-4 text-white/30 text-xs text-center">
                    Henuz konu yok
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
