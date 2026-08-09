import { MetadataRoute } from 'next';

// V3.9.29: los iconos son el ESCUDO REAL del sitio. Antes apuntaban al
// backend, que devolvía una "D" azul si no había logo en Configuración.
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
      { src: `/icons/icon-72.png`, sizes: "72x72", type: "image/png", purpose: "any" },
      { src: `/icons/icon-96.png`, sizes: "96x96", type: "image/png", purpose: "any" },
      { src: `/icons/icon-128.png`, sizes: "128x128", type: "image/png", purpose: "any" },
      { src: `/icons/icon-144.png`, sizes: "144x144", type: "image/png", purpose: "any" },
      { src: `/icons/icon-152.png`, sizes: "152x152", type: "image/png", purpose: "any" },
      { src: `/icons/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: `/icons/icon-384.png`, sizes: "384x384", type: "image/png", purpose: "any" },
      { src: `/icons/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
