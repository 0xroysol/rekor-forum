import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { ProfileEditButton } from "@/components/profile-edit";
import SendMessageButton from "@/components/send-message-button";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.user.findUnique({ where: { username }, select: { username: true, displayName: true, bio: true } });
  if (!user) return { title: "Kullanıcı Bulunamadı - Rekor Forum" };
  const name = user.displayName || user.username;
  return {
    title: `${name} - Rekor Forum Profil`,
    description: user.bio || `${name} Rekor Forum üyesi`,
    openGraph: { title: `${name} - Rekor Forum`, siteName: "Rekor Forum" },
  };
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

const roleColors: Record<string, string> = {
  ADMIN: "border-[#ef4444] text-[#ef4444]",
  MOD: "border-[#e8a935] text-[#e8a935]",
  USER: "border-[#1f844e] text-[#1f844e]",
};

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  MOD: "Moderator",
  USER: "Uye",
};

export default async function ProfilPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      rank: true,
      badges: {
        include: { badge: true },
        orderBy: { earnedAt: "desc" },
      },
      threads: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          category: true,
          prefix: true,
        },
      },
      posts: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          thread: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const threadCount = await prisma.thread.count({
    where: { authorId: user.id },
  });
  const postCountTotal = await prisma.post.count({
    where: { authorId: user.id },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Profile Header */}
      <div className="rounded-xl border border-[#1e293b] bg-[#131820] p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0d1017] ring-2 ring-[#1e293b]">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-[#e2e8f0]">
                  {user.username.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            {/* Online indicator */}
            <span
              className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#131820] ${
                user.isOnline ? "bg-[#1f844e]" : "bg-[#64748b]"
              }`}
            />
          </div>

          <div className="flex flex-1 flex-col gap-2 text-center sm:text-left">
            <div className="flex flex-col items-center gap-2 sm:flex-row">
              <h1 className="text-2xl font-bold text-[#e2e8f0]">
                {user.displayName || user.username}
              </h1>
              <span className="text-sm text-[#64748b]">@{user.username}</span>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleColors[user.role]}`}
              >
                {roleLabels[user.role]}
              </span>
            </div>

            {user.title && (
              <p className="text-sm text-[#e8a935]">{user.title}</p>
            )}

            {user.rank && (
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{user.rank.icon}</span>
                <span
                  className="text-sm font-medium"
                  style={{ color: user.rank.color }}
                >
                  {user.rank.name}
                </span>
              </div>
            )}

            {user.bio && (
              <p className="mt-1 text-sm text-[#94a3b8]">{user.bio}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <SendMessageButton username={user.username} />
              <ProfileEditButton
                username={user.username}
                currentDisplayName={user.displayName}
                currentBio={user.bio}
                currentAvatar={user.avatar}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#64748b]">
                {user.isOnline
                  ? "Çevrimiçi"
                  : `Son görülen: ${formatDate(user.lastSeen)}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Mesaj", value: postCountTotal },
          { label: "Konu", value: threadCount },
          { label: "Itibar", value: user.reputation },
          { label: "Puan", value: user.points },
          { label: "Katilim", value: formatDate(user.createdAt) },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-0.5 rounded-xl border border-[#1e293b] bg-[#131820] px-3 py-3"
          >
            <span className="text-lg font-bold text-[#e2e8f0]">
              {stat.value}
            </span>
            <span className="text-xs text-[#64748b]">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Badges Section */}
      {user.badges.length > 0 && (
        <div className="mt-4 rounded-xl border border-[#1e293b] bg-[#131820]">
          <div className="border-b border-[#1e293b] bg-[#1a2130] px-5 py-3">
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Rozetler</h2>
          </div>
          <div className="flex flex-wrap gap-2 p-5">
            {user.badges.map((ub) => (
              <div
                key={ub.id}
                className="flex items-center gap-1.5 rounded-full border border-[#1e293b] bg-[#0d1017] px-3 py-1.5"
                title={ub.badge.description}
              >
                <span className="text-sm">{ub.badge.icon}</span>
                <span className="text-xs text-[#e2e8f0]">
                  {ub.badge.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Sections */}
      <div className="mt-6 space-y-6">
        {/* Konular */}
        <div className="rounded-xl border border-[#1e293b] bg-[#131820]">
          <div className="border-b border-[#1e293b] bg-[#1a2130] px-5 py-3">
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Konular</h2>
          </div>
          <div className="p-4">
            {user.threads.length === 0 ? (
              <p className="text-sm text-[#64748b]">Henuz konu acilmamis.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {user.threads.map((thread) => (
                  <div
                    key={thread.id}
                    className="flex items-center justify-between rounded-md bg-[#0d1017] px-4 py-3"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {thread.prefix && (
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: `${thread.prefix.color}20`,
                              color: thread.prefix.color,
                            }}
                          >
                            {thread.prefix.label}
                          </span>
                        )}
                        <span className="text-sm font-medium text-[#e2e8f0]">
                          {thread.title}
                        </span>
                      </div>
                      <span className="text-xs text-[#64748b]">
                        {thread.category.name} &middot;{" "}
                        {formatDate(thread.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#64748b]">
                      <span>{thread.viewCount} goruntulenme</span>
                      <span>{thread.replyCount} cevap</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Son Mesajlar */}
        <div className="rounded-xl border border-[#1e293b] bg-[#131820]">
          <div className="border-b border-[#1e293b] bg-[#1a2130] px-5 py-3">
            <h2 className="text-sm font-semibold text-[#e2e8f0]">
              Son Mesajlar
            </h2>
          </div>
          <div className="p-4">
            {user.posts.length === 0 ? (
              <p className="text-sm text-[#64748b]">Henuz mesaj yok.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {user.posts.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-md bg-[#0d1017] px-4 py-3"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs text-[#1f844e]">
                        {post.thread.title}
                      </span>
                      <span className="text-xs text-[#64748b]">
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-[#94a3b8]">
                      {post.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hakkinda */}
        <div className="rounded-xl border border-[#1e293b] bg-[#131820]">
          <div className="border-b border-[#1e293b] bg-[#1a2130] px-5 py-3">
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Hakkinda</h2>
          </div>
          <div className="p-5">
            <p className="text-sm text-[#94a3b8]">
              {user.bio || "Kullanici hakkinda bilgi bulunmuyor."}
            </p>
            <div className="my-4 border-t border-[#1e293b]" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#64748b]">Katilim Tarihi</span>
                <p className="text-[#94a3b8]">{formatDate(user.createdAt)}</p>
              </div>
              <div>
                <span className="text-[#64748b]">Son Gorulen</span>
                <p className="text-[#94a3b8]">{formatDate(user.lastSeen)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
