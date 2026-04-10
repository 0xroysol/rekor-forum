import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import { BRAND } from "@/config/brand";

export const metadata: Metadata = {
  title: `Takip Ettiklerim | ${BRAND.name}`,
};

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

export default async function TakipEttiklerimPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
  });

  if (!dbUser) {
    redirect("/giris");
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: dbUser.id },
    include: {
      thread: {
        include: {
          author: true,
          prefix: true,
          category: true,
          _count: { select: { posts: true } },
        },
      },
    },
    orderBy: { thread: { lastPostAt: "desc" } },
  });

  const threads = bookmarks.map((b) => b.thread);

  return (
    <div className="mx-auto max-w-7xl px-5 py-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-[#64748b] mb-5">
        <Link href="/" className="hover:text-[#e2e8f0] transition-colors">
          Forum
        </Link>
        <span className="text-[#64748b]">&rsaquo;</span>
        <span className="text-[#94a3b8]">Takip Ettiklerim</span>
      </nav>

      {/* Page Header */}
      <div className="border border-[#1e293b] bg-[#131820] p-4 mb-4 flex items-center gap-3" style={{ borderRadius: "12px" }}>
        <div className="w-9 h-9 rounded-md bg-[#1a2130] flex items-center justify-center text-lg">
          &#128065;
        </div>
        <div>
          <h1 className="text-lg font-semibold text-[#e2e8f0]">Takip Ettiklerim</h1>
          <p className="text-[#94a3b8] text-sm mt-0.5">
            {threads.length} takip edilen konu
          </p>
        </div>
      </div>

      {/* Thread List */}
      <div className="overflow-hidden border border-[#1e293b]" style={{ borderRadius: "12px" }}>
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2.5 bg-[#1a2130]">
          <div className="col-span-6 text-xs text-[#64748b] uppercase tracking-wide font-medium">
            Konu
          </div>
          <div className="col-span-2 text-center text-xs text-[#64748b] uppercase tracking-wide font-medium hidden md:block">
            Yanit
          </div>
          <div className="col-span-2 text-center text-xs text-[#64748b] uppercase tracking-wide font-medium hidden md:block">
            Goruntuleme
          </div>
          <div className="col-span-2 text-right text-xs text-[#64748b] uppercase tracking-wide font-medium hidden lg:block">
            Son Mesaj
          </div>
        </div>

        {/* Threads */}
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
                  {thread.author.username} · {thread.category?.name} · {thread.createdAt.toLocaleDateString("tr-TR")}
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
              {thread.lastPostAt.toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {threads.length === 0 && (
          <div className="px-4 py-12 text-center text-[#64748b] text-sm bg-[#131820]">
            Henuz takip ettiginiz konu yok.
          </div>
        )}
      </div>
    </div>
  );
}
