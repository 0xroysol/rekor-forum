"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { AuthGate } from "@/components/auth-gate";
import { createClient } from "@/lib/supabase/client";

type ChatUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  role: string;
  rank: { name: string; icon: string; color: string } | null;
};

type ChatMsg = {
  id: string;
  userId: string;
  roomId: string;
  content: string;
  createdAt: string;
  user: ChatUser;
};

type Room = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
};

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  ADMIN: { label: "Admin", color: "#ef4444" },
  MOD: { label: "Mod", color: "#e8a935" },
};

export default function SohbetPage() {
  const { dbUser, loading: authLoading } = useAuth();

  return (
    <AuthGate title="Sohbete Katıl" description="Canlı sohbete katılmak için giriş yapın." icon="💬">
      {dbUser && <ChatApp user={dbUser} />}
    </AuthGate>
  );
}

function ChatApp({ user }: { user: { id: string; username: string; role: string } }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState("genel");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [showRules, setShowRules] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("chat-rules-dismissed") !== "1";
  });
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [lastSendTime, setLastSendTime] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const supabaseRef = useRef(createClient());

  // Helper: add incoming messages to state, dedup, auto-scroll
  const addMessages = useCallback((incoming: ChatMsg[]) => {
    setMessages((prev) => {
      const ids = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !ids.has(m.id));
      if (fresh.length === 0) return prev;
      return [...prev, ...fresh];
    });
    if (isNearBottomRef.current) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, []);

  // Load rooms
  useEffect(() => {
    fetch("/api/chat/rooms")
      .then((r) => r.json())
      .then((d) => setRooms(d.rooms || []))
      .catch(() => {});
  }, []);

  // Load messages when room changes
  useEffect(() => {
    setLoadingMsgs(true);
    setMessages([]);
    fetch(`/api/chat?room=${activeRoom}`)
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages || []);
        setLoadingMsgs(false);
        setTimeout(() => messagesEndRef.current?.scrollIntoView(), 50);
      })
      .catch(() => setLoadingMsgs(false));
  }, [activeRoom]);

  // Supabase Broadcast channel + Presence
  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase.channel(`chat-room:${activeRoom}`, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "new-message" }, ({ payload }) => {
        addMessages([payload as ChatMsg]);
      })
      .on("broadcast", { event: "delete-message" }, ({ payload }) => {
        setMessages((prev) => prev.filter((m) => m.id !== payload.id));
      })
      .on("presence", { event: "sync" }, () => {
        setOnlineCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ userId: user.id, username: user.username });
        }
      });

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [activeRoom, user.id, user.username, addMessages]);

  // Polling fallback: fetch new messages every 3s in case broadcast misses
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const lastTime = prev[prev.length - 1].createdAt;
        fetch(`/api/chat?room=${activeRoom}&after=${encodeURIComponent(lastTime)}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.messages?.length) addMessages(d.messages);
          })
          .catch(() => {});
        return prev;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [activeRoom, addMessages]);

  // Track scroll position
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 80;
  }, []);

  // Send message
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const now = Date.now();
    if (now - lastSendTime < 3000) return;

    setSending(true);
    setLastSendTime(now);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed, roomId: activeRoom }),
    });

    if (res.ok) {
      const { message } = await res.json();
      addMessages([message]);
      setInput("");

      // Broadcast to other clients via the existing channel
      channelRef.current?.send({
        type: "broadcast",
        event: "new-message",
        payload: message,
      });
    }
    setSending(false);
  };

  // Delete message (mod/admin)
  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/chat?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      channelRef.current?.send({
        type: "broadcast",
        event: "delete-message",
        payload: { id },
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const dismissRules = () => {
    setShowRules(false);
    localStorage.setItem("chat-rules-dismissed", "1");
  };

  const activeRoomData = rooms.find((r) => r.slug === activeRoom);
  const isMod = user.role === "MOD" || user.role === "ADMIN";

  return (
    <div className="mx-auto max-w-7xl px-0 md:px-5 py-0 md:py-5">
      <div
        className="flex overflow-hidden"
        style={{
          backgroundColor: "#131820",
          border: "1px solid #1e293b",
          borderRadius: "0px",
          height: "calc(100dvh - 56px - 56px)",
        }}
      >
        {/* Room List — Desktop */}
        <div
          className="hidden md:flex flex-col flex-shrink-0"
          style={{ width: 220, borderRight: "1px solid #1e293b", backgroundColor: "#0d1017" }}
        >
          <div className="px-4 py-3" style={{ borderBottom: "1px solid #1e293b" }}>
            <span className="text-[13px] font-semibold" style={{ color: "#94a3b8" }}>
              Sohbet Odaları
            </span>
          </div>
          {rooms.map((room) => (
            <button
              key={room.slug}
              onClick={() => setActiveRoom(room.slug)}
              className="flex items-center gap-2.5 px-4 py-3 text-left transition-colors w-full"
              style={{
                backgroundColor: activeRoom === room.slug ? "var(--bg-elevated)" : "transparent",
                borderLeft: activeRoom === room.slug ? "2px solid var(--accent-green)" : "2px solid transparent",
                color: activeRoom === room.slug ? "#e2e8f0" : "#94a3b8",
              }}
            >
              <span className="text-base">{room.icon}</span>
              <span className="text-sm font-medium truncate">{room.name}</span>
            </button>
          ))}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <div
            className="flex items-center justify-between px-4 flex-shrink-0"
            style={{ height: 48, borderBottom: "1px solid #1e293b" }}
          >
            <div className="flex items-center gap-2">
              {/* Mobile Room Selector */}
              <select
                className="md:hidden text-sm font-semibold bg-transparent border-none outline-none"
                style={{ color: "#e2e8f0" }}
                value={activeRoom}
                onChange={(e) => setActiveRoom(e.target.value)}
              >
                {rooms.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.icon} {r.name}
                  </option>
                ))}
              </select>
              {/* Desktop title */}
              <span className="hidden md:inline text-base">{activeRoomData?.icon}</span>
              <span className="hidden md:inline text-sm font-semibold" style={{ color: "#e2e8f0" }}>
                {activeRoomData?.name || activeRoom}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "#64748b" }}>
              <span>👥</span>
              <span>{onlineCount} çevrimiçi</span>
            </div>
          </div>

          {/* Rules Banner */}
          {showRules && (
            <div
              className="flex items-center justify-between px-4 py-2 text-xs"
              style={{ backgroundColor: "var(--bg-elevated)", borderBottom: "1px solid #1e293b", color: "#94a3b8" }}
            >
              <span>
                ℹ️ Sohbet Kuralları: Saygılı olun, spam yapmayın, reklam paylaşmayın. Kuralları ihlal eden
                kullanıcılar uzaklaştırılır.
              </span>
              <button
                onClick={dismissRules}
                className="ml-3 flex-shrink-0 text-[#64748b] hover:text-[#e2e8f0] transition-colors"
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14 }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Messages */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5"
            style={{ overscrollBehavior: "contain" }}
          >
            {loadingMsgs ? (
              <div className="flex items-center justify-center py-20">
                <div
                  className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: "var(--accent-green)", borderTopColor: "transparent" }}
                />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-20 text-sm" style={{ color: "#64748b" }}>
                Henüz mesaj yok. İlk mesajı siz yazın!
              </div>
            ) : (
              messages.map((msg, idx) => {
                const prev = idx > 0 ? messages[idx - 1] : null;
                const sameUser = prev?.userId === msg.userId;
                const isOwn = msg.userId === user.id;
                const badge = ROLE_BADGE[msg.user.role];
                const time = new Date(msg.createdAt).toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={msg.id}
                    className="group flex gap-2.5 py-1 px-2 rounded-md transition-colors hover:bg-[#1a2130]"
                    style={{
                      backgroundColor: isOwn ? "var(--accent-green, #1f844e)08" : undefined,
                      marginTop: sameUser ? 0 : 8,
                    }}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0" style={{ width: 28 }}>
                      {!sameUser && (
                        <Link href={`/profil/${msg.user.username}`}>
                          {msg.user.avatar ? (
                            <img
                              src={msg.user.avatar}
                              alt={msg.user.username}
                              className="rounded-full object-cover"
                              style={{ width: 28, height: 28 }}
                            />
                          ) : (
                            <div
                              className="flex items-center justify-center rounded-full text-[10px] font-bold"
                              style={{
                                width: 28,
                                height: 28,
                                backgroundColor: "var(--bg-elevated)",
                                color: "var(--accent-green)",
                              }}
                            >
                              {msg.user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </Link>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {!sameUser && (
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Link
                            href={`/profil/${msg.user.username}`}
                            className="text-xs font-bold hover:underline"
                            style={{ color: "var(--accent-green)" }}
                          >
                            {msg.user.displayName || msg.user.username}
                          </Link>
                          {badge && (
                            <span
                              className="text-[9px] font-bold px-1 py-px rounded"
                              style={{ color: badge.color, border: `1px solid ${badge.color}` }}
                            >
                              {badge.label}
                            </span>
                          )}
                          {msg.user.rank && (
                            <span className="text-[10px]" style={{ color: msg.user.rank.color }}>
                              {msg.user.rank.icon}
                            </span>
                          )}
                          <span className="text-[10px]" style={{ color: "#64748b" }}>
                            {time}
                          </span>
                        </div>
                      )}
                      <p className="text-[13px] break-words" style={{ color: "#e2e8f0", lineHeight: 1.5 }}>
                        {msg.content}
                      </p>
                    </div>

                    {/* Mod actions */}
                    {isMod && msg.userId !== user.id && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 flex-shrink-0">
                        <select
                          defaultValue=""
                          onChange={async (e) => {
                            if (!e.target.value) return;
                            await fetch("/api/moderation/chat-mute", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ userId: msg.userId, roomId: activeRoom, duration: e.target.value }),
                            });
                            e.target.value = "";
                          }}
                          className="text-[10px] bg-transparent border-none outline-none cursor-pointer"
                          style={{ color: "#64748b" }}
                          title="Sustur"
                        >
                          <option value="">🔇</option>
                          <option value="5m">5dk</option>
                          <option value="15m">15dk</option>
                          <option value="1h">1 Saat</option>
                          <option value="1d">1 Gün</option>
                        </select>
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="text-[#64748b] hover:text-[#ef4444] text-xs"
                          style={{ background: "none", border: "none", cursor: "pointer" }}
                          title="Mesajı sil"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
            style={{ borderTop: "1px solid #1e293b" }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 500))}
              onKeyDown={handleKeyDown}
              placeholder="Mesajınızı yazın..."
              className="flex-1 text-sm outline-none"
              style={{
                height: 40,
                backgroundColor: "var(--bg-base)",
                border: "1px solid #1e293b",
                borderRadius: 20,
                padding: "0 16px",
                color: "#e2e8f0",
              }}
              maxLength={500}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="flex items-center justify-center flex-shrink-0 text-white transition-all hover:brightness-110 disabled:opacity-40"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                backgroundColor: "var(--accent-green)",
                border: "none",
                cursor: input.trim() && !sending ? "pointer" : "default",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
