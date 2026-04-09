import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skor Tahmini - Rekor Forum",
  description: "Maç skor tahminlerini yap, puan kazan ve liderlik tablosunda yerini al.",
};

export default function TahminlerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
