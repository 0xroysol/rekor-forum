"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const stats = [
  { label: "Toplam Uye", value: "12,458", change: "+124 bu hafta", color: "#1f844e" },
  { label: "Toplam Konu", value: "3,842", change: "+56 bu hafta", color: "#e8a935" },
  { label: "Toplam Mesaj", value: "89,215", change: "+1,203 bu hafta", color: "#3b82f6" },
  { label: "Acik Rapor", value: "23", change: "5 acil", color: "#ef4444" },
];

const mockUsers = [
  { id: "1", username: "BetMaster42", email: "betmaster@email.com", role: "USER", joinDate: "12.01.2025", posts: 342 },
  { id: "2", username: "SporGuru", email: "sporguru@email.com", role: "MOD", joinDate: "03.08.2024", posts: 1205 },
  { id: "3", username: "CasinoKral", email: "casinokral@email.com", role: "USER", joinDate: "22.03.2025", posts: 89 },
  { id: "4", username: "TahminUzmani", email: "tahmin@email.com", role: "USER", joinDate: "15.11.2024", posts: 567 },
  { id: "5", username: "AdminPro", email: "admin@rekorforum.com", role: "ADMIN", joinDate: "01.01.2024", posts: 2341 },
  { id: "6", username: "SlotMaster", email: "slot@email.com", role: "USER", joinDate: "07.06.2025", posts: 45 },
];

const mockReports = [
  { id: "1", reporter: "SporGuru", type: "Mesaj", target: "Spam icerik #4521", reason: "Reklam / Spam", status: "PENDING", date: "04.04.2026" },
  { id: "2", reporter: "BetMaster42", type: "Kullanici", target: "SpamBot99", reason: "Bot hesap", status: "PENDING", date: "04.04.2026" },
  { id: "3", reporter: "TahminUzmani", type: "Konu", target: "Yasadisi bahis sitesi", reason: "Kural ihlali", status: "REVIEWED", date: "03.04.2026" },
  { id: "4", reporter: "CasinoKral", type: "Mesaj", target: "Hakaret #8832", reason: "Hakaret / Kufur", status: "RESOLVED", date: "02.04.2026" },
  { id: "5", reporter: "AdminPro", type: "Kullanici", target: "FakeAccount", reason: "Sahte hesap", status: "PENDING", date: "04.04.2026" },
];

const mockCategories = [
  { id: "1", name: "Futbol", slug: "futbol", threads: 1245, icon: "U+26BD", isVip: false },
  { id: "2", name: "Basketbol", slug: "basketbol", threads: 432, icon: "U+1F3C0", isVip: false },
  { id: "3", name: "Casino", slug: "casino", threads: 876, icon: "U+1F3B0", isVip: true },
  { id: "4", name: "Canli Bahis", slug: "canli-bahis", threads: 654, icon: "U+1F4B0", isVip: false },
  { id: "5", name: "VIP Tahminler", slug: "vip-tahminler", threads: 234, icon: "U+2B50", isVip: true },
];

const roleColors: Record<string, string> = {
  ADMIN: "bg-[#ef4444]/20 text-[#ef4444]",
  MOD: "bg-[#e8a935]/20 text-[#e8a935]",
  USER: "bg-[#1f844e]/20 text-[#1f844e]",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-[#e8a935]/20 text-[#e8a935]",
  REVIEWED: "bg-[#3b82f6]/20 text-[#3b82f6]",
  RESOLVED: "bg-[#1f844e]/20 text-[#1f844e]",
};

const statusLabels: Record<string, string> = {
  PENDING: "Beklemede",
  REVIEWED: "Incelendi",
  RESOLVED: "Cozuldu",
};

export default function YonetimPage() {
  const [userSearch, setUserSearch] = useState("");

  const filteredUsers = mockUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#080a0f]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-white">Yonetim Paneli</h1>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className="border-none bg-[#131820] ring-white/5"
            >
              <CardContent className="flex flex-col gap-1">
                <span className="text-sm text-gray-500">{stat.label}</span>
                <span className="text-2xl font-bold text-white">
                  {stat.value}
                </span>
                <span className="text-xs" style={{ color: stat.color }}>
                  {stat.change}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users">
          <TabsList className="bg-[#131820]">
            <TabsTrigger value="users" className="text-gray-400 data-active:text-white">
              Kullanicilar
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-gray-400 data-active:text-white">
              Raporlar
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ef4444] text-[10px] text-white">
                3
              </span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="text-gray-400 data-active:text-white">
              Kategoriler
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-gray-400 data-active:text-white">
              Ayarlar
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="border-none bg-[#131820] ring-white/5">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-white">Kullanicilar</CardTitle>
                <Input
                  placeholder="Kullanici ara..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-64 border-white/10 bg-[#0d1017] text-white placeholder:text-gray-500 focus-visible:border-[#1f844e] focus-visible:ring-[#1f844e]/30"
                />
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5 text-left text-xs text-gray-500">
                        <th className="pb-3 font-medium">Kullanici Adi</th>
                        <th className="pb-3 font-medium">E-posta</th>
                        <th className="pb-3 font-medium">Rol</th>
                        <th className="pb-3 font-medium">Katilim</th>
                        <th className="pb-3 font-medium">Mesaj</th>
                        <th className="pb-3 text-right font-medium">Islemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-white/5 last:border-0"
                        >
                          <td className="py-3 text-sm font-medium text-white">
                            {user.username}
                          </td>
                          <td className="py-3 text-sm text-gray-400">
                            {user.email}
                          </td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[user.role]}`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3 text-sm text-gray-400">
                            {user.joinDate}
                          </td>
                          <td className="py-3 text-sm text-gray-400">
                            {user.posts}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="xs"
                                className="text-gray-400 hover:text-white"
                              >
                                Duzenle
                              </Button>
                              <Button
                                variant="ghost"
                                size="xs"
                                className="text-[#ef4444] hover:text-[#ef4444]/80"
                              >
                                Banla
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card className="border-none bg-[#131820] ring-white/5">
              <CardHeader>
                <CardTitle className="text-white">Raporlar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5 text-left text-xs text-gray-500">
                        <th className="pb-3 font-medium">Raporlayan</th>
                        <th className="pb-3 font-medium">Tur</th>
                        <th className="pb-3 font-medium">Hedef</th>
                        <th className="pb-3 font-medium">Sebep</th>
                        <th className="pb-3 font-medium">Durum</th>
                        <th className="pb-3 font-medium">Tarih</th>
                        <th className="pb-3 text-right font-medium">Islemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockReports.map((report) => (
                        <tr
                          key={report.id}
                          className="border-b border-white/5 last:border-0"
                        >
                          <td className="py-3 text-sm font-medium text-white">
                            {report.reporter}
                          </td>
                          <td className="py-3">
                            <Badge variant="outline" className="border-white/10 text-gray-300">
                              {report.type}
                            </Badge>
                          </td>
                          <td className="py-3 text-sm text-gray-400">
                            {report.target}
                          </td>
                          <td className="py-3 text-sm text-gray-400">
                            {report.reason}
                          </td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[report.status]}`}
                            >
                              {statusLabels[report.status]}
                            </span>
                          </td>
                          <td className="py-3 text-sm text-gray-400">
                            {report.date}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="xs"
                                className="text-gray-400 hover:text-white"
                              >
                                Incele
                              </Button>
                              <Button
                                variant="ghost"
                                size="xs"
                                className="text-[#1f844e] hover:text-[#1f844e]/80"
                              >
                                Coz
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <Card className="border-none bg-[#131820] ring-white/5">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-white">Kategoriler</CardTitle>
                <Button className="bg-[#1f844e] text-white hover:bg-[#1f844e]/80">
                  Yeni Kategori
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {mockCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between rounded-lg bg-[#0d1017] px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{cat.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">
                              {cat.name}
                            </span>
                            {cat.isVip && (
                              <span className="inline-flex items-center rounded-full bg-[#e8a935]/20 px-2 py-0.5 text-[10px] font-medium text-[#e8a935]">
                                VIP
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            /{cat.slug} &middot; {cat.threads} konu
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-gray-400 hover:text-white"
                        >
                          Duzenle
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-[#ef4444] hover:text-[#ef4444]/80"
                        >
                          Sil
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="border-none bg-[#131820] ring-white/5">
              <CardHeader>
                <CardTitle className="text-white">Forum Ayarlari</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-gray-400">Forum Adi</label>
                    <Input
                      defaultValue="Rekor Forum"
                      className="max-w-md border-white/10 bg-[#0d1017] text-white focus-visible:border-[#1f844e] focus-visible:ring-[#1f844e]/30"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-gray-400">
                      Forum Aciklamasi
                    </label>
                    <Input
                      defaultValue="Turkiye'nin en buyuk spor ve casino forumu"
                      className="max-w-md border-white/10 bg-[#0d1017] text-white focus-visible:border-[#1f844e] focus-visible:ring-[#1f844e]/30"
                    />
                  </div>
                  <Separator className="bg-white/5" />
                  <div className="flex flex-col gap-3">
                    <span className="text-sm font-medium text-white">
                      Genel Ayarlar
                    </span>
                    {[
                      { label: "Yeni kayitlari etkinlestir", checked: true },
                      { label: "E-posta dogrulamasi zorunlu", checked: true },
                      { label: "Bakim modu", checked: false },
                      { label: "VIP bolumu aktif", checked: true },
                    ].map((setting) => (
                      <label
                        key={setting.label}
                        className="flex items-center gap-3 text-sm text-gray-400"
                      >
                        <input
                          type="checkbox"
                          defaultChecked={setting.checked}
                          className="rounded border-white/10 bg-[#0d1017]"
                        />
                        {setting.label}
                      </label>
                    ))}
                  </div>
                  <div className="pt-2">
                    <Button className="bg-[#1f844e] text-white hover:bg-[#1f844e]/80">
                      Ayarlari Kaydet
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
