"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ThreadResult { id: string; title: string; slug: string; category?: { name: string }; }
interface UserResult { id: string; username: string; avatar: string | null; }

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [threads, setThreads] = useState<ThreadResult[]>([]);
  const [users, setUsers] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setThreads([]); setUsers([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setThreads((data.threads || []).slice(0, 5));
        setUsers((data.users || []).slice(0, 3));
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  function handleChange(q: string) {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(q), 300);
  }

  function navigateTo(path: string) {
    setOpen(false); setQuery(""); setThreads([]); setUsers([]);
    router.push(path);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) navigateTo(`/ara?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <>
      {/* Search icon button */}
      <button
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-md transition-all duration-150 hover:bg-bg-hover"
        style={{ color: "#64748b" }}
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
      </button>

      {/* Desktop: inline dropdown (hidden on mobile) */}
      {/* Mobile: fullscreen overlay */}
      {open && (
        <div
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10001, backgroundColor: "rgba(0,0,0,0.8)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px", paddingTop: "max(16px, env(safe-area-inset-top, 16px))" }} onClick={(e) => e.stopPropagation()}>
            {/* Search input */}
            <form onSubmit={handleSubmit} style={{ position: "relative" }}>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Konu, kullanıcı veya haber ara..."
                style={{
                  width: "100%",
                  padding: "12px 16px 12px 40px",
                  borderRadius: 12,
                  backgroundColor: "#131820",
                  border: "1px solid #1e293b",
                  color: "#e2e8f0",
                  fontSize: 16,
                  outline: "none",
                }}
              />
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#64748b" strokeWidth="2" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <button type="button" onClick={() => setOpen(false)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: 14, fontWeight: 600 }}>
                İptal
              </button>
            </form>

            {/* Results */}
            {query.trim() && (
              <div style={{ marginTop: 12, backgroundColor: "#131820", border: "1px solid #1e293b", borderRadius: 12, maxHeight: "60vh", overflowY: "auto" }}>
                {loading && <div style={{ padding: 16, textAlign: "center", color: "#64748b", fontSize: 13 }}>Aranıyor...</div>}

                {!loading && threads.length === 0 && users.length === 0 && query.trim().length > 0 && (
                  <div style={{ padding: 16, textAlign: "center", color: "#64748b", fontSize: 13 }}>Sonuç bulunamadı</div>
                )}

                {threads.length > 0 && (
                  <>
                    <div style={{ padding: "8px 16px", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", borderBottom: "1px solid #1e293b" }}>Konular</div>
                    {threads.map((t) => (
                      <button key={t.id} onClick={() => navigateTo(`/konu/${t.slug}`)} style={{ display: "block", width: "100%", padding: "10px 16px", textAlign: "left", borderBottom: "1px solid #1e293b", color: "#e2e8f0", fontSize: 14, backgroundColor: "transparent", border: "none", cursor: "pointer" }}>
                        <div style={{ fontWeight: 500 }}>{t.title}</div>
                        {t.category && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{t.category.name}</div>}
                      </button>
                    ))}
                  </>
                )}

                {users.length > 0 && (
                  <>
                    <div style={{ padding: "8px 16px", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", borderBottom: "1px solid #1e293b" }}>Kullanıcılar</div>
                    {users.map((u) => (
                      <button key={u.id} onClick={() => navigateTo(`/profil/${u.username}`)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 16px", textAlign: "left", borderBottom: "1px solid #1e293b", color: "#e2e8f0", fontSize: 14, backgroundColor: "transparent", border: "none", cursor: "pointer" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "color-mix(in srgb, var(--accent-green) 20%, transparent)", color: "var(--accent-green)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <span>{u.username}</span>
                      </button>
                    ))}
                  </>
                )}

                {(threads.length > 0 || users.length > 0) && (
                  <button onClick={() => navigateTo(`/ara?q=${encodeURIComponent(query)}`)} style={{ display: "block", width: "100%", padding: "10px 16px", textAlign: "center", color: "var(--accent-green)", fontSize: 13, fontWeight: 500, backgroundColor: "transparent", border: "none", cursor: "pointer" }}>
                    Tüm sonuçları gör →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
