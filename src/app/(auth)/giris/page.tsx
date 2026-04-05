"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function GirisPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // TODO: implement login
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
          <CardTitle className="text-lg text-white">Giris Yap</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  className="rounded border-white/10 bg-[#0d1017]"
                />
                Beni hatirla
              </label>
              <Link
                href="#"
                className="text-sm text-[#e8a935] hover:text-[#e8a935]/80"
              >
                Sifremi unuttum
              </Link>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-10 w-full bg-[#1f844e] text-white hover:bg-[#1f844e]/80"
            >
              {loading ? "Giris yapiliyor..." : "Giris Yap"}
            </Button>
            <p className="text-center text-sm text-gray-400">
              Hesabin yok mu?{" "}
              <Link
                href="/kayit"
                className="font-medium text-[#1f844e] hover:text-[#1f844e]/80"
              >
                Kayit ol
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
