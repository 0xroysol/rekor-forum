"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function LiveNavLink() {
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/live-scores");
        const data = await res.json();
        const live = (data.matches || []).filter((m: { status: string }) => m.status === "live" || m.status === "ht").length;
        setLiveCount(live);
      } catch {}
    };
    check();
    const i = setInterval(check, 120_000);
    return () => clearInterval(i);
  }, []);

  return (
    <Link
      href="/canli-skorlar"
      className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 hover:bg-bg-hover hover:text-text-primary"
      style={{ color: liveCount > 0 ? "#ef4444" : "#94a3b8" }}
    >
      {liveCount > 0 && (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{
            backgroundColor: "#ef4444",
            animation: "livePulse 1.5s ease-in-out infinite",
            boxShadow: "0 0 4px rgba(239,68,68,0.5)",
          }}
        />
      )}
      Canlı Skorlar
    </Link>
  );
}
