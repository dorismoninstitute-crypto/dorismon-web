// GATE 5B — Se decide AL CONSTRUIR (no en el navegador):
//  · Service worker SOLO en la producción de Vercel (VERCEL_ENV === "production").
//    Preview, `next dev` y builds locales → sin service worker.
//  · Versión pública del build = commit de Vercel; fuera de Vercel, "local".
//    (Constante a propósito: Next evalúa este archivo varias veces por build y
//    una marca de tiempo daría versiones distintas a servidor y cliente.)
//    Al cliente llegan únicamente estos dos textos.
const SW_ENABLED = process.env.VERCEL_ENV === "production" ? "1" : "0";
const APP_VERSION = (process.env.VERCEL_GIT_COMMIT_SHA || "local").replace(/[^a-zA-Z0-9._-]/g, "");

// GATE 6H-A.1 — La URL de la API SIEMPRE es explícita. Sin NEXT_PUBLIC_API_URL, `next build`
// y `next dev` FALLAN con un mensaje claro (local, preview y producción de Vercel): nunca hay
// una URL por defecto (antes era la API de producción). `next start` usa lo ya compilado.
const { PHASE_PRODUCTION_BUILD, PHASE_DEVELOPMENT_SERVER } = require("next/constants");
function exigirApiUrl() {
  const url = (process.env.NEXT_PUBLIC_API_URL || "").trim();
  if (!url) {
    throw new Error(
      "[Dorismon] Falta NEXT_PUBLIC_API_URL. Defínela explícitamente " +
      "(local: NEXT_PUBLIC_API_URL=http://127.0.0.1:8000; Vercel: la URL de la API en Production y Preview). " +
      "No existe URL por defecto."
    );
  }
  if (!/^https?:\/\/[^\s/]+/.test(url)) {
    throw new Error(`[Dorismon] NEXT_PUBLIC_API_URL no es una URL http(s) válida: "${url}"`);
  }
  if (process.env.VERCEL === "1" && !url.startsWith("https://")) {
    throw new Error("[Dorismon] En Vercel NEXT_PUBLIC_API_URL debe ser https://");
  }
}

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_SW_ENABLED: SW_ENABLED,
    NEXT_PUBLIC_APP_VERSION: APP_VERSION,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },
};

module.exports = (phase) => {
  if (phase === PHASE_PRODUCTION_BUILD || phase === PHASE_DEVELOPMENT_SERVER) exigirApiUrl();
  return config;
};
