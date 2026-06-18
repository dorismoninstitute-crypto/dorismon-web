import { MetadataRoute } from 'next';

// V2.8: Manifest dinámico que apunta al backend para iconos
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://dorismon-api.onrender.com";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dorismon Language Institute",
    short_name: "Dorismon",
    description: "Plataforma de aprendizaje de inglés del Dorismon Language Institute",
    start_url: "/dashboard",
    id: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#ffffff",
    theme_color: "#4361ee",
    lang: "es",
    categories: ["education", "productivity"],
    icons: [
      { src: `${API_BASE}/institute-icon/72`, sizes: "72x72", type: "image/png", purpose: "any" },
      { src: `${API_BASE}/institute-icon/96`, sizes: "96x96", type: "image/png", purpose: "any" },
      { src: `${API_BASE}/institute-icon/128`, sizes: "128x128", type: "image/png", purpose: "any" },
      { src: `${API_BASE}/institute-icon/144`, sizes: "144x144", type: "image/png", purpose: "any" },
      { src: `${API_BASE}/institute-icon/152`, sizes: "152x152", type: "image/png", purpose: "any" },
      { src: `${API_BASE}/institute-icon/192`, sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: `${API_BASE}/institute-icon/384`, sizes: "384x384", type: "image/png", purpose: "any" },
      { src: `${API_BASE}/institute-icon/512`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
