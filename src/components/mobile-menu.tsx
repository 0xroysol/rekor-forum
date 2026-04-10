"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="md:hidden"
        style={{ color: "#94a3b8", padding: 4 }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
    );
  }

  return (
    <>
      <button
        className="md:hidden"
        style={{ color: "#94a3b8", padding: 4 }}
        onClick={() => setOpen(false)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999 }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0,
        width: 260, background: "#131820", zIndex: 10000,
        borderRight: "1px solid #1e293b",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 48, padding: "0 16px", borderBottom: "1px solid #1e293b" }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>
            <span style={{ color: "#1f844e" }}>Rekor</span>
            <span style={{ color: "#e2e8f0" }}>Forum</span>
          </span>
          <button onClick={() => setOpen(false)} style={{ color: "#94a3b8", fontSize: 18, fontWeight: 700 }}>✕</button>
        </div>

        {/* Links */}
        {[
          { href: "/", label: "Ana Sayfa" },
          { href: "/haberler", label: "Haberler" },
          { href: "/tahminler", label: "Tahminler" },
          { href: "/canli-skorlar", label: "Canlı Skorlar" },
          { href: "/mesajlar", label: "Mesajlar" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            style={{
              display: "flex", alignItems: "center",
              height: 48, padding: "0 16px",
              fontSize: 15, color: "#e2e8f0",
              borderBottom: "1px solid #1e293b",
              textDecoration: "none",
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </>
  );
}
