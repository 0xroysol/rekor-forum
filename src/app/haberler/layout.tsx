import type { Metadata } from "next";
import { BRAND } from "@/config/brand";

export const metadata: Metadata = {
  title: `Spor Haberleri - ${BRAND.name}`,
  description:
    "En güncel spor haberleri. Süper Lig, Şampiyonlar Ligi, transfer ve dünya spor haberleri.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
