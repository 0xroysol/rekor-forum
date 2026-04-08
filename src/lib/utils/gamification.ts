import prisma from "@/lib/prisma";

// ── Rank Definitions ──
const RANK_THRESHOLDS = [
  { name: "Çaylak",     icon: "🌱", color: "#6b7280", minPosts: 0 },
  { name: "Üye",        icon: "⚡", color: "#3b82f6", minPosts: 10 },
  { name: "Aktif Üye",  icon: "🔥", color: "#8b5cf6", minPosts: 50 },
  { name: "Uzman",      icon: "⭐", color: "#f59e0b", minPosts: 150 },
  { name: "Efsane",     icon: "👑", color: "#ef4444", minPosts: 500 },
];

const SPECIAL_RANKS = ["VIP", "Moderatör", "Admin"];

export async function updateUserRank(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { rank: true },
  });
  if (!user) return false;

  // Don't change special ranks
  if (user.rank && SPECIAL_RANKS.includes(user.rank.name)) {
    return false;
  }

  // Find appropriate rank based on postCount
  let targetRankName = RANK_THRESHOLDS[0].name;
  for (const r of RANK_THRESHOLDS) {
    if (user.postCount >= r.minPosts) {
      targetRankName = r.name;
    }
  }

  // If already at this rank, skip
  if (user.rank?.name === targetRankName) {
    return false;
  }

  // Find or create the rank in DB
  let rank = await prisma.rank.findFirst({ where: { name: targetRankName } });
  if (!rank) {
    const def = RANK_THRESHOLDS.find((r) => r.name === targetRankName)!;
    rank = await prisma.rank.create({
      data: {
        name: def.name,
        icon: def.icon,
        color: def.color,
        minPosts: def.minPosts,
        special: false,
        position: RANK_THRESHOLDS.indexOf(def),
      },
    });
  }

  // Update user rank
  await prisma.user.update({
    where: { id: userId },
    data: { rankId: rank.id },
  });

  // Send notification
  await prisma.notification.create({
    data: {
      userId,
      type: "system",
      content: `Tebrikler! Yeni rütbeniz: ${rank.name} ${rank.icon}`,
    },
  });

  return true;
}

// ── Badge Definitions ──
interface BadgeCheck {
  name: string;
  icon: string;
  description: string;
  check: (userId: string) => Promise<boolean>;
}

const AUTO_BADGES: BadgeCheck[] = [
  {
    name: "İlk Mesaj",
    icon: "✍️",
    description: "İlk mesajını yazdı",
    check: async (userId) => {
      const count = await prisma.post.count({ where: { authorId: userId } });
      return count >= 1;
    },
  },
  {
    name: "Sohbet Ustası",
    icon: "💬",
    description: "100+ mesaj yazdı",
    check: async (userId) => {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { postCount: true } });
      return (user?.postCount ?? 0) >= 100;
    },
  },
  {
    name: "Kupon Kralı",
    icon: "🎯",
    description: "10+ kupon/banko konusu açtı",
    check: async (userId) => {
      const count = await prisma.thread.count({
        where: {
          authorId: userId,
          prefix: { label: { in: ["KUPON", "BANKO"] } },
        },
      });
      return count >= 10;
    },
  },
  {
    name: "Analizci",
    icon: "📊",
    description: "10+ analiz/taktik konusu açtı",
    check: async (userId) => {
      const count = await prisma.thread.count({
        where: {
          authorId: userId,
          prefix: { label: { in: ["ANALİZ", "TAKTİK"] } },
        },
      });
      return count >= 10;
    },
  },
  {
    name: "Slot Gezgini",
    icon: "🎰",
    description: "Casino kategorisinde 10+ mesaj",
    check: async (userId) => {
      const count = await prisma.post.count({
        where: {
          authorId: userId,
          thread: { category: { isCasino: true } },
        },
      });
      return count >= 10;
    },
  },
  {
    name: "Yardımsever",
    icon: "🤝",
    description: "50+ tepki aldı",
    check: async (userId) => {
      const count = await prisma.reaction.count({
        where: { post: { authorId: userId } },
      });
      return count >= 50;
    },
  },
  {
    name: "Popüler",
    icon: "🌟",
    description: "100+ görüntülenen bir konusu var",
    check: async (userId) => {
      const thread = await prisma.thread.findFirst({
        where: { authorId: userId, viewCount: { gte: 100 } },
        select: { id: true },
      });
      return !!thread;
    },
  },
];

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const awarded: string[] = [];

  // Get user's existing badges
  const existingBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
  });
  const existingNames = new Set(existingBadges.map((ub) => ub.badge.name));

  for (const badgeDef of AUTO_BADGES) {
    if (existingNames.has(badgeDef.name)) continue;

    const earned = await badgeDef.check(userId);
    if (!earned) continue;

    // Find or create badge
    let badge = await prisma.badge.findFirst({ where: { name: badgeDef.name } });
    if (!badge) {
      badge = await prisma.badge.create({
        data: {
          name: badgeDef.name,
          icon: badgeDef.icon,
          description: badgeDef.description,
        },
      });
    }

    // Award badge
    await prisma.userBadge.create({
      data: { userId, badgeId: badge.id },
    }).catch(() => {}); // ignore duplicate

    // Send notification
    await prisma.notification.create({
      data: {
        userId,
        type: "system",
        content: `Yeni rozet kazandınız: ${badgeDef.name} ${badgeDef.icon}`,
      },
    });

    // Award points for badge
    await updateReputation(userId, 5);

    awarded.push(badgeDef.name);
  }

  return awarded;
}

// ── Reputation System ──
const REACTION_POINTS: Record<string, number> = {
  "👍": 1,
  "❤️": 1,
  "😂": 1,
  "🔥": 2,
  "🎯": 2,
  "💰": 2,
  "🧠": 2,
  "👎": -1,
};

export function getReactionPoints(emoji: string): number {
  return REACTION_POINTS[emoji] ?? 0;
}

export async function updateReputation(userId: string, delta: number): Promise<void> {
  if (delta === 0) return;

  if (delta > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { reputation: { increment: delta } },
    });
  } else {
    // Ensure reputation doesn't go below 0
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { reputation: true } });
    if (!user) return;
    const newRep = Math.max(0, user.reputation + delta);
    await prisma.user.update({
      where: { id: userId },
      data: { reputation: newRep },
    });
  }
}

// ── Combined post-action hook ──
export async function onPostCreated(userId: string): Promise<void> {
  // +2 reputation for posting
  await updateReputation(userId, 2);
  // Check rank
  await updateUserRank(userId);
  // Check badges
  await checkAndAwardBadges(userId);
}

export async function onThreadCreated(userId: string): Promise<void> {
  // +5 reputation for creating thread
  await updateReputation(userId, 5);
  // Check rank
  await updateUserRank(userId);
  // Check badges
  await checkAndAwardBadges(userId);
}

export async function onReactionAdded(postAuthorId: string, emoji: string): Promise<void> {
  const points = getReactionPoints(emoji);
  await updateReputation(postAuthorId, points);
  // Check badges (for "Yardımsever" badge)
  await checkAndAwardBadges(postAuthorId);
}

export async function onReactionRemoved(postAuthorId: string, emoji: string): Promise<void> {
  const points = getReactionPoints(emoji);
  // Reverse the points
  await updateReputation(postAuthorId, -points);
}
