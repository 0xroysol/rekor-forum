"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SifremiUnuttumPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/giris`,
    });

    if (resetError) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
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

        <h1 className="mb-2 text-center text-lg font-semibold text-[#e2e8f0]">
          Şifremi Unuttum
        </h1>
        <p className="mb-6 text-center text-sm text-[#64748b]">
          E-posta adresinizi girin, sıfırlama linki gönderelim.
        </p>

        {sent ? (
          <div className="space-y-4">
            <div className="rounded-md border border-[#1f844e]/30 bg-[#1f844e]/10 px-3 py-3 text-sm text-[#1f844e]">
              E-posta adresinize şifre sıfırlama linki gönderildi. Lütfen gelen kutunuzu kontrol edin.
            </div>
            <Link
              href="/giris"
              className="block w-full rounded-md bg-[#1f844e] px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-[#1f844e]/80"
            >
              Giriş sayfasına dön
            </Link>
          </div>
        ) : (
          <>
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
                  className="rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#1f844e] focus:outline-none focus:ring-1 focus:ring-[#1f844e]/30"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-[#1f844e] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1f844e]/80 disabled:opacity-50"
              >
                {loading ? "Gönderiliyor..." : "Sıfırlama Linki Gönder"}
              </button>

              <p className="text-center text-sm text-[#64748b]">
                <Link
                  href="/giris"
                  className="font-medium text-[#1f844e] transition-colors hover:text-[#1f844e]/80"
                >
                  Giriş sayfasına dön
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
