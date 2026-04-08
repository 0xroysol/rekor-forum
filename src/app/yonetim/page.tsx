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

type TabId = "dashboard" | "reports" | "users" | "categories";

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

  // Debounce user search
  useEffect(() => {
    const timer = setTimeout(() => {
      setUserSearchDebounced(userSearch);
      setUserPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [userSearch]);

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

  // Fetch on tab change
  useEffect(() => {
    if (!dbUser || (dbUser.role !== "MOD" && dbUser.role !== "ADMIN")) return;
    if (activeTab === "dashboard") fetchStats();
    if (activeTab === "reports") fetchReports();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "categories") fetchCategories();
  }, [activeTab, dbUser, fetchStats, fetchReports, fetchUsers, fetchCategories]);

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
