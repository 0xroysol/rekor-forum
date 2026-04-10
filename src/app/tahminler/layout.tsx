import type { Metadata } from "next";
import { BRAND } from "@/config/brand";

export const metadata: Metadata = {
  title: `Skor Tahmini - ${BRAND.name}`,
  description: "Maç skor tahminlerini yap, puan kazan ve liderlik tablosunda yerini al.",
};

export default function TahminlerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
