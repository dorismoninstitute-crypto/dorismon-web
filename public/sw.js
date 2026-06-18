// Service Worker V2.8 — SEGURIDAD MEJORADA
// Solo cachea assets estáticos. NUNCA páginas detrás de auth.

const CACHE_VERSION = "dorismon-v2.8";
const STATIC_CACHE = `${CACHE_VERSION}-static`;

const STATIC_ASSETS = [
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/favicon.ico",
];

// Instalación
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Activación: BORRAR TODOS los caches viejos (V2.6, V2.7, etc.)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// V2.8 CRÍTICO: Páginas con auth NO se cachean NUNCA
// Solo assets estáticos: imágenes, fonts, CSS, JS de Next.js
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET") return;

  // NO cachear API
  if (url.pathname.startsWith("/api/") ||
      url.hostname.includes("onrender.com") ||
      url.hostname.includes("api.")) {
    return;
  }

  // V2.8 CRÍTICO: NO cachear páginas con datos de usuario
  if (url.pathname.startsWith("/dashboard") ||
      url.pathname.startsWith("/checkout") ||
      url.pathname === "/login" ||
      url.pathname === "/register" ||
      url.pathname.startsWith("/verify-email") ||
      url.pathname.startsWith("/reset-password") ||
      url.pathname.startsWith("/forgot-password")) {
    // Pass-through: dejar que el navegador maneje la request normalmente
    return;
  }

  // Cache-first SOLO para assets estáticos (imágenes, fonts, CSS, JS bundles)
  if (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/") ||
      url.pathname.endsWith(".png") ||
      url.pathname.endsWith(".jpg") ||
      url.pathname.endsWith(".jpeg") ||
      url.pathname.endsWith(".webp") ||
      url.pathname.endsWith(".svg") ||
      url.pathname.endsWith(".woff2") ||
      url.pathname.endsWith(".woff") ||
      url.pathname.endsWith(".ico") ||
      url.pathname.endsWith(".css")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200) return response;
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, responseClone));
          return response;
        });
      })
    );
    return;
  }

  // Para todo lo demás (landing, etc.): network-first sin cachear
  // El navegador maneja la request normalmente
});

// Mensaje desde la app: skip waiting o LIMPIAR CACHE
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data && event.data.type === "CLEAR_CACHE") {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});
