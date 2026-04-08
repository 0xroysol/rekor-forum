"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { SearchModal } from "@/components/search-modal";
import NotificationBell from "@/components/notification-bell";

export function HeaderAuth() {
  const { dbUser, loading, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full animate-pulse" style={{ backgroundColor: "#1a2130" }} />
        <div className="hidden sm:block h-4 w-16 rounded animate-pulse" style={{ backgroundColor: "#1a2130" }} />
      </div>
    );
  }

  if (!dbUser) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/giris"
          className="rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 hover:bg-bg-hover"
          style={{ color: "#94a3b8" }}
        >
          Giriş Yap
        </Link>
        <Link
          href="/kayit"
          className="rounded-md px-3 py-1.5 text-sm font-semibold text-white transition-all duration-150 hover:brightness-110"
          style={{ backgroundColor: "#1f844e" }}
        >
          Kayıt Ol
        </Link>
      </div>
    );
  }

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      {/* Search */}
      <SearchModal />
      {/* Notifications */}
      <NotificationBell />
      {/* Messages */}
      <Link href="/mesajlar" className="flex h-8 w-8 items-center justify-center rounded-md transition-all duration-150 hover:bg-bg-hover" style={{ color: "#64748b" }}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </Link>
      {/* Divider */}
      <div className="mx-1 h-5 w-px" style={{ backgroundColor: "#1e293b" }} />
      {/* User dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 rounded-md px-2 py-1 transition-all duration-150 hover:bg-bg-hover"
        >
          {dbUser.avatar ? (
            <img src={dbUser.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
          ) : (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
              style={{ backgroundColor: "#1f844e30", color: "#1f844e" }}
            >
              {dbUser.username.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="hidden text-sm font-medium sm:block" style={{ color: "#94a3b8" }}>
            {dbUser.username}
          </span>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ color: "#64748b" }}><path d="m6 9 6 6 6-6"/></svg>
        </button>

        {dropdownOpen && (
          <div
            className="absolute right-0 top-full mt-1 w-48 overflow-hidden py-1 z-50"
            style={{
              backgroundColor: "#131820",
              border: "1px solid #1e293b",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            <Link
              href={`/profil/${dbUser.username}`}
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm transition-colors duration-150 hover:bg-bg-hover"
              style={{ color: "#e2e8f0" }}
            >
              Profilim
            </Link>
            <Link
              href="/kaydedilenler"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm transition-colors duration-150 hover:bg-bg-hover"
              style={{ color: "#e2e8f0" }}
            >
              Kaydedilenler
            </Link>
            <Link
              href="#"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm transition-colors duration-150 hover:bg-bg-hover"
              style={{ color: "#e2e8f0" }}
            >
              Ayarlar
            </Link>
            {(dbUser.role === "ADMIN" || dbUser.role === "MOD") && (
              <>
                <div className="my-1" style={{ borderTop: "1px solid #1e293b" }} />
                <Link
                  href="/yonetim"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm transition-colors duration-150 hover:bg-bg-hover"
                  style={{ color: "#e8a935" }}
                >
                  Yönetim Paneli
                </Link>
              </>
            )}
            <div className="my-1" style={{ borderTop: "1px solid #1e293b" }} />
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors duration-150 hover:bg-bg-hover"
              style={{ color: "#ef4444" }}
            >
              Çıkış Yap
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
