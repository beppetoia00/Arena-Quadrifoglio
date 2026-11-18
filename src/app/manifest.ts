import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Arena Quadrifoglio",
    short_name: "Arena",
    description: "Ultimate Team tra amici: carte, pacchetti, voti, partite e formazioni. Blacks vs Blancos.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#070b10",
    theme_color: "#070b10",
    lang: "it",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
