"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

const NAV_LINKS = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/haberler", label: "Haberler" },
  { href: "/tahminler", label: "Tahminler" },
  { href: "/canli-skorlar", label: "Canlı Skorlar" },
  { href: "/mesajlar", label: "Mesajlar" },
];

const FORUM_LINKS = [
  { href: "/forum/super-lig-tartismalari", label: "Süper Lig Tartışmaları" },
  { href: "/forum/uefa-avrupa-kupalari", label: "UEFA & Avrupa Kupaları" },
  { href: "/forum/transfer-soylentileri", label: "Transfer Söylentileri" },
  { href: "/forum/mac-tahminleri", label: "Maç Tahminleri" },
  { href: "/forum/kupon-paylasimlari", label: "Kupon Paylaşımları" },
  { href: "/forum/slot-oyunlari", label: "Slot Oyunları" },
  { href: "/forum/casino-stratejileri", label: "Casino Stratejileri" },
  { href: "/forum/serbest-kursu", label: "Serbest Kürsü" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { dbUser, logout } = useAuth();
  const router = useRouter();

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const close = () => setOpen(false);

  const handleLogout = async () => {
    close();
    await logout();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ color: "#94a3b8" }}
      >
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Menu overlay + panel */}
      {open && (
        <>
          {/* Overlay — covers entire screen */}
          <div
            onClick={close}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100vh",
              backgroundColor: "rgba(0,0,0,0.8)",
              zIndex: 9999,
            }}
          />

          {/* Panel */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: 280,
              height: "100vh",
              backgroundColor: "#131820",
              zIndex: 10000,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                height: 48,
                padding: "0 20px",
                borderBottom: "1px solid #1e293b",
                flexShrink: 0,
              }}
            >
              <Link href="/" onClick={close} style={{ fontSize: 18, fontWeight: 700 }}>
                <span style={{ color: "#1f844e" }}>Rekor</span>
                <span style={{ color: "#e2e8f0" }}>Forum</span>
              </Link>
              <button
                onClick={close}
                style={{ color: "#94a3b8", fontSize: 20, fontWeight: 700, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ✕
              </button>
            </div>

            {/* Nav Links */}
            <div style={{ flexShrink: 0 }}>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: 48,
                    padding: "0 20px",
                    fontSize: 15,
                    color: "#e2e8f0",
                    borderBottom: "1px solid #1e293b",
                    textDecoration: "none",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Separator + Forum Categories */}
            <div style={{ padding: "12px 20px 8px", flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Forum Kategorileri
              </span>
            </div>
            <div style={{ flexShrink: 0 }}>
              {FORUM_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: 44,
                    padding: "0 20px",
                    fontSize: 14,
                    color: "#94a3b8",
                    borderBottom: "1px solid #1e293b",
                    textDecoration: "none",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Bottom: auth section */}
            <div style={{ padding: 16, borderTop: "1px solid #1e293b", flexShrink: 0 }}>
              {dbUser ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "rgba(31,132,78,0.2)", color: "#1f844e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                      {dbUser.avatar ? <img src={dbUser.avatar} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} /> : dbUser.username.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dbUser.username}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{dbUser.role}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link href={`/profil/${dbUser.username}`} onClick={close} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: 40, borderRadius: 8, fontSize: 14, fontWeight: 500, color: "#94a3b8", border: "1px solid #1e293b", textDecoration: "none" }}>
                      Profilim
                    </Link>
                    <button onClick={handleLogout} style={{ flex: 1, height: 40, borderRadius: 8, fontSize: 14, fontWeight: 500, color: "#ef4444", border: "1px solid #1e293b", backgroundColor: "transparent", cursor: "pointer" }}>
                      Çıkış Yap
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <Link href="/giris" onClick={close} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: 40, borderRadius: 8, fontSize: 14, fontWeight: 500, color: "#fff", backgroundColor: "#1f844e", textDecoration: "none" }}>
                    Giriş Yap
                  </Link>
                  <Link href="/kayit" onClick={close} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: 40, borderRadius: 8, fontSize: 14, fontWeight: 500, color: "#94a3b8", border: "1px solid #1e293b", textDecoration: "none" }}>
                    Kayıt Ol
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
