"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CasinoGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("casino_age_confirmed")) {
      setShow(true);
    }
  }, []);

  function handleConfirm() {
    localStorage.setItem("casino_age_confirmed", "true");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
      <div className="mx-4 w-full max-w-md rounded-xl p-6 text-center" style={{ backgroundColor: "#131820", border: "1px solid #1e293b" }}>
        <div className="mb-4 text-4xl">⚠️</div>
        <h2 className="mb-2 text-lg font-semibold" style={{ color: "#e2e8f0" }}>
          Bu bölüm 18 yaş ve üzeri içindir
        </h2>
        <p className="mb-1 text-sm" style={{ color: "#94a3b8" }}>
          Kumar bağımlılık yapabilir. Lütfen sorumlu oynayın.
        </p>
        <p className="mb-6 text-sm font-medium" style={{ color: "#64748b" }}>
          Yardım Hattı: 444 0 632
        </p>
        <button
          onClick={handleConfirm}
          className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors hover:brightness-110"
          style={{ backgroundColor: "#1f844e" }}
        >
          Anladım, devam et
        </button>
        <div className="mt-3">
          <Link
            href="/sorumlu-oyun"
            className="text-sm transition-colors hover:underline"
            style={{ color: "#94a3b8" }}
          >
            Sorumlu Oyun Politikası
          </Link>
        </div>
      </div>
    </div>
  );
}
