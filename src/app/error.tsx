"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <span className="text-6xl mb-4">⚠️</span>
      <h1 className="text-2xl font-bold mb-2" style={{ color: "#e2e8f0" }}>Bir Hata Olustu</h1>
      <p className="mb-6 text-sm" style={{ color: "#64748b" }}>
        Beklenmeyen bir hata olustu. Lutfen tekrar deneyin.
      </p>
      <button
        onClick={() => reset()}
        className="rounded-xl px-6 py-2.5 text-sm font-medium text-white transition-colors hover:brightness-110"
        style={{ backgroundColor: "var(--accent-green)" }}
      >
        Tekrar Dene
      </button>
    </div>
  );
}
