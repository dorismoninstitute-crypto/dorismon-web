"use client";
import { useEffect, useState, ReactNode } from "react";
import { publicApi } from "@/lib/api";

/**
 * V3.9.25 — Muestra la imagen que el admin subió para un espacio.
 *
 * CÓMO FUNCIONA:
 * - Si el admin subió una foto → se muestra la foto (ya optimizada por el
 *   servidor: formato moderno, calidad justa y el ancho que hace falta).
 * - Si NO subió nada → se muestra el dibujo de respaldo hecho en código.
 * - Al subir una foto real, el dibujo desaparece solo. Sin desplegar.
 *
 * MEJORAS DE CARGA (V3.9.25):
 * - Fondo suave mientras la foto llega: nada de huecos blancos parpadeando.
 * - La imagen aparece con una transición corta en vez de "saltar".
 * - La foto principal se carga con prioridad; el resto, solo al acercarse.
 */

// Se pide UNA sola vez aunque haya varias imágenes en la página
let cache: Promise<Record<string, string>> | null = null;
function loadImages(): Promise<Record<string, string>> {
  if (!cache) cache = publicApi.siteImages().catch(() => ({}));
  return cache;
}

export default function SiteImageSlot({
  slot,
  alt,
  className = "",
  fallback = null,
  placeholderText = "",
  priority = false,
}: {
  slot: string;
  alt: string;
  className?: string;
  /** Dibujo que se muestra mientras no haya foto subida */
  fallback?: ReactNode;
  /** Texto del marcador cuando NO hay dibujo de respaldo */
  placeholderText?: string;
  /** true en la foto principal: se carga de primero */
  priority?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let alive = true;
    loadImages().then((map) => {
      if (!alive) return;
      setUrl(map?.[slot] || null);
      setReady(true);
    });
    return () => { alive = false; };
  }, [slot]);

  // Foto real subida por el admin: manda sobre todo lo demás
  if (url) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* Fondo suave mientras la foto termina de llegar */}
        {!shown && <div className="absolute inset-0 bg-[#DCE5FB] animate-pulse" aria-hidden="true" />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt}
          onLoad={() => setShown(true)}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          // @ts-expect-error fetchpriority es válido en HTML aunque React aún no lo tipe
          fetchpriority={priority ? "high" : "auto"}
          className={`w-full h-full object-cover transition-opacity duration-500 ${shown ? "opacity-100" : "opacity-0"}`}
        />
      </div>
    );
  }

  // Dibujo de respaldo (se muestra de una, sin esperar al servidor)
  if (fallback) return <div className={className}>{fallback}</div>;

  // Sin dibujo: marcador discreto, nunca un hueco roto
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 bg-[#DCE5FB] border border-[#C7D5F7] text-[#8397C6] ${className}`}
      aria-label={alt}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
      {ready && placeholderText && <span className="text-[11px] px-3 text-center">{placeholderText}</span>}
    </div>
  );
}
