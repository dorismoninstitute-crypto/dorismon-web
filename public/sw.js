// Service Worker — GATE 5B: versionado automático por build.
// Solo cachea assets estáticos DEL PROPIO DOMINIO. NUNCA páginas, datos ni API.
//
// La versión llega en la URL de registro (/sw.js?v=<commit>): cada deploy
// registra un script distinto, el navegador instala este SW nuevo y al
// activarse borra las cachés Dorismon anteriores. Nadie tiene que acordarse
// de cambiar un número a mano.
//
// NO hay offline real (las páginas siempre van por red) y este SW NUNCA
// recarga la aplicación: no existe "controllerchange -> reload".

const VERSION = new URL(self.location.href).searchParams.get("v") || "sin-version";
const PREFIJO = "dorismon-";
const CACHE = `${PREFIJO}${VERSION}`;

// Instalación: sin precache (no hay modo offline que lo necesite).
self.addEventListener("install", () => {
  self.skipWaiting();
});

// Activación: conservar SOLO la caché de esta versión; borrar las Dorismon
// anteriores (incluida "dorismon-v2.8-static"). Las cachés ajenas no se tocan.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key.startsWith(PREFIJO) && key !== CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// /_next/static/* lleva hash en el nombre: si está guardado, es correcto.
function primeroCache(request) {
  return caches.open(CACHE).then((cache) =>
    cache.match(request).then((guardado) => {
      if (guardado) return guardado;
      return fetch(request).then((resp) => {
        if (resp && resp.status === 200 && resp.type === "basic") cache.put(request, resp.clone());
        return resp;
      });
    })
  );
}

// Archivos SIN hash (logo, iconos, imágenes de /public, favicon): se responde
// al instante con lo guardado y se renueva en segundo plano; el cambio se ve
// en la siguiente carga.
function guardadoYRenovar(event) {
  const request = event.request;
  return caches.open(CACHE).then((cache) =>
    cache.match(request).then((guardado) => {
      const deRed = fetch(request).then((resp) => {
        if (resp && resp.status === 200 && resp.type === "basic") cache.put(request, resp.clone());
        return resp;
      });
      if (guardado) {
        event.waitUntil(deRed.catch(() => {}));
        return guardado;
      }
      return deRed;
    })
  );
}

const SIN_HASH = /\.(svg|png|jpe?g|webp|gif|ico)$/i;

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET") return;

  // Otros dominios (API en Render, Cloudinary, LiveKit…): no se guardan aquí.
  if (url.origin !== self.location.origin) return;

  // NO cachear API ni la ruta de versión
  if (url.pathname.startsWith("/api/") || url.pathname === "/version") return;

  // NUNCA cachear páginas con datos de usuario (pasan directo al navegador)
  if (url.pathname.startsWith("/dashboard") ||
      url.pathname.startsWith("/checkout") ||
      url.pathname === "/login" ||
      url.pathname === "/register" ||
      url.pathname.startsWith("/verify-email") ||
      url.pathname.startsWith("/reset-password") ||
      url.pathname.startsWith("/forgot-password")) {
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(primeroCache(event.request));
    return;
  }

  if (url.pathname.startsWith("/icons/") || SIN_HASH.test(url.pathname)) {
    event.respondWith(guardadoYRenovar(event));
    return;
  }

  // Todo lo demás (HTML, RSC, manifest.webmanifest, sw.js…): red, sin guardar.
});

// Mensaje desde la app: skip waiting o LIMPIAR CACHE
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data && event.data.type === "CLEAR_CACHE") {
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIJO)).map((k) => caches.delete(k))));
  }
});

/* ===================================================================
   V3.9.29 — Avisos al teléfono (push).
   Aquí llega el mensaje cuando el servidor avisa algo, incluso con la
   plataforma cerrada. Al tocarlo, abre la pantalla que corresponde.
   =================================================================== */

self.addEventListener("push", (event) => {
  let datos = {};
  try {
    datos = event.data ? event.data.json() : {};
  } catch (e) {
    datos = { title: "Dorismon", body: event.data ? event.data.text() : "" };
  }

  const titulo = datos.title || "Dorismon Language Institute";
  const opciones = {
    body: datos.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-96.png",
    tag: datos.tag || "dorismon",
    renotify: true,
    data: { url: datos.url || "/dashboard" },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(titulo, opciones));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = (event.notification.data && event.notification.data.url) || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((lista) => {
      // Si la plataforma ya está abierta, la trae al frente en vez de
      // abrir otra pestaña
      for (const c of lista) {
        if ("focus" in c) {
          c.navigate(destino).catch(() => {});
          return c.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(destino);
    })
  );
});
