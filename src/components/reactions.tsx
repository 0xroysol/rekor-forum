"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";

export type ReactionData = {
  emoji: string;
  count: number;
  users: string[];
};

interface ReactionBarProps {
  postId: string;
  initialReactions: ReactionData[];
  initialUserReactions: string[];
}

const AVAILABLE_EMOJIS = ["👍", "👎", "🔥", "😂", "🎯", "💰", "🧠", "❤️"];

function formatTooltip(users: string[]): string {
  if (users.length === 0) return "";
  if (users.length <= 3) return users.join(", ");
  const shown = users.slice(0, 3).join(", ");
  const remaining = users.length - 3;
  return `${shown} ve ${remaining} kişi daha`;
}

export function ReactionBar({
  postId,
  initialReactions,
  initialUserReactions,
}: ReactionBarProps) {
  const { dbUser } = useAuth();
  const [reactions, setReactions] = useState<ReactionData[]>(initialReactions);
  const [userReactions, setUserReactions] = useState<string[]>(initialUserReactions);
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState(false);

  function getReactionData(emoji: string): ReactionData {
    return reactions.find((r) => r.emoji === emoji) ?? { emoji, count: 0, users: [] };
  }

  async function handleToggle(emoji: string) {
    if (!dbUser) {
      setAuthMessage(true);
      setTimeout(() => setAuthMessage(false), 2000);
      return;
    }

    const isActive = userReactions.includes(emoji);
    const prevReactions = reactions;
    const prevUserReactions = userReactions;

    // Optimistic update
    if (isActive) {
      setUserReactions((prev) => prev.filter((e) => e !== emoji));
      setReactions((prev) =>
        prev.map((r) =>
          r.emoji === emoji
            ? {
                ...r,
                count: Math.max(0, r.count - 1),
                users: r.users.filter((u) => u !== dbUser.username),
              }
            : r
        )
      );
    } else {
      setUserReactions((prev) => [...prev, emoji]);
      const existing = reactions.find((r) => r.emoji === emoji);
      if (existing) {
        setReactions((prev) =>
          prev.map((r) =>
            r.emoji === emoji
              ? { ...r, count: r.count + 1, users: [...r.users, dbUser.username] }
              : r
          )
        );
      } else {
        setReactions((prev) => [
          ...prev,
          { emoji, count: 1, users: [dbUser.username] },
        ]);
      }
    }

    try {
      const res = await fetch("/api/reactions/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, emoji }),
      });
      if (!res.ok) throw new Error("API error");
    } catch {
      // Revert on failure
      setReactions(prevReactions);
      setUserReactions(prevUserReactions);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 relative">
      {authMessage && (
        <div className="absolute -top-8 left-0 bg-[#1a2130] border border-[#1e293b] rounded-lg px-2 py-1 text-[11px] text-[#94a3b8] z-50">
          Tepki vermek için giriş yapmalısınız
        </div>
      )}
      {AVAILABLE_EMOJIS.map((emoji) => {
        const data = getReactionData(emoji);
        const isActive = userReactions.includes(emoji);

        return (
          <div key={emoji} className="relative">
            <button
              type="button"
              onClick={() => handleToggle(emoji)}
              onMouseEnter={() => setHoveredEmoji(emoji)}
              onMouseLeave={() => setHoveredEmoji(null)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors hover:bg-[#1e2738] ${
                isActive
                  ? "bg-accent-green/12 border border-accent-green/30"
                  : "border border-transparent"
              }`}
            >
              <span>{emoji}</span>
              {data.count > 0 && (
                <span className="text-[#94a3b8]">{data.count}</span>
              )}
            </button>
            {hoveredEmoji === emoji && data.users.length > 0 && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap bg-[#1a2130] border border-[#1e293b] rounded-lg px-2 py-1 text-[11px] text-[#94a3b8] z-50">
                {formatTooltip(data.users)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
