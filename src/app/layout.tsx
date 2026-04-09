import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import { AuthProvider } from "@/providers/auth-provider";
import { HeaderAuth } from "@/components/header-auth";
// ThemeToggle removed — dark mode only (light mode needs full inline-style refactor)
import { ScrollToTop } from "@/components/scroll-to-top";
import { CookieConsent } from "@/components/cookie-consent";
import { MobileMenu } from "@/components/mobile-menu";
import { ToastProvider } from "@/components/toast";
import { LiveTicker } from "@/components/live-ticker";
import { LiveNavLink } from "@/components/live-nav-link";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rekorforum.com"),
  title: { default: "Rekor Forum — Spor Tartışma Platformu", template: "%s | Rekor Forum" },
  description: "Türkiye'nin en aktif spor topluluğu. Maç analizleri, kupon paylaşımları, canlı skorlar ve spor haberleri.",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://rekorforum.com",
    siteName: "Rekor Forum",
    title: "Rekor Forum — Spor Tartışma Platformu",
    description: "Türkiye'nin en aktif spor topluluğu.",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Rekor Forum" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rekor Forum",
    description: "Türkiye'nin en aktif spor topluluğu.",
    images: ["/api/og"],
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  themeColor: "#1f844e",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Rekor Forum",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${dmSans.variable} dark h-full antialiased`} data-theme="dark">
      <body className="min-h-full flex flex-col bg-bg-deep text-text-primary font-sans">
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');`}
            </Script>
          </>
        )}
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
              <Link href="/" className="rounded-md px-3 py-1.5 text-sm font-medium text-text-secondary transition-all duration-150 hover:bg-bg-hover hover:text-text-primary">Ana Sayfa</Link>
              <Link href="/haberler" className="rounded-md px-3 py-1.5 text-sm font-medium text-text-secondary transition-all duration-150 hover:bg-bg-hover hover:text-text-primary">Haberler</Link>
              <Link href="/tahminler" className="rounded-md px-3 py-1.5 text-sm font-medium text-text-secondary transition-all duration-150 hover:bg-bg-hover hover:text-text-primary">Tahminler</Link>
              <LiveNavLink />
              <Link href="/mesajlar" className="rounded-md px-3 py-1.5 text-sm font-medium text-text-secondary transition-all duration-150 hover:bg-bg-hover hover:text-text-primary">Mesajlar</Link>
            </nav>

            {/* Right: theme toggle + auth */}
            <div className="flex items-center gap-1">
              {/* ThemeToggle removed — dark mode only */}
              <HeaderAuth />
            </div>
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
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-text-muted">
              <Link href="/kurallar" className="hover:text-text-secondary transition-colors">Kurallar</Link>
              <span>·</span>
              <Link href="/gizlilik" className="hover:text-text-secondary transition-colors">Gizlilik</Link>
              <span>·</span>
              <Link href="/kullanim-sartlari" className="hover:text-text-secondary transition-colors">Kullanım Şartları</Link>
              <span>·</span>
              <Link href="/kvkk" className="hover:text-text-secondary transition-colors">KVKK</Link>
            </div>
          </div>
        </footer>
        <CookieConsent />
        <ScrollToTop />
        </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
