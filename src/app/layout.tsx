import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Rekor Forum - Spor ve Bahis Tartisma Platformu",
  description:
    "Turkiye'nin en buyuk spor ve bahis tartisma forumu. Canli skorlar, tahminler ve daha fazlasi.",
};

const liveScores = [
  "Galatasaray 2 - 1 Fenerbahce",
  "Besiktas 0 - 0 Trabzonspor",
  "Barcelona 3 - 2 Real Madrid",
  "Liverpool 1 - 0 Man City",
  "PSG 2 - 2 Bayern Munich",
  "Juventus 1 - 3 Inter Milan",
  "Ajax 0 - 1 Feyenoord",
  "Adana Demirspor 2 - 0 Antalyaspor",
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${dmSans.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg-deep text-foreground font-sans">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-bg-base/95 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-0.5 text-2xl font-bold tracking-tight">
              <span className="text-accent-green">REKOR</span>
              <span className="text-white">FORUM</span>
            </Link>

            {/* Nav Links */}
            <nav className="hidden items-center gap-8 md:flex">
              <Link
                href="/forum"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-white"
              >
                Forum
              </Link>
              <Link
                href="/canli-skorlar"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-white"
              >
                Canli Skorlar
              </Link>
              <Link
                href="/mesajlar"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-white"
              >
                Mesajlar
              </Link>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Link
                href="/giris"
                className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-white"
              >
                Giris Yap
              </Link>
              <Link
                href="/kayit"
                className="rounded-md bg-accent-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-green/90"
              >
                Kayit Ol
              </Link>
            </div>
          </div>

          {/* Live Score Ticker */}
          <div className="overflow-hidden border-t border-white/5 bg-accent-green/10">
            <div className="flex items-center">
              <div className="z-10 shrink-0 bg-accent-green px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
                Canli
              </div>
              <div className="relative flex-1 overflow-hidden">
                <div className="animate-ticker flex w-max items-center gap-8 py-1.5">
                  {/* Duplicate the scores for seamless loop */}
                  {[...liveScores, ...liveScores].map((score, i) => (
                    <span
                      key={i}
                      className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground"
                    >
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse" />
                      {score}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-border bg-bg-base">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
            <p className="text-sm text-muted-foreground">
              Rekor Forum &copy; 2024
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
