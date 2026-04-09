"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useState, useEffect } from "react";

const TABS = [
  { href: "/", label: "Ana Sayfa", icon: "🏠", authRequired: false },
  { href: "/haberler", label: "Haberler", icon: "📰", authRequired: true },
  { href: "/canli-skorlar", label: "Skorlar", icon: "⚽", authRequired: true },
  { href: "/tahminler", label: "Tahmin", icon: "🎯", authRequired: true },
  { href: "/profil", label: "Profil", icon: "👤", authRequired: false },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const { dbUser } = useAuth();
  const [hasLive, setHasLive] = useState(false);

  // Check for live matches (for badge on Skorlar tab)
  useEffect(() => {
    fetch("/api/live-scores")
      .then((r) => r.json())
      .then((d) => {
        const live = (d.matches || []).some((m: { status: string }) => m.status === "live" || m.status === "ht");
        setHasLive(live);
      })
      .catch(() => {});
  }, []);

  const getHref = (tab: typeof TABS[0]) => {
    if (tab.href === "/profil") {
      return dbUser ? `/profil/${dbUser.username}` : "/giris";
    }
    if (tab.authRequired && !dbUser) return "/giris";
    return tab.href;
  };

  const isActive = (tab: typeof TABS[0]) => {
    if (tab.href === "/") return pathname === "/";
    if (tab.href === "/profil") return pathname.startsWith("/profil");
    return pathname.startsWith(tab.href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden flex items-end"
      style={{
        zIndex: 998,
        backgroundColor: "#131820",
        borderTop: "1px solid #1e293b",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {TABS.map((tab) => {
        const active = isActive(tab);
        const href = getHref(tab);
        return (
          <Link
            key={tab.href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors"
            style={{ color: active ? "#1f844e" : "#64748b", minHeight: 56 }}
          >
            <span className="relative text-[20px]">
              {tab.icon}
              {tab.href === "/canli-skorlar" && hasLive && (
                <span
                  className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full animate-pulse"
                  style={{ backgroundColor: "#ef4444" }}
                />
              )}
            </span>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
