type Brand = {
  name: string;
  shortName: string;
  domain: string;
  accent: string;
  accentHover: string;
  gold: string;
  logoLetter: string;
  logoGradientFrom: string;
  logoGradientTo: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  contactEmail: string;
};

const brands: Record<string, Brand> = {
  rekor: {
    name: "Rekor Forum",
    shortName: "RekorForum",
    domain: "rekorforum.com",
    accent: "#1f844e",
    accentHover: "#22965a",
    gold: "#e8a935",
    logoLetter: "R",
    logoGradientFrom: "#1f844e",
    logoGradientTo: "#0f5132",
    description: "Türkiye'nin en aktif spor tartışma platformu",
    metaTitle: "Rekor Forum — Spor Tartışma Platformu",
    metaDescription:
      "Türkiye'nin en aktif spor topluluğu. Maç analizleri, kupon paylaşımları, canlı skorlar ve spor haberleri.",
    contactEmail: "iletisim@rekorforum.com",
  },
  avrupa: {
    name: "Avrupa Forum",
    shortName: "AvrupaForum",
    domain: "avrupaforum.com",
    accent: "#e8a935",
    accentHover: "#d4952e",
    gold: "#e8a935",
    logoLetter: "A",
    logoGradientFrom: "#e8a935",
    logoGradientTo: "#b8791a",
    description: "Avrupa'nın en aktif spor tartışma platformu",
    metaTitle: "Avrupa Forum — Spor Tartışma Platformu",
    metaDescription:
      "Avrupa'nın en aktif spor topluluğu. Maç analizleri, kupon paylaşımları, canlı skorlar ve spor haberleri.",
    contactEmail: "iletisim@avrupaforum.com",
  },
};

export const BRAND_KEY = process.env.NEXT_PUBLIC_BRAND || "rekor";
export const BRAND = brands[BRAND_KEY] || brands.rekor;
