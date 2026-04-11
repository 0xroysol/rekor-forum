"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    role: string;
  };
}

export function ProfileComments({ username, profileUserId }: { username: string; profileUserId: string }) {
  const { dbUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/profile-comments?username=${username}`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username]);

  async function handleSubmit() {
    if (!content.trim() || sending) return;
    setSending(true);
    const res = await fetch("/api/profile-comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileUsername: username, content: content.trim() }),
    });
    if (res.ok) {
      const { comment } = await res.json();
      setComments((prev) => [comment, ...prev]);
      setContent("");
    }
    setSending(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/profile-comments?id=${id}`, { method: "DELETE" });
    setComments((prev) => prev.filter((c) => c.id !== id));
  }

  const canDelete = (c: Comment) => dbUser && (dbUser.id === profileUserId || dbUser.role === "ADMIN");

  function timeAgo(d: string) {
    const ms = Date.now() - new Date(d).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return "az önce";
    if (mins < 60) return `${mins} dk önce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} saat önce`;
    return `${Math.floor(hours / 24)} gün önce`;
  }

  return (
    <div className="mt-4 rounded-xl border border-[#1e293b] bg-[#131820]">
      <div className="border-b border-[#1e293b] bg-[#1a2130] px-5 py-3">
        <h2 className="text-sm font-semibold text-[#e2e8f0]">Profil Yorumları</h2>
      </div>
      <div className="p-4 space-y-3">
        {/* Write comment */}
        {dbUser && (
          <div className="flex gap-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 200))}
              placeholder="Yorum yaz..."
              rows={2}
              className="flex-1 rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-2 text-sm text-[#e2e8f0] placeholder-[#64748b] resize-none focus:outline-none focus:border-accent-green"
            />
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || sending}
              className="self-end px-4 py-2 rounded-md text-xs font-medium text-white bg-accent-green hover:brightness-110 disabled:opacity-50"
            >
              {sending ? "..." : "Yorum Yap"}
            </button>
          </div>
        )}

        {/* Comments */}
        {loading ? (
          <div className="text-center py-4 text-sm text-[#64748b]">Yükleniyor...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-sm text-[#64748b]">Henüz yorum yok</div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-2.5 group">
              <Link href={`/profil/${c.author.username}`} className="flex-shrink-0">
                {c.author.avatar ? (
                  <img src={c.author.avatar} alt={c.author.username} className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#1a2130] flex items-center justify-center text-[10px] font-bold text-accent-green">
                    {c.author.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Link href={`/profil/${c.author.username}`} className="text-xs font-semibold text-accent-green hover:underline">
                    {c.author.displayName || c.author.username}
                  </Link>
                  <span className="text-[10px] text-[#64748b]">{timeAgo(c.createdAt)}</span>
                  {canDelete(c) && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="opacity-0 group-hover:opacity-100 text-[10px] text-[#64748b] hover:text-[#ef4444] transition-all ml-auto"
                    >
                      Sil
                    </button>
                  )}
                </div>
                <p className="text-sm text-[#94a3b8] mt-0.5">{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
