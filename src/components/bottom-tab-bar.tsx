"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

const TABS = [
  { href: "/", label: "Ana Sayfa", icon: "🏠", auth: false },
  { href: "/haberler", label: "Haberler", icon: "📰", auth: true },
  { href: "/canli-skorlar", label: "Skorlar", icon: "⚽", auth: true },
  { href: "/sohbet", label: "Sohbet", icon: "💬", auth: true },
  { href: "/profil", label: "Profil", icon: "👤", auth: false },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const { dbUser } = useAuth();

  const getHref = (tab: typeof TABS[0]) => {
    if (tab.href === "/profil") return dbUser ? `/profil/${dbUser.username}` : "/giris";
    if (tab.auth && !dbUser) return "/giris";
    return tab.href;
  };

  const isActive = (tab: typeof TABS[0]) => {
    if (tab.href === "/") return pathname === "/";
    if (tab.href === "/profil") return pathname.startsWith("/profil");
    return pathname.startsWith(tab.href);
  };

  return (
    <nav
      className="flex md:hidden"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 56,
        backgroundColor: "#131820",
        borderTop: "1px solid #1e293b",
        zIndex: 9998,
        WebkitTapHighlightColor: "transparent",
      } as React.CSSProperties}
    >
      {TABS.map((tab) => {
        const active = isActive(tab);
        return (
          <Link
            key={tab.href}
            href={getHref(tab)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              color: active ? "var(--accent-green)" : "#64748b",
              textDecoration: "none",
              touchAction: "manipulation",
              userSelect: "none",
              WebkitUserSelect: "none",
              minHeight: 44,
              cursor: "pointer",
            } as React.CSSProperties}
          >
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 500 }}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
