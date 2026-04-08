"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface ThreadResult {
  id: string;
  title: string;
  slug: string;
  category: { name: string } | null;
  author: { username: string };
}

interface UserResult {
  id: string;
  username: string;
  avatar: string | null;
}

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [threads, setThreads] = useState<ThreadResult[]>([]);
  const [users, setUsers] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setThreads([]);
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setThreads((data.threads || []).slice(0, 5));
        setUsers((data.users || []).slice(0, 3));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setThreads([]);
      setUsers([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      doSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function navigateTo(path: string) {
    setOpen(false);
    setQuery("");
    setThreads([]);
    setUsers([]);
    router.push(path);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      navigateTo(`/ara?q=${encodeURIComponent(query.trim())}`);
    }
  }

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Ara..."
          className="w-48 lg:w-64 px-3 py-1.5 rounded-lg bg-[#0d1017] border border-[#1e293b] text-sm text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#1f844e] transition-colors"
        />
      </form>

      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 bg-[#131820] border border-[#1e293b] shadow-xl z-50 overflow-hidden"
          style={{ borderRadius: "12px", minWidth: "320px" }}
        >
          {loading && (
            <div className="px-4 py-3 text-sm text-[#64748b]">
              Aranıyor...
            </div>
          )}

          {!loading && threads.length === 0 && users.length === 0 && (
            <div className="px-4 py-3 text-sm text-[#64748b]">
              Sonuç bulunamadı
            </div>
          )}

          {/* Thread Results */}
          {threads.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs text-[#64748b] uppercase tracking-wide font-medium bg-[#1a2130] border-b border-[#1e293b]">
                Konular
              </div>
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => navigateTo(`/konu/${thread.slug}`)}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#1e2738] transition-colors border-b border-[#1e293b] last:border-b-0"
                >
                  <div className="text-sm text-[#e2e8f0] truncate">
                    {thread.title}
                  </div>
                  <div className="text-xs text-[#64748b] mt-0.5">
                    {thread.category?.name} &middot; {thread.author.username}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* User Results */}
          {users.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs text-[#64748b] uppercase tracking-wide font-medium bg-[#1a2130] border-b border-[#1e293b]">
                Kullanıcılar
              </div>
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => navigateTo(`/profil/${u.username}`)}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#1e2738] transition-colors border-b border-[#1e293b] last:border-b-0 flex items-center gap-2.5"
                >
                  <div className="w-7 h-7 rounded-full bg-[#1a2130] border border-[#1e293b] flex items-center justify-center text-xs font-semibold text-[#1f844e] flex-shrink-0">
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-[#e2e8f0]">{u.username}</span>
                </button>
              ))}
            </div>
          )}

          {/* Full search link */}
          {(threads.length > 0 || users.length > 0) && (
            <button
              onClick={() => navigateTo(`/ara?q=${encodeURIComponent(query.trim())}`)}
              className="w-full text-center px-4 py-2.5 text-xs text-[#1f844e] hover:bg-[#1e2738] transition-colors bg-[#1a2130] border-t border-[#1e293b]"
            >
              Tüm sonuçları gör &rarr;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
