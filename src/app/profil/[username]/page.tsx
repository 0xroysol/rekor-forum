import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-[#ef4444]/20 text-[#ef4444]",
  MOD: "bg-[#e8a935]/20 text-[#e8a935]",
  USER: "bg-[#1f844e]/20 text-[#1f844e]",
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
    <div className="min-h-screen bg-[#080a0f]">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Profile Header */}
        <Card className="border-none bg-[#131820] ring-white/5">
          <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <Avatar className="!h-24 !w-24 ring-2 ring-[#1f844e]/50">
              {user.avatar ? (
                <AvatarImage src={user.avatar} alt={user.username} />
              ) : null}
              <AvatarFallback className="bg-[#0d1017] text-2xl text-white">
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-1 flex-col gap-2 text-center sm:text-left">
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                <h1 className="text-2xl font-bold text-white">
                  {user.displayName || user.username}
                </h1>
                <span className="text-sm text-gray-500">@{user.username}</span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[user.role]}`}
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
                <p className="mt-1 text-sm text-gray-400">{user.bio}</p>
              )}
            </div>

            {/* Online status */}
            <div className="flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  user.isOnline ? "bg-[#1f844e]" : "bg-gray-500"
                }`}
              />
              <span className="text-xs text-gray-400">
                {user.isOnline
                  ? "Cevrimici"
                  : `Son gorulen: ${formatDate(user.lastSeen)}`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Mesaj", value: postCountTotal },
            { label: "Konu", value: threadCount },
            { label: "Itibar", value: user.reputation },
            { label: "Puan", value: user.points },
            { label: "Katilim", value: formatDate(user.createdAt) },
          ].map((stat) => (
            <Card
              key={stat.label}
              className="border-none bg-[#131820] ring-white/5"
              size="sm"
            >
              <CardContent className="flex flex-col items-center gap-0.5 py-1">
                <span className="text-lg font-bold text-white">
                  {stat.value}
                </span>
                <span className="text-xs text-gray-500">{stat.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Badges Section */}
        {user.badges.length > 0 && (
          <Card className="mt-4 border-none bg-[#131820] ring-white/5">
            <CardHeader>
              <CardTitle className="text-white">Rozetler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.badges.map((ub) => (
                  <div
                    key={ub.id}
                    className="flex items-center gap-1.5 rounded-lg bg-[#0d1017] px-3 py-2"
                    title={ub.badge.description}
                  >
                    <span className="text-base">{ub.badge.icon}</span>
                    <span className="text-sm text-gray-300">
                      {ub.badge.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Tabs (static, no client interactivity needed) */}
        <div className="mt-6 space-y-6">
          {/* Konular (User Threads) */}
          <Card className="border-none bg-[#131820] ring-white/5">
            <CardHeader>
              <CardTitle className="text-white">Konular</CardTitle>
            </CardHeader>
            <CardContent>
              {user.threads.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Henuz konu acilmamis.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {user.threads.map((thread) => (
                    <div
                      key={thread.id}
                      className="flex items-center justify-between rounded-lg bg-[#0d1017] px-4 py-3"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {thread.prefix && (
                            <Badge
                              className="text-xs"
                              style={{
                                backgroundColor: `${thread.prefix.color}20`,
                                color: thread.prefix.color,
                              }}
                            >
                              {thread.prefix.label}
                            </Badge>
                          )}
                          <span className="text-sm font-medium text-white">
                            {thread.title}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {thread.category.name} &middot;{" "}
                          {formatDate(thread.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{thread.viewCount} goruntulenme</span>
                        <span>{thread.replyCount} cevap</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mesajlar (User Posts) */}
          <Card className="border-none bg-[#131820] ring-white/5">
            <CardHeader>
              <CardTitle className="text-white">Son Mesajlar</CardTitle>
            </CardHeader>
            <CardContent>
              {user.posts.length === 0 ? (
                <p className="text-sm text-gray-500">Henuz mesaj yok.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {user.posts.map((post) => (
                    <div
                      key={post.id}
                      className="rounded-lg bg-[#0d1017] px-4 py-3"
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-xs text-[#1f844e]">
                          {post.thread.title}
                        </span>
                        <span className="text-xs text-gray-600">
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm text-gray-300">
                        {post.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hakkinda (Bio) */}
          <Card className="border-none bg-[#131820] ring-white/5">
            <CardHeader>
              <CardTitle className="text-white">Hakkinda</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                {user.bio || "Kullanici hakkinda bilgi bulunmuyor."}
              </p>
              <Separator className="my-4 bg-white/5" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Katilim Tarihi</span>
                  <p className="text-gray-300">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Son Gorulen</span>
                  <p className="text-gray-300">
                    {formatDate(user.lastSeen)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
