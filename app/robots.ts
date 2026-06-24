import type { MetadataRoute } from "next";

// V3.5 — robots.txt: protege las páginas privadas de ser indexadas por Google.
// Solo el landing y páginas públicas deben aparecer en buscadores.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",   // todos los paneles privados (estudiante/profe/admin)
        "/checkout",     // proceso de pago
        "/api/",         // endpoints internos
      ],
    },
    sitemap: "https://dorismon.com/sitemap.xml",
  };
}
