import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { ReplyForm, PostActions, ViewCounter } from "@/components/thread-interactions";
import { ReactionBar } from "@/components/reactions";
import { PollCard } from "@/components/poll-card";
import { BookmarkButton } from "@/components/bookmark-button";
import ModDropdown from "@/components/mod-dropdown";
import ReportModal from "@/components/report-modal";
import { createClient } from "@/lib/supabase/server";
import { renderPostContent } from "@/components/editor/sanitize";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const thread = await prisma.thread.findUnique({
    where: { slug },
    include: { posts: { take: 1, orderBy: { createdAt: "asc" } } },
  });
  if (!thread) return { title: "Konu Bulunamadı - Rekor Forum" };
  const desc = thread.posts[0]?.content.slice(0, 160) || "";
  return {
    title: `${thread.title} - Rekor Forum`,
    description: desc,
    openGraph: { title: `${thread.title} - Rekor Forum`, description: desc, siteName: "Rekor Forum" },
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
      return { label: "Moderatör", color: "#e8a935" };
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
      tags: { include: { tag: true } },
      poll: {
        include: {
          options: {
            include: { _count: { select: { votes: true } } },
            orderBy: { position: "asc" as const },
          },
          votes: true,
        },
      },
      posts: {
        include: {
          author: {
            include: {
              rank: true,
              badges: { include: { badge: true } },
            },
          },
          reactions: { include: { user: { select: { username: true } } } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!thread) {
    notFound();
  }

  // Get current user for reaction highlighting
  let currentUserId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const dbUser = await prisma.user.findUnique({ where: { email: user.email! }, select: { id: true } });
      currentUserId = dbUser?.id || null;
    }
  } catch {}

  return (
    <div className="mx-auto max-w-7xl px-5 py-5">
      {/* View Counter (client) */}
      <ViewCounter threadSlug={slug} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-[#64748b] mb-5">
        <Link href="/" className="hover:text-[#e2e8f0] transition-colors">
          Forum
        </Link>
        <span>›</span>
        {thread.category.parent && (
          <>
            <span>{thread.category.parent.name}</span>
            <span>›</span>
          </>
        )}
        <Link
          href={`/forum/${thread.category.slug}`}
          className="hover:text-[#e2e8f0] transition-colors"
        >
          {thread.category.name}
        </Link>
        <span>›</span>
        <span className="text-[#94a3b8] truncate max-w-xs">{thread.title}</span>
      </nav>

      {/* Casino Warning */}
      {thread.category.isCasino && (
        <div className="mb-5 rounded-xl bg-[#131820] border-l-2 border-[#ef4444] px-4 py-3">
          <p className="text-[#94a3b8] text-sm">
            <span className="font-semibold text-[#e2e8f0]">18+ Sorumlu Oyun</span>
            {" — "}
            Bu bölüm casino ve bahis içerikleri içermektedir. Kumar bağımlılık
            yapabilir. 18 yaşından küçükseniz bu bölümü terk ediniz.
          </p>
        </div>
      )}

      {/* Thread Title Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 flex-wrap">
            {thread.isPinned && <span title="Sabitlenmiş">📌</span>}
            {thread.isLocked && <span title="Kilitli">🔒</span>}
            {thread.replyCount > 20 && <span title="Sıcak Konu">🔥</span>}
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
            <h1 className="text-xl font-bold text-[#e2e8f0]">{thread.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ReportModal type="thread" targetId={thread.id} />
            <BookmarkButton threadId={thread.id} />
            <ModDropdown
              threadId={thread.id}
              isPinned={thread.isPinned}
              isLocked={thread.isLocked}
              isFeatured={thread.isFeatured}
              categoryId={thread.categoryId}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-[#64748b]">
          <span>
            Yazan:{" "}
            <Link href={`/profil/${thread.author.username}`} className="text-[#94a3b8] hover:underline">
              {thread.author.username}
            </Link>
          </span>
          <span>&middot;</span>
          <span>{formatDate(thread.createdAt)}</span>
          <span>&middot;</span>
          <span>{thread.viewCount.toLocaleString("tr-TR")} görüntülenme</span>
          <span>&middot;</span>
          <span>{thread.replyCount} yanıt</span>
        </div>
        {/* Tags */}
        {thread.tags.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            {thread.tags.map((tt) => (
              <Link
                key={tt.tag.id}
                href={`/ara?tag=${encodeURIComponent(tt.tag.name)}`}
                className="px-2 py-0.5 rounded-md text-[11px] transition-colors hover:bg-[#1e2738]"
                style={{ backgroundColor: "#1a2130", color: "#64748b" }}
              >
                #{tt.tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Poll */}
      {thread.poll && (
        <div className="mb-5">
          <PollCard
            poll={{
              id: thread.poll.id,
              question: thread.poll.question,
              endsAt: thread.poll.endsAt ? thread.poll.endsAt.toISOString() : null,
              options: thread.poll.options,
            }}
            totalVotes={thread.poll.options.reduce(
              (sum: number, o: { _count: { votes: number } }) => sum + o._count.votes,
              0
            )}
            userVotedOptionId={
              currentUserId
                ? thread.poll.votes.find(
                    (v: { userId: string; optionId: string }) => v.userId === currentUserId
                  )?.optionId ?? null
                : null
            }
          />
        </div>
      )}

      {/* Posts */}
      <div className="space-y-3">
        {thread.posts.map((post, idx) => {
          const roleBadge = getRoleBadge(post.author.role);
          // Build reaction data for ReactionBar
          const emojiMap = new Map<string, { count: number; users: string[] }>();
          for (const r of post.reactions) {
            const entry = emojiMap.get(r.emoji) || { count: 0, users: [] };
            entry.count++;
            if (r.user?.username) entry.users.push(r.user.username);
            emojiMap.set(r.emoji, entry);
          }
          const initialReactions = Array.from(emojiMap.entries()).map(([emoji, data]) => ({
            emoji,
            count: data.count,
            users: data.users,
          }));
          const initialUserReactions = currentUserId
            ? post.reactions.filter((r) => r.userId === currentUserId).map((r) => r.emoji)
            : [];
          const isDeleted = post.content === "[Bu mesaj bir moderatör tarafından silindi.]";

          return (
            <article
              key={post.id}
              className="rounded-xl border border-[#1e293b] overflow-hidden"
            >
              <div className="flex flex-col md:flex-row">
                {/* Author Panel */}
                {!isDeleted && (
                  <div className="md:w-44 flex-shrink-0 bg-[#1a2130] p-4 flex flex-row md:flex-col items-center md:items-center gap-3 md:gap-2 border-b md:border-b-0 md:border-r border-[#1e293b]">
                    <div className="w-12 h-12 rounded-full bg-[#131820] flex items-center justify-center text-lg font-bold text-[#1f844e] flex-shrink-0">
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
                      <Link href={`/profil/${post.author.username}`} className="text-[#e2e8f0] font-semibold text-sm hover:underline">
                        {post.author.displayName || post.author.username}
                      </Link>

                      {roleBadge && (
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 border bg-transparent"
                          style={{ borderColor: roleBadge.color, color: roleBadge.color }}
                        >
                          {roleBadge.label}
                        </span>
                      )}

                      {post.author.rank && (
                        <div className="mt-1 text-xs" style={{ color: post.author.rank.color }}>
                          {post.author.rank.icon} {post.author.rank.name}
                        </div>
                      )}

                      {post.author.badges.length > 0 && (
                        <div className="flex items-center justify-center gap-1 mt-1 flex-wrap">
                          {post.author.badges.slice(0, 3).map((ub) => (
                            <span key={ub.id} className="text-sm" title={ub.badge.name}>
                              {ub.badge.icon}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-2 text-[11px] text-[#64748b] space-y-0.5 hidden md:block">
                        <div>Mesaj: {post.author.postCount}</div>
                        <div>
                          Katılım:{" "}
                          {post.author.createdAt.toLocaleDateString("tr-TR", {
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Post Content */}
                <div className="flex-1 flex flex-col bg-[#131820]">
                  {/* Post Header */}
                  <div className="px-4 py-2 border-b border-[#1e293b] flex items-center justify-between">
                    <span className="text-xs text-[#64748b]">
                      {idx === 0 ? "Konu Başlangıcı" : `#${idx + 1}`}{" "}
                      &middot; {formatDate(post.createdAt)}
                      {post.editedAt && (
                        <span className="ml-2 text-[10px]">(düzenlendi)</span>
                      )}
                    </span>
                    <div className="flex items-center gap-1">
                      <ReportModal type="post" targetId={post.id} />
                      <PostActions
                        postId={post.id}
                        postContent={post.content}
                        authorId={post.authorId}
                        authorUsername={post.author.username}
                        isFirstPost={idx === 0}
                      />
                    </div>
                  </div>

                  {/* Post Body */}
                  {isDeleted ? (
                    <div className="px-4 py-4 flex-1 text-sm leading-relaxed text-[#64748b] italic">
                      {post.content}
                    </div>
                  ) : (
                    <div
                      className="px-4 py-4 flex-1 text-sm leading-relaxed text-[#94a3b8] prose-forum"
                      dangerouslySetInnerHTML={{ __html: renderPostContent(post.content) }}
                    />
                  )}

                  {/* Reactions */}
                  {!isDeleted && (
                    <div className="px-4 py-2.5 border-t border-[#1e293b]">
                      <ReactionBar
                        postId={post.id}
                        initialReactions={initialReactions}
                        initialUserReactions={initialUserReactions}
                      />
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Reply Form (client component) */}
      <ReplyForm threadId={thread.id} isLocked={thread.isLocked} />
    </div>
  );
}
