"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/providers/auth-provider";

interface StatsData {
  totalUsers: number;
  totalThreads: number;
  totalPosts: number;
  pendingReports: number;
  onlineUsers: number;
  todayUsers: number;
  todayThreads: number;
  todayPosts: number;
  recentUsers: {
    id: string;
    username: string;
    avatar: string | null;
    createdAt: string;
    role: string;
  }[];
  recentReports: {
    id: string;
    type: string;
    targetId: string;
    reason: string;
    status: string;
    createdAt: string;
    reporter: { id: string; username: string };
  }[];
}

interface ReportItem {
  id: string;
  type: string;
  targetId: string;
  reason: string;
  description?: string | null;
  status: string;
  createdAt: string;
  reporter: { id: string; username: string; avatar: string | null };
}

interface UserItem {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  role: string;
  postCount: number;
  title: string | null;
  createdAt: string;
  rank: { id: string; name: string; icon: string; color: string } | null;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  color: string;
  position: number;
  isVip: boolean;
  isCasino: boolean;
  parentId: string | null;
  _count?: { threads: number };
}

interface ThreadItem {
  id: string;
  title: string;
  slug: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  createdAt: string;
  author: { id: string; username: string; avatar: string | null };
  category: { id: string; name: string; slug: string };
  _count: { posts: number };
}

interface PostItem {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; username: string; avatar: string | null };
  thread: { id: string; title: string; slug: string };
  _count?: { reactions: number };
}

type TabId = "dashboard" | "reports" | "users" | "threads" | "posts" | "categories";

const roleColors: Record<string, string> = {
  ADMIN: "border-[#ef4444] text-[#ef4444]",
  MOD: "border-[#e8a935] text-[#e8a935]",
  USER: "border-[#1f844e] text-[#1f844e]",
};

const statusColors: Record<string, string> = {
  PENDING: "border-[#e8a935] text-[#e8a935]",
  REVIEWED: "border-[#3b82f6] text-[#3b82f6]",
  RESOLVED: "border-[#1f844e] text-[#1f844e]",
};

const statusLabels: Record<string, string> = {
  PENDING: "Beklemede",
  REVIEWED: "Incelendi",
  RESOLVED: "Cozuldu",
};

const typeLabels: Record<string, string> = {
  post: "Mesaj",
  thread: "Konu",
  user: "Kullanici",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatRelative(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Az once";
  if (diffMins < 60) return `${diffMins} dk once`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} saat once`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} gun once`;
  return formatDate(dateStr);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").slice(0, 80);
}

export default function YonetimPage() {
  const { dbUser, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  // Dashboard state
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Reports state
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportFilter, setReportFilter] = useState<string>("");
  const [reportPage, setReportPage] = useState(1);
  const [reportTotalPages, setReportTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Users state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userSearchDebounced, setUserSearchDebounced] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userActionLoading, setUserActionLoading] = useState<string | null>(null);

  // Categories state
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Threads state
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadSearch, setThreadSearch] = useState("");
  const [threadSearchDebounced, setThreadSearchDebounced] = useState("");
  const [threadCategoryFilter, setThreadCategoryFilter] = useState("");
  const [threadStatusFilter, setThreadStatusFilter] = useState("");
  const [threadSort, setThreadSort] = useState("");
  const [threadPage, setThreadPage] = useState(1);
  const [threadTotalPages, setThreadTotalPages] = useState(1);
  const [threadSelectedIds, setThreadSelectedIds] = useState<Set<string>>(new Set());
  const [threadActionLoading, setThreadActionLoading] = useState(false);
  const [threadCategories, setThreadCategories] = useState<CategoryItem[]>([]);

  // Posts state
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postSearch, setPostSearch] = useState("");
  const [postSearchDebounced, setPostSearchDebounced] = useState("");
  const [postDateRange, setPostDateRange] = useState("");
  const [postSort, setPostSort] = useState("");
  const [postPage, setPostPage] = useState(1);
  const [postTotalPages, setPostTotalPages] = useState(1);
  const [postSelectedIds, setPostSelectedIds] = useState<Set<string>>(new Set());
  const [postActionLoading, setPostActionLoading] = useState(false);
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);
  const [editContent, setEditContent] = useState("");

  // Debounce user search
  useEffect(() => {
    const timer = setTimeout(() => {
      setUserSearchDebounced(userSearch);
      setUserPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [userSearch]);

  // Debounce thread search
  useEffect(() => {
    const timer = setTimeout(() => {
      setThreadSearchDebounced(threadSearch);
      setThreadPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [threadSearch]);

  // Debounce post search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPostSearchDebounced(postSearch);
      setPostPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [postSearch]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // silently fail
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const params = new URLSearchParams();
      if (reportFilter) params.set("status", reportFilter);
      params.set("page", String(reportPage));
      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
        setReportTotalPages(data.pagination.totalPages);
      }
    } catch {
      // silently fail
    } finally {
      setReportsLoading(false);
    }
  }, [reportFilter, reportPage]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (userSearchDebounced) params.set("search", userSearchDebounced);
      params.set("page", String(userPage));
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setUserTotalPages(data.pagination.totalPages);
      }
    } catch {
      // silently fail
    } finally {
      setUsersLoading(false);
    }
  }, [userSearchDebounced, userPage]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch {
      // silently fail — fallback to simple categories endpoint
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch {
        // silently fail
      }
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Fetch thread categories (for filter dropdown)
  const fetchThreadCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setThreadCategories(data);
      }
    } catch {
      // silently fail
    }
  }, []);

  // Fetch threads
  const fetchThreads = useCallback(async () => {
    setThreadsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(threadPage));
      if (threadSearchDebounced) params.set("search", threadSearchDebounced);
      if (threadCategoryFilter) params.set("categoryId", threadCategoryFilter);
      if (threadStatusFilter) params.set("status", threadStatusFilter);
      if (threadSort) params.set("sort", threadSort);
      const res = await fetch(`/api/admin/threads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads);
        setThreadTotalPages(data.pagination?.totalPages ?? 1);
      }
    } catch {
      // silently fail
    } finally {
      setThreadsLoading(false);
    }
  }, [threadSearchDebounced, threadCategoryFilter, threadStatusFilter, threadSort, threadPage]);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(postPage));
      if (postSearchDebounced) params.set("search", postSearchDebounced);
      if (postDateRange) params.set("dateRange", postDateRange);
      if (postSort) params.set("sort", postSort);
      const res = await fetch(`/api/admin/posts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
        setPostTotalPages(data.pagination?.totalPages ?? 1);
      }
    } catch {
      // silently fail
    } finally {
      setPostsLoading(false);
    }
  }, [postSearchDebounced, postDateRange, postSort, postPage]);

  // Fetch on tab change
  useEffect(() => {
    if (!dbUser || (dbUser.role !== "MOD" && dbUser.role !== "ADMIN")) return;
    if (activeTab === "dashboard") fetchStats();
    if (activeTab === "reports") fetchReports();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "categories") fetchCategories();
    if (activeTab === "threads") {
      fetchThreads();
      fetchThreadCategories();
    }
    if (activeTab === "posts") fetchPosts();
  }, [activeTab, dbUser, fetchStats, fetchReports, fetchUsers, fetchCategories, fetchThreads, fetchPosts, fetchThreadCategories]);

  // Report actions
  async function handleReportAction(
    reportId: string,
    status: string,
    action?: string
  ) {
    setActionLoading(reportId);
    try {
      const body: Record<string, string> = { status };
      if (action) body.action = action;
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        fetchReports();
        if (activeTab === "dashboard") fetchStats();
      }
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  }

  // User actions
  async function handleRoleChange(userId: string, role: string) {
    setUserActionLoading(userId);
    try {
      const res = await fetch("/api/moderation/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "changeRole", data: { role } }),
      });
      if (res.ok) fetchUsers();
    } catch {
      // silently fail
    } finally {
      setUserActionLoading(null);
    }
  }

  async function handleBanUser(userId: string) {
    if (!confirm("Bu kullaniciyi yasaklamak istediginize emin misiniz?")) return;
    setUserActionLoading(userId);
    try {
      const res = await fetch("/api/moderation/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "ban" }),
      });
      if (res.ok) fetchUsers();
    } catch {
      // silently fail
    } finally {
      setUserActionLoading(null);
    }
  }

  async function handleUnbanUser(userId: string) {
    setUserActionLoading(userId);
    try {
      const res = await fetch("/api/moderation/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "unban" }),
      });
      if (res.ok) fetchUsers();
    } catch {
      // silently fail
    } finally {
      setUserActionLoading(null);
    }
  }

  // Thread actions
  async function handleThreadAction(action: string, threadIds: string[]) {
    if (action === "delete" && !window.confirm("Bu konulari silmek istediginize emin misiniz?")) return;
    setThreadActionLoading(true);
    try {
      const res = await fetch("/api/admin/threads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, threadIds }),
      });
      if (res.ok) {
        setThreadSelectedIds(new Set());
        fetchThreads();
      }
    } catch {
      // silently fail
    } finally {
      setThreadActionLoading(false);
    }
  }

  function toggleThreadSelect(id: string) {
    setThreadSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllThreads() {
    if (threadSelectedIds.size === threads.length) {
      setThreadSelectedIds(new Set());
    } else {
      setThreadSelectedIds(new Set(threads.map((t) => t.id)));
    }
  }

  // Post actions
  async function handlePostAction(action: string, postIds: string[]) {
    if (action === "delete" && !window.confirm("Bu icerigi silmek istediginize emin misiniz?")) return;
    setPostActionLoading(true);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, postIds }),
      });
      if (res.ok) {
        setPostSelectedIds(new Set());
        fetchPosts();
      }
    } catch {
      // silently fail
    } finally {
      setPostActionLoading(false);
    }
  }

  async function handlePostEdit(postId: string, content: string) {
    setPostActionLoading(true);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "edit", postId, content }),
      });
      if (res.ok) {
        setEditingPost(null);
        setEditContent("");
        fetchPosts();
      }
    } catch {
      // silently fail
    } finally {
      setPostActionLoading(false);
    }
  }

  async function handlePostWarn(userId: string) {
    const message = window.prompt("Uyari mesaji:");
    if (!message) return;
    setPostActionLoading(true);
    try {
      await fetch("/api/admin/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "warn", userId, message }),
      });
    } catch {
      // silently fail
    } finally {
      setPostActionLoading(false);
    }
  }

  function togglePostSelect(id: string) {
    setPostSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllPosts() {
    if (postSelectedIds.size === posts.length) {
      setPostSelectedIds(new Set());
    } else {
      setPostSelectedIds(new Set(posts.map((p) => p.id)));
    }
  }

  // Auth check
  if (authLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1f844e] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!dbUser || (dbUser.role !== "MOD" && dbUser.role !== "ADMIN")) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-xl border border-[#1e293b] bg-[#131820] p-12 text-center">
          <p className="text-lg font-medium text-[#e2e8f0]">
            Bu sayfaya erisim yetkiniz yok
          </p>
          <p className="mt-2 text-sm text-[#64748b]">
            Bu sayfa yalnizca moderator ve yoneticiler icindir.
          </p>
        </div>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; badge?: number }[] = [
    { id: "dashboard", label: "Genel Bakis" },
    { id: "reports", label: "Raporlar", badge: stats?.pendingReports },
    { id: "users", label: "Kullanicilar" },
    { id: "threads", label: "Konular" },
    { id: "posts", label: "Mesajlar" },
    { id: "categories", label: "Kategoriler" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[#e2e8f0]">Yonetim Paneli</h1>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl bg-[#1a2130] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[#131820] text-[#e2e8f0]"
                : "text-[#64748b] hover:text-[#94a3b8]"
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] text-white">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ==================== DASHBOARD TAB ==================== */}
      {activeTab === "dashboard" && (
        <>
          {statsLoading && !stats ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1f844e] border-t-transparent" />
            </div>
          ) : stats ? (
            <>
              {/* Stats Cards */}
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-[#1e293b] bg-[#131820] p-4">
                  <span className="text-sm text-[#64748b]">Toplam Uye</span>
                  <p className="mt-1 text-2xl font-bold text-[#e2e8f0]">
                    {stats.totalUsers.toLocaleString("tr-TR")}
                  </p>
                  <span className="text-xs text-[#1f844e]">
                    +{stats.todayUsers} bugun
                  </span>
                </div>
                <div className="rounded-xl border border-[#1e293b] bg-[#131820] p-4">
                  <span className="text-sm text-[#64748b]">Toplam Konu</span>
                  <p className="mt-1 text-2xl font-bold text-[#e2e8f0]">
                    {stats.totalThreads.toLocaleString("tr-TR")}
                  </p>
                  <span className="text-xs text-[#e8a935]">
                    +{stats.todayThreads} bugun
                  </span>
                </div>
                <div className="rounded-xl border border-[#1e293b] bg-[#131820] p-4">
                  <span className="text-sm text-[#64748b]">Toplam Mesaj</span>
                  <p className="mt-1 text-2xl font-bold text-[#e2e8f0]">
                    {stats.totalPosts.toLocaleString("tr-TR")}
                  </p>
                  <span className="text-xs text-[#3b82f6]">
                    +{stats.todayPosts} bugun
                  </span>
                </div>
                <div className="rounded-xl border border-[#1e293b] bg-[#131820] p-4">
                  <span className="text-sm text-[#64748b]">Acik Rapor</span>
                  <p className="mt-1 text-2xl font-bold text-[#e2e8f0]">
                    {stats.pendingReports}
                  </p>
                  <span className="text-xs text-[#ef4444]">
                    {stats.onlineUsers} cevrimici
                  </span>
                </div>
              </div>

              {/* Recent sections */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Recent Users */}
                <div className="rounded-xl border border-[#1e293b] bg-[#131820]">
                  <div className="border-b border-[#1e293b] bg-[#1a2130] px-5 py-3">
                    <h2 className="text-sm font-semibold text-[#e2e8f0]">
                      Son Kayit Olan Uyeler
                    </h2>
                  </div>
                  <div className="flex flex-col gap-1 p-3">
                    {stats.recentUsers.length === 0 ? (
                      <p className="py-4 text-center text-sm text-[#64748b]">
                        Henuz kayitli uye yok
                      </p>
                    ) : (
                      stats.recentUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-[#1e2738]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a2130] text-sm font-medium text-[#94a3b8]">
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt={user.username}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              ) : (
                                user.username.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-[#e2e8f0]">
                                {user.username}
                              </span>
                              <span
                                className={`ml-2 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${roleColors[user.role]}`}
                              >
                                {user.role}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-[#64748b]">
                            {formatRelative(user.createdAt)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Reports */}
                <div className="rounded-xl border border-[#1e293b] bg-[#131820]">
                  <div className="border-b border-[#1e293b] bg-[#1a2130] px-5 py-3">
                    <h2 className="text-sm font-semibold text-[#e2e8f0]">
                      Bekleyen Raporlar
                    </h2>
                  </div>
                  <div className="flex flex-col gap-1 p-3">
                    {stats.recentReports.length === 0 ? (
                      <p className="py-4 text-center text-sm text-[#64748b]">
                        Bekleyen rapor yok
                      </p>
                    ) : (
                      stats.recentReports.map((report) => (
                        <div
                          key={report.id}
                          className="flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-[#1e2738]"
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center rounded-full border border-[#1e293b] px-1.5 py-0.5 text-[10px] text-[#94a3b8]">
                                {typeLabels[report.type] || report.type}
                              </span>
                              <span className="text-sm text-[#e2e8f0]">
                                {report.reason}
                              </span>
                            </div>
                            <span className="text-xs text-[#64748b]">
                              {report.reporter.username} tarafindan
                            </span>
                          </div>
                          <button
                            onClick={() => setActiveTab("reports")}
                            className="rounded px-2 py-1 text-xs text-[#94a3b8] transition-colors hover:bg-[#1a2130] hover:text-[#e2e8f0]"
                          >
                            Incele
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </>
      )}

      {/* ==================== REPORTS TAB ==================== */}
      {activeTab === "reports" && (
        <div className="rounded-xl border border-[#1e293b] bg-[#131820]">
          <div className="flex items-center justify-between border-b border-[#1e293b] bg-[#1a2130] px-5 py-3">
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Raporlar</h2>
            <div className="flex gap-1">
              {[
                { value: "", label: "Tumu" },
                { value: "PENDING", label: "Beklemede" },
                { value: "REVIEWED", label: "Incelendi" },
                { value: "RESOLVED", label: "Cozuldu" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => {
                    setReportFilter(f.value);
                    setReportPage(1);
                  }}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    reportFilter === f.value
                      ? "bg-[#131820] text-[#e2e8f0]"
                      : "text-[#64748b] hover:text-[#94a3b8]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto p-4">
            {reportsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1f844e] border-t-transparent" />
              </div>
            ) : reports.length === 0 ? (
              <p className="py-12 text-center text-sm text-[#64748b]">
                Rapor bulunamadi
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e293b] text-left text-xs text-[#64748b]">
                    <th className="pb-3 font-medium">Tip</th>
                    <th className="pb-3 font-medium">Hedef</th>
                    <th className="pb-3 font-medium">Bildiren</th>
                    <th className="pb-3 font-medium">Sebep</th>
                    <th className="pb-3 font-medium">Tarih</th>
                    <th className="pb-3 font-medium">Durum</th>
                    <th className="pb-3 text-right font-medium">Islem</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="border-b border-[#1e293b] last:border-0"
                    >
                      <td className="py-3">
                        <span className="inline-flex items-center rounded-full border border-[#1e293b] px-2 py-0.5 text-xs text-[#94a3b8]">
                          {typeLabels[report.type] || report.type}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-[#94a3b8]">
                        <span className="max-w-[120px] truncate inline-block">
                          {report.targetId.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="py-3 text-sm font-medium text-[#e2e8f0]">
                        {report.reporter.username}
                      </td>
                      <td className="py-3 text-sm text-[#94a3b8]">
                        {report.reason}
                      </td>
                      <td className="py-3 text-sm text-[#94a3b8]">
                        {formatDate(report.createdAt)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[report.status]}`}
                        >
                          {statusLabels[report.status]}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {report.status === "PENDING" && (
                            <>
                              <button
                                disabled={actionLoading === report.id}
                                onClick={() =>
                                  handleReportAction(report.id, "REVIEWED")
                                }
                                className="rounded px-2 py-1 text-xs text-[#3b82f6] transition-colors hover:bg-[#3b82f6]/10 disabled:opacity-50"
                              >
                                Incele
                              </button>
                              <button
                                disabled={actionLoading === report.id}
                                onClick={() =>
                                  handleReportAction(report.id, "RESOLVED")
                                }
                                className="rounded px-2 py-1 text-xs text-[#1f844e] transition-colors hover:bg-[#1f844e]/10 disabled:opacity-50"
                              >
                                Coz
                              </button>
                              <button
                                disabled={actionLoading === report.id}
                                onClick={() =>
                                  handleReportAction(
                                    report.id,
                                    "RESOLVED",
                                    "deleteContent"
                                  )
                                }
                                className="rounded px-2 py-1 text-xs text-[#ef4444] transition-colors hover:bg-[#ef4444]/10 disabled:opacity-50"
                              >
                                Icerigi Sil
                              </button>
                            </>
                          )}
                          {report.status === "REVIEWED" && (
                            <>
                              <button
                                disabled={actionLoading === report.id}
                                onClick={() =>
                                  handleReportAction(report.id, "RESOLVED")
                                }
                                className="rounded px-2 py-1 text-xs text-[#1f844e] transition-colors hover:bg-[#1f844e]/10 disabled:opacity-50"
                              >
                                Coz
                              </button>
                              <button
                                disabled={actionLoading === report.id}
                                onClick={() =>
                                  handleReportAction(
                                    report.id,
                                    "RESOLVED",
                                    "deleteContent"
                                  )
                                }
                                className="rounded px-2 py-1 text-xs text-[#ef4444] transition-colors hover:bg-[#ef4444]/10 disabled:opacity-50"
                              >
                                Icerigi Sil
                              </button>
                            </>
                          )}
                          {report.status === "RESOLVED" && (
                            <span className="px-2 py-1 text-xs text-[#64748b]">
                              Tamamlandi
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {/* Pagination */}
          {reportTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 border-t border-[#1e293b] px-5 py-3">
              <button
                disabled={reportPage <= 1}
                onClick={() => setReportPage((p) => p - 1)}
                className="rounded px-3 py-1 text-xs text-[#94a3b8] transition-colors hover:bg-[#1a2130] disabled:opacity-50"
              >
                Onceki
              </button>
              <span className="text-xs text-[#64748b]">
                {reportPage} / {reportTotalPages}
              </span>
              <button
                disabled={reportPage >= reportTotalPages}
                onClick={() => setReportPage((p) => p + 1)}
                className="rounded px-3 py-1 text-xs text-[#94a3b8] transition-colors hover:bg-[#1a2130] disabled:opacity-50"
              >
                Sonraki
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================== USERS TAB ==================== */}
      {activeTab === "users" && (
        <div className="rounded-xl border border-[#1e293b] bg-[#131820]">
          <div className="flex items-center justify-between border-b border-[#1e293b] bg-[#1a2130] px-5 py-3">
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Kullanicilar</h2>
            <input
              placeholder="Kullanici ara..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-64 rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-1.5 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#1f844e] focus:outline-none focus:ring-1 focus:ring-[#1f844e]/30"
            />
          </div>
          <div className="overflow-x-auto p-4">
            {usersLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1f844e] border-t-transparent" />
              </div>
            ) : users.length === 0 ? (
              <p className="py-12 text-center text-sm text-[#64748b]">
                Kullanici bulunamadi
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e293b] text-left text-xs text-[#64748b]">
                    <th className="pb-3 font-medium">Kullanici Adi</th>
                    <th className="pb-3 font-medium">E-posta</th>
                    <th className="pb-3 font-medium">Rol</th>
                    <th className="pb-3 font-medium">Mesaj</th>
                    <th className="pb-3 font-medium">Katilim</th>
                    <th className="pb-3 text-right font-medium">Islem</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-[#1e293b] last:border-0"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1a2130] text-xs font-medium text-[#94a3b8]">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.username}
                                className="h-7 w-7 rounded-full object-cover"
                              />
                            ) : (
                              user.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-[#e2e8f0]">
                              {user.username}
                            </span>
                            {user.title === "[YASAKLI]" && (
                              <span className="text-[10px] text-[#ef4444]">
                                YASAKLI
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-sm text-[#94a3b8]">
                        {user.email}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${roleColors[user.role]}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-[#94a3b8]">
                        {user.postCount}
                      </td>
                      <td className="py-3 text-sm text-[#94a3b8]">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {dbUser.role === "ADMIN" && user.id !== dbUser.id && (
                            <select
                              value={user.role}
                              onChange={(e) =>
                                handleRoleChange(user.id, e.target.value)
                              }
                              disabled={userActionLoading === user.id}
                              className="rounded border border-[#1e293b] bg-[#0d1017] px-2 py-1 text-xs text-[#e2e8f0] focus:border-[#1f844e] focus:outline-none disabled:opacity-50"
                            >
                              <option value="USER">USER</option>
                              <option value="MOD">MOD</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          )}
                          {dbUser.role === "ADMIN" && user.id !== dbUser.id && (
                            <>
                              {user.title === "[YASAKLI]" ? (
                                <button
                                  disabled={userActionLoading === user.id}
                                  onClick={() => handleUnbanUser(user.id)}
                                  className="rounded px-2 py-1 text-xs text-[#1f844e] transition-colors hover:bg-[#1f844e]/10 disabled:opacity-50"
                                >
                                  Yasagi Kaldir
                                </button>
                              ) : (
                                <button
                                  disabled={userActionLoading === user.id}
                                  onClick={() => handleBanUser(user.id)}
                                  className="rounded px-2 py-1 text-xs text-[#ef4444] transition-colors hover:bg-[#ef4444]/10 disabled:opacity-50"
                                >
                                  Yasakla
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {/* Pagination */}
          {userTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 border-t border-[#1e293b] px-5 py-3">
              <button
                disabled={userPage <= 1}
                onClick={() => setUserPage((p) => p - 1)}
                className="rounded px-3 py-1 text-xs text-[#94a3b8] transition-colors hover:bg-[#1a2130] disabled:opacity-50"
              >
                Onceki
              </button>
              <span className="text-xs text-[#64748b]">
                {userPage} / {userTotalPages}
              </span>
              <button
                disabled={userPage >= userTotalPages}
                onClick={() => setUserPage((p) => p + 1)}
                className="rounded px-3 py-1 text-xs text-[#94a3b8] transition-colors hover:bg-[#1a2130] disabled:opacity-50"
              >
                Sonraki
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================== THREADS TAB ==================== */}
      {activeTab === "threads" && (
        <div className="rounded-xl border border-[#1e293b] bg-[#131820]">
          <div className="border-b border-[#1e293b] bg-[#1a2130] px-5 py-3">
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Konular</h2>
          </div>
          {/* Search & Filters */}
          <div className="flex flex-col gap-3 border-b border-[#1e293b] px-5 py-3">
            <input
              placeholder="Baslik veya yazar ara..."
              value={threadSearch}
              onChange={(e) => setThreadSearch(e.target.value)}
              className="w-full rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-1.5 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#1f844e] focus:outline-none focus:ring-1 focus:ring-[#1f844e]/30"
            />
            <div className="flex flex-wrap gap-2">
              <select
                value={threadCategoryFilter}
                onChange={(e) => {
                  setThreadCategoryFilter(e.target.value);
                  setThreadPage(1);
                }}
                className="rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-1.5 text-xs text-[#e2e8f0] focus:border-[#1f844e] focus:outline-none"
              >
                <option value="">Tum Kategoriler</option>
                {threadCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <select
                value={threadStatusFilter}
                onChange={(e) => {
                  setThreadStatusFilter(e.target.value);
                  setThreadPage(1);
                }}
                className="rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-1.5 text-xs text-[#e2e8f0] focus:border-[#1f844e] focus:outline-none"
              >
                <option value="">Tumu</option>
                <option value="active">Aktif</option>
                <option value="locked">Kilitli</option>
                <option value="pinned">Sabitlenmis</option>
              </select>
              <select
                value={threadSort}
                onChange={(e) => {
                  setThreadSort(e.target.value);
                  setThreadPage(1);
                }}
                className="rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-1.5 text-xs text-[#e2e8f0] focus:border-[#1f844e] focus:outline-none"
              >
                <option value="">En Yeni</option>
                <option value="oldest">En Eski</option>
                <option value="mostReplies">En Cok Yanit</option>
                <option value="mostViews">En Cok Goruntuleme</option>
              </select>
            </div>
          </div>
          {/* Bulk Actions */}
          {threadSelectedIds.size > 0 && (
            <div className="flex items-center gap-2 border-b border-[#1e293b] px-5 py-2">
              <span className="text-xs text-[#94a3b8]">
                {threadSelectedIds.size} secili
              </span>
              <button
                disabled={threadActionLoading}
                onClick={() =>
                  handleThreadAction("delete", Array.from(threadSelectedIds))
                }
                className="rounded px-2 py-1 text-xs text-[#ef4444] transition-colors hover:bg-[#ef4444]/10 disabled:opacity-50"
              >
                Secilenleri Sil
              </button>
              <button
                disabled={threadActionLoading}
                onClick={() =>
                  handleThreadAction("lock", Array.from(threadSelectedIds))
                }
                className="rounded px-2 py-1 text-xs text-[#e8a935] transition-colors hover:bg-[#e8a935]/10 disabled:opacity-50"
              >
                Secilenleri Kilitle
              </button>
            </div>
          )}
          <div className="overflow-x-auto p-4">
            {threadsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1f844e] border-t-transparent" />
              </div>
            ) : threads.length === 0 ? (
              <p className="py-12 text-center text-sm text-[#64748b]">
                Konu bulunamadi
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e293b] text-left text-xs text-[#64748b]">
                    <th className="pb-3 font-medium">
                      <input
                        type="checkbox"
                        checked={threadSelectedIds.size === threads.length && threads.length > 0}
                        onChange={toggleAllThreads}
                        className="h-3.5 w-3.5 rounded border-[#1e293b] bg-[#0d1017]"
                      />
                    </th>
                    <th className="pb-3 font-medium">Baslik</th>
                    <th className="pb-3 font-medium">Kategori</th>
                    <th className="pb-3 font-medium">Yazar</th>
                    <th className="pb-3 font-medium">Yanit</th>
                    <th className="pb-3 font-medium">Goruntuleme</th>
                    <th className="pb-3 font-medium">Tarih</th>
                    <th className="pb-3 font-medium">Durum</th>
                    <th className="pb-3 text-right font-medium">Islem</th>
                  </tr>
                </thead>
                <tbody>
                  {threads.map((thread) => (
                    <tr
                      key={thread.id}
                      className="border-b border-[#1e293b] last:border-0 transition-colors hover:bg-[#1e2738]"
                    >
                      <td className="py-3">
                        <input
                          type="checkbox"
                          checked={threadSelectedIds.has(thread.id)}
                          onChange={() => toggleThreadSelect(thread.id)}
                          className="h-3.5 w-3.5 rounded border-[#1e293b] bg-[#0d1017]"
                        />
                      </td>
                      <td className="py-3">
                        <span className="text-sm font-medium text-[#e2e8f0] max-w-[200px] truncate inline-block">
                          {thread.title}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center rounded-full border border-[#1e293b] px-2 py-0.5 text-xs text-[#94a3b8]">
                          {thread.category.name}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-[#94a3b8]">
                        {thread.author.username}
                      </td>
                      <td className="py-3 text-sm text-[#94a3b8]">
                        {thread._count.posts}
                      </td>
                      <td className="py-3 text-sm text-[#94a3b8]">
                        {thread.viewCount}
                      </td>
                      <td className="py-3 text-sm text-[#94a3b8]">
                        {formatDate(thread.createdAt)}
                      </td>
                      <td className="py-3">
                        {thread.isPinned ? (
                          <span className="inline-flex items-center rounded-full border border-[#3b82f6] px-2 py-0.5 text-xs font-medium text-[#3b82f6]">
                            Sabitli
                          </span>
                        ) : thread.isLocked ? (
                          <span className="inline-flex items-center rounded-full border border-[#e8a935] px-2 py-0.5 text-xs font-medium text-[#e8a935]">
                            Kilitli
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-[#1f844e] px-2 py-0.5 text-xs font-medium text-[#1f844e]">
                            Aktif
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            disabled={threadActionLoading}
                            onClick={() =>
                              handleThreadAction("pin", [thread.id])
                            }
                            title={thread.isPinned ? "Sabitlemeyi Kaldir" : "Sabitle"}
                            className="rounded px-2 py-1 text-xs transition-colors hover:bg-[#3b82f6]/10 disabled:opacity-50"
                          >
                            📌
                          </button>
                          <button
                            disabled={threadActionLoading}
                            onClick={() =>
                              handleThreadAction("lock", [thread.id])
                            }
                            title={thread.isLocked ? "Kilidi Ac" : "Kilitle"}
                            className="rounded px-2 py-1 text-xs transition-colors hover:bg-[#e8a935]/10 disabled:opacity-50"
                          >
                            🔒
                          </button>
                          <button
                            disabled={threadActionLoading}
                            onClick={() =>
                              handleThreadAction("delete", [thread.id])
                            }
                            title="Sil"
                            className="rounded px-2 py-1 text-xs transition-colors hover:bg-[#ef4444]/10 disabled:opacity-50"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {/* Pagination */}
          {threadTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 border-t border-[#1e293b] px-5 py-3">
              <button
                disabled={threadPage <= 1}
                onClick={() => setThreadPage((p) => p - 1)}
                className="rounded px-3 py-1 text-xs text-[#94a3b8] transition-colors hover:bg-[#1a2130] disabled:opacity-50"
              >
                Onceki
              </button>
              <span className="text-xs text-[#64748b]">
                {threadPage} / {threadTotalPages}
              </span>
              <button
                disabled={threadPage >= threadTotalPages}
                onClick={() => setThreadPage((p) => p + 1)}
                className="rounded px-3 py-1 text-xs text-[#94a3b8] transition-colors hover:bg-[#1a2130] disabled:opacity-50"
              >
                Sonraki
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================== POSTS TAB ==================== */}
      {activeTab === "posts" && (
        <div className="rounded-xl border border-[#1e293b] bg-[#131820]">
          <div className="border-b border-[#1e293b] bg-[#1a2130] px-5 py-3">
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Mesajlar</h2>
          </div>
          {/* Search & Filters */}
          <div className="flex flex-col gap-3 border-b border-[#1e293b] px-5 py-3">
            <input
              placeholder="Icerik veya yazar ara..."
              value={postSearch}
              onChange={(e) => setPostSearch(e.target.value)}
              className="w-full rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-1.5 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#1f844e] focus:outline-none focus:ring-1 focus:ring-[#1f844e]/30"
            />
            <div className="flex flex-wrap gap-2">
              <select
                value={postDateRange}
                onChange={(e) => {
                  setPostDateRange(e.target.value);
                  setPostPage(1);
                }}
                className="rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-1.5 text-xs text-[#e2e8f0] focus:border-[#1f844e] focus:outline-none"
              >
                <option value="">Tumu</option>
                <option value="today">Bugun</option>
                <option value="week">Son 7 Gun</option>
                <option value="month">Son 30 Gun</option>
              </select>
              <select
                value={postSort}
                onChange={(e) => {
                  setPostSort(e.target.value);
                  setPostPage(1);
                }}
                className="rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-1.5 text-xs text-[#e2e8f0] focus:border-[#1f844e] focus:outline-none"
              >
                <option value="">En Yeni</option>
                <option value="oldest">En Eski</option>
              </select>
            </div>
          </div>
          {/* Bulk Actions */}
          {postSelectedIds.size > 0 && (
            <div className="flex items-center gap-2 border-b border-[#1e293b] px-5 py-2">
              <span className="text-xs text-[#94a3b8]">
                {postSelectedIds.size} secili
              </span>
              <button
                disabled={postActionLoading}
                onClick={() =>
                  handlePostAction("delete", Array.from(postSelectedIds))
                }
                className="rounded px-2 py-1 text-xs text-[#ef4444] transition-colors hover:bg-[#ef4444]/10 disabled:opacity-50"
              >
                Secilenleri Sil
              </button>
            </div>
          )}
          <div className="overflow-x-auto p-4">
            {postsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1f844e] border-t-transparent" />
              </div>
            ) : posts.length === 0 ? (
              <p className="py-12 text-center text-sm text-[#64748b]">
                Mesaj bulunamadi
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e293b] text-left text-xs text-[#64748b]">
                    <th className="pb-3 font-medium">
                      <input
                        type="checkbox"
                        checked={postSelectedIds.size === posts.length && posts.length > 0}
                        onChange={toggleAllPosts}
                        className="h-3.5 w-3.5 rounded border-[#1e293b] bg-[#0d1017]"
                      />
                    </th>
                    <th className="pb-3 font-medium">Icerik</th>
                    <th className="pb-3 font-medium">Konu</th>
                    <th className="pb-3 font-medium">Yazar</th>
                    <th className="pb-3 font-medium">Tepki</th>
                    <th className="pb-3 font-medium">Tarih</th>
                    <th className="pb-3 text-right font-medium">Islem</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr
                      key={post.id}
                      className="border-b border-[#1e293b] last:border-0 transition-colors hover:bg-[#1e2738]"
                    >
                      <td className="py-3">
                        <input
                          type="checkbox"
                          checked={postSelectedIds.has(post.id)}
                          onChange={() => togglePostSelect(post.id)}
                          className="h-3.5 w-3.5 rounded border-[#1e293b] bg-[#0d1017]"
                        />
                      </td>
                      <td className="py-3">
                        <span className="text-sm text-[#94a3b8] max-w-[250px] truncate inline-block">
                          {stripHtml(post.content)}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="text-sm text-[#e2e8f0] max-w-[150px] truncate inline-block">
                          {post.thread.title}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-[#94a3b8]">
                        {post.author.username}
                      </td>
                      <td className="py-3 text-sm text-[#94a3b8]">
                        {post._count?.reactions ?? 0}
                      </td>
                      <td className="py-3 text-sm text-[#94a3b8]">
                        {formatDate(post.createdAt)}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            disabled={postActionLoading}
                            onClick={() => {
                              setEditingPost(post);
                              setEditContent(post.content);
                            }}
                            title="Duzenle"
                            className="rounded px-2 py-1 text-xs transition-colors hover:bg-[#3b82f6]/10 disabled:opacity-50"
                          >
                            ✏️
                          </button>
                          <button
                            disabled={postActionLoading}
                            onClick={() =>
                              handlePostAction("delete", [post.id])
                            }
                            title="Sil"
                            className="rounded px-2 py-1 text-xs transition-colors hover:bg-[#ef4444]/10 disabled:opacity-50"
                          >
                            🗑️
                          </button>
                          <button
                            disabled={postActionLoading}
                            onClick={() => handlePostWarn(post.author.id)}
                            title="Kullaniciyi Uyar"
                            className="rounded px-2 py-1 text-xs transition-colors hover:bg-[#e8a935]/10 disabled:opacity-50"
                          >
                            ⚠️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {/* Pagination */}
          {postTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 border-t border-[#1e293b] px-5 py-3">
              <button
                disabled={postPage <= 1}
                onClick={() => setPostPage((p) => p - 1)}
                className="rounded px-3 py-1 text-xs text-[#94a3b8] transition-colors hover:bg-[#1a2130] disabled:opacity-50"
              >
                Onceki
              </button>
              <span className="text-xs text-[#64748b]">
                {postPage} / {postTotalPages}
              </span>
              <button
                disabled={postPage >= postTotalPages}
                onClick={() => setPostPage((p) => p + 1)}
                className="rounded px-3 py-1 text-xs text-[#94a3b8] transition-colors hover:bg-[#1a2130] disabled:opacity-50"
              >
                Sonraki
              </button>
            </div>
          )}
        </div>
      )}

      {/* Post Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-lg rounded-xl border border-[#1e293b] bg-[#131820] p-6">
            <h3 className="mb-4 text-sm font-semibold text-[#e2e8f0]">
              Mesaji Duzenle
            </h3>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={8}
              className="w-full rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#1f844e] focus:outline-none focus:ring-1 focus:ring-[#1f844e]/30"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setEditingPost(null);
                  setEditContent("");
                }}
                className="rounded-md border border-[#1e293b] px-3 py-1.5 text-xs text-[#94a3b8] transition-colors hover:bg-[#1a2130]"
              >
                Iptal
              </button>
              <button
                disabled={postActionLoading}
                onClick={() => handlePostEdit(editingPost.id, editContent)}
                className="rounded-md bg-[#1f844e] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1f844e]/80 disabled:opacity-50"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CATEGORIES TAB ==================== */}
      {activeTab === "categories" && (
        <div className="rounded-xl border border-[#1e293b] bg-[#131820]">
          <div className="flex items-center justify-between border-b border-[#1e293b] bg-[#1a2130] px-5 py-3">
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Kategoriler</h2>
            <button className="rounded-md bg-[#1f844e] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1f844e]/80">
              Yeni Kategori
            </button>
          </div>
          <div className="flex flex-col gap-2 p-4">
            {categoriesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1f844e] border-t-transparent" />
              </div>
            ) : categories.length === 0 ? (
              <p className="py-12 text-center text-sm text-[#64748b]">
                Kategori bulunamadi
              </p>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between rounded-md bg-[#0d1017] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{cat.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#e2e8f0]">
                          {cat.name}
                        </span>
                        {cat.isVip && (
                          <span className="inline-flex items-center rounded-full border border-[#e8a935] px-2 py-0.5 text-[10px] font-medium text-[#e8a935]">
                            VIP
                          </span>
                        )}
                        {cat.isCasino && (
                          <span className="inline-flex items-center rounded-full border border-[#ef4444] px-2 py-0.5 text-[10px] font-medium text-[#ef4444]">
                            Casino
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#64748b]">
                        /{cat.slug}
                        {cat._count?.threads !== undefined &&
                          ` \u00B7 ${cat._count.threads} konu`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="rounded px-2 py-1 text-xs text-[#94a3b8] transition-colors hover:bg-[#1a2130] hover:text-[#e2e8f0]">
                      Duzenle
                    </button>
                    <button className="rounded px-2 py-1 text-xs text-[#ef4444] transition-colors hover:bg-[#ef4444]/10">
                      Sil
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
