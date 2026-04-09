"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (consent === null) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "true");
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookieConsent", "false");
    setVisible(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999,
        background: "#131820",
        borderTop: "1px solid #1e293b",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap",
      }}
    >
      <p className="text-sm text-text-secondary" style={{ flex: 1, minWidth: 200 }}>
        Bu web sitesi deneyiminizi iyileştirmek için çerezler kullanmaktadır. Sitemizi
        kullanarak çerez politikamızı kabul etmiş olursunuz.{" "}
        <Link href="/gizlilik" className="underline" style={{ color: "#1f844e" }}>
          Çerez Politikası
        </Link>
      </p>
      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        <button
          onClick={handleReject}
          className="rounded-md px-4 py-2 text-sm font-medium"
          style={{ background: "#1a2130", color: "#94a3b8" }}
        >
          Reddet
        </button>
        <button
          onClick={handleAccept}
          className="rounded-md px-4 py-2 text-sm font-medium"
          style={{ background: "#1f844e", color: "white" }}
        >
          Kabul Et
        </button>
      </div>
    </div>
  );
}
