import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spor Haberleri - Rekor Forum",
  description:
    "En güncel spor haberleri. Süper Lig, Şampiyonlar Ligi, transfer ve dünya spor haberleri.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
