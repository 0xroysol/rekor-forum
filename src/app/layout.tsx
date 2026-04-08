import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import Link from "next/link";
import { AuthProvider } from "@/providers/auth-provider";
import { HeaderAuth } from "@/components/header-auth";
import { ScrollToTop } from "@/components/scroll-to-top";
import { MobileMenu } from "@/components/mobile-menu";
import { ToastProvider } from "@/components/toast";
import { LiveTicker } from "@/components/live-ticker";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Rekor Forum — Spor & Bahis Tartışma Platformu",
  description:
    "Türkiye'nin en büyük spor ve bahis tartışma forumu. Canlı skorlar, tahminler ve daha fazlası.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${dmSans.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg-deep text-text-primary font-sans">
        <AuthProvider>
        <ToastProvider>
        {/* Header */}
        <header className="sticky top-0 z-50 bg-bg-base/95 backdrop-blur-md">
          {/* Top bar */}
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5">
            {/* Mobile Menu */}
            <MobileMenu />

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #1f844e, #0f5132)" }}
              >
                R
              </div>
              <span className="text-lg font-bold tracking-tight">
                <span style={{ color: "#1f844e" }}>Rekor</span>
                <span className="text-white">Forum</span>
              </span>
            </Link>

            {/* Nav Links */}
            <nav className="hidden items-center gap-1 md:flex">
              {[
                { href: "/", label: "Ana Sayfa" },
                { href: "/canli-skorlar", label: "Canlı Skorlar" },
                { href: "/mesajlar", label: "Mesajlar" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-text-secondary transition-all duration-150 hover:bg-bg-hover hover:text-text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right: auth */}
            <HeaderAuth />
          </div>

          {/* Live Score Ticker — client component, fetches from /api/live-scores */}
          <LiveTicker />
        </header>

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t" style={{ borderColor: "#1e293b" }}>
          <div className="mx-auto max-w-7xl px-5 py-6 text-center">
            <p className="text-sm text-text-muted">
              &copy; 2026 Rekor Forum. Tüm hakları saklıdır.
            </p>
            <p className="mt-1 text-xs text-text-muted">
              18+ | Bu platform casino ve bahis tartışma içerikleri barındırır. Kumar bağımlılık yapabilir.
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-text-muted">
              <Link href="/kurallar" className="hover:text-text-secondary transition-colors">Kurallar</Link>
              <span>·</span>
              <Link href="/gizlilik" className="hover:text-text-secondary transition-colors">Gizlilik</Link>
              <span>·</span>
              <Link href="/kullanim-sartlari" className="hover:text-text-secondary transition-colors">Kullanım Şartları</Link>
              <span>·</span>
              <Link href="/kvkk" className="hover:text-text-secondary transition-colors">KVKK</Link>
              <span>·</span>
              <a href="#" className="hover:text-text-secondary transition-colors">İletişim</a>
              <span>·</span>
              <Link href="/sorumlu-oyun" className="hover:text-text-secondary transition-colors">Sorumlu Oyun</Link>
            </div>
          </div>
        </footer>
        <ScrollToTop />
        </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
