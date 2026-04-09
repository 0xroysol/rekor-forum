"use client";

import { useState } from "react";

interface LoadMoreThreadsProps {
  categoryId: string;
  initialThreads: unknown[];
  totalCount: number;
  pageSize: number;
  renderThread: (thread: unknown, index: number) => React.ReactNode;
}

export function LoadMoreThreads({
  categoryId,
  initialThreads,
  totalCount,
  pageSize,
  renderThread,
}: LoadMoreThreadsProps) {
  const [threads, setThreads] = useState(initialThreads);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const hasMore = threads.length < totalCount;

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const nextPage = page + 1;
      const res = await fetch(
        `/api/threads?categoryId=${encodeURIComponent(categoryId)}&page=${nextPage}&limit=${pageSize}`
      );
      if (res.ok) {
        const data = await res.json();
        const newThreads = data.threads || data;
        if (Array.isArray(newThreads) && newThreads.length > 0) {
          setThreads((prev) => [...prev, ...newThreads]);
          setPage(nextPage);
        }
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div>{threads.map((thread, i) => renderThread(thread, i))}</div>

      {hasMore && (
        <div className="flex justify-center py-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-lg px-6 py-2.5 text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: "var(--bg-elevated)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-color)",
            }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Yükleniyor...
              </span>
            ) : (
              "Daha Fazla Yükle"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
