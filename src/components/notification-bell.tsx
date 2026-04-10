"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

interface NotifItem {
  id: string;
  type: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  relatedThreadId?: string | null;
  relatedUserId?: string | null;
}

const ICONS: Record<string, string> = {
  reply: "💬", reaction: "👍", mention: "@", mod_warning: "⚠️",
  system: "🔔", message: "✉️", badge: "🏆",
};

function timeAgo(d: string): string {
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} saat önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

export default function NotificationBell() {
  const { dbUser } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Poll unread count
  const fetchCount = useCallback(async () => {
    if (!dbUser) return;
    try {
      const r = await fetch("/api/notifications?countOnly=true");
      if (r.ok) { const d = await r.json(); setUnread(d.unreadCount ?? 0); }
    } catch {}
  }, [dbUser]);

  useEffect(() => {
    fetchCount();
    const i = setInterval(fetchCount, 30000);
    return () => clearInterval(i);
  }, [fetchCount]);

  // Fetch full list when opened
  useEffect(() => {
    if (!open || !dbUser) return;
    setLoading(true);
    fetch("/api/notifications")
      .then(r => r.json())
      .then(d => { setItems(d.notifications ?? []); setUnread(d.unreadCount ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, dbUser]);

  if (!dbUser) return null;

  async function markRead(id: string) {
    await fetch("/api/notifications/read", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => {});
    setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications/read", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) }).catch(() => {});
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnread(0);
  }

  function handleClick(n: NotifItem) {
    if (!n.isRead) markRead(n.id);
    setOpen(false);
    if (n.type === "message") router.push("/mesajlar");
    else if (n.type === "system" || n.type === "badge") router.push(`/profil/${dbUser!.username}`);
    else if (n.relatedThreadId) {
      // Find thread slug — for now just go to notification's thread
      router.push(`/`); // fallback, ideally we'd have the slug
    }
  }

  const dropdown = open && mounted ? createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 99998 }}>
      {/* Overlay */}
      <div onClick={() => setOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
      {/* Panel */}
      <div style={{
        position: "absolute", top: 48, right: 8, width: "min(360px, calc(100vw - 16px))",
        maxHeight: 480, backgroundColor: "#131820", border: "1px solid #1e293b",
        borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #1e293b", flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>Bildirimler</span>
          {unread > 0 && (
            <button onClick={markAllRead} style={{ fontSize: 12, color: "#1f844e", background: "none", border: "none", cursor: "pointer" }}>
              Tümünü Okundu İşaretle
            </button>
          )}
        </div>
        {/* List */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "#64748b", fontSize: 13 }}>Yükleniyor...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
              <div style={{ color: "#64748b", fontSize: 13 }}>Bildiriminiz bulunmuyor</div>
            </div>
          ) : (
            items.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  display: "flex", gap: 10, width: "100%", padding: "12px 16px",
                  textAlign: "left", borderBottom: "1px solid #1e293b", cursor: "pointer",
                  background: n.isRead ? "transparent" : "rgba(31,132,78,0.05)",
                  borderLeft: n.isRead ? "2px solid transparent" : "2px solid #1f844e",
                  border: "none", borderBottomStyle: "solid" as const, borderBottomWidth: 1, borderBottomColor: "#1e293b",
                  borderLeftStyle: "solid" as const, borderLeftWidth: 2,
                  borderLeftColor: n.isRead ? "transparent" : "#1f844e",
                  backgroundColor: n.isRead ? "transparent" : "rgba(31,132,78,0.05)",
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>{ICONS[n.type] || "🔔"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                    {n.content}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
                </div>
                {!n.isRead && <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#1f844e", flexShrink: 0, marginTop: 6 }} />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 6, color: "#94a3b8", background: "none", border: "none", cursor: "pointer", position: "relative" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
        {unread > 0 && (
          <span style={{
            position: "absolute", top: -2, right: -2, minWidth: 16, height: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 999, backgroundColor: "#ef4444", color: "#fff",
            fontSize: 10, fontWeight: 700, padding: "0 4px",
          }}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {dropdown}
    </div>
  );
}
