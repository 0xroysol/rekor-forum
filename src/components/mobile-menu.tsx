"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const navLinks = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/canli-skorlar", label: "Canlı Skorlar" },
  { href: "/mesajlar", label: "Mesajlar" },
  { href: "/forum/yeni", label: "Yeni Konu" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-bg-hover"
        aria-label="Menüyü aç"
        style={{ color: "#94a3b8" }}
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          {open ? (
            <path d="M6 18 18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60" aria-hidden="true" />
      )}

      {/* Slide-in panel */}
      <div
        ref={panelRef}
        className={`fixed left-0 top-0 z-50 h-full w-64 transform transition-transform duration-200 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: "#0d1017", borderRight: "1px solid #1e293b" }}
      >
        {/* Panel header */}
        <div className="flex h-14 items-center justify-between px-4" style={{ borderBottom: "1px solid #1e293b" }}>
          <span className="text-lg font-bold tracking-tight">
            <span style={{ color: "#1f844e" }}>Rekor</span>
            <span className="text-white">Forum</span>
          </span>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-bg-hover"
            aria-label="Menüyü kapat"
            style={{ color: "#94a3b8" }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 p-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-text-secondary transition-all duration-150 hover:bg-bg-hover hover:text-text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
