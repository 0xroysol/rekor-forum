import type { Metadata } from "next";
import { BRAND } from "@/config/brand";

export const metadata: Metadata = {
  title: `Canlı Sohbet - ${BRAND.name}`,
  description: "Topluluk canlı sohbet odaları. Spor tartışmaları, maç günü sohbetleri ve daha fazlası.",
};

export default function SohbetLayout({ children }: { children: React.ReactNode }) {
  return children;
}
