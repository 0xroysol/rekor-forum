import prisma from "@/lib/prisma";

interface UserStatsProps {
  userId: string;
}

export default async function UserStats({ userId }: UserStatsProps) {
  const [postCount, threadCount, reactionsData, predictionsData, user] =
    await Promise.all([
      prisma.post.count({ where: { authorId: userId } }),
      prisma.thread.count({ where: { authorId: userId } }),
      prisma.reaction.groupBy({
        by: ["emoji"],
        where: { post: { authorId: userId } },
        _count: { emoji: true },
      }),
      prisma.prediction.aggregate({
        where: { userId },
        _sum: { points: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true },
      }),
    ]);

  const totalReactions = reactionsData.reduce(
    (sum, r) => sum + r._count.emoji,
    0
  );
  const predictionPoints = predictionsData._sum.points ?? 0;

  // Calculate prediction rank
  let predictionRank = 0;
  if (predictionPoints > 0) {
    predictionRank = await prisma.user.count({
      where: {
        predictions: {
          some: {},
        },
      },
    });
    // Simplified: count users with more points
    const usersAbove = await prisma.prediction.groupBy({
      by: ["userId"],
      _sum: { points: true },
      having: {
        points: { _sum: { gt: predictionPoints } },
      },
    });
    predictionRank = usersAbove.length + 1;
  }

  // Member since
  const memberSince = user?.createdAt ?? new Date();
  const now = new Date();
  const diffMs = now.getTime() - memberSince.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  let memberSinceText: string;
  if (diffDays < 30) {
    memberSinceText = `${diffDays} gun`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    memberSinceText = `${months} ay`;
  } else {
    const years = Math.floor(diffDays / 365);
    const remainingMonths = Math.floor((diffDays % 365) / 30);
    memberSinceText =
      remainingMonths > 0
        ? `${years} yil ${remainingMonths} ay`
        : `${years} yil`;
  }

  return (
    <div
      className="mt-4 rounded-xl border border-[#1e293b] bg-[#131820] p-4"
    >
      <h2 className="text-sm font-semibold text-[#e2e8f0] mb-3">
        Istatistikler
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
        <div className="flex flex-col items-center gap-0.5 rounded-lg bg-[#0d1017] px-3 py-2.5">
          <span className="text-lg font-bold text-[#e2e8f0]">{postCount}</span>
          <span className="text-xs text-[#64748b]">Mesaj</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 rounded-lg bg-[#0d1017] px-3 py-2.5">
          <span className="text-lg font-bold text-[#e2e8f0]">{threadCount}</span>
          <span className="text-xs text-[#64748b]">Konu</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 rounded-lg bg-[#0d1017] px-3 py-2.5">
          <span className="text-lg font-bold text-[#e2e8f0]">{totalReactions}</span>
          <span className="text-xs text-[#64748b]">Tepki</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 rounded-lg bg-[#0d1017] px-3 py-2.5">
          <span className="text-lg font-bold text-[#e2e8f0]">{memberSinceText}</span>
          <span className="text-xs text-[#64748b]">Uyelik</span>
        </div>
      </div>

      {/* Reaction Breakdown */}
      {reactionsData.length > 0 && (
        <div className="mb-4">
          <span className="text-xs text-[#64748b] mb-1.5 block">Alinan Tepkiler</span>
          <div className="flex flex-wrap gap-2">
            {reactionsData
              .sort((a, b) => b._count.emoji - a._count.emoji)
              .map((r) => (
                <div
                  key={r.emoji}
                  className="flex items-center gap-1 rounded-full bg-[#0d1017] px-2.5 py-1 text-sm"
                >
                  <span>{r.emoji}</span>
                  <span className="text-xs text-[#94a3b8]">{r._count.emoji}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Prediction Rank */}
      {predictionPoints > 0 && (
        <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
          <span>Tahmin Puani: {predictionPoints}</span>
          <span className="text-[#64748b]">·</span>
          <span>Sira: {predictionRank}</span>
        </div>
      )}
    </div>
  );
}
