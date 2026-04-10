import type { Metadata } from "next";
import { BRAND } from "@/config/brand";

export const metadata: Metadata = {
  title: `Canlı Skorlar - ${BRAND.name}`,
  description: "Futbol ve basketbol canlı maç sonuçları. Süper Lig, Şampiyonlar Ligi, EuroLeague ve daha fazlası.",
  openGraph: { title: `Canlı Skorlar - ${BRAND.name}`, siteName: BRAND.name },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
