import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function slugify(title: string): string {
  const map: Record<string, string> = { ş: "s", Ş: "s", ç: "c", Ç: "c", ğ: "g", Ğ: "g", ü: "u", Ü: "u", ö: "o", Ö: "o", ı: "i", İ: "i" };
  return title
    .replace(/[şŞçÇğĞüÜöÖıİ]/g, (c) => map[c] || c)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function daysAgo(d: number, hours = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() - d);
  date.setHours(date.getHours() - hours);
  return date;
}

function randomView(): number {
  return Math.floor(Math.random() * 4800) + 200;
}

async function main() {
  console.log("🧹 Cleaning old content...");

  // 1. Delete dependent data
  await prisma.reaction.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.threadTag.deleteMany();
  await prisma.post.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.liveMatch.deleteMany();

  // Reset user postCount
  await prisma.user.updateMany({ data: { postCount: 0 } });

  console.log("✅ Old content cleared");

  // Get users
  const users = await prisma.user.findMany();
  const u = (name: string) => users.find((x) => x.username === name)!;

  // Check if CasinoKral exists, create if not
  let casinoKral = users.find((x) => x.username === "CasinoKral");
  if (!casinoKral) {
    const uyeRank = await prisma.rank.findFirst({ where: { name: "Üye" } });
    casinoKral = await prisma.user.create({
      data: {
        username: "CasinoKral",
        email: "casinokral@rekor.forum",
        displayName: "Casino Kral",
        bio: "Casino ve slot oyunları hakkında deneyim paylaşımları",
        role: "USER",
        points: 120,
        reputation: 35,
        rankId: uyeRank?.id,
      },
    });
  }

  // Get categories
  const cats = await prisma.category.findMany();
  const cat = (slug: string) => cats.find((x) => x.slug === slug)!;

  // Get prefixes
  const prefixes = await prisma.prefix.findMany();
  const prefix = (label: string) => prefixes.find((x) => x.label === label) || null;

  console.log("📝 Creating threads and posts...");

  // Helper to create thread + posts
  async function createThread(opts: {
    title: string;
    categorySlug: string;
    prefixLabel: string | null;
    authorName: string;
    content: string;
    replies: { authorName: string; content: string }[];
    daysAgoVal: number;
    hoursOffset?: number;
    isPinned?: boolean;
    isHot?: boolean;
  }) {
    const slug = slugify(opts.title);
    const category = cat(opts.categorySlug);
    const author = opts.authorName === "CasinoKral" ? casinoKral! : u(opts.authorName);
    const pfx = opts.prefixLabel ? prefix(opts.prefixLabel) : null;
    const createdAt = daysAgo(opts.daysAgoVal, opts.hoursOffset || 0);

    const thread = await prisma.thread.create({
      data: {
        title: opts.title,
        slug,
        categoryId: category.id,
        authorId: author.id,
        prefixId: pfx?.id || null,
        isPinned: opts.isPinned || false,
        isHot: opts.isHot || false,
        viewCount: randomView(),
        replyCount: opts.replies.length,
        lastPostAt: daysAgo(Math.max(0, opts.daysAgoVal - 1)),
        createdAt,
      },
    });

    // First post
    await prisma.post.create({
      data: {
        threadId: thread.id,
        authorId: author.id,
        content: opts.content,
        createdAt,
      },
    });
    await prisma.user.update({ where: { id: author.id }, data: { postCount: { increment: 1 } } });

    // Replies
    for (let i = 0; i < opts.replies.length; i++) {
      const r = opts.replies[i];
      const rAuthor = r.authorName === "CasinoKral" ? casinoKral! : u(r.authorName);
      const replyTime = new Date(createdAt.getTime() + (i + 1) * 1800000 + Math.random() * 3600000);
      const post = await prisma.post.create({
        data: {
          threadId: thread.id,
          authorId: rAuthor.id,
          content: r.content,
          createdAt: replyTime,
        },
      });
      await prisma.user.update({ where: { id: rAuthor.id }, data: { postCount: { increment: 1 } } });

      // Random reactions on some posts
      if (Math.random() > 0.4) {
        const emojis = ["👍", "🔥", "🎯", "💰"];
        const reactors = users.filter((x) => x.id !== rAuthor.id).slice(0, Math.floor(Math.random() * 3) + 1);
        for (const reactor of reactors) {
          const emoji = emojis[Math.floor(Math.random() * emojis.length)];
          await prisma.reaction.create({
            data: { postId: post.id, userId: reactor.id, emoji },
          }).catch(() => {});
        }
      }
    }

    // Update thread lastPostAt
    if (opts.replies.length > 0) {
      const lastReply = new Date(createdAt.getTime() + opts.replies.length * 1800000 + 3600000);
      await prisma.thread.update({ where: { id: thread.id }, data: { lastPostAt: lastReply } });
    }

    return thread;
  }

  // ===== SÜPER LİG TARTIŞMALARI =====

  await createThread({
    title: "Trabzonspor 2-1 Galatasaray — Şampiyonluk Yarışı Karıştı!",
    categorySlug: "super-lig-tartismalari",
    prefixLabel: "ANALİZ",
    authorName: "AyseAnalizci",
    daysAgoVal: 3,
    isHot: true,
    content: `28. haftanın dev maçında Trabzonspor evinde Galatasaray'ı 2-1 mağlup etti. Fatih Tekke'nin takımı bu sezon inanılmaz bir performans sergiliyor. Galatasaray liderliğini koruyor ama Fenerbahçe ve Trabzonspor 1 puan geride. Son 6 haftada her şey olabilir.

Galatasaray'ın kanat savunması bu maçta çok açık verdi, Trabzonspor'un hızlı geçişleri etkili oldu. Özellikle sol kanattan yapılan ataklar Galatasaray savunmasını defalarca dağıttı.

Maç istatistikleri:
- Topa sahip olma: TS %42 - GS %58
- Şut: TS 14 - GS 8
- İsabetli şut: TS 6 - GS 3
- Korner: TS 5 - GS 7`,
    replies: [
      { authorName: "MehmetGol", content: "Trabzonspor'un bu sezon yaptığı inanılmaz. Fatih Tekke mucize yaratıyor! Geçen sezon küme düşme hattındaydılar, şimdi şampiyonluk yarışındalar. Hoca farkı bu." },
      { authorName: "FatihKupon", content: "Galatasaray'ın orta sahada otorite kuramaması büyük sorun. Mertens ve Torreira ikilisi bu maçta tamamen kayboldu. Trabzonspor'un pres oyunu onları boğdu." },
      { authorName: "DerinAnaliz", content: "Puan durumu: GS 64, FB 63, TS 63 — Son 6 hafta cehennem olacak. Türk futbol tarihinin en heyecanlı şampiyonluk yarışlarından birine şahitlik ediyoruz. 3 takımın da kalan fikstürü zorlu." },
      { authorName: "BurakPredictor", content: "Galatasaray deplasman sorununu çözmezse şampiyonluk gider. Son 5 deplasmanda 2 mağlubiyet 2 beraberlik var. Bu istatistik şampiyon adayına yakışmıyor." },
      { authorName: "AliTopcu", content: "Kante olmadan Fenerbahçe bu kadar rahat oynayamazdı, Trabzonspor da etkileyici ama bence GS toparlanır. Okan Buruk kriz dönemlerinde hep iyi kararlar aldı." },
      { authorName: "ZeynepBahis", content: "Bu maçtan sonra bahis oranları tamamen değişti. Galatasaray 1.80'den 2.10'a çıktı, Fenerbahçe 2.50'den 2.30'a düştü. Piyasa Fenerbahçe'ye kayıyor." },
    ],
  });

  await createThread({
    title: "Fenerbahçe 1-0 Beşiktaş — Kadıköy Derbisi",
    categorySlug: "super-lig-tartismalari",
    prefixLabel: "CANLI",
    authorName: "MehmetGol",
    daysAgoVal: 5,
    isHot: true,
    content: `Kadıköy'de oynanan derbide Fenerbahçe, Beşiktaş'ı 1-0 mağlup etti. Tedesco'nun takımı bu galibiyetle puan farkını 1'e indirdi.

Skriniar ve Semedo'nun dönüşüyle savunma sağlamlaştı — 7 maç sonra ilk kez kalesini gole kapattı Fenerbahçe! Kante yine sahada olağanüstü bir performans sergiledi. Maçın tek golü 67. dakikada Kante'nin müthiş pasıyla Tadic'ten geldi.

Fenerbahçe bu galibiyetle moral buldu ve şampiyonluk yarışında iddiasını sürdürdü.`,
    replies: [
      { authorName: "DerinAnaliz", content: "Kante bu ligde bambaşka bir seviyede, her topu kapıyor. Maç başına 8.2 top kapma, 92% pas isabeti — bu istatistikler Premier Lig seviyesinde. Süper Lig'de eşi yok." },
      { authorName: "AyseAnalizci", content: "Beşiktaş son haftalarda çok düştü. Sergen hoca kamp yapacakmış, 5 maçta 1 galibiyet var. Takımda motivasyon sorunu var, oyuncular sahada isteksiz görünüyor." },
      { authorName: "FatihKupon", content: "Skriniar-Semedo ikilisinin değeri bu maçta bir kez daha anlaşıldı. İkisi de sahada olunca Fenerbahçe savunması tamamen farklı bir takım. Clean sheet 7 maç sonra geldi!" },
      { authorName: "BurakPredictor", content: "Fenerbahçe bu kadroyla şampiyon olur. Son 6 hafta kritik ama Tedesco doğru hamleleri yapıyor. Kante + Tadic + Fred üçgeni çok etkili." },
      { authorName: "AliTopcu", content: "Derbi atmosferi müthişti, Kadıköy yine fark yarattı. 50.000 kişi tek ses oldu, bu destek takımı taşıyor. Deplasman maçlarında da bu enerji lazım." },
    ],
  });

  await createThread({
    title: "Süper Lig Şampiyonluk Yarışı — Son 6 Hafta Analizi",
    categorySlug: "super-lig-tartismalari",
    prefixLabel: "TAKTİK",
    authorName: "DerinAnaliz",
    daysAgoVal: 2,
    isPinned: true,
    content: `28. hafta sonrası puan durumu:
🥇 Galatasaray: 64 puan
🥈 Fenerbahçe: 63 puan
🥉 Trabzonspor: 63 puan

Son 6 haftada 3 takımın kalan maçlarını analiz ettim.

Galatasaray: Göztepe (D), Başakşehir (İ), Antalya (D), Hatay (İ), Sivas (D), Adana (İ)
Fenerbahçe: Kayseri (D), Konya (İ), Kasımpaşa (D), Bodrum (İ), Gaziantep (D), Samsun (İ)
Trabzonspor: Alanya (D), Göztepe (İ), Hatay (D), Başakşehir (İ), Rize (D), Konya (İ)

GS'nin Göztepe deplasmanı bu hafta çok kritik (8 Nisan). FB'nin Kayserispor deplasmanı (11 Nisan) ve TS'nin Alanyaspor deplasmanı (11 Nisan) belirleyici olacak.`,
    replies: [
      { authorName: "AyseAnalizci", content: "Galatasaray'ın kalan fikstürü en zor gibi görünüyor. 3 deplasman maçı var ve hepsinde zorluk çekebilirler. Göztepe deplasmanı özellikle tehlikeli." },
      { authorName: "FatihKupon", content: "Fenerbahçe evdeki formunu korursa şampiyon olur. Kadıköy'de bu sezon sadece 1 yenilgi var. Deplasman maçları sorun ama Kayseri ve Kasımpaşa alınabilir." },
      { authorName: "MehmetGol", content: "Trabzonspor sürprizi devam eder mi yoksa son haftalarda düşer mi? Genç kadro yoğun fikstürde yorulabilir. Ama Fatih Tekke'nin motivasyon gücü müthiş." },
      { authorName: "BurakPredictor", content: "İstatistiklere göre en iyi deplasman performansı Trabzonspor'da. 14 deplasman maçında 8 galibiyet! Bu rakam şaşırtıcı ve şampiyonluk için avantaj." },
    ],
  });

  await createThread({
    title: "Antalyaspor 3-0 Eyüpspor — Küme Düşme Hattı",
    categorySlug: "super-lig-tartismalari",
    prefixLabel: "SORU",
    authorName: "AliTopcu",
    daysAgoVal: 4,
    content: `Antalyaspor evinde Eyüpspor'u 3-0 ile geçti. Küme düşme hattında durum giderek netleşiyor. Sizce hangi takımlar düşecek? Eyüpspor artık çok zor durumda gibi.

Küme düşme hattı:
16. Samsunspor: 28 puan
17. Gençlerbirliği: 25 puan
18. Eyüpspor: 22 puan
19. Kayserispor: 19 puan`,
    replies: [
      { authorName: "MehmetGol", content: "Eyüpspor ve Kayserispor gidici gibi görünüyor. Eyüpspor'un kalan fikstürü çok zor, toparlanması neredeyse imkansız." },
      { authorName: "BurakPredictor", content: "Gençlerbirliği de tehlikeli bölgede. Son 5 maçta 0 galibiyet var. Moral çok düşük, teknik direktör değişikliği bile fayda etmedi." },
      { authorName: "ZeynepBahis", content: "Samsunspor son haftalarda puan toplamaya başladı, kurtulabilir. Ersin hoca geldiğinden beri takım farklı oynuyor." },
    ],
  });

  await createThread({
    title: "29. Hafta Maç Programı ve Tahminler",
    categorySlug: "super-lig-tartismalari",
    prefixLabel: "TAKTİK",
    authorName: "BurakPredictor",
    daysAgoVal: 1,
    content: `29. hafta maçları geliyor! Kritik karşılaşmalar:

📅 8 Nisan: Göztepe - Galatasaray (21:00)
📅 10 Nisan: Beşiktaş - Antalyaspor (20:00)
📅 11 Nisan: Kayserispor - Fenerbahçe (19:00)
📅 11 Nisan: Alanyaspor - Trabzonspor (21:45)

Tahminlerinizi paylaşın! Bu hafta şampiyonluk yarışında kritik bir dönüm noktası olabilir.`,
    replies: [
      { authorName: "FatihKupon", content: "Göztepe - GS zor maç, Göztepe evinde bu sezon çok iyi. Son 5 ev maçında 4 galibiyet var. GS dikkatli olmalı." },
      { authorName: "ZeynepBahis", content: "Kayserispor - FB kolay olmalı ama Kayseri deplasmanı her zaman sıkıntılı. Yükseklik ve saha koşulları avantaj yaratıyor." },
      { authorName: "DerinAnaliz", content: "Alanyaspor - TS dengeli maç olur. Alanya evinde güçlü ama Trabzonspor deplasmanları bu sezon müthiş. 2-2 bekliyorum." },
    ],
  });

  // ===== BAHİS & KUPON =====

  await createThread({
    title: "29. Hafta Banko Maçlar — 8-11 Nisan",
    categorySlug: "banko-maclar",
    prefixLabel: "BANKO",
    authorName: "FatihKupon",
    daysAgoVal: 1,
    hoursOffset: 3,
    content: `Bu haftanın banko maç önerileri:

1️⃣ Kayserispor - Fenerbahçe → MS 2 (oran 1.45) — Fenerbahçe formda
2️⃣ Beşiktaş - Antalyaspor → MS 1 (oran 1.55) — Beşiktaş evinde toparlanmalı
3️⃣ Rizespor - Samsunspor → KG VAR (oran 1.65) — İki takım da gole açık

Bu 3'lü kombine oran: 3.70

⚠️ Bu paylaşımlar yatırım tavsiyesi değildir. Sorumlu oynayın.`,
    replies: [
      { authorName: "ZeynepBahis", content: "FB banko ama Kayseri deplasmanı her zaman zor. Yükseklik farkı oyuncuları etkiliyor, ilk yarı dikkat etmek lazım." },
      { authorName: "BurakPredictor", content: "Beşiktaş son haftada çok kötüydü, riskli. Ama evinde oynaması avantaj, taraftar desteği moral verir." },
      { authorName: "AliTopcu", content: "KG VAR güzel seçim, ben de ekliyorum kuponuma. İki takımın da savunması zayıf, gol olmama ihtimali düşük." },
      { authorName: "MehmetGol", content: "Oran düşük ama güvenli kombine. Tek maç yerine 3'lü kombine risk dağıtımı açısından mantıklı." },
    ],
  });

  await createThread({
    title: "Haftalık Süper Kombine — 12.80 Oran",
    categorySlug: "kupon-paylasimlari",
    prefixLabel: "KUPON",
    authorName: "HakanVIP",
    daysAgoVal: 1,
    hoursOffset: 1,
    isPinned: true,
    content: `🎯 VIP HAFTALIK KOMBİNE KUPON 🎯

1. Göztepe - Galatasaray → MS 2 + 1.5 Üst (1.50)
2. Kayserispor - Fenerbahçe → MS 2 (1.45)
3. Beşiktaş - Antalyaspor → MS 1 + 2.5 Alt (1.80)
4. Konyaspor - F.Karagümrük → KG VAR (1.70)
5. Alanyaspor - Trabzonspor → İY/MS: X/2 (2.90)

Toplam oran: 12.80

Son 4 haftada 3 kuponum tuttu ✅
Geçen hafta 8.50'lik kupon da geldi ✅

⚠️ Yatırım tavsiyesi değildir. Sorumlu oynayın.`,
    replies: [
      { authorName: "FatihKupon", content: "Hoca yine güzel kupon hazırlamış, takipteyim! Son haftalardaki isabet oranın gerçekten etkileyici." },
      { authorName: "MehmetGol", content: "Beşiktaş 2.5 alt riskli, son maçlarda goller var. Son 4 maçta toplam 14 gol atıldı, üst gelebilir." },
      { authorName: "DerinAnaliz", content: "Trabzonspor İY/MS cesur seçim, beğendim. Trabzonspor deplasmanda genelde yavaş başlıyor ama ikinci yarıda açılıyor." },
      { authorName: "ZeynepBahis", content: "Ben GS maçını çıkardım, Göztepe evinde tehlikeli. Göztepe evinde 3 maçtır yenilmiyor, riskli bahis." },
      { authorName: "AliTopcu", content: "12.80 güzel oran, tutarsa harika olur. Ben 4'lüsünü oynadım, GS maçını çıkardım." },
    ],
  });

  await createThread({
    title: "Günlük Tek Maç Kuponu — 8 Nisan",
    categorySlug: "kupon-paylasimlari",
    prefixLabel: "KUPON",
    authorName: "ZeynepBahis",
    daysAgoVal: 0,
    hoursOffset: 5,
    content: `Bugünün tek maçı: Göztepe - Galatasaray

Benim tahminim: MS 2 + 2.5 Üst → Oran: 1.85

Galatasaray Trabzonspor yenilgisinin ardından bu maçta reaksiyon gösterecek. Göztepe evinde güçlü ama GS'nin kadro kalitesi fark yaratır. Okan Buruk'un bu tip kritik maçlarda hep doğru hamleleri yaptığını düşünüyorum.

⚠️ Yatırım tavsiyesi değildir.`,
    replies: [
      { authorName: "FatihKupon", content: "GS toparlanır bence de, 2-1 bekliyorum. Icardi bu tip maçlarda her zaman golünü atıyor." },
      { authorName: "BurakPredictor", content: "Dikkat Göztepe evinde 3 maçtır yenilmiyor. İstatistikler GS lehine ama ev sahibi avantajı güçlü." },
      { authorName: "AliTopcu", content: "MS 1X çifte şans daha güvenli. Göztepe'yi küçümsemeyin, bu sezon evde sadece 2 mağlubiyet var." },
    ],
  });

  // ===== TAKTİK ANALİZLER =====

  await createThread({
    title: "Kante Etkisi — Fenerbahçe'nin Dönüşümü",
    categorySlug: "mac-tahminleri",
    prefixLabel: "ANALİZ",
    authorName: "DerinAnaliz",
    daysAgoVal: 4,
    hoursOffset: 2,
    content: `N'Golo Kante, Premier Lig'den Süper Lig'e geldiğinde birçok kişi şüpheliydi. Ama bu sezon gösterdiği performansla Fenerbahçe'nin şampiyonluk şansını tekrar canlandırdı.

İstatistikler:
📊 Maç başına 8.2 top kapma
📊 92% pas isabeti
📊 11.4 km koşu mesafesi
📊 Beşiktaş derbisinde 12 top kapma — sezonun rekoru

Tedesco'nun sistemi tamamen Kante üzerine kurulu. Kante hem defansif hem ofansif olarak takımın kalbi. Onun olmadığı maçlarda Fenerbahçe tamamen farklı bir takım.`,
    replies: [
      { authorName: "AyseAnalizci", content: "Kante bu ligde uzaylı gibi, başka seviye. Premier Lig'deki yıpranmışlığı burada hiç hissedilmiyor. 33 yaşında ama 25 yaşında gibi oynuyor." },
      { authorName: "MehmetGol", content: "Premier Lig'deki yıpranmışlığı burada hiç hissedilmiyor. Aslında Al-Ittihad'da da iyi oynuyordu ama Süper Lig'de tamamen fark yaratıyor." },
      { authorName: "FatihKupon", content: "Galatasaray'ın benzer bir transfer yapması lazım. Orta saha kalitesi şampiyonluk yarışında belirleyici olacak." },
      { authorName: "BurakPredictor", content: "Kante'nin maç başına koşu mesafesi 11.4 km — bu 33 yaşında bir oyuncu için inanılmaz. Fiziksel kapasitesi hâlâ üst düzey." },
    ],
  });

  await createThread({
    title: "Fatih Tekke'nin Trabzonspor Mucizesi",
    categorySlug: "super-lig-tartismalari",
    prefixLabel: "TAKTİK",
    authorName: "AyseAnalizci",
    daysAgoVal: 3,
    hoursOffset: 5,
    content: `Geçen sezon küme düşme hattının 5 puan üstünde devraldığı takımı bu sezon şampiyonluk yarışına soktu. Fatih Tekke, Trabzonspor'da nasıl bir dönüşüm yarattı?

Dönüşümün 3 sütunu:
1️⃣ Taktik: 3-4-3 sisteminden 4-2-3-1'e geçiş. Daha kompakt ve organize bir takım.
2️⃣ Gençler: Akademiden çıkan 4 oyuncu A takımda düzenli oynuyor. Ortalama yaş 24.2'ye düştü.
3️⃣ Deplasman: 14 deplasmanda 8 galibiyet — ligin en iyisi!

Fatih Tekke'nin en büyük başarısı takıma kimlik kazandırması. Her oyuncu görevini biliyor ve takım olarak mücadele ediyor.`,
    replies: [
      { authorName: "DerinAnaliz", content: "Fatih Tekke yerli hoca olarak gurur veriyor. Yabancı hoca modası bitmeli, yerli hocalarımız da başarılı olabiliyor." },
      { authorName: "MehmetGol", content: "Trabzonspor'un gençleri bu sezon patlama yaptı. Akademi mezunlarının katkısı büyük, gelecek için de umut verici." },
      { authorName: "AliTopcu", content: "Eğer şampiyon olurlarsa Türk futbol tarihine geçer. Bütçesi en düşük olan takımın şampiyon olması mucize olur." },
      { authorName: "BurakPredictor", content: "Deplasman istatistikleri inanılmaz. 14 maçta 8 galibiyet, 4 beraberlik, sadece 2 mağlubiyet. Bu rakamlar şampiyon takım rakamları." },
    ],
  });

  // ===== CASINO & SLOT =====

  await createThread({
    title: "Sweet Bonanza vs Gates of Olympus — Hangisi Daha İyi?",
    categorySlug: "slot-oyunlari",
    prefixLabel: "SLOT",
    authorName: "EmreSlot",
    daysAgoVal: 5,
    content: `İki efsanevi Pragmatic Play slotu karşılaştırması!

🍬 Sweet Bonanza:
- RTP: %96.51
- Volatilite: Yüksek
- Max kazanç: 21,175x
- Özellik: Scatter ödemesi, tumble mekaniği

⚡ Gates of Olympus:
- RTP: %96.50
- Volatilite: Yüksek
- Max kazanç: 5,000x
- Özellik: Çarpan mekaniği, Zeus teması

Siz hangisini tercih ediyorsunuz?

⚠️ 18+ | Kumar bağımlılık yapabilir. Sorumlu oynayın. Yardım hattı: 444 0 632`,
    replies: [
      { authorName: "CasinoKral", content: "Gates of Olympus çarpanları çok daha heyecanlı. x500 çarpan geldiğinde adrenalin tavan yapıyor." },
      { authorName: "ZeynepBahis", content: "Sweet Bonanza daha sık bonus veriyor bence. Bonus frekansı daha yüksek, daha uzun oynayabiliyorsun." },
      { authorName: "AliTopcu", content: "İkisi de yüksek volatilite, bütçenizi belirleyin. Stop-loss limiti koymadan oynamayın." },
      { authorName: "HakanVIP", content: "Unutmayın bunlar şans oyunları, strateji sınırlı. RTP uzun vadede kasanın kazanacağını gösteriyor. Eğlence amaçlı oynayın." },
    ],
  });

  await createThread({
    title: "Yeni Çıkan Slot Oyunları — Nisan 2026",
    categorySlug: "slot-oyunlari",
    prefixLabel: "SLOT",
    authorName: "CasinoKral",
    daysAgoVal: 2,
    content: `Nisan ayında çıkan yeni slot oyunlarının incelemesi.

🆕 Pragmatic Play — "Wild Beach Party" (RTP: %96.47)
🆕 NetEnt — "Starburst XXXtreme 2" (RTP: %96.25)
🆕 Play'n GO — "Rise of Olympus Origins" (RTP: %96.20)

Her oyunun tema, mekanik ve RTP değerlendirmesi. Hangisi denemeye değer?

⚠️ 18+ | Bu içerik bilgi amaçlıdır. Sorumlu oyun oynayın. Yardım hattı: 444 0 632`,
    replies: [
      { authorName: "EmreSlot", content: "Pragmatic'in yeni oyunları her zaman güzel oluyor. Wild Beach Party'nin grafikleri çok iyi görünüyor." },
      { authorName: "HakanVIP", content: "RTP oranlarını kontrol etmeden oynamayın. %96'nın altındaki oyunlardan uzak durun." },
      { authorName: "AliTopcu", content: "Bütçe kontrolü her şeyden önemli. Yeni oyun heyecanıyla fazla harcamayın, limit koyun." },
    ],
  });

  await createThread({
    title: "Blackjack Temel Strateji Rehberi (Güncelleme 2026)",
    categorySlug: "casino-stratejileri",
    prefixLabel: null,
    authorName: "EmreSlot",
    daysAgoVal: 6,
    content: `Blackjack'te temel strateji tablosunun güncellenmiş hali.

Temel kurallar:
- 17+ → Stand
- 11 → Her zaman Double Down
- 8-8 ve A-A → Her zaman Split
- 10-10 → Asla Split yapma
- 16 vs Dealer 10 → Surrender (varsa)

Unutmayın: temel strateji kasa avantajını %0.5'e kadar azaltır ama ortadan kaldırmaz. Kasa HER ZAMAN avantajlıdır.

⚠️ 18+ | Kumar bağımlılık yapabilir. Yardım hattı: 444 0 632`,
    replies: [
      { authorName: "CasinoKral", content: "Güzel rehber, yeni başlayanlar için çok faydalı. Temel strateji bilmeden blackjack oynamak para çöpe atmaktır." },
      { authorName: "HakanVIP", content: "Kasa avantajını sıfırlayamazsınız, bunu unutmayın. Eğlence amaçlı oynayın, gelir kaynağı olarak görmeyin." },
      { authorName: "ZeynepBahis", content: "Sorumlu oyun en önemli kural. Kaybetmeyi göze alamayacağınız parayla oynamayın." },
    ],
  });

  // ===== UEFA & AVRUPA KUPALARI =====

  await createThread({
    title: "Şampiyonlar Ligi Çeyrek Final Eşleşmeleri — Devler Sahada!",
    categorySlug: "uefa-avrupa-kupalari",
    prefixLabel: "ANALİZ",
    authorName: "DerinAnaliz",
    daysAgoVal: 2,
    hoursOffset: 1,
    isHot: true,
    content: `Şampiyonlar Ligi çeyrek final eşleşmeleri belli oldu! Bu hafta oynanan maçlar:

📅 7 Nisan: Sporting CP - Arsenal | Real Madrid - Bayern Münih
📅 8 Nisan: Barcelona - Atletico Madrid | PSG - Liverpool

🔥 Real Madrid ve Bayern 29. kez karşı karşıya — Avrupa futbol tarihinin en çok tekrarlanan eşleşmesi!

Arsenal, Gyökeres transferiyle güçlendi ve favori gösteriliyor. Bayern son 16'da 10-2 ile geçti — korkunç form! PSG-Liverpool geçen sezon penaltılarla ayrıldı, bu sefer de çekişmeli olacak.

Final 30 Mayıs'ta Budapeşte Puskás Arena'da oynanacak. 🏟️`,
    replies: [
      { authorName: "MehmetGol", content: "Arsenal bu sene alır bence, Gyökeres bambaşka bir seviyede. 45 gol 15 asist — Avrupa'nın en etkili forveti şu an." },
      { authorName: "AyseAnalizci", content: "Real Madrid - Bayern her zaman efsane maçlar çıkarıyor. 29. karşılaşma, ikisi de birbirini çok iyi tanıyor." },
      { authorName: "FatihKupon", content: "PSG-Liverpool geçen sene de elenme turu oynamışlardı, PSG kazanmıştı. Kvaratskhelia bu sezon PSG'de patlama yaptı." },
      { authorName: "BurakPredictor", content: "Barcelona - Atletico çok fiziksel geçer, Simeone'nin planı önemli. İspanyol derbisi her zaman taktik savaşı olur." },
      { authorName: "ZeynepBahis", content: "Bayern 10-2 ile geçti son 16'yı, bu istatistik korkunç. Ama Real Madrid Bernabéu'da farklı bir takım." },
      { authorName: "AliTopcu", content: "Galatasaray elenmese bu tabloda olabilirdi. Liverpool'a 4-1 yenilmek acı ama güzel bir kampanyaydı." },
    ],
  });

  await createThread({
    title: "Galatasaray'ın Şampiyonlar Ligi Macerası — Nerede Hata Yaptık?",
    categorySlug: "uefa-avrupa-kupalari",
    prefixLabel: "TAKTİK",
    authorName: "AyseAnalizci",
    daysAgoVal: 5,
    hoursOffset: 3,
    content: `Galatasaray bu sezon Şampiyonlar Ligi'nde güzel bir yolculuk yaşadı.

Unutulmaz anlar:
✅ Lig aşaması: Atletico Madrid ile 1-1 berabere
✅ İstanbul'da Liverpool'u 1-0 yenmek
✅ Playoff: Juventus'u toplam 7-5 ile elemek (muhteşem!)
❌ Son 16: Liverpool'a toplam 4-1 ile elendik

Liverpool'un baskı oyunu ve orta saha üstünlüğü belirleyici oldu. Savunma hataları ve deplasmandaki düşük performans farkı ortaya koydu.

Gelecek sezon için neler değişmeli?`,
    replies: [
      { authorName: "DerinAnaliz", content: "Juventus maçları efsaneydi ama Liverpool bambaşka seviye. Şampiyonlar Ligi'nde üst seviye takımlarla oynamak için kadro derinliği şart." },
      { authorName: "MehmetGol", content: "Orta sahada kalite eksikliği var, transfer şart. Liverpool orta sahada bizi ezdi, Kante gibi bir oyuncu lazım bize de." },
      { authorName: "FatihKupon", content: "Galatasaray lig aşamasında çok güzel oynadı, gurur duyulacak kampanya. Liverpool İstanbul'daki maç tarih yazıldı." },
      { authorName: "AliTopcu", content: "Liverpool'a karşı defansif yaklaşım hataydı, daha cesur olmalıydık. İstanbul'daki gibi cesur oynasaydık farklı olabilirdi." },
    ],
  });

  await createThread({
    title: "Real Madrid - Bayern Münih — Çeyrek Final İlk Maç",
    categorySlug: "uefa-avrupa-kupalari",
    prefixLabel: "CANLI",
    authorName: "MehmetGol",
    daysAgoVal: 1,
    hoursOffset: 2,
    content: `Avrupa futbolunun en büyük klasiklerinden biri! Real Madrid, Santiago Bernabéu'da Bayern Münih'i ağırlıyor.

İki takım Avrupa kupalarında 29. kez karşı karşıya. Bayern bu sezon inanılmaz formda — son 16'da 10-2 ile geçti! Real Madrid ise Manchester City'yi 5-1 ile eledi.

📊 Son 10 karşılaşma: Real Madrid 5G - 2B - 3M
📊 Bernabéu'daki son 5: Real Madrid 4G - 1M
📊 Bayern'in son 10 deplasman: 7G - 2B - 1M

Tahminleriniz?`,
    replies: [
      { authorName: "DerinAnaliz", content: "Bayern bu sezon çok farklı, ama Bernabéu'da Real Madrid kaybetmez. Bu stadyumun büyüsü var, özellikle Şampiyonlar Ligi gecelerinde." },
      { authorName: "AyseAnalizci", content: "Real Madrid'in tecrübesi her şeyin üstünde. 15 Şampiyonlar Ligi kupası — bu tecrübe kritik anlarda fark yaratıyor." },
      { authorName: "FatihKupon", content: "Bayern 10-2 ile geçti son 16'yı, bu istatistik korkunç. Harry Kane bu sezon 42 gol attı, durdurmak çok zor." },
      { authorName: "BurakPredictor", content: "Klasik maç, her zaman gol olur. 2-2 bekliyorum. İki takım da ofansif oynayacak, defansif maç beklemiyorum." },
    ],
  });

  await createThread({
    title: "UEFA Avrupa Ligi Çeyrek Final — Final İstanbul'da!",
    categorySlug: "uefa-avrupa-kupalari",
    prefixLabel: "ANALİZ",
    authorName: "BurakPredictor",
    daysAgoVal: 1,
    hoursOffset: 4,
    content: `Avrupa Ligi çeyrek final eşleşmeleri:

📅 8 Nisan: Braga - Real Betis
📅 9 Nisan: Bologna - Aston Villa | Porto - Nottingham Forest | Freiburg - Celta

🏟️ Final 20 Mayıs'ta İstanbul Beşiktaş Park'ta oynanacak!

Nottingham Forest 30 yıl sonra Avrupa'da ve rüya gibi bir yolculuk yaşıyor. Aston Villa ise Emery ile üst üste üçüncü Avrupa çeyrek finali.

Porto evinde 13 maçta sadece 1 yenilgi aldı — çok güçlü ev sahibi!`,
    replies: [
      { authorName: "MehmetGol", content: "Final İstanbul'da, muhteşem olacak! Beşiktaş Park mükemmel bir stadyum, Avrupa finaline yakışır." },
      { authorName: "AyseAnalizci", content: "Nottingham Forest'ın hikayesi inanılmaz. 30 yıl sonra Avrupa sahnesine döndüler. 1979-80'deki şampiyonluğu hatırlatan bir yolculuk." },
      { authorName: "DerinAnaliz", content: "Porto evinde çok güçlü, 13 maçta 1 yenilgi. Nottingham Forest için çok zor bir deplasman olacak." },
      { authorName: "FatihKupon", content: "Aston Villa favori gibi ama Bologna sürpriz yapabilir. Emery Avrupa'da çok tecrübeli, 4 kez Avrupa Ligi kazandı." },
    ],
  });

  await createThread({
    title: "Şampiyonlar Ligi Çeyrek Final Kuponları",
    categorySlug: "kupon-paylasimlari",
    prefixLabel: "KUPON",
    authorName: "FatihKupon",
    daysAgoVal: 1,
    content: `🎯 Şampiyonlar Ligi Çeyrek Final Özel Kuponu 🎯

7 Nisan:
1. Sporting CP - Arsenal → MS 2 (1.60) — Arsenal çok favori
2. Real Madrid - Bayern Münih → KG VAR + 2.5 Üst (1.55)

8 Nisan:
3. Barcelona - Atletico Madrid → MS 1 (1.85)
4. PSG - Liverpool → MS 1 (2.10)

Tekli oranlar ve kombine seçenekleri:
- İkili: Arsenal + KG VAR → 2.48
- Dörtlü kombine: 9.20

⚠️ Yatırım tavsiyesi değildir. Sorumlu oynayın.`,
    replies: [
      { authorName: "ZeynepBahis", content: "Arsenal banko gibi ama Sporting evinde tehlikeli olabilir. Gyökeres eski takımına karşı oynuyor, motivasyon ekstra olacak." },
      { authorName: "DerinAnaliz", content: "Real Madrid - Bayern KG VAR çok güzel seçim. Bu iki takım karşılaştığında hep gol oluyor, son 10 maçta ortalama 3.8 gol." },
      { authorName: "AliTopcu", content: "PSG evinde MS 1 riskli, Liverpool güçlü. Liverpool deplasmanda çok etkili, PSG'yi zorlayacaktır." },
      { authorName: "BurakPredictor", content: "Barcelona - Atletico en zor maç, ben çifte şans oynardım. Simeone her zaman büyük maçlarda sürpriz yapabiliyor." },
    ],
  });

  // ===== GENEL =====

  await createThread({
    title: "Euro 2028 Aday Şehirler Belli Oldu mu?",
    categorySlug: "serbest-kursu",
    prefixLabel: "SORU",
    authorName: "AliTopcu",
    daysAgoVal: 4,
    hoursOffset: 6,
    content: `Türkiye'nin Euro 2028 adaylığı hakkında gelişmeler var mı? Hangi şehirler ve stadyumlar aday? Bilgisi olan var mı?

Türkiye daha önce 2008, 2012, 2016 ve 2024 için aday olmuştu ama kazanamamıştı. Bu sefer şansımız daha yüksek gibi görünüyor.`,
    replies: [
      { authorName: "MehmetGol", content: "Türkiye bu sefer güçlü aday gibi görünüyor. UEFA ile ilişkiler iyi, stadyum altyapısı da gelişti." },
      { authorName: "BurakPredictor", content: "İstanbul, Ankara, İzmir kesinlikle olacak. Artı Bursa, Konya ve Antalya da aday şehirler arasında diye biliyorum." },
      { authorName: "DerinAnaliz", content: "Yeni stadyumlar da yapılıyor bildiğim kadarıyla. Özellikle İzmir'deki yeni stadyum projesi çok konuşuluyor." },
    ],
  });

  await createThread({
    title: "Bahis Dünyasına Yeni Başlayanlar İçin Rehber (2026 Güncellemesi)",
    categorySlug: "serbest-kursu",
    prefixLabel: null,
    authorName: "HakanVIP",
    daysAgoVal: 6,
    isPinned: true,
    content: `Bahis terimleri, kupon okuma, oran hesaplama, bankroll yönetimi ve sorumlu oyun hakkında kapsamlı rehber. Yeni başlayanların mutlaka okuması gereken konu.

📖 Temel Terimler:
- MS: Maç Sonucu (1, X, 2)
- KG: Karşılıklı Gol (Var/Yok)
- İY: İlk Yarı sonucu
- Alt/Üst: Toplam gol sayısı tahmini
- Handikap: Skor avantajı/dezavantajı
- Kombine: Birden fazla maçın tek kuponda birleştirilmesi
- Sistem: Birden fazla kombine seçeneği
- Canlı Bahis: Maç devam ederken yapılan bahis

💰 Bankroll Yönetimi:
- Günlük/haftalık bütçe belirleyin
- Tek kupona toplam bütçenizin %5'inden fazla koymayın
- Kaybettikçe artırmayın (kovalama yapmayın)

⚠️ Bahis bağımlılık yapabilir. Kaybedemeyeceğiniz parayla oynamayın. Yardım hattı: 444 0 632`,
    replies: [
      { authorName: "FatihKupon", content: "Çok faydalı rehber, teşekkürler hocam. Özellikle bankroll yönetimi kısmı altın değerinde." },
      { authorName: "ZeynepBahis", content: "Bankroll yönetimi en önemli konu, kesinlikle okuyun. Çoğu kişi bunu bilmediği için kaybediyor." },
      { authorName: "AliTopcu", content: "Yeni başlayanlara tavsiyem: tek maç oynayın, kombine riskli. Kombine ile para kazanmak çok zor." },
      { authorName: "DerinAnaliz", content: "Güzel özet olmuş. Bir de maç analizi yapmasını öğrenmek önemli. İstatistik sitelerini takip edin." },
    ],
  });

  // ===== LIVE MATCHES =====
  console.log("⚽ Creating live match data...");

  const matches = [
    { league: "Süper Lig", homeTeam: "Göztepe", awayTeam: "Galatasaray", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-08T18:00:00Z") },
    { league: "Süper Lig", homeTeam: "Beşiktaş", awayTeam: "Antalyaspor", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-10T17:00:00Z") },
    { league: "Süper Lig", homeTeam: "Kayserispor", awayTeam: "Fenerbahçe", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-11T16:00:00Z") },
    { league: "Süper Lig", homeTeam: "Alanyaspor", awayTeam: "Trabzonspor", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-11T18:45:00Z") },
    { league: "Süper Lig", homeTeam: "Trabzonspor", awayTeam: "Galatasaray", homeScore: 2, awayScore: 1, minute: 90, status: "finished", startTime: new Date("2026-04-05T18:00:00Z") },
    { league: "Süper Lig", homeTeam: "Fenerbahçe", awayTeam: "Beşiktaş", homeScore: 1, awayScore: 0, minute: 90, status: "finished", startTime: new Date("2026-04-03T18:00:00Z") },
    { league: "Şampiyonlar Ligi", homeTeam: "Sporting CP", awayTeam: "Arsenal", homeScore: 0, awayScore: 1, minute: 35, status: "live", startTime: new Date("2026-04-07T19:00:00Z") },
    { league: "Şampiyonlar Ligi", homeTeam: "Real Madrid", awayTeam: "Bayern Münih", homeScore: 1, awayScore: 1, minute: 62, status: "live", startTime: new Date("2026-04-07T19:00:00Z") },
    { league: "Şampiyonlar Ligi", homeTeam: "Barcelona", awayTeam: "Atletico Madrid", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-08T19:00:00Z") },
    { league: "Şampiyonlar Ligi", homeTeam: "PSG", awayTeam: "Liverpool", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-08T19:00:00Z") },
    { league: "Avrupa Ligi", homeTeam: "Braga", awayTeam: "Real Betis", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-08T17:45:00Z") },
    { league: "Avrupa Ligi", homeTeam: "Porto", awayTeam: "Nottingham Forest", homeScore: 0, awayScore: 0, minute: 0, status: "upcoming", startTime: new Date("2026-04-09T19:00:00Z") },
  ];

  for (const m of matches) {
    await prisma.liveMatch.create({ data: m });
  }

  console.log("✅ Live matches created");

  // Count totals
  const threadCount = await prisma.thread.count();
  const postCount = await prisma.post.count();
  const reactionCount = await prisma.reaction.count();

  console.log(`\n🎉 Content population completed!`);
  console.log(`   📋 ${threadCount} threads`);
  console.log(`   💬 ${postCount} posts`);
  console.log(`   👍 ${reactionCount} reactions`);
  console.log(`   ⚽ ${matches.length} live matches`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
