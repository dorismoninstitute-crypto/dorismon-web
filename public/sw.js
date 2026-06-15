// Service Worker - Dorismon Language Institute PWA
// V2.6 — Cache-first para assets estáticos, Network-first para API

const CACHE_VERSION = "dorismon-v2.6";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Recursos a cachear inmediatamente al instalar
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/favicon.ico",
];

// Instalación: cachear recursos básicos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Activación: limpiar caches viejos
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

// Fetch: estrategia diferenciada
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Solo manejar requests GET
  if (event.request.method !== "GET") return;

  // Ignorar requests a la API (siempre network)
  if (url.pathname.startsWith("/api/") ||
      url.hostname.includes("onrender.com") ||
      url.hostname.includes("api.")) {
    return;
  }

  // Estrategia cache-first para assets estáticos
  if (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/") ||
      url.pathname.endsWith(".png") ||
      url.pathname.endsWith(".jpg") ||
      url.pathname.endsWith(".webp") ||
      url.pathname.endsWith(".svg") ||
      url.pathname.endsWith(".woff2") ||
      url.pathname.endsWith(".ico")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200) return response;
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(event.request, responseClone));
          return response;
        });
      })
    );
    return;
  }

  // Network-first para HTML/páginas (con fallback a cache)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200) return response;
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request).then((c) => c || caches.match("/")))
  );
});

// Mensaje desde la app (para forzar update)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
