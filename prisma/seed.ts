import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data in reverse dependency order
  await prisma.reaction.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.threadTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.post.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.prefix.deleteMany();
  await prisma.category.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.report.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rank.deleteMany();
  await prisma.liveMatch.deleteMany();

  // ============================================================
  // RANKS
  // ============================================================
  const ranks = await Promise.all([
    prisma.rank.create({
      data: { name: "Çaylak", icon: "🌱", color: "#6b7280", minPosts: 0, position: 1 },
    }),
    prisma.rank.create({
      data: { name: "Üye", icon: "⚡", color: "#3b82f6", minPosts: 10, position: 2 },
    }),
    prisma.rank.create({
      data: { name: "Aktif Üye", icon: "🔥", color: "#8b5cf6", minPosts: 50, position: 3 },
    }),
    prisma.rank.create({
      data: { name: "Uzman", icon: "⭐", color: "#f59e0b", minPosts: 150, position: 4 },
    }),
    prisma.rank.create({
      data: { name: "Efsane", icon: "👑", color: "#ef4444", minPosts: 500, position: 5 },
    }),
    prisma.rank.create({
      data: { name: "VIP", icon: "💎", color: "#e8a935", minPosts: 0, special: true, position: 6 },
    }),
    prisma.rank.create({
      data: { name: "Moderatör", icon: "🛡️", color: "#1f844e", minPosts: 0, special: true, position: 7 },
    }),
    prisma.rank.create({
      data: { name: "Admin", icon: "⚔️", color: "#e74c3c", minPosts: 0, special: true, position: 8 },
    }),
  ]);

  const [rankCaylak, rankUye, rankAktif, rankUzman, rankEfsane, rankVIP, rankMod, rankAdmin] = ranks;

  console.log("✅ Ranks created");

  // ============================================================
  // BADGES
  // ============================================================
  const badges = await Promise.all([
    prisma.badge.create({
      data: { name: "İlk Mesaj", icon: "✍️", description: "İlk mesajını yazdı" },
    }),
    prisma.badge.create({
      data: { name: "Sohbet Ustası", icon: "💬", description: "100+ mesaj yazdı" },
    }),
    prisma.badge.create({
      data: { name: "Kupon Kralı", icon: "🎯", description: "10+ kupon/banko konusu açtı" },
    }),
    prisma.badge.create({
      data: { name: "Analizci", icon: "📊", description: "10+ analiz/taktik konusu açtı" },
    }),
    prisma.badge.create({
      data: { name: "Slot Gezgini", icon: "🎰", description: "Casino kategorisinde 10+ mesaj" },
    }),
    prisma.badge.create({
      data: { name: "Yardımsever", icon: "🤝", description: "50+ tepki aldı" },
    }),
    prisma.badge.create({
      data: { name: "Popüler", icon: "🌟", description: "100+ görüntülenen bir konusu var" },
    }),
    // Manual badges
    prisma.badge.create({
      data: { name: "Erken Kuş", icon: "🐦", description: "Beta üyesi" },
    }),
    prisma.badge.create({
      data: { name: "Forum Veteranı", icon: "🏛️", description: "1 yıldan eski üye" },
    }),
    prisma.badge.create({
      data: { name: "Taktikçi", icon: "🧠", description: "Özel taktik uzmanı" },
    }),
    prisma.badge.create({
      data: { name: "VIP Üye", icon: "💎", description: "VIP statüsü" },
    }),
  ]);

  const [
    badgeIlkMesaj,
    badgeSohbetUstasi,
    badgeKuponKrali,
    badgeAnalizci,
    badgeSlotGezgini,
    badgeYardimsever,
    badgePopuler,
    badgeErkenKus,
    badgeForumVeterani,
    badgeTaktikci,
    badgeVipUye,
  ] = badges;

  console.log("✅ Badges created");

  // ============================================================
  // USERS
  // ============================================================
  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: "AliTopcu",
        email: "ali@rekor.forum",
        displayName: "Ali Topçu",
        bio: "Süper Lig tutkunu, Galatasaray aşığı. Maç analizleri ve tahminler burada!",
        role: "USER",
        points: 1250,
        reputation: 89,
        postCount: 156,
        rankId: rankUzman.id,
        isOnline: true,
        lastSeen: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        username: "MehmetGol",
        email: "mehmet@rekor.forum",
        displayName: "Mehmet Gol",
        bio: "Futbol her şeydir. Transfer dönemlerinde uyumam.",
        role: "USER",
        points: 890,
        reputation: 67,
        postCount: 98,
        rankId: rankUye.id,
        isOnline: false,
        lastSeen: new Date(Date.now() - 3600000),
      },
    }),
    prisma.user.create({
      data: {
        username: "AyseAnalizci",
        email: "ayse@rekor.forum",
        displayName: "Ayşe Analizci",
        bio: "Veri odaklı maç analizleri. İstatistikler yalan söylemez!",
        role: "MOD",
        points: 3200,
        reputation: 245,
        postCount: 534,
        rankId: rankMod.id,
        isOnline: true,
        lastSeen: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        username: "FatihKupon",
        email: "fatih@rekor.forum",
        displayName: "Fatih Kupon",
        bio: "Kupon kralı! Haftalık kuponlarımı takip edin.",
        role: "USER",
        points: 2100,
        reputation: 178,
        postCount: 312,
        rankId: rankUzman.id,
        isOnline: false,
        lastSeen: new Date(Date.now() - 7200000),
      },
    }),
    prisma.user.create({
      data: {
        username: "ZeynepBahis",
        email: "zeynep@rekor.forum",
        displayName: "Zeynep Bahis",
        bio: "Canlı bahis uzmanı. Maç içi stratejiler konusunda tecrübeliyim.",
        role: "USER",
        points: 760,
        reputation: 54,
        postCount: 87,
        rankId: rankUye.id,
        isOnline: true,
        lastSeen: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        username: "EmreSlot",
        email: "emre@rekor.forum",
        displayName: "Emre Slot",
        bio: "Casino ve slot oyunları hakkında her şey. Strateji paylaşımları.",
        role: "USER",
        points: 1560,
        reputation: 112,
        postCount: 203,
        rankId: rankUzman.id,
        isOnline: false,
        lastSeen: new Date(Date.now() - 1800000),
      },
    }),
    prisma.user.create({
      data: {
        username: "BurakPredictor",
        email: "burak@rekor.forum",
        displayName: "Burak Predictor",
        bio: "Skor tahmincisi. UEFA maçlarında yüksek isabet oranı.",
        role: "USER",
        points: 980,
        reputation: 76,
        postCount: 124,
        rankId: rankUzman.id,
        isOnline: true,
        lastSeen: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        username: "CansuBet",
        email: "cansu@rekor.forum",
        displayName: "Cansu Bet",
        bio: "Bahis dünyasında yeniyim ama öğrenmeye açığım!",
        role: "USER",
        points: 120,
        reputation: 12,
        postCount: 23,
        rankId: rankUye.id,
        isOnline: false,
        lastSeen: new Date(Date.now() - 86400000),
      },
    }),
    prisma.user.create({
      data: {
        username: "HakanVIP",
        email: "hakan@rekor.forum",
        displayName: "Hakan VIP",
        bio: "Forum yöneticisi. Kurallara uyalım, keyifle takılalım!",
        role: "ADMIN",
        points: 5600,
        reputation: 430,
        postCount: 1245,
        rankId: rankAdmin.id,
        isOnline: true,
        lastSeen: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        username: "DerinAnaliz",
        email: "derin@rekor.forum",
        displayName: "Derin Analiz",
        bio: "Derinlemesine maç analizleri. Taktik tahta benim işim.",
        role: "USER",
        points: 1800,
        reputation: 134,
        postCount: 267,
        rankId: rankUzman.id,
        isOnline: false,
        lastSeen: new Date(Date.now() - 5400000),
      },
    }),
  ]);

  const [
    userAli,
    userMehmet,
    userAyse,
    userFatih,
    userZeynep,
    userEmre,
    userBurak,
    userCansu,
    userHakan,
    userDerin,
  ] = users;

  console.log("✅ Users created");

  // ============================================================
  // USER BADGES
  // ============================================================
  await Promise.all([
    // Ali
    prisma.userBadge.create({ data: { userId: userAli.id, badgeId: badgeIlkMesaj.id } }),
    prisma.userBadge.create({ data: { userId: userAli.id, badgeId: badgeYardimsever.id } }),
    // Ayse (MOD)
    prisma.userBadge.create({ data: { userId: userAyse.id, badgeId: badgeIlkMesaj.id } }),
    prisma.userBadge.create({ data: { userId: userAyse.id, badgeId: badgeAnalizci.id } }),
    prisma.userBadge.create({ data: { userId: userAyse.id, badgeId: badgeForumVeterani.id } }),
    prisma.userBadge.create({ data: { userId: userAyse.id, badgeId: badgeSohbetUstasi.id } }),
    // Fatih
    prisma.userBadge.create({ data: { userId: userFatih.id, badgeId: badgeIlkMesaj.id } }),
    prisma.userBadge.create({ data: { userId: userFatih.id, badgeId: badgeKuponKrali.id } }),
    prisma.userBadge.create({ data: { userId: userFatih.id, badgeId: badgeYardimsever.id } }),
    // Emre
    prisma.userBadge.create({ data: { userId: userEmre.id, badgeId: badgeIlkMesaj.id } }),
    prisma.userBadge.create({ data: { userId: userEmre.id, badgeId: badgeSlotGezgini.id } }),
    // Burak
    prisma.userBadge.create({ data: { userId: userBurak.id, badgeId: badgeIlkMesaj.id } }),
    prisma.userBadge.create({ data: { userId: userBurak.id, badgeId: badgeTaktikci.id } }),
    // Hakan (ADMIN)
    prisma.userBadge.create({ data: { userId: userHakan.id, badgeId: badgeIlkMesaj.id } }),
    prisma.userBadge.create({ data: { userId: userHakan.id, badgeId: badgeForumVeterani.id } }),
    prisma.userBadge.create({ data: { userId: userHakan.id, badgeId: badgeSohbetUstasi.id } }),
    prisma.userBadge.create({ data: { userId: userHakan.id, badgeId: badgeAnalizci.id } }),
    // Derin
    prisma.userBadge.create({ data: { userId: userDerin.id, badgeId: badgeIlkMesaj.id } }),
    prisma.userBadge.create({ data: { userId: userDerin.id, badgeId: badgeAnalizci.id } }),
    prisma.userBadge.create({ data: { userId: userDerin.id, badgeId: badgeForumVeterani.id } }),
    // Mehmet
    prisma.userBadge.create({ data: { userId: userMehmet.id, badgeId: badgeIlkMesaj.id } }),
    // Zeynep
    prisma.userBadge.create({ data: { userId: userZeynep.id, badgeId: badgeIlkMesaj.id } }),
    prisma.userBadge.create({ data: { userId: userZeynep.id, badgeId: badgeYardimsever.id } }),
    // Cansu
    prisma.userBadge.create({ data: { userId: userCansu.id, badgeId: badgeIlkMesaj.id } }),
  ]);

  console.log("✅ User badges assigned");

  // ============================================================
  // PREFIXES
  // ============================================================
  const prefixes = await Promise.all([
    prisma.prefix.create({ data: { label: "[CANLI]", color: "#ef4444" } }),
    prisma.prefix.create({ data: { label: "[KUPON]", color: "#1f844e" } }),
    prisma.prefix.create({ data: { label: "[BANKO]", color: "#e8a935" } }),
    prisma.prefix.create({ data: { label: "[TAKTİK]", color: "#3b82f6" } }),
    prisma.prefix.create({ data: { label: "[ANALİZ]", color: "#8b5cf6" } }),
    prisma.prefix.create({ data: { label: "[SLOT]", color: "#ec4899" } }),
    prisma.prefix.create({ data: { label: "[SORU]", color: "#06b6d4" } }),
    prisma.prefix.create({ data: { label: "[VIP]", color: "#a855f7" } }),
  ]);

  const [prefCanli, prefKupon, prefBanko, prefTaktik, prefAnaliz, prefSlot, prefSoru, prefVip] = prefixes;

  console.log("✅ Prefixes created");

  // ============================================================
  // CATEGORIES
  // ============================================================
  // Parents
  const catFutbol = await prisma.category.create({
    data: {
      name: "Futbol Forumu",
      slug: "futbol-forumu",
      icon: "⚽",
      description: "Futbol ile ilgili tüm tartışmalar",
      color: "#22c55e",
      position: 1,
    },
  });

  const catBahis = await prisma.category.create({
    data: {
      name: "Bahis & Kupon",
      slug: "bahis-kupon",
      icon: "🎯",
      description: "Bahis tahminleri ve kupon paylaşımları",
      color: "#eab308",
      position: 2,
    },
  });

  const catCasino = await prisma.category.create({
    data: {
      name: "Casino & Slot",
      slug: "casino-slot",
      icon: "🎰",
      description: "Casino oyunları ve slot stratejileri",
      color: "#ec4899",
      position: 3,
      isCasino: true,
    },
  });

  const catGenel = await prisma.category.create({
    data: {
      name: "Genel",
      slug: "genel",
      icon: "💬",
      description: "Genel sohbet ve tartışmalar",
      color: "#6b7280",
      position: 4,
    },
  });

  // Children
  const catSuperLig = await prisma.category.create({
    data: {
      name: "Süper Lig Tartışmaları",
      slug: "super-lig-tartismalari",
      icon: "🏟️",
      description: "Türkiye Süper Lig maçları ve tartışmaları",
      color: "#22c55e",
      position: 1,
      parentId: catFutbol.id,
    },
  });

  const catUefa = await prisma.category.create({
    data: {
      name: "UEFA & Avrupa Kupaları",
      slug: "uefa-avrupa-kupalari",
      icon: "🏆",
      description: "Şampiyonlar Ligi, Avrupa Ligi ve Konferans Ligi",
      color: "#3b82f6",
      position: 2,
      parentId: catFutbol.id,
    },
  });

  const catTransfer = await prisma.category.create({
    data: {
      name: "Transfer Söylentileri",
      slug: "transfer-soylentileri",
      icon: "🔄",
      description: "Transfer haberleri ve söylentiler",
      color: "#f97316",
      position: 3,
      parentId: catFutbol.id,
    },
  });

  const catTahmin = await prisma.category.create({
    data: {
      name: "Maç Tahminleri",
      slug: "mac-tahminleri",
      icon: "🔮",
      description: "Maç skor tahminleri ve analizler",
      color: "#8b5cf6",
      position: 1,
      parentId: catBahis.id,
    },
  });

  const catKuponlar = await prisma.category.create({
    data: {
      name: "Kupon Paylaşımları",
      slug: "kupon-paylasimlari",
      icon: "🎫",
      description: "Günlük ve haftalık kupon paylaşımları",
      color: "#eab308",
      position: 2,
      parentId: catBahis.id,
    },
  });

  const catBanko = await prisma.category.create({
    data: {
      name: "Banko Maçlar",
      slug: "banko-maclar",
      icon: "💰",
      description: "Yüksek güvenli banko maç önerileri",
      color: "#10b981",
      position: 3,
      parentId: catBahis.id,
    },
  });

  const catSlotOyunlari = await prisma.category.create({
    data: {
      name: "Slot Oyunları",
      slug: "slot-oyunlari",
      icon: "🎰",
      description: "Slot oyunları hakkında tartışmalar",
      color: "#ec4899",
      position: 1,
      parentId: catCasino.id,
      isCasino: true,
    },
  });

  const catCasinoStratejileri = await prisma.category.create({
    data: {
      name: "Casino Stratejileri",
      slug: "casino-stratejileri",
      icon: "♠️",
      description: "Casino oyun stratejileri ve ipuçları",
      color: "#6366f1",
      position: 2,
      parentId: catCasino.id,
      isCasino: true,
    },
  });

  const catSerbestKursu = await prisma.category.create({
    data: {
      name: "Serbest Kürsü",
      slug: "serbest-kursu",
      icon: "🗣️",
      description: "Her konuda serbest tartışma alanı",
      color: "#6b7280",
      position: 1,
      parentId: catGenel.id,
    },
  });

  console.log("✅ Categories created");

  // ============================================================
  // THREADS
  // ============================================================
  const threads = await Promise.all([
    // Thread 1 - Derbi analizi
    prisma.thread.create({
      data: {
        title: "Galatasaray - Fenerbahçe Derbi Analizi",
        slug: "galatasaray-fenerbahce-derbi-analizi",
        categoryId: catSuperLig.id,
        authorId: userAyse.id,
        prefixId: prefAnaliz.id,
        isPinned: true,
        isHot: true,
        viewCount: 3456,
        replyCount: 23,
        lastPostAt: new Date(Date.now() - 600000),
      },
    }),
    // Thread 2 - Haftalık kuponlar
    prisma.thread.create({
      data: {
        title: "Haftalık Süper Lig Kuponları",
        slug: "haftalik-super-lig-kuponlari",
        categoryId: catKuponlar.id,
        authorId: userFatih.id,
        prefixId: prefKupon.id,
        isPinned: true,
        viewCount: 2890,
        replyCount: 18,
        lastPostAt: new Date(Date.now() - 1200000),
      },
    }),
    // Thread 3 - Şampiyonlar Ligi
    prisma.thread.create({
      data: {
        title: "Şampiyonlar Ligi Çeyrek Final Tahminleri",
        slug: "sampiyonlar-ligi-ceyrek-final-tahminleri",
        categoryId: catUefa.id,
        authorId: userBurak.id,
        prefixId: prefTaktik.id,
        isFeatured: true,
        viewCount: 1876,
        replyCount: 15,
        lastPostAt: new Date(Date.now() - 3600000),
      },
    }),
    // Thread 4 - Slot oyunları
    prisma.thread.create({
      data: {
        title: "En Çok Kazandıran Slot Oyunları",
        slug: "en-cok-kazandiran-slot-oyunlari",
        categoryId: catSlotOyunlari.id,
        authorId: userEmre.id,
        prefixId: prefSlot.id,
        viewCount: 1245,
        replyCount: 12,
        lastPostAt: new Date(Date.now() - 7200000),
      },
    }),
    // Thread 5 - Canlı bahis
    prisma.thread.create({
      data: {
        title: "Canlı Bahis Taktikleri ve İpuçları",
        slug: "canli-bahis-taktikleri-ve-ipuclari",
        categoryId: catTahmin.id,
        authorId: userZeynep.id,
        prefixId: prefCanli.id,
        isHot: true,
        viewCount: 2134,
        replyCount: 19,
        lastPostAt: new Date(Date.now() - 900000),
      },
    }),
    // Thread 6 - Transfer
    prisma.thread.create({
      data: {
        title: "Beşiktaş'ın Yeni Transferi Kim Olacak?",
        slug: "besiktasin-yeni-transferi-kim-olacak",
        categoryId: catTransfer.id,
        authorId: userMehmet.id,
        viewCount: 987,
        replyCount: 8,
        lastPostAt: new Date(Date.now() - 14400000),
      },
    }),
    // Thread 7 - Banko maçlar
    prisma.thread.create({
      data: {
        title: "Bugünün Banko Maçları - Günlük Tahminler",
        slug: "bugunun-banko-maclari-gunluk-tahminler",
        categoryId: catBanko.id,
        authorId: userFatih.id,
        prefixId: prefBanko.id,
        viewCount: 1567,
        replyCount: 14,
        lastPostAt: new Date(Date.now() - 1800000),
      },
    }),
    // Thread 8 - Casino stratejileri
    prisma.thread.create({
      data: {
        title: "Blackjack Strateji Rehberi",
        slug: "blackjack-strateji-rehberi",
        categoryId: catCasinoStratejileri.id,
        authorId: userEmre.id,
        prefixId: prefTaktik.id,
        viewCount: 876,
        replyCount: 6,
        lastPostAt: new Date(Date.now() - 21600000),
      },
    }),
    // Thread 9 - Serbest
    prisma.thread.create({
      data: {
        title: "Futbolda VAR Sistemi Hakkında Ne Düşünüyorsunuz?",
        slug: "futbolda-var-sistemi-hakkinda-ne-dusunuyorsunuz",
        categoryId: catSerbestKursu.id,
        authorId: userAli.id,
        prefixId: prefSoru.id,
        viewCount: 654,
        replyCount: 11,
        lastPostAt: new Date(Date.now() - 10800000),
      },
    }),
    // Thread 10 - Trabzonspor analizi
    prisma.thread.create({
      data: {
        title: "Trabzonspor'un Sezon Sonu Değerlendirmesi",
        slug: "trabzonsporun-sezon-sonu-degerlendirmesi",
        categoryId: catSuperLig.id,
        authorId: userDerin.id,
        prefixId: prefAnaliz.id,
        viewCount: 543,
        replyCount: 7,
        lastPostAt: new Date(Date.now() - 28800000),
      },
    }),
    // Thread 11 - Avrupa Ligi
    prisma.thread.create({
      data: {
        title: "Avrupa Ligi'nde Türk Takımlarının Şansı",
        slug: "avrupa-liginde-turk-takimlarinin-sansi",
        categoryId: catUefa.id,
        authorId: userAli.id,
        prefixId: prefAnaliz.id,
        viewCount: 789,
        replyCount: 9,
        lastPostAt: new Date(Date.now() - 43200000),
      },
    }),
    // Thread 12 - VIP kupon
    prisma.thread.create({
      data: {
        title: "VIP Özel Kupon - Hafta Sonu Kombine",
        slug: "vip-ozel-kupon-hafta-sonu-kombine",
        categoryId: catKuponlar.id,
        authorId: userHakan.id,
        prefixId: prefVip.id,
        viewCount: 2345,
        replyCount: 21,
        lastPostAt: new Date(Date.now() - 3600000),
      },
    }),
    // Thread 13 - Yeni başlayanlar
    prisma.thread.create({
      data: {
        title: "Bahis Dünyasına Yeni Başlayanlar İçin Rehber",
        slug: "bahis-dunyasina-yeni-baslayanlar-icin-rehber",
        categoryId: catTahmin.id,
        authorId: userCansu.id,
        prefixId: prefSoru.id,
        viewCount: 1123,
        replyCount: 16,
        lastPostAt: new Date(Date.now() - 5400000),
      },
    }),
    // Thread 14 - Galatasaray transfer
    prisma.thread.create({
      data: {
        title: "Galatasaray Yaz Transfer Dönemi Beklentileri",
        slug: "galatasaray-yaz-transfer-donemi-beklentileri",
        categoryId: catTransfer.id,
        authorId: userAli.id,
        viewCount: 1456,
        replyCount: 13,
        lastPostAt: new Date(Date.now() - 7200000),
      },
    }),
    // Thread 15 - Sweet Bonanza
    prisma.thread.create({
      data: {
        title: "Sweet Bonanza Taktikleri ve Büyük Kazançlar",
        slug: "sweet-bonanza-taktikleri-ve-buyuk-kazanclar",
        categoryId: catSlotOyunlari.id,
        authorId: userEmre.id,
        prefixId: prefSlot.id,
        viewCount: 934,
        replyCount: 10,
        lastPostAt: new Date(Date.now() - 10800000),
      },
    }),
    // Thread 16 - Fenerbahçe analiz
    prisma.thread.create({
      data: {
        title: "Fenerbahçe'nin Yeni Hocası ile İlk Değerlendirme",
        slug: "fenerbahcenin-yeni-hocasi-ile-ilk-degerlendirme",
        categoryId: catSuperLig.id,
        authorId: userMehmet.id,
        prefixId: prefAnaliz.id,
        isHot: true,
        viewCount: 2678,
        replyCount: 20,
        lastPostAt: new Date(Date.now() - 1800000),
      },
    }),
  ]);

  const [
    threadDerbi,
    threadHaftalikKupon,
    threadCL,
    threadSlot,
    threadCanliBahis,
    threadTransfer,
    threadBanko,
    threadBlackjack,
    threadVAR,
    threadTrabzon,
    threadAvrupaLigi,
    threadVIPKupon,
    threadYeniBaslayanlar,
    threadGSTransfer,
    threadSweetBonanza,
    threadFBHoca,
  ] = threads;

  console.log("✅ Threads created");

  // ============================================================
  // POSTS (50+)
  // ============================================================
  const posts = await Promise.all([
    // ---- Thread 1: Derbi Analizi (threadDerbi) ----
    prisma.post.create({
      data: {
        threadId: threadDerbi.id,
        authorId: userAyse.id,
        content: `Galatasaray - Fenerbahçe derbisi için kapsamlı bir analiz hazırladım. Bu sezon her iki takımın da form durumunu, sakatlık listelerini ve taktiksel yaklaşımlarını inceledim.

Galatasaray son 5 maçta 4 galibiyet 1 beraberlik alırken, Fenerbahçe 3 galibiyet 1 beraberlik 1 mağlubiyet yaşadı. Ev sahibi avantajı ve taraftar desteği düşünüldüğünde Galatasaray hafif favori görünüyor.

Dikkat edilmesi gereken noktalar:
- Galatasaray'ın orta saha dominasyonu
- Fenerbahçe'nin kontra atak potansiyeli
- Kanat oyunlarında üstünlük mücadelesi

Tahminim: Galatasaray 2-1 Fenerbahçe`,
        createdAt: new Date(Date.now() - 86400000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadDerbi.id,
        authorId: userAli.id,
        content: "Ayşe hanım harika bir analiz olmuş! Ben de Galatasaray'ın kazanacağını düşünüyorum ama 3-1 gibi daha farklı bir skor bekliyorum. Icardi bu maçta coşacak bence.",
        createdAt: new Date(Date.now() - 82800000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadDerbi.id,
        authorId: userMehmet.id,
        content: "Fenerbahçe'yi hafife almayın! Son derbilerde hep sürpriz sonuçlar çıkıyor. Deplasman galibiyeti bile gelebilir. Bence 1-2 Fenerbahçe.",
        createdAt: new Date(Date.now() - 79200000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadDerbi.id,
        authorId: userDerin.id,
        content: `İstatistiklere baktığımızda çok ilginç veriler var:

- Son 10 derbide ev sahibi 6 kez kazandı
- Her iki takımın da gol attığı maç oranı %70
- İlk golü atan takım %65 oranında kazanıyor

Bu veriler ışığında KG VAR oynamamı tavsiye ederim. Oran da gayet güzel şu an.`,
        createdAt: new Date(Date.now() - 75600000),
      },
    }),

    // ---- Thread 2: Haftalık Kuponlar (threadHaftalikKupon) ----
    prisma.post.create({
      data: {
        threadId: threadHaftalikKupon.id,
        authorId: userFatih.id,
        content: `Bu haftanın kuponunu paylaşıyorum arkadaşlar! 🎯

1. Galatasaray - Antalyaspor ➡️ MS 1 (1.35)
2. Real Madrid - Sevilla ➡️ MS 1 (1.40)
3. Bayern - Augsburg ➡️ İY/MS 1/1 (1.55)
4. Liverpool - Brighton ➡️ 2.5 Üst (1.45)
5. Inter - Monza ➡️ MS 1 (1.30)

Toplam Oran: 5.47
Güven Oranı: ⭐⭐⭐⭐

Herkese bol şanslar!`,
        createdAt: new Date(Date.now() - 72000000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadHaftalikKupon.id,
        authorId: userZeynep.id,
        content: "Fatih abi kupon güzel ama Bayern İY/MS 1/1 riskli olabilir. Augsburg son maçlarda iyi oynuyor. Onun yerine sadece MS 1 oynasak?",
        createdAt: new Date(Date.now() - 68400000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadHaftalikKupon.id,
        authorId: userBurak.id,
        content: "Liverpool maçında 2.5 üst çok mantıklı. Brighton ofansif oynayan bir takım ve Liverpool zaten gol yağdırıyor. Ben 3.5 üst bile düşünüyorum.",
        createdAt: new Date(Date.now() - 64800000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadHaftalikKupon.id,
        authorId: userCansu.id,
        content: "Ben de bu kuponu oynadım! İlk kuponum olacak, umarım tutar. Fatih abinin kuponlarına güveniyorum.",
        createdAt: new Date(Date.now() - 61200000),
      },
    }),

    // ---- Thread 3: CL Tahminleri (threadCL) ----
    prisma.post.create({
      data: {
        threadId: threadCL.id,
        authorId: userBurak.id,
        content: `Şampiyonlar Ligi çeyrek final eşleşmeleri belli oldu! İşte tahminlerim:

🔵 Real Madrid vs Manchester City: İki ayaklı düşünüyorum, Real Madrid turu geçer. Bernabeu faktörü çok önemli.

🔴 Arsenal vs Bayern München: Çok zorlu eşleşme. Bayern'in tecrübesi ağır basabilir ama Arsenal bu sezon bambaşka bir takım.

⚫ PSG vs Barcelona: Eski dostlar karşı karşıya! Dembele faktörü belirleyici olacak.

🟡 Atletico Madrid vs Dortmund: En dengeli eşleşme. Simeone'nin savunma anlayışı vs Dortmund'un genç enerjisi.

Sizin tahminleriniz neler?`,
        createdAt: new Date(Date.now() - 57600000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadCL.id,
        authorId: userDerin.id,
        content: "Arsenal - Bayern eşleşmesi bu turun en iyi maçı olacak. Arsenal'in yüksek pres oyunu Bayern'i zorlayabilir ama Müller'in büyük maç tecrübesini unutmamak lazım. Ben Bayern diyorum ama çok zor.",
        createdAt: new Date(Date.now() - 54000000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadCL.id,
        authorId: userAyse.id,
        content: `xG verilerine göre bu sezon CL'de en verimli atak yapan takımlar:
1. Manchester City (xG: 2.4/maç)
2. Real Madrid (xG: 2.1/maç)
3. Bayern (xG: 1.9/maç)

Savunma tarafında ise Atletico açık ara önde. Maç başına sadece 0.7 xGA. Simeone işini biliyor.`,
        createdAt: new Date(Date.now() - 50400000),
      },
    }),

    // ---- Thread 4: Slot Oyunları (threadSlot) ----
    prisma.post.create({
      data: {
        threadId: threadSlot.id,
        authorId: userEmre.id,
        content: `En çok kazandıran slot oyunlarını sizler için derledim! 🎰

1. **Sweet Bonanza** - RTP: %96.48 - Volatilite: Yüksek
   Şeker temalı bu oyun, x100'e kadar çarpanlarla büyük kazançlar sunuyor.

2. **Gates of Olympus** - RTP: %96.50 - Volatilite: Yüksek
   Zeus temalı oyun, tumbling wins özelliği ile ardışık kazançlar.

3. **Book of Dead** - RTP: %96.21 - Volatilite: Yüksek
   Klasik Mısır temalı slot, free spin bonusları harika.

4. **Big Bass Bonanza** - RTP: %96.71 - Volatilite: Yüksek/Orta
   Balık tutma temalı eğlenceli oyun.

5. **Starlight Princess** - RTP: %96.50 - Volatilite: Yüksek
   Anime tarzı görseller ve yüksek çarpanlar.

Her oyunun demo versiyonunu mutlaka deneyin!`,
        createdAt: new Date(Date.now() - 46800000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadSlot.id,
        authorId: userCansu.id,
        content: "Sweet Bonanza gerçekten çok eğlenceli! Dün x50 çarpan geldi, küçük bir yatırımla güzel kazandım. Ama dikkatli olmak lazım, bütçe yönetimi çok önemli.",
        createdAt: new Date(Date.now() - 43200000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadSlot.id,
        authorId: userHakan.id,
        content: "⚠️ Arkadaşlar, slot oyunlarında sorumlu oyun çok önemli! Lütfen bütçenizi belirleyin ve asla kaybetmeyi göze alamayacağınız parayla oynamayın. Forum kurallarımızı hatırlatırım.",
        createdAt: new Date(Date.now() - 39600000),
      },
    }),

    // ---- Thread 5: Canlı Bahis (threadCanliBahis) ----
    prisma.post.create({
      data: {
        threadId: threadCanliBahis.id,
        authorId: userZeynep.id,
        content: `Canlı bahiste başarılı olmak için bazı temel taktikler:

1. **Maçı İzleyin**: Canlı bahis yapıyorsanız mutlaka maçı izleyin. İstatistikler tek başına yetmez.

2. **Momentum Analizi**: Hangi takımın baskılı olduğunu gözlemleyin. Korner sayıları ve şut istatistikleri ipucu verir.

3. **Cash Out Kullanımı**: Doğru zamanda cash out yapmak, uzun vadede kârlılığı artırır.

4. **İlk 15 Dakika Kuralı**: Maçın ilk 15 dakikasında bahis yapmayın. Takımların tempo ve taktik anlayışını gözlemleyin.

5. **Over/Under Stratejisi**: Golsüz geçen ilk yarılarda 2. yarıda gol beklentisi artar. 0-0 HT sonrası 0.5 üst oranları genelde düşer ama hâlâ değerlidir.

Bu taktiklerle ben son 3 ayda %23 kârdayım!`,
        createdAt: new Date(Date.now() - 36000000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadCanliBahis.id,
        authorId: userFatih.id,
        content: "Zeynep hanım cash out konusunda çok haklı. Ben geçen hafta cash out yapmasaydım 500 TL kaybedecektim. Doğru zamanlama her şey!",
        createdAt: new Date(Date.now() - 32400000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadCanliBahis.id,
        authorId: userAli.id,
        content: "Canlı bahiste en önemli şey sabırlı olmak. Herkes hemen kazanmak istiyor ama uzun vadede düşünmek lazım. Zeynep'in taktikleri gerçekten işe yarıyor.",
        createdAt: new Date(Date.now() - 28800000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadCanliBahis.id,
        authorId: userDerin.id,
        content: "Momentum analizi konusunda bir ekleme yapmak istiyorum. Corner istatistikleri yanında, takımların pozisyon haritasına da bakın. Hangi takım rakip yarı sahada daha çok top sürüyor, bu çok önemli bir gösterge.",
        createdAt: new Date(Date.now() - 25200000),
      },
    }),

    // ---- Thread 6: Beşiktaş Transfer (threadTransfer) ----
    prisma.post.create({
      data: {
        threadId: threadTransfer.id,
        authorId: userMehmet.id,
        content: "Beşiktaş'ın yeni transfer hedeflerini araştırdım. Forvet hattına kesinlikle takviye şart. Son haftalarda Bundesliga'dan bir isim gündemde. Sizce kim olabilir?",
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadTransfer.id,
        authorId: userAli.id,
        content: "Bence Beşiktaş'a bir tane sağlam stoper lazım. Forvet de önemli ama savunmadaki açıklar kapatılmazsa forvetçi de işe yaramaz.",
        createdAt: new Date(Date.now() - 86400000 * 2 + 3600000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadTransfer.id,
        authorId: userBurak.id,
        content: "İtalya basınında Beşiktaş'ın Serie A'dan bir orta saha oyuncusuyla ilgilendiği yazıyor. Bence doğru hamle olur.",
        createdAt: new Date(Date.now() - 86400000 * 2 + 7200000),
      },
    }),

    // ---- Thread 7: Banko Maçlar (threadBanko) ----
    prisma.post.create({
      data: {
        threadId: threadBanko.id,
        authorId: userFatih.id,
        content: `Bugünün banko maçları! 💰

🟢 Barcelona - Cadiz ➡️ MS 1 (1.12) - %95 güven
🟢 PSG - Lorient ➡️ MS 1 (1.18) - %90 güven
🟢 Napoli - Salernitana ➡️ MS 1 (1.22) - %88 güven

Bu üçlüyü tek kupon yaparsanız oran: 1.63
Düşük oran ama güvenli. Bankroll yönetimi açısından bu tür kuponlar çok önemli.`,
        createdAt: new Date(Date.now() - 21600000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadBanko.id,
        authorId: userZeynep.id,
        content: "Barcelona - Cadiz maçında dikkatli olun. Cadiz küme düşme hattında ve bu tür takımlar bazen beklenmedik performanslar sergiliyor. Ben yine de MS 1 diyorum ama...",
        createdAt: new Date(Date.now() - 18000000),
      },
    }),

    // ---- Thread 8: Blackjack (threadBlackjack) ----
    prisma.post.create({
      data: {
        threadId: threadBlackjack.id,
        authorId: userEmre.id,
        content: `Blackjack Temel Strateji Rehberi 🃏

Blackjack'te kasa avantajını minimize etmek için temel stratejiyi bilmek şart:

**Sert Eller (Hard Hands):**
- 8 veya altı: Her zaman kart çek
- 9: Krupiye 3-6 ise double, değilse kart çek
- 10: Krupiye 2-9 ise double, değilse kart çek
- 11: Her zaman double
- 12-16: Krupiye 2-6 ise dur, değilse kart çek
- 17+: Her zaman dur

**Yumuşak Eller (Soft Hands):**
- A+2 veya A+3: Krupiye 5-6 ise double, değilse kart çek
- A+4 veya A+5: Krupiye 4-6 ise double, değilse kart çek
- A+6: Krupiye 3-6 ise double, değilse kart çek
- A+7: Krupiye 2,7,8 ise dur, 3-6 ise double, değilse kart çek

Bu stratejiyi uygulayarak kasa avantajını %0.5'e kadar düşürebilirsiniz.`,
        createdAt: new Date(Date.now() - 86400000 * 3),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadBlackjack.id,
        authorId: userHakan.id,
        content: "Güzel rehber Emre! Blackjack casino oyunları arasında en düşük kasa avantajına sahip oyun. Ama her zaman sorumluluk bilinci ile oynanmalı.",
        createdAt: new Date(Date.now() - 86400000 * 3 + 3600000),
      },
    }),

    // ---- Thread 9: VAR Sistemi (threadVAR) ----
    prisma.post.create({
      data: {
        threadId: threadVAR.id,
        authorId: userAli.id,
        content: "VAR sistemi Türkiye'de doğru uygulanıyor mu sizce? Son haftalarda çok tartışmalı pozisyonlar oldu. Özellikle penaltı kararlarında tutarsızlık var. Fikirlerinizi merak ediyorum.",
        createdAt: new Date(Date.now() - 86400000 * 4),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadVAR.id,
        authorId: userMehmet.id,
        content: "VAR teknoloji olarak güzel ama uygulayan insanlar sorunlu. Aynı pozisyona bir maçta penaltı veriyor, diğerinde vermiyor. Standart yok!",
        createdAt: new Date(Date.now() - 86400000 * 4 + 7200000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadVAR.id,
        authorId: userAyse.id,
        content: "İstatistiklere bakarsak VAR sonrası hatalı karar oranı %7'den %3'e düştü. Mükemmel değil ama iyileşme var. Sorun algı yönetiminde bence.",
        createdAt: new Date(Date.now() - 86400000 * 4 + 14400000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadVAR.id,
        authorId: userBurak.id,
        content: "Premier Lig'de VAR nasıl uygulanıyor bir bakın. Orada da tartışmalar var ama en azından süreç şeffaf. Türkiye'de VAR odasının yayınlanması lazım.",
        createdAt: new Date(Date.now() - 86400000 * 4 + 21600000),
      },
    }),

    // ---- Thread 10: Trabzonspor (threadTrabzon) ----
    prisma.post.create({
      data: {
        threadId: threadTrabzon.id,
        authorId: userDerin.id,
        content: `Trabzonspor'un bu sezon performansını analiz ettim:

**Güçlü Yanlar:**
- İç saha performansı ligde ilk 3'te
- Genç oyuncu gelişimi (altyapıdan 4 oyuncu A takımda)
- Set piece organizasyonu (ligde en çok kornerden gol atan 2. takım)

**Zayıf Yanlar:**
- Deplasman performansı ligde 10. sırada
- Sakatlık sayısı çok yüksek (sezon boyunca 23 farklı sakatlık)
- Forvet hattında verimlilik düşük (xG: 1.8, gerçekleşen: 1.2)

Sezon sonu değerlendirmesi: Beklentilerin altında kaldılar ama gelecek sezon için umut var.`,
        createdAt: new Date(Date.now() - 86400000 * 5),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadTrabzon.id,
        authorId: userAli.id,
        content: "Trabzonspor'un en büyük sorunu kadro derinliği. 11'i gayet iyi ama yedekler yeterli değil. Yazın en az 3-4 transfer şart.",
        createdAt: new Date(Date.now() - 86400000 * 5 + 7200000),
      },
    }),

    // ---- Thread 11: Avrupa Ligi (threadAvrupaLigi) ----
    prisma.post.create({
      data: {
        threadId: threadAvrupaLigi.id,
        authorId: userAli.id,
        content: "Türk takımlarının Avrupa'daki performansını tartışalım. Bu sezon beklentileri karşılayabildik mi? Galatasaray'ın Şampiyonlar Ligi macerasını nasıl değerlendiriyorsunuz?",
        createdAt: new Date(Date.now() - 86400000 * 6),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadAvrupaLigi.id,
        authorId: userAyse.id,
        content: "Galatasaray gruptan çıkarak harika bir iş başardı! UEFA ülke puanı açısından da çok önemli katkılar sağladı. Fenerbahçe'nin Konferans Ligi performansı da olumlu.",
        createdAt: new Date(Date.now() - 86400000 * 6 + 3600000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadAvrupaLigi.id,
        authorId: userDerin.id,
        content: "UEFA ülke sıralamasında yükseliyoruz. Birkaç sezon daha böyle devam ederse Şampiyonlar Ligi'ne direkt katılım hakkı alabiliriz. Bu çok önemli.",
        createdAt: new Date(Date.now() - 86400000 * 6 + 7200000),
      },
    }),

    // ---- Thread 12: VIP Kupon (threadVIPKupon) ----
    prisma.post.create({
      data: {
        threadId: threadVIPKupon.id,
        authorId: userHakan.id,
        content: `🌟 VIP ÖZEL KUPON - HAFTA SONU KOMBİNE 🌟

Bu hafta sonu için özel kombine kuponumu paylaşıyorum:

1. Galatasaray - Konyaspor ➡️ MS 1 + 1.5 Üst (1.50)
2. Barcelona - Athletic Bilbao ➡️ MS 1 (1.45)
3. Man City - Wolves ➡️ MS 1 + KG Yok (1.75)
4. Juventus - Lecce ➡️ İY/MS 1/1 (1.80)

Toplam Oran: 7.03
Yatırım Önerisi: Bankroll'ün %3'ü

Bu kupon premium analizlere dayanmaktadır. Bol şanslar!`,
        createdAt: new Date(Date.now() - 14400000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadVIPKupon.id,
        authorId: userFatih.id,
        content: "Hakan hocam her zamanki gibi kaliteli kupon! Man City maçında KG Yok biraz riskli ama City son maçlarda defansif olarak çok sağlam. Güveniyorum.",
        createdAt: new Date(Date.now() - 10800000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadVIPKupon.id,
        authorId: userAli.id,
        content: "Juventus İY/MS 1/1 riskli olabilir, İtalyan takımları ilk yarıda temkinli oynuyor genelde. Ama oran güzel, oynanır.",
        createdAt: new Date(Date.now() - 7200000),
      },
    }),

    // ---- Thread 13: Yeni Başlayanlar (threadYeniBaslayanlar) ----
    prisma.post.create({
      data: {
        threadId: threadYeniBaslayanlar.id,
        authorId: userCansu.id,
        content: "Merhaba arkadaşlar! Bahis dünyasına yeni başladım ve çok kafam karışık. Hangi tür bahislerle başlamak daha mantıklı? Maç sonucu mu, alt/üst mü? Tecrübelerinizi paylaşır mısınız?",
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadYeniBaslayanlar.id,
        authorId: userFatih.id,
        content: `Cansu hoş geldin! Yeni başlayanlar için tavsiyelerim:

1. **Maç sonucu** ile başla, en basit bahis türü
2. **Tek maç oyna**, kombine kuponlara hemen girme
3. **Bütçe belirle** ve asla aşma
4. **Favori takımına bahis yapma**, duygusal kararlar zararlı
5. **İstatistikleri takip et**, göz kararı oynama

En önemli kural: Kaybetmeyi göze alabildiğin kadar oyna!`,
        createdAt: new Date(Date.now() - 86400000 * 2 + 3600000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadYeniBaslayanlar.id,
        authorId: userAyse.id,
        content: "Fatih'in söylediklerine ek olarak, bahis sitelerinin verdiği istatistiklere güvenme. Kendi araştırmanı yap. WhoScored, Transfermarkt gibi siteleri kullan.",
        createdAt: new Date(Date.now() - 86400000 * 2 + 7200000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadYeniBaslayanlar.id,
        authorId: userZeynep.id,
        content: "Ben de 2 yıl önce başladım. En büyük hatam çok fazla maçta birden bahis yapmaktı. Şimdi günde en fazla 2-3 maç oynuyorum ve çok daha başarılıyım.",
        createdAt: new Date(Date.now() - 86400000 * 2 + 10800000),
      },
    }),

    // ---- Thread 14: GS Transfer (threadGSTransfer) ----
    prisma.post.create({
      data: {
        threadId: threadGSTransfer.id,
        authorId: userAli.id,
        content: `Galatasaray yazın hangi mevkilere transfer yapmalı? Bence öncelikler:

1. Sol bek - Kesinlikle kaliteli bir sol bek şart
2. Stoper - Tecrübeli bir stoper transferi lazım
3. Forvet alternatifi - Icardi'nin yedeği yok

Bütçe konusunda da kulüp iyi durumda. Şampiyonlar Ligi gelirleri güzel bir kaynak sağladı.`,
        createdAt: new Date(Date.now() - 86400000 * 3),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadGSTransfer.id,
        authorId: userMehmet.id,
        content: "Galatasaray'a Premier Lig'den bir sol bek gelebilir diye duydum. İsim vermeyeyim ama çok kaliteli bir oyuncu. Transfer dönemi çok heyecanlı geçecek!",
        createdAt: new Date(Date.now() - 86400000 * 3 + 7200000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadGSTransfer.id,
        authorId: userDerin.id,
        content: "Galatasaray'ın en büyük sorunu yaş ortalaması. Genç ve dinamik oyuncular alınmalı. 28 yaş üstü yıldız transferleri yerine 23-25 yaş arası gelişen oyuncular tercih edilmeli.",
        createdAt: new Date(Date.now() - 86400000 * 3 + 14400000),
      },
    }),

    // ---- Thread 15: Sweet Bonanza (threadSweetBonanza) ----
    prisma.post.create({
      data: {
        threadId: threadSweetBonanza.id,
        authorId: userEmre.id,
        content: `Sweet Bonanza'da kazanma şansınızı artıracak taktikler:

🍬 **Ante Bet Kullanın**: %25 ekstra maliyet ama scatter gelme olasılığı 2 katına çıkıyor.

🍬 **Sabırlı Olun**: Bu oyun yüksek volatiliteli. 50-100 spin boyunca hiç bonus gelmeyebilir ama geldiğinde büyük kazandırır.

🍬 **Bütçe Yönetimi**: 200 spin yapacak kadar bakiyeniz olsun. Minimum bahisle başlayın.

🍬 **Free Spin Bonusu**: 4+ scatter ile bonus başlar. Bonus sırasında x100'e kadar çarpanlar gelebilir.

Dün 50 TL yatırımla 1200 TL kazandım! Ama her zaman bu kadar şanslı olmayacağınızı unutmayın.`,
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadSweetBonanza.id,
        authorId: userCansu.id,
        content: "Ante bet gerçekten işe yarıyor mu? Ekstra maliyet mantıklı mı uzun vadede?",
        createdAt: new Date(Date.now() - 86400000 * 2 + 3600000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadSweetBonanza.id,
        authorId: userEmre.id,
        content: "Matematiksel olarak ante bet RTP'yi çok az artırıyor. Ama bonus alma sıklığı artıyor ve oyun daha eğlenceli hale geliyor. Tercih meselesi.",
        createdAt: new Date(Date.now() - 86400000 * 2 + 7200000),
      },
    }),

    // ---- Thread 16: FB Hoca (threadFBHoca) ----
    prisma.post.create({
      data: {
        threadId: threadFBHoca.id,
        authorId: userMehmet.id,
        content: `Fenerbahçe'nin yeni teknik direktörüyle ilk maçları geride kaldı. İlk izlenimlerim:

**Olumlu:**
- Takımda bir enerji değişimi var
- Gençlere şans veriliyor
- Pres oyunu gelişti

**Olumsuz:**
- Hücum organizasyonu henüz oturmadı
- Set piece savunması hâlâ kötü
- Kadro rotasyonu yapılmıyor

Genel olarak umut verici ama sabırlı olmak lazım. En az 2-3 ay süre vermek gerekiyor.`,
        createdAt: new Date(Date.now() - 86400000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadFBHoca.id,
        authorId: userAli.id,
        content: "Fenerbahçe'de hoca değişikliği doğru karardı ama zamanlama geçti. Sezon başında yapılsaydı şimdi çok daha iyi bir yerde olabilirlerdi.",
        createdAt: new Date(Date.now() - 72000000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadFBHoca.id,
        authorId: userAyse.id,
        content: `İstatistiklere bakarsak yeni hoca sonrası:
- Topa sahip olma: %48 → %54
- Maç başı şut: 8.2 → 12.4
- Gol beklentisi (xG): 1.1 → 1.7

Rakamlar iyileşmeye işaret ediyor. Ama örneklem az henüz, kesin yorum yapmak için erken.`,
        createdAt: new Date(Date.now() - 57600000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadFBHoca.id,
        authorId: userDerin.id,
        content: "Fenerbahçe'nin en büyük problemi orta sahada. Yaratıcı bir 10 numara olmadan hücum oyununu çözmek zor. Yazın bu mevkiye kesin transfer yapılmalı.",
        createdAt: new Date(Date.now() - 43200000),
      },
    }),
    prisma.post.create({
      data: {
        threadId: threadFBHoca.id,
        authorId: userBurak.id,
        content: "Fenerbahçe - Beşiktaş maçı bu hafta. Yeni hocanın gerçek sınavı o maç olacak. Kazanırlarsa taraftar tamamen arkasına geçer.",
        createdAt: new Date(Date.now() - 28800000),
      },
    }),
  ]);

  console.log("✅ Posts created (" + posts.length + " posts)");

  // ============================================================
  // REACTIONS
  // ============================================================
  const reactionData: { postId: string; userId: string; emoji: string }[] = [];
  const emojis = ["👍", "❤️", "🔥"];

  // Spread reactions across posts
  const reactionPairs = [
    { post: 0, user: userMehmet, emoji: "👍" },
    { post: 0, user: userFatih, emoji: "❤️" },
    { post: 0, user: userHakan, emoji: "🔥" },
    { post: 0, user: userDerin, emoji: "👍" },
    { post: 0, user: userBurak, emoji: "👍" },
    { post: 1, user: userAyse, emoji: "👍" },
    { post: 1, user: userZeynep, emoji: "❤️" },
    { post: 3, user: userAli, emoji: "🔥" },
    { post: 3, user: userFatih, emoji: "👍" },
    { post: 4, user: userAli, emoji: "👍" },
    { post: 4, user: userZeynep, emoji: "❤️" },
    { post: 4, user: userBurak, emoji: "👍" },
    { post: 4, user: userHakan, emoji: "🔥" },
    { post: 8, user: userAli, emoji: "👍" },
    { post: 8, user: userFatih, emoji: "🔥" },
    { post: 8, user: userAyse, emoji: "👍" },
    { post: 12, user: userAyse, emoji: "👍" },
    { post: 12, user: userMehmet, emoji: "👍" },
    { post: 12, user: userCansu, emoji: "❤️" },
    { post: 15, user: userAli, emoji: "👍" },
    { post: 15, user: userMehmet, emoji: "🔥" },
    { post: 15, user: userDerin, emoji: "👍" },
    { post: 16, user: userZeynep, emoji: "❤️" },
    { post: 16, user: userBurak, emoji: "👍" },
    { post: 22, user: userAyse, emoji: "🔥" },
    { post: 22, user: userAli, emoji: "👍" },
    { post: 25, user: userFatih, emoji: "👍" },
    { post: 25, user: userMehmet, emoji: "👍" },
    { post: 33, user: userAli, emoji: "🔥" },
    { post: 33, user: userZeynep, emoji: "👍" },
    { post: 33, user: userEmre, emoji: "❤️" },
    { post: 38, user: userAyse, emoji: "👍" },
    { post: 38, user: userHakan, emoji: "🔥" },
    { post: 42, user: userFatih, emoji: "👍" },
    { post: 42, user: userDerin, emoji: "❤️" },
    { post: 42, user: userBurak, emoji: "🔥" },
  ];

  await Promise.all(
    reactionPairs.map((r) =>
      prisma.reaction.create({
        data: {
          postId: posts[r.post].id,
          userId: r.user.id,
          emoji: r.emoji,
        },
      })
    )
  );

  console.log("✅ Reactions created");

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: userAli.id,
        type: "reply",
        content: "AyseAnalizci konunuza yanıt verdi: Galatasaray - Fenerbahçe Derbi Analizi",
        relatedThreadId: threadDerbi.id,
        relatedUserId: userAyse.id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: userFatih.id,
        type: "like",
        content: "ZeynepBahis mesajınızı beğendi",
        relatedUserId: userZeynep.id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: userCansu.id,
        type: "reply",
        content: "FatihKupon konunuza yanıt verdi: Bahis Dünyasına Yeni Başlayanlar İçin Rehber",
        relatedThreadId: threadYeniBaslayanlar.id,
        relatedUserId: userFatih.id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: userEmre.id,
        type: "mention",
        content: "HakanVIP sizi bir mesajda etiketledi",
        relatedThreadId: threadSlot.id,
        relatedUserId: userHakan.id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: userHakan.id,
        type: "reply",
        content: "FatihKupon VIP kuponunuza yanıt verdi",
        relatedThreadId: threadVIPKupon.id,
        relatedUserId: userFatih.id,
        isRead: true,
      },
    }),
    prisma.notification.create({
      data: {
        userId: userMehmet.id,
        type: "like",
        content: "AliTopcu mesajınızı beğendi",
        relatedUserId: userAli.id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: userDerin.id,
        type: "reply",
        content: "AliTopcu konunuza yanıt verdi: Trabzonspor'un Sezon Sonu Değerlendirmesi",
        relatedThreadId: threadTrabzon.id,
        relatedUserId: userAli.id,
      },
    }),
  ]);

  console.log("✅ Notifications created");

  // ============================================================
  // LIVE MATCHES
  // ============================================================
  await Promise.all([
    prisma.liveMatch.create({
      data: {
        league: "Süper Lig",
        homeTeam: "Galatasaray",
        awayTeam: "Fenerbahçe",
        homeScore: 2,
        awayScore: 1,
        minute: 67,
        status: "live",
        startTime: new Date(Date.now() - 67 * 60000),
      },
    }),
    prisma.liveMatch.create({
      data: {
        league: "Süper Lig",
        homeTeam: "Beşiktaş",
        awayTeam: "Trabzonspor",
        homeScore: 0,
        awayScore: 0,
        minute: 34,
        status: "live",
        startTime: new Date(Date.now() - 34 * 60000),
      },
    }),
    prisma.liveMatch.create({
      data: {
        league: "La Liga",
        homeTeam: "Real Madrid",
        awayTeam: "Barcelona",
        homeScore: 0,
        awayScore: 0,
        minute: 0,
        status: "upcoming",
        startTime: new Date(Date.now() + 3 * 3600000),
      },
    }),
    prisma.liveMatch.create({
      data: {
        league: "Premier League",
        homeTeam: "Manchester City",
        awayTeam: "Liverpool",
        homeScore: 3,
        awayScore: 2,
        minute: 90,
        status: "finished",
        startTime: new Date(Date.now() - 3 * 3600000),
      },
    }),
    prisma.liveMatch.create({
      data: {
        league: "Bundesliga",
        homeTeam: "Bayern München",
        awayTeam: "Dortmund",
        homeScore: 1,
        awayScore: 1,
        minute: 78,
        status: "live",
        startTime: new Date(Date.now() - 78 * 60000),
      },
    }),
  ]);

  console.log("✅ Live matches created");
  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
