"use client";
import { useEffect, useState, ReactNode } from "react";
import { publicApi } from "@/lib/api";

/**
 * V3.9.24 — Muestra la imagen que el admin subió para un espacio.
 *
 * CÓMO FUNCIONA (lo importante):
 * - Si el admin subió una foto a ese espacio → se muestra la foto.
 * - Si NO subió nada → se muestra el dibujo de respaldo (`fallback`), que
 *   viene hecho en código. Así la página se ve completa desde el día uno.
 * - Cuando Luis sube la foto real, el dibujo desaparece SOLO. Sin tocar
 *   código, sin desplegar.
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
}: {
  slot: string;
  alt: string;
  className?: string;
  /** Dibujo que se muestra mientras no haya foto subida */
  fallback?: ReactNode;
  /** Texto del marcador cuando NO hay dibujo de respaldo */
  placeholderText?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

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
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={alt} className={className} loading="lazy" />;
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
