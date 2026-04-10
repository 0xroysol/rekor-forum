import type { MetadataRoute } from "next";
import { BRAND } from "@/config/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.shortName,
    description: BRAND.description,
    start_url: "/",
    display: "standalone",
    background_color: "#080a0f",
    theme_color: BRAND.accent,
    orientation: "portrait-primary",
    icons: [
      { src: "/api/og?size=192", sizes: "192x192", type: "image/png" },
      { src: "/api/og?size=512", sizes: "512x512", type: "image/png" },
    ],
  };
}
