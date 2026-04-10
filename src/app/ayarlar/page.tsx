"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function AyarlarPage() {
  const { dbUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!dbUser) {
    return (
      <div className="flex items-center justify-center py-20">
        <div style={{ backgroundColor: "#131820", border: "1px solid #1e293b", borderRadius: 12, padding: "32px", textAlign: "center", maxWidth: 400 }}>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>Bu sayfayı görüntülemek için giriş yapın.</p>
          <Link href="/giris" style={{ display: "inline-block", marginTop: 16, padding: "8px 24px", backgroundColor: "var(--accent-green)", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: "none" }}>Giriş Yap</Link>
        </div>
      </div>
    );
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 6) {
      setError("Yeni şifre en az 6 karakter olmalıdır");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Yeni şifreler eşleşmiyor");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: dbUser!.email,
      password: currentPassword,
    });

    if (signInError) {
      setError("Mevcut şifre yanlış");
      setLoading(false);
      return;
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError("Şifre güncellenirken bir hata oluştu");
      setLoading(false);
      return;
    }

    setMessage("Şifreniz başarıyla güncellendi");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-8">
      <h1 style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 24 }}>⚙️ Hesap Ayarları</h1>

      {/* Password Change */}
      <div style={{ backgroundColor: "#131820", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #1e293b", backgroundColor: "#1a2130" }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>Şifre Değiştir</h2>
        </div>
        <form onSubmit={handleChangePassword} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div style={{ padding: "8px 12px", borderRadius: 8, backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: 13 }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ padding: "8px 12px", borderRadius: 8, backgroundColor: "color-mix(in srgb, var(--accent-green) 10%, transparent)", border: "1px solid var(--accent-green)4D", color: "var(--accent-green)", fontSize: 13 }}>
              {message}
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>Mevcut Şifre</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, backgroundColor: "#0d1017", border: "1px solid #1e293b", color: "#e2e8f0", fontSize: 14, outline: "none" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>Yeni Şifre</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="En az 6 karakter"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, backgroundColor: "#0d1017", border: "1px solid #1e293b", color: "#e2e8f0", fontSize: 14, outline: "none" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>Yeni Şifre Tekrar</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, backgroundColor: "#0d1017", border: "1px solid #1e293b", color: "#e2e8f0", fontSize: 14, outline: "none" }}
            />
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>Şifreler eşleşmiyor</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ padding: "10px 20px", borderRadius: 8, backgroundColor: "var(--accent-green)", color: "#fff", fontSize: 14, fontWeight: 500, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1 }}
          >
            {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
          </button>
        </form>
      </div>
    </div>
  );
}
