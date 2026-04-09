"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import Link from "next/link";
import { RichTextEditor } from "@/components/editor/rich-text-editor";

// --- Reply Form ---
export function ReplyForm({ threadId, isLocked }: { threadId: string; isLocked: boolean }) {
  const { dbUser } = useAuth();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  if (isLocked) {
    return (
      <div className="mt-6 rounded-xl border border-[#1e293b] overflow-hidden">
        <div className="px-4 py-4 bg-[#131820] text-center text-sm text-[#64748b]">
          🔒 Bu konu kilitlenmiştir. Yanıt yazılamaz.
        </div>
      </div>
    );
  }

  if (!dbUser) {
    return (
      <div className="mt-6 rounded-xl border border-[#1e293b] overflow-hidden">
        <div className="px-4 py-4 bg-[#131820] text-center text-sm text-[#64748b]">
          Yanıt yazmak için{" "}
          <Link href="/giris" className="text-[#1f844e] hover:underline">giriş yapın</Link>.
        </div>
      </div>
    );
  }

  async function handleSubmit() {
    if (!content.trim()) return;
    setError("");
    setLoading(true);

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId, content }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Yanıt gönderilirken hata oluştu");
      setLoading(false);
      return;
    }

    setContent("");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="mt-6 rounded-xl border border-[#1e293b] overflow-hidden">
      <div className="px-4 py-2.5 font-semibold text-sm text-[#e2e8f0] bg-[#1a2130] border-b border-[#1e293b]">
        Yanıt Yaz
      </div>
      <div className="p-4 bg-[#131820]">
        {error && (
          <div className="mb-3 rounded-md border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#ef4444]">
            {error}
          </div>
        )}
        <RichTextEditor content={content} onChange={setContent} placeholder="Yanıtınızı yazın..." minHeight={150} />
        <div className="mt-3 flex items-center justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
            className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm bg-[#1f844e] hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? "Gönderiliyor..." : "Yanıt Gönder"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Post Actions (edit, delete, quote) ---
export function PostActions({
  postId,
  postContent,
  authorId,
  authorUsername,
  isFirstPost,
}: {
  postId: string;
  postContent: string;
  authorId: string;
  authorUsername: string;
  isFirstPost: boolean;
}) {
  const { dbUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(postContent);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!dbUser) return null;

  const canEdit = dbUser.id === authorId || dbUser.role === "MOD" || dbUser.role === "ADMIN";
  const canDelete = (dbUser.role === "MOD" || dbUser.role === "ADMIN") && !isFirstPost;

  async function handleSaveEdit() {
    setLoading(true);
    const res = await fetch(`/api/posts/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    setLoading(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!confirm("Bu mesajı silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    router.refresh();
  }

  function handleQuote() {
    const replyBox = document.querySelector<HTMLTextAreaElement>("textarea[placeholder*='Yanıtınızı']");
    if (replyBox) {
      const quoteText = `> **${authorUsername}** yazdı:\n> ${postContent.split("\n").join("\n> ")}\n\n`;
      replyBox.value = replyBox.value + quoteText;
      replyBox.focus();
      // Trigger React state update
      replyBox.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  if (editing) {
    return (
      <div className="px-4 py-3 border-t border-[#1e293b]">
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-2 text-sm text-[#e2e8f0] focus:outline-none focus:border-[#1f844e] resize-y"
        />
        <div className="mt-2 flex items-center gap-2 justify-end">
          <button
            onClick={() => { setEditing(false); setEditContent(postContent); }}
            className="px-3 py-1.5 rounded-md text-xs text-[#64748b] hover:text-[#e2e8f0] transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSaveEdit}
            disabled={loading}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-[#1f844e] hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 ml-auto">
      {/* Quote */}
      <button
        onClick={handleQuote}
        className="px-2 py-1 rounded text-[11px] text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2738] transition-colors"
        title="Alıntıla"
      >
        Alıntı
      </button>
      {/* Edit */}
      {canEdit && (
        <button
          onClick={() => setEditing(true)}
          className="px-2 py-1 rounded text-[11px] text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e2738] transition-colors"
          title="Düzenle"
        >
          ✏️
        </button>
      )}
      {/* Delete */}
      {canDelete && (
        <button
          onClick={handleDelete}
          className="px-2 py-1 rounded text-[11px] text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
          title="Sil"
        >
          🗑️
        </button>
      )}
    </div>
  );
}

// --- View Counter (client component that fires once) ---
export function ViewCounter({ threadSlug }: { threadSlug: string }) {
  useState(() => {
    // Check cookie for cooldown (1 hour)
    const cookieKey = `viewed_${threadSlug}`;
    if (typeof document !== "undefined") {
      const cookies = document.cookie.split("; ").reduce((acc, c) => {
        const [k, v] = c.split("=");
        acc[k] = v;
        return acc;
      }, {} as Record<string, string>);

      if (!cookies[cookieKey]) {
        // Set cookie for 1 hour
        document.cookie = `${cookieKey}=1; max-age=3600; path=/`;
        // Increment view count
        fetch(`/api/threads/view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: threadSlug }),
        }).catch(() => {});
      }
    }
  });

  return null;
}
