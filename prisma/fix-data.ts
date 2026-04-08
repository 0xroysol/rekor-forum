import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ===== 1. CLEAR AND REPOPULATE LIVEMATCH =====
  console.log("⚽ Updating LiveMatch data...");
  await prisma.liveMatch.deleteMany();

  const matches = [
    // Süper Lig 28. Hafta (finished)
    { league: "Süper Lig", homeTeam: "Gençlerbirliği", awayTeam: "Göztepe", homeScore: 0, awayScore: 2, minute: 90, status: "finished", startTime: new Date("2026-04-04T14:00:00Z") },
    { league: "Süper Lig", homeTeam: "Kasımpaşa", awayTeam: "Kayserispor", homeScore: 2, awayScore: 0, minute: 90, status: "finished", startTime: new Date("2026-04-04T17:00:00Z") },
    { league: "Süper Lig", homeTeam: "Gaziantep FK", awayTeam: "Alanyaspor", homeScore: 1, awayScore: 1, minute: 90, status: "finished", startTime: new Date("2026-04-04T17:00:00Z") },
    { league: "Süper Lig", homeTeam: "Trabzonspor", awayTeam: "Galatasaray", homeScore: 2, awayScore: 1, minute: 90, status: "finished", startTime: new Date("2026-04-04T17:00:00Z") },
    { league: "Süper Lig", homeTeam: "Samsunspor", awayTeam: "Konyaspor", homeScore: 2, awayScore: 2, minute: 90, status: "finished", startTime: new Date("2026-04-05T14:00:00Z") },
    { league: "Süper Lig", homeTeam: "F. Karagümrük", awayTeam: "Rizespor", homeScore: 2, awayScore: 1, minute: 90, status: "finished", startTime: new Date("2026-04-05T14:00:00Z") },
    { league: "Süper Lig", homeTeam: "Antalyaspor", awayTeam: "Eyüpspor", homeScore: 3, awayScore: 0, minute: 90, status: "finished", startTime: new Date("2026-04-05T17:00:00Z") },
    { league: "Süper Lig", homeTeam: "Fenerbahçe", awayTeam: "Beşiktaş", homeScore: 1, awayScore: 0, minute: 90, status: "finished", startTime: new Date("2026-04-05T17:00:00Z") },
    // Süper Lig 27. Hafta erteleme (bugün)
    { league: "Süper Lig", homeTeam: "Göztepe", awayTeam: "Galatasaray", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-08T17:00:00Z") },
    // Süper Lig 29. Hafta
    { league: "Süper Lig", homeTeam: "Rizespor", awayTeam: "Samsunspor", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-09T17:00:00Z") },
    { league: "Süper Lig", homeTeam: "Beşiktaş", awayTeam: "Antalyaspor", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-10T17:00:00Z") },
    { league: "Süper Lig", homeTeam: "Başakşehir", awayTeam: "Gençlerbirliği", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-11T14:00:00Z") },
    { league: "Süper Lig", homeTeam: "Alanyaspor", awayTeam: "Trabzonspor", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-11T17:00:00Z") },
    { league: "Süper Lig", homeTeam: "Kayserispor", awayTeam: "Fenerbahçe", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-11T17:00:00Z") },
    { league: "Süper Lig", homeTeam: "Konyaspor", awayTeam: "F. Karagümrük", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-12T14:00:00Z") },
    // ŞL Çeyrek Final 1. Maç (7 Nisan, bitti)
    { league: "Şampiyonlar Ligi", homeTeam: "Sporting CP", awayTeam: "Arsenal", homeScore: 0, awayScore: 1, minute: 90, status: "finished", startTime: new Date("2026-04-07T19:00:00Z") },
    { league: "Şampiyonlar Ligi", homeTeam: "Real Madrid", awayTeam: "Bayern Münih", homeScore: 1, awayScore: 2, minute: 90, status: "finished", startTime: new Date("2026-04-07T19:00:00Z") },
    // ŞL Çeyrek Final 1. Maç (bugün)
    { league: "Şampiyonlar Ligi", homeTeam: "Barcelona", awayTeam: "Atletico Madrid", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-08T19:00:00Z") },
    { league: "Şampiyonlar Ligi", homeTeam: "PSG", awayTeam: "Liverpool", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-08T19:00:00Z") },
    // ŞL Çeyrek Final 2. Maç
    { league: "Şampiyonlar Ligi", homeTeam: "Atletico Madrid", awayTeam: "Barcelona", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-14T19:00:00Z") },
    { league: "Şampiyonlar Ligi", homeTeam: "Liverpool", awayTeam: "PSG", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-14T19:00:00Z") },
    { league: "Şampiyonlar Ligi", homeTeam: "Arsenal", awayTeam: "Sporting CP", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-15T19:00:00Z") },
    { league: "Şampiyonlar Ligi", homeTeam: "Bayern Münih", awayTeam: "Real Madrid", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-15T19:00:00Z") },
    // Avrupa Ligi Çeyrek Final 1. Maç
    { league: "Avrupa Ligi", homeTeam: "Braga", awayTeam: "Real Betis", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-08T16:45:00Z") },
    { league: "Avrupa Ligi", homeTeam: "Bologna", awayTeam: "Aston Villa", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-09T19:00:00Z") },
    { league: "Avrupa Ligi", homeTeam: "Porto", awayTeam: "Nottingham Forest", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-09T19:00:00Z") },
    { league: "Avrupa Ligi", homeTeam: "Freiburg", awayTeam: "Celta Vigo", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-09T19:00:00Z") },
    // Avrupa Ligi Çeyrek Final 2. Maç
    { league: "Avrupa Ligi", homeTeam: "Celta Vigo", awayTeam: "Freiburg", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-16T16:45:00Z") },
    { league: "Avrupa Ligi", homeTeam: "Aston Villa", awayTeam: "Bologna", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-16T19:00:00Z") },
    { league: "Avrupa Ligi", homeTeam: "Nottingham Forest", awayTeam: "Porto", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-16T19:00:00Z") },
    { league: "Avrupa Ligi", homeTeam: "Real Betis", awayTeam: "Braga", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-16T19:00:00Z") },
  ];

  for (const m of matches) {
    await prisma.liveMatch.create({ data: m });
  }
  console.log(`✅ ${matches.length} matches created`);

  // ===== 3. DELETE COUPON THREADS =====
  console.log("\n🗑️ Deleting coupon threads...");
  const slugsToDelete = [
    "29-hafta-banko-maclar--8-11-nisan",
    "haftalik-super-kombine--1280-oran",
    "gunluk-tek-mac-kuponu--8-nisan",
    "sampiyonlar-ligi-ceyrek-final-kuponlari",
  ];

  for (const slug of slugsToDelete) {
    const thread = await prisma.thread.findFirst({
      where: { OR: [{ slug }, { slug: { contains: slug.split("--")[0] } }] },
    });
    if (thread) {
      // Delete related data
      const postIds = (await prisma.post.findMany({ where: { threadId: thread.id }, select: { id: true } })).map(p => p.id);
      if (postIds.length > 0) {
        await prisma.reaction.deleteMany({ where: { postId: { in: postIds } } });
      }
      await prisma.bookmark.deleteMany({ where: { threadId: thread.id } });
      await prisma.threadTag.deleteMany({ where: { threadId: thread.id } });
      await prisma.post.deleteMany({ where: { threadId: thread.id } });
      await prisma.thread.delete({ where: { id: thread.id } });
      console.log(`  ✅ Deleted: ${thread.title}`);
    }
  }

  // Also search by partial title match
  const partialMatches = await prisma.thread.findMany({
    where: {
      OR: [
        { title: { contains: "Banko Maçlar", mode: "insensitive" } },
        { title: { contains: "Süper Kombine", mode: "insensitive" } },
        { title: { contains: "Tek Maç Kuponu", mode: "insensitive" } },
        { title: { contains: "Çeyrek Final Kuponları", mode: "insensitive" } },
      ],
    },
  });

  for (const thread of partialMatches) {
    const postIds = (await prisma.post.findMany({ where: { threadId: thread.id }, select: { id: true } })).map(p => p.id);
    if (postIds.length > 0) {
      await prisma.reaction.deleteMany({ where: { postId: { in: postIds } } });
    }
    await prisma.bookmark.deleteMany({ where: { threadId: thread.id } });
    await prisma.threadTag.deleteMany({ where: { threadId: thread.id } });
    await prisma.post.deleteMany({ where: { threadId: thread.id } });
    await prisma.thread.delete({ where: { id: thread.id } });
    console.log(`  ✅ Deleted: ${thread.title}`);
  }

  // ===== 4. UPDATE THREAD CONTENT =====
  console.log("\n📝 Updating thread content...");

  // Real Madrid - Bayern
  const rmBayern = await prisma.thread.findFirst({
    where: { title: { contains: "Real Madrid", mode: "insensitive" } },
  });
  if (rmBayern) {
    await prisma.thread.update({
      where: { id: rmBayern.id },
      data: { title: "Real Madrid 1-2 Bayern Münih — Çeyrek Final Maç Sonu" },
    });
    // Update first post
    const firstPost = await prisma.post.findFirst({ where: { threadId: rmBayern.id }, orderBy: { createdAt: "asc" } });
    if (firstPost) {
      await prisma.post.update({
        where: { id: firstPost.id },
        data: {
          content: `Avrupa futbolunun en büyük klasiklerinden birinde Bayern Münih, Santiago Bernabéu'da Real Madrid'i 2-1 mağlup etti!

Harry Kane 2 gol attı (27' ve 68'), Mbappé Real Madrid'in tek golünü kaydetti (54'). Manuel Neuer 9 kurtarış yaparak maçın adamı seçildi.

Bayern deplasmanda kritik avantaj yakaladı. Rövanş 15 Nisan'da Münih Allianz Arena'da oynanacak.

📊 Maç istatistikleri:
- Topa sahip olma: RM %56 - BAY %44
- Şut: RM 18 - BAY 11
- İsabetli şut: RM 5 - BAY 6
- Korner: RM 8 - BAY 4

Kane'in ilk golü muhteşem bir kontra ataktan geldi. İkinci golü ise Sané'nin asistinden Neuer'ın 9 kurtarış yapması olmasaydı skor çok daha farklı olabilirdi.`,
        },
      });
    }
    console.log("  ✅ Updated: Real Madrid - Bayern Münih");
  }

  // Sporting - Arsenal
  const sportArsenal = await prisma.thread.findFirst({
    where: { title: { contains: "Sporting", mode: "insensitive" } },
  });
  if (sportArsenal) {
    // Check if it's the CL match thread (not the general CL overview)
    if (sportArsenal.title.includes("Sporting") || sportArsenal.title.includes("Arsenal")) {
      // This might be the general CL overview. Let's find the specific match thread
      const clOverview = await prisma.thread.findFirst({
        where: { title: { contains: "Çeyrek Final Eşleşmeleri", mode: "insensitive" } },
      });
      if (clOverview) {
        // Update the overview thread to reflect results
        const overviewPost = await prisma.post.findFirst({ where: { threadId: clOverview.id }, orderBy: { createdAt: "asc" } });
        if (overviewPost) {
          await prisma.post.update({
            where: { id: overviewPost.id },
            data: {
              content: `Şampiyonlar Ligi çeyrek final eşleşmeleri ve sonuçlar!

📅 7 Nisan (oynandı):
⚽ Sporting CP 0-1 Arsenal — Havertz 90+1' golüyle Arsenal kazandı
⚽ Real Madrid 1-2 Bayern Münih — Kane 2 gol, Bayern deplasman avantajı

📅 8 Nisan (bugün):
🔜 Barcelona - Atletico Madrid (22:00)
🔜 PSG - Liverpool (22:00)

Arsenal, Kai Havertz'in 90+1'deki golüyle Sporting'i deplasmanda 1-0 yendi. David Raya muhteşem kurtarışlarla maçın adamı seçildi. Bayern ise Harry Kane'in 2 golüyle Real Madrid'i Bernabéu'da 2-1 mağlup etti.

Rövanş maçları:
📅 14 Nisan: Atletico - Barcelona | Liverpool - PSG
📅 15 Nisan: Arsenal - Sporting | Bayern - Real Madrid

Final 30 Mayıs'ta Budapeşte Puskás Arena'da oynanacak. 🏟️`,
            },
          });
        }
        console.log("  ✅ Updated: CL overview with results");
      }
    }
  }

  // Şampiyonluk yarışı puan durumu
  const sampiyonluk = await prisma.thread.findFirst({
    where: { title: { contains: "Şampiyonluk Yarışı", mode: "insensitive" } },
  });
  if (sampiyonluk) {
    const firstPost = await prisma.post.findFirst({ where: { threadId: sampiyonluk.id }, orderBy: { createdAt: "asc" } });
    if (firstPost) {
      await prisma.post.update({
        where: { id: firstPost.id },
        data: {
          content: `28. hafta sonrası puan durumu:
🥇 Galatasaray: 64 puan (27 maç, 1 eksik — bugün Göztepe deplasmanı!)
🥈 Fenerbahçe: 63 puan (28 maç)
🥉 Trabzonspor: 63 puan (28 maç)
4️⃣ Beşiktaş: 52 puan
5️⃣ Göztepe: 46 puan

ÖNEMLİ: GS'nin Göztepe maçı 27. hafta ertelemesi. GS kazanırsa 67'ye çıkıp 4 puan fark açar!

Son 6 haftada kalan maçlar:

Galatasaray: Göztepe (D)*, Başakşehir (İ), Antalya (D), Hatay (İ), Sivas (D), Adana (İ)
Fenerbahçe: Kayseri (D), Konya (İ), Kasımpaşa (D), Bodrum (İ), Gaziantep (D), Samsun (İ)
Trabzonspor: Alanya (D), Göztepe (İ), Hatay (D), Başakşehir (İ), Rize (D), Konya (İ)

* GS'nin Göztepe maçı bugün 20:00'de. Bu maç şampiyonluk yarışının kaderini belirleyebilir.

Galatasaray kazanırsa 67 puan → 4 puan fark, büyük avantaj
Berabere kalırsa 65 puan → 2 puan fark, yarış devam
Kaybederse 64 puan → 3'lü yarış kızışır`,
        },
      });
    }
    console.log("  ✅ Updated: Şampiyonluk yarışı puan durumu");
  }

  // Final count
  const threadCount = await prisma.thread.count();
  const matchCount = await prisma.liveMatch.count();
  console.log(`\n🎉 All fixes applied!`);
  console.log(`   📋 ${threadCount} threads remaining`);
  console.log(`   ⚽ ${matchCount} live matches`);
}

main()
  .catch((e) => { console.error("❌ Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
