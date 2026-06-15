"use client";
import { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";

/**
 * V2.6 — Registra Service Worker y muestra botón "Instalar app"
 *
 * Comportamiento:
 * - Registra SW al cargar (solo en producción)
 * - Captura evento beforeinstallprompt (Chrome/Edge/Android)
 * - Muestra banner sutil "Instalar Dorismon" abajo derecha
 * - Si usuario rechaza, no insiste por 7 días
 * - Si ya está instalado, no muestra nada
 */
export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Registrar Service Worker (solo HTTPS / localhost)
    if ("serviceWorker" in navigator && typeof window !== "undefined") {
      const isLocalhost = window.location.hostname === "localhost";
      const isHttps = window.location.protocol === "https:";
      if (isHttps || isLocalhost) {
        navigator.serviceWorker.register("/sw.js")
          .then((reg) => {
            // Service Worker registrado
          })
          .catch(() => {
            // Falla silenciosa, no es crítico
          });
      }
    }

    // Detectar iOS (no soporta beforeinstallprompt)
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);

    // Verificar si ya está instalado
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
                        (window.navigator as any).standalone;
    if (isStandalone) return; // Ya instalado, no mostrar nada

    // Verificar si el usuario rechazó hace menos de 7 días
    const lastDismissed = localStorage.getItem("pwa-install-dismissed");
    if (lastDismissed) {
      const days = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
      if (days < 7) return;
    }

    // Para Android/Desktop: capturar evento de instalación
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Mostrar banner después de 10 segundos (no agresivo)
      setTimeout(() => setShowBanner(true), 10000);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Para iOS: mostrar banner después de 15 segundos
    if (ios) {
      setTimeout(() => setShowBanner(true), 15000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
        localStorage.setItem("pwa-install-accepted", String(Date.now()));
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-install-dismissed", String(Date.now()));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:max-w-sm z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-brand-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-brand-600 to-brand-700 p-4 text-white relative">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center font-black text-2xl">
              D
            </div>
            <div>
              <p className="font-black text-lg leading-tight">Instalar Dorismon</p>
              <p className="text-xs text-white/80">Como una app en tu dispositivo</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          {isIOS ? (
            <>
              <p className="text-sm text-slate-700 mb-3">
                <strong>Para instalar en iPhone/iPad:</strong>
              </p>
              <ol className="text-xs text-slate-600 space-y-1.5 mb-3">
                <li>1. Toca el botón <strong>Compartir</strong> abajo ⬆️</li>
                <li>2. Selecciona <strong>"Añadir a pantalla de inicio"</strong></li>
                <li>3. Toca <strong>Añadir</strong> arriba derecha</li>
              </ol>
              <button
                onClick={handleDismiss}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm transition"
              >
                Entendido
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-700 mb-3">
                Accede a tus clases más rápido. Funciona offline, recibe notificaciones y abre como una app.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDismiss}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm transition"
                >
                  Ahora no
                </button>
                <button
                  onClick={handleInstall}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold text-sm transition flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Instalar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
