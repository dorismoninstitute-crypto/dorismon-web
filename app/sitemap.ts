import type { MetadataRoute } from "next";

// V3.5 — Sitemap: solo páginas PÚBLICAS (Google no debe ver dashboards ni datos privados)
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://dorismon.com";
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/legal/privacidad`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/terminos`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
