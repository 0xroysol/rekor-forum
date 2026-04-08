"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

export default function KayitPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("Şifreler eşleşmiyor");
      return;
    }
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır");
      return;
    }
    if (username.length < 3) {
      setError("Kullanıcı adı en az 3 karakter olmalıdır");
      return;
    }

    setLoading(true);
    const result = await register(email, password, username);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080a0f] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[#1e293b] bg-[#131820] p-6">
        {/* Logo */}
        <div className="mb-4 flex items-center justify-center gap-1.5">
          <span className="text-lg font-bold text-[#1f844e]">REKOR</span>
          <span className="text-lg font-bold text-white">FORUM</span>
        </div>

        <h1 className="mb-6 text-center text-lg font-semibold text-[#e2e8f0]">
          Kayıt Ol
        </h1>

        {error && (
          <div className="mb-4 rounded-md border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#ef4444]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-sm text-[#94a3b8]">
              Kullanıcı Adı
            </label>
            <input
              id="username"
              type="text"
              placeholder="kullanici_adi"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#1f844e] focus:outline-none focus:ring-1 focus:ring-[#1f844e]/30"
            />
          </div>

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
              className="rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#1f844e] focus:outline-none focus:ring-1 focus:ring-[#1f844e]/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm text-[#94a3b8]">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              placeholder="En az 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#1f844e] focus:outline-none focus:ring-1 focus:ring-[#1f844e]/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="passwordConfirm" className="text-sm text-[#94a3b8]">
              Şifre Tekrar
            </label>
            <input
              id="passwordConfirm"
              type="password"
              placeholder="Şifrenizi tekrar girin"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              className="rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#1f844e] focus:outline-none focus:ring-1 focus:ring-[#1f844e]/30"
            />
            {password && passwordConfirm && password !== passwordConfirm && (
              <p className="text-xs text-[#ef4444]">Şifreler eşleşmiyor</p>
            )}
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#1e293b] bg-[#0d1017] accent-[#1f844e]"
            />
            <span className="text-xs text-[#94a3b8]">
              <Link href="/kurallar" className="text-[#1f844e] hover:underline">Forum kurallarını</Link>
              {" ve "}
              <Link href="/kullanim-sartlari" className="text-[#1f844e] hover:underline">kullanım şartlarını</Link>
              {" "}okudum, kabul ediyorum.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !termsAccepted}
            className="w-full rounded-md bg-[#1f844e] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1f844e]/80 disabled:opacity-50"
          >
            {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
          </button>

          <p className="text-center text-sm text-[#64748b]">
            Zaten üye misiniz?{" "}
            <Link
              href="/giris"
              className="font-medium text-[#1f844e] transition-colors hover:text-[#1f844e]/80"
            >
              Giriş yap
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
