"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";

export function BookmarkButton({ threadId }: { threadId: string }) {
  const { dbUser } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!dbUser) return;

    fetch(`/api/bookmarks/check?threadId=${encodeURIComponent(threadId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.bookmarked) setBookmarked(true);
      })
      .catch(() => {});
  }, [dbUser, threadId]);

  if (!dbUser) return null;

  async function handleToggle() {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/bookmarks/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId }),
      });

      if (res.ok) {
        const data = await res.json();
        setBookmarked(data.bookmarked);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-3 py-1.5 border border-[#1e293b] rounded-md text-sm transition-colors ${
        bookmarked
          ? "text-[#e8a935] border-[#e8a935]/40"
          : "text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#94a3b8]"
      } disabled:opacity-50`}
    >
      {bookmarked ? "\u2605 Kaydedildi" : "\u2606 Kaydet"}
    </button>
  );
}
