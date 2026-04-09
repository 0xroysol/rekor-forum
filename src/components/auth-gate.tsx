"use client";

import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import type { ReactNode } from "react";

interface AuthGateProps {
  children: ReactNode;
  title?: string;
  description?: string;
  icon?: string;
}

export function AuthGate({
  children,
  title = "Bu İçeriği Görüntülemek İçin Giriş Yapın",
  description = "Ücretsiz hesap oluşturarak tüm özelliklere erişebilirsiniz.",
  icon = "🔒",
}: AuthGateProps) {
  const { dbUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#1f844e", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (dbUser) return <>{children}</>;

  return (
    <div className="flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md" style={{ backgroundColor: "#131820", border: "1px solid #1e293b", borderRadius: "16px", padding: "48px 32px" }}>
        <span className="text-5xl block mb-4">{icon}</span>
        <h2 className="text-xl font-bold mb-2" style={{ color: "#e2e8f0" }}>{title}</h2>
        <p className="text-sm mb-6" style={{ color: "#94a3b8" }}>{description}</p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/giris"
            className="rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors hover:brightness-110"
            style={{ backgroundColor: "#1f844e" }}
          >
            Giriş Yap
          </Link>
          <Link
            href="/kayit"
            className="rounded-lg px-6 py-2.5 text-sm font-medium transition-colors hover:bg-[#1e2738]"
            style={{ color: "#94a3b8", border: "1px solid #1e293b" }}
          >
            Kayıt Ol
          </Link>
        </div>
      </div>
    </div>
  );
}
