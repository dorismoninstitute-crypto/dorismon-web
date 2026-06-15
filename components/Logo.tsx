"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { publicApi } from "@/lib/api";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "white" | "compact";
  withTagline?: boolean;
  asLink?: boolean;
  shieldOnly?: boolean;
  /** V2.7: Forzar layout horizontal (escudo + texto al lado) en lugar de vertical */
  horizontal?: boolean;
}

/**
 * V2.7 — Logo PROFESIONAL DEFINITIVO.
 *
 * Tienes 3 versiones del logo en /public/:
 * - logo-horizontal.png — escudo + texto al lado (RECOMENDADO para navbar, sidebar)
 * - logo-vertical.png   — escudo arriba, texto debajo (para login, landing, hero)
 * - logo-shield.png     — solo escudo (para favicons pequeños)
 *
 * Por defecto el componente decide la mejor versión según size:
 * - sm, md  → horizontal (navbar/sidebar)
 * - lg, xl  → vertical (login/landing/hero)
 *
 * Puedes forzar horizontal=true o shieldOnly=true si lo necesitas.
 */
export default function Logo({
  size = "md",
  variant = "default",
  withTagline = true,
  asLink = true,
  shieldOnly = false,
  horizontal,
}: LogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [instituteName, setInstituteName] = useState<string>("Dorismon Language Institute");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // V2.7: cache "v7" para forzar refresh definitivo
    const cached = typeof window !== "undefined" ? sessionStorage.getItem("institute_logo_v7") : null;
    const cachedName = typeof window !== "undefined" ? sessionStorage.getItem("institute_name") : null;

    if (cached !== null) {
      setLogoUrl(cached || null);
      if (cachedName) setInstituteName(cachedName);
      setLoaded(true);
      return;
    }

    publicApi.instituteSettings()
      .then((s: any) => {
        const url = s.logo_url || "";
        if (typeof window !== "undefined") {
          // Limpiar caches viejas
          ["institute_logo", "institute_logo_v2", "institute_logo_v3", "institute_logo_v4", "institute_logo_v5", "institute_logo_v6"].forEach(k =>
            sessionStorage.removeItem(k)
          );
          sessionStorage.setItem("institute_logo_v7", url);
          sessionStorage.setItem("institute_name", s.name || "Dorismon Language Institute");
        }
        setLogoUrl(url || null);
        setInstituteName(s.name || "Dorismon Language Institute");
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // V2.7 — Decidir si usar horizontal o vertical según contexto
  const useHorizontal = horizontal !== undefined
    ? horizontal
    : (size === "sm" || size === "md");  // Default: horizontal para sm/md

  // Tamaños finales — GRANDES y BIEN PROPORCIONADOS
  // Logo horizontal (ratio ~2.15) → más ancho que alto
  // Logo vertical (ratio ~0.74) → más alto que ancho
  const sizes = {
    sm: useHorizontal ? "h-12" : "h-16",        // 48 / 64
    md: useHorizontal ? "h-16" : "h-24",        // 64 / 96 (navbar, sidebar)
    lg: useHorizontal ? "h-24" : "h-40",        // 96 / 160 (login)
    xl: useHorizontal ? "h-32 md:h-40" : "h-56 md:h-72",  // 128-160 / 224-288 (hero)
  };
  const heightClass = sizes[size];

  // Decidir source del logo
  let logoSrc: string;
  if (logoUrl) {
    // Custom subido por admin tiene prioridad
    logoSrc = logoUrl;
  } else if (shieldOnly) {
    logoSrc = "/logo-shield.png";
  } else if (useHorizontal) {
    logoSrc = "/logo-horizontal.png";
  } else {
    logoSrc = "/logo-vertical.png";
  }

  if (!loaded) {
    return (
      <div className={`${heightClass} bg-slate-100 rounded animate-pulse`}
           style={{ width: useHorizontal ? 200 : 100 }} />
    );
  }

  const content = (
    <img
      src={logoSrc}
      alt={instituteName}
      className={`${heightClass} w-auto object-contain`}
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        // Cadena de fallbacks
        if (img.src.includes("/logo-horizontal.png")) {
          img.src = "/logo-full.png";
        } else if (img.src.includes("/logo-vertical.png")) {
          img.src = "/logo-full.png";
        } else if (img.src.includes("/logo-shield.png")) {
          img.src = "/logo-full.png";
        }
        // Si /logo-full.png también falla, dejar como está
      }}
    />
  );

  if (asLink) {
    return <Link href="/" className="inline-block">{content}</Link>;
  }
  return content;
}
