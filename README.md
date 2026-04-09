# Rekor Forum

Turkce spor tartisma platformu. XenForo tarzi modern forum, canli skorlar, AI spor haberleri ve skor tahmin oyunu.

**Canli Demo:** [rekorforum.com](https://rekorforum.com)

## Ozellikler

- **Forum Sistemi** — Kategori, thread, post, prefix, etiket, arama
- **Canli Skorlar** — API-Sports entegrasyonu, Flashscore tarzi UI, mac detaylari
- **Spor Haberleri** — RSS + Gemini AI ile otomatik haber uretimi
- **Skor Tahmini** — Mac skoru tahmin oyunu, liderlik tablosu
- **Auth Sistemi** — Supabase Auth, kayit, giris, profil duzenleme
- **Mesajlasma** — Ozel mesaj sistemi, gercek zamanli polling
- **Moderasyon** — Admin paneli, rapor sistemi, moderasyon araclari
- **Bildirimler** — Yanit, tepki, mention bildirimleri
- **Rank & Rozet** — Otomatik rutbe yukseltme, basari rozetleri
- **Tepki Sistemi** — 8 emoji ile post tepkileri
- **Anket** — Konu ici anket olusturma
- **PWA** — Progressive Web App destegi
- **SEO** — Dinamik meta taglar, sitemap, OG image

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma 7
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Sports API:** API-Sports (Football + Basketball)
- **AI:** Google Gemini (haber uretimi)
- **Editor:** Tiptap (zengin metin editoru)
- **Deploy:** Vercel

## Kurulum

### Gereksinimler
- Node.js 20+
- PostgreSQL veritabani (Supabase onerilir)

### Adimlar

1. Clone
```
git clone https://github.com/0xroysol/rekor-forum.git
cd rekor-forum
```

2. Bagimliliklari yukle
```
npm install
```

3. Environment variables
```
cp .env.example .env.local
# .env.local dosyasini duzenle
```

4. Veritabani
```
npx prisma migrate dev
npx prisma db seed
```

5. Gelistirme sunucusu
```
npm run dev
```

## Environment Variables

| Variable | Aciklama |
|----------|----------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase proje URL'si |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anon key |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key |
| DATABASE_URL | PostgreSQL baglanti URL'si (pooler) |
| DIRECT_URL | PostgreSQL direkt URL (migration icin) |
| API_SPORTS_KEY | API-Sports API anahtari |
| GEMINI_API_KEY | Google Gemini API anahtari |
| CRON_SECRET | Cron job guvenlik anahtari |
| NEXT_PUBLIC_GA_ID | Google Analytics ID (opsiyonel) |

## Lisans

Bu proje ozel kullanim icindir.
