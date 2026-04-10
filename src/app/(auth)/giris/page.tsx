"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

export default function GirisPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      const redirect = searchParams.get("redirect") || "/";
      router.push(redirect);
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080a0f] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[#1e293b] bg-[#131820] p-6">
        {/* Logo */}
        <div className="mb-4 flex items-center justify-center gap-1.5">
          <span className="text-lg font-bold text-accent-green">REKOR</span>
          <span className="text-lg font-bold text-white">FORUM</span>
        </div>

        {/* Title */}
        <h1 className="mb-6 text-center text-lg font-semibold text-[#e2e8f0]">
          Giriş Yap
        </h1>

        {error && (
          <div className="mb-4 rounded-md border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#ef4444]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm text-[#94a3b8]">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-accent-green focus:outline-none focus:ring-1 focus:ring-accent-green/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm text-[#94a3b8]">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-accent-green focus:outline-none focus:ring-1 focus:ring-accent-green/30"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-[#64748b]">
              <input
                type="checkbox"
                className="rounded border-[#1e293b] bg-[#0d1017]"
              />
              Beni hatırla
            </label>
            <Link
              href="/sifremi-unuttum"
              className="text-sm text-[#64748b] transition-colors hover:text-[#e8a935]"
            >
              Şifremi unuttum
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-accent-green px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-green/80 disabled:opacity-50"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>

          <p className="text-center text-sm text-[#64748b]">
            Hesabın yok mu?{" "}
            <Link
              href="/kayit"
              className="font-medium text-accent-green transition-colors hover:text-accent-green/80"
            >
              Kayıt ol
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
