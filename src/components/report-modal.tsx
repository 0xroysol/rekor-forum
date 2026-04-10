"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";

interface ReportModalProps {
  type: "post" | "thread";
  targetId: string;
}

const REASONS = [
  "Spam",
  "Hakaret",
  "Uygunsuz İçerik",
  "Yanlış Bilgi",
  "Reklam",
  "Diğer",
];

export default function ReportModal({ type, targetId }: ReportModalProps) {
  const { dbUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  if (!dbUser) return null;

  async function handleSubmit() {
    if (!reason) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, targetId, reason, description }),
      });
      if (res.ok) {
        setMessage({ text: "Bildiriminiz alındı", error: false });
        setTimeout(() => {
          setOpen(false);
          setMessage(null);
          setReason("");
          setDescription("");
        }, 1500);
      } else {
        const data = await res.json();
        if (res.status === 409 || data.error?.includes("zaten")) {
          setMessage({ text: "Bu içeriği zaten bildirdiniz", error: true });
        } else {
          setMessage({ text: data.error || "Bir hata oluştu", error: true });
        }
      }
    } catch {
      setMessage({ text: "Bir hata oluştu", error: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-[#64748b] hover:text-[#e2e8f0] transition-colors"
      >
        🚩 Bildir
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-[#131820] border border-[#1e293b] rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-[#e2e8f0] mb-4">
              İçerik Bildir
            </h3>

            {message && (
              <div
                className={`mb-4 px-3 py-2 rounded-lg text-sm ${
                  message.error
                    ? "bg-[#ef4444]/10 text-[#ef4444]"
                    : "bg-accent-green/10 text-accent-green"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="space-y-2 mb-4">
              {REASONS.map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-[#1e2738] transition-colors"
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-accent-green"
                  />
                  <span className="text-sm text-[#e2e8f0]">{r}</span>
                </label>
              ))}
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ek açıklama (isteğe bağlı)"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[#1a2130] border border-[#1e293b] text-[#e2e8f0] text-sm placeholder-[#64748b] mb-4 resize-none focus:outline-none focus:border-accent-green"
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setOpen(false);
                  setMessage(null);
                  setReason("");
                  setDescription("");
                }}
                className="px-4 py-2 text-sm rounded-lg bg-[#1a2130] text-[#94a3b8] hover:bg-[#1e2738] transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reason || loading}
                className="px-4 py-2 text-sm rounded-lg bg-accent-green text-white hover:bg-[#166d3b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Gönderiliyor..." : "Gönder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
