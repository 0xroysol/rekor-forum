import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canlı Skorlar - Rekor Forum",
  description: "Futbol ve basketbol canlı maç sonuçları. Süper Lig, Şampiyonlar Ligi, EuroLeague ve daha fazlası.",
  openGraph: { title: "Canlı Skorlar - Rekor Forum", siteName: "Rekor Forum" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
