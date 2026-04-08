"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

interface Notification {
  id: string;
  type: "reply" | "reaction" | "mention" | "mod_warning" | "system" | "message";
  content: string;
  isRead: boolean;
  createdAt: string;
  relatedThreadId?: string | null;
}

const TYPE_ICONS: Record<string, string> = {
  reply: "💬",
  reaction: "👍",
  mention: "@",
  mod_warning: "⚠️",
  system: "ℹ️",
  message: "✉️",
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "az önce";
  if (minutes < 60) return `${minutes} dk`;
  if (hours < 24) return `${hours} saat`;
  return `${days} gün`;
}

export default function NotificationBell() {
  const { dbUser } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!dbUser) return;
    try {
      const res = await fetch("/api/notifications?countOnly=true");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      // silently fail
    }
  }, [dbUser]);

  // Poll unread count every 30 seconds
  useEffect(() => {
    if (!dbUser) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [dbUser, fetchUnreadCount]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function toggleDropdown() {
    if (!open) {
      setOpen(true);
      setLoading(true);
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    } else {
      setOpen(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      await fetch("/api/notifications/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silently fail
    }
  }

  async function markAllAsRead() {
    try {
      await fetch("/api/notifications/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  }

  function handleNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.relatedThreadId) {
      router.push(`/forum/konu/${notification.relatedThreadId}`);
      setOpen(false);
    }
  }

  if (!dbUser) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-[#94a3b8] hover:text-[#e2e8f0] transition-colors"
        aria-label="Bildirimler"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#ef4444] text-white text-[10px] font-bold px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-[#131820] border border-[#1e293b] rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1e293b] flex items-center justify-between">
            <span className="text-sm font-semibold text-[#e2e8f0]">Bildirimler</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[#1f844e] hover:text-[#25a060] transition-colors"
              >
                Tümünü Okundu İşaretle
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-[#64748b]">
                Yükleniyor...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[#64748b]">
                Bildirim yok
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#1e2738] transition-colors border-b border-[#1e293b] last:border-b-0 ${
                    notification.isRead ? "bg-[#131820]" : "bg-[#1a2130]"
                  }`}
                >
                  <span className="text-base mt-0.5 shrink-0">
                    {TYPE_ICONS[notification.type] || "📢"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#e2e8f0] line-clamp-2">
                      {notification.content}
                    </p>
                    <span className="text-xs text-[#64748b] mt-1 block">
                      {relativeTime(notification.createdAt)}
                    </span>
                  </div>
                  {!notification.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#1f844e] shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
