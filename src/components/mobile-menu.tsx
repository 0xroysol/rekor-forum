"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

const LINKS = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/haberler", label: "Haberler" },
  { href: "/tahminler", label: "Tahminler" },
  { href: "/canli-skorlar", label: "Canlı Skorlar" },
  { href: "/mesajlar", label: "Mesajlar" },
  { href: "/sohbet", label: "Sohbet" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const menu = open && mounted ? createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 99999 }}>
      {/* Overlay */}
      <div onClick={() => setOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)" }} />
      {/* Panel */}
      <div style={{
        position: "absolute", top: 0, left: 0, bottom: 0, width: 260,
        background: "#131820", borderRight: "1px solid #1e293b",
        display: "flex", flexDirection: "column", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 48, padding: "0 16px", borderBottom: "1px solid #1e293b", flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>
            Menü
          </span>
          <button onClick={() => setOpen(false)} style={{ color: "#94a3b8", fontSize: 20, fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: 4 }}>✕</button>
        </div>
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
            style={{ display: "flex", alignItems: "center", height: 48, padding: "0 16px", fontSize: 15, color: "#e2e8f0", borderBottom: "1px solid #1e293b", textDecoration: "none", flexShrink: 0 }}>
            {link.label}
          </Link>
        ))}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="flex items-center md:hidden">
      <button onClick={() => setOpen(!open)} style={{ color: "#94a3b8", padding: 4, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {open ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>
      {menu}
    </div>
  );
}
