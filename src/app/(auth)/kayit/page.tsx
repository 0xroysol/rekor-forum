"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function KayitPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== passwordConfirm) return;
    if (!termsAccepted) return;
    setLoading(true);
    // TODO: implement registration
    setTimeout(() => setLoading(false), 1000);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080a0f] px-4">
      <Card className="w-full max-w-md border-none bg-[#131820] ring-white/5">
        <CardHeader className="items-center gap-3 pb-2">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1f844e] font-bold text-white">
              R
            </div>
            <span className="text-xl font-bold text-white">
              Rekor<span className="text-[#e8a935]">Forum</span>
            </span>
          </div>
          <CardTitle className="text-lg text-white">Kayit Ol</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-sm text-gray-400">
                Kullanici Adi
              </label>
              <Input
                id="username"
                type="text"
                placeholder="kullanici_adi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="border-white/10 bg-[#0d1017] text-white placeholder:text-gray-500 focus-visible:border-[#1f844e] focus-visible:ring-[#1f844e]/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm text-gray-400">
                E-posta
              </label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-white/10 bg-[#0d1017] text-white placeholder:text-gray-500 focus-visible:border-[#1f844e] focus-visible:ring-[#1f844e]/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm text-gray-400">
                Sifre
              </label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-white/10 bg-[#0d1017] text-white placeholder:text-gray-500 focus-visible:border-[#1f844e] focus-visible:ring-[#1f844e]/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="passwordConfirm"
                className="text-sm text-gray-400"
              >
                Sifre Tekrar
              </label>
              <Input
                id="passwordConfirm"
                type="password"
                placeholder="********"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                className="border-white/10 bg-[#0d1017] text-white placeholder:text-gray-500 focus-visible:border-[#1f844e] focus-visible:ring-[#1f844e]/30"
              />
              {password &&
                passwordConfirm &&
                password !== passwordConfirm && (
                  <p className="text-xs text-[#ef4444]">
                    Sifreler eslesmiyor
                  </p>
                )}
            </div>
            <label className="flex items-start gap-2 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded border-white/10 bg-[#0d1017]"
              />
              <span>
                <Link
                  href="#"
                  className="text-[#e8a935] hover:text-[#e8a935]/80"
                >
                  Forum kurallarini
                </Link>{" "}
                kabul ediyorum
              </span>
            </label>
            <Button
              type="submit"
              disabled={loading || !termsAccepted}
              className="h-10 w-full bg-[#1f844e] text-white hover:bg-[#1f844e]/80 disabled:opacity-50"
            >
              {loading ? "Kayit yapiliyor..." : "Kayit Ol"}
            </Button>
            <p className="text-center text-sm text-gray-400">
              Zaten hesabin var mi?{" "}
              <Link
                href="/giris"
                className="font-medium text-[#1f844e] hover:text-[#1f844e]/80"
              >
                Giris yap
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
