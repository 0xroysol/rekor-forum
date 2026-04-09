"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

const navLinks = [
  { href: "/", label: "Ana Sayfa", icon: "🏠" },
  { href: "/haberler", label: "Haberler", icon: "📰" },
  { href: "/tahminler", label: "Tahminler", icon: "🎯" },
  { href: "/canli-skorlar", label: "Canlı Skorlar", icon: "⚽" },
  { href: "/mesajlar", label: "Mesajlar", icon: "💬" },
  { href: "/konu/olustur", label: "Yeni Konu", icon: "✏️" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { dbUser, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-bg-hover"
        aria-label="Menüyü aç"
        style={{ color: "#94a3b8" }}
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Full screen overlay + panel */}
      {open && (
        <div className="fixed inset-0" style={{ zIndex: 999 }}>
          {/* Dark overlay — click to close */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
            onClick={() => setOpen(false)}
          />

          {/* Slide-in panel */}
          <div
            className="absolute left-0 top-0 h-full flex flex-col"
            style={{
              width: 280,
              backgroundColor: "#131820",
              borderRight: "1px solid #1e293b",
              animation: "slideInLeft 200ms ease-out",
            }}
          >
            {/* Header: logo + close */}
            <div className="flex h-14 items-center justify-between px-5 flex-shrink-0" style={{ borderBottom: "1px solid #1e293b" }}>
              <Link href="/" onClick={() => setOpen(false)} className="text-lg font-bold tracking-tight">
                <span style={{ color: "#1f844e" }}>Rekor</span>
                <span className="text-white">Forum</span>
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold transition-colors hover:bg-[#1e2738]"
                style={{ color: "#94a3b8" }}
              >
                ✕
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto py-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 transition-colors hover:bg-[#1e2738]"
                  style={{
                    height: 48,
                    padding: "0 20px",
                    fontSize: 15,
                    color: "#e2e8f0",
                    borderBottom: "1px solid #1e293b",
                  }}
                >
                  <span className="text-base">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>

            {/* Bottom: user section */}
            <div className="flex-shrink-0" style={{ borderTop: "1px solid #1e293b" }}>
              {dbUser ? (
                <div className="p-4">
                  {/* User info */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: "#1f844e30", color: "#1f844e" }}
                    >
                      {dbUser.avatar ? (
                        <img src={dbUser.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        dbUser.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: "#e2e8f0" }}>{dbUser.username}</div>
                      <div className="text-xs" style={{ color: "#64748b" }}>{dbUser.role}</div>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/profil/${dbUser.username}`}
                      onClick={() => setOpen(false)}
                      className="flex-1 rounded-lg py-2 text-center text-sm font-medium transition-colors hover:bg-[#1e2738]"
                      style={{ color: "#94a3b8", border: "1px solid #1e293b" }}
                    >
                      Profilim
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex-1 rounded-lg py-2 text-center text-sm font-medium transition-colors hover:bg-[#ef4444]/10"
                      style={{ color: "#ef4444", border: "1px solid #1e293b" }}
                    >
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 flex gap-2">
                  <Link
                    href="/giris"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-lg py-2.5 text-center text-sm font-medium text-white transition-colors hover:brightness-110"
                    style={{ backgroundColor: "#1f844e" }}
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    href="/kayit"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-lg py-2.5 text-center text-sm font-medium transition-colors hover:bg-[#1e2738]"
                    style={{ color: "#94a3b8", border: "1px solid #1e293b" }}
                  >
                    Kayıt Ol
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
