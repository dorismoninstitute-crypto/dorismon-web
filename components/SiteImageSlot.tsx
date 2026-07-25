"use client";
import { useEffect, useState } from "react";
import { publicApi } from "@/lib/api";

/**
 * V3.9.23 — Muestra una imagen que el admin subió desde el panel.
 *
 * Si el espacio todavía no tiene foto cargada, muestra un marcador discreto
 * en vez de un hueco roto: la página se ve completa desde el día uno y las
 * fotos se van agregando sin tocar código ni desplegar.
 */

// Se pide UNA sola vez aunque haya varias imágenes en la página
let cache: Promise<Record<string, string>> | null = null;
function loadImages(): Promise<Record<string, string>> {
  if (!cache) {
    cache = publicApi.siteImages().catch(() => ({}));
  }
  return cache;
}

export default function SiteImageSlot({
  slot,
  alt,
  className = "",
  wrapperClassName = "",
  placeholderText = "Foto próximamente",
}: {
  slot: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
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

  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={alt} className={className} loading="lazy" />;
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400 ${wrapperClassName} ${className}`}
      aria-label={alt}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
      {ready && <span className="text-xs px-3 text-center">{placeholderText}</span>}
    </div>
  );
}
