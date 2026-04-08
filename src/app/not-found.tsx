import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <span className="text-6xl mb-4">🔍</span>
      <h1 className="text-3xl font-bold mb-2" style={{ color: "#e2e8f0" }}>404</h1>
      <p className="text-lg mb-1" style={{ color: "#94a3b8" }}>Sayfa Bulunamadi</p>
      <p className="mb-6 text-sm" style={{ color: "#64748b" }}>
        Aradiginiz sayfa mevcut degil veya kaldirilmis olabilir.
      </p>
      <Link
        href="/"
        className="rounded-xl px-6 py-2.5 text-sm font-medium text-white transition-colors hover:brightness-110"
        style={{ backgroundColor: "#1f844e" }}
      >
        Ana Sayfaya Don
      </Link>
    </div>
  );
}
