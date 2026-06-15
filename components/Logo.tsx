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
}

/**
 * V2.6.2 — Logo MUY GRANDE.
 *
 * Tu logo (escudo Dorismon Language Institute) tiene aspect ratio 1.31 (casi cuadrado).
 * Para que se vea con todo el detalle visible, los tamaños son grandes:
 *
 * - sm = 64px alto (compacto)
 * - md = 96px alto (sidebar, navbar)
 * - lg = 160px alto (login, register, páginas auth)
 * - xl = 240-320px alto (hero principal)
 *
 * Prioridad:
 * 1. Logo subido en admin/settings (custom)
 * 2. /logo-full.png (escudo Dorismon completo) — fallback
 * 3. /logo-shield.png (solo escudo sin texto) — para shieldOnly
 */
export default function Logo({
  size = "md",
  variant = "default",
  withTagline = true,
  asLink = true,
  shieldOnly = false,
}: LogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [instituteName, setInstituteName] = useState<string>("Dorismon Language Institute");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // V2.6.2: forzar reload limpiando cache vieja
    const cached = typeof window !== "undefined" ? sessionStorage.getItem("institute_logo_v4") : null;
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
          sessionStorage.removeItem("institute_logo");
          sessionStorage.removeItem("institute_logo_v2");
          sessionStorage.removeItem("institute_logo_v3");
          // Guardar nueva
          sessionStorage.setItem("institute_logo_v4", url);
          sessionStorage.setItem("institute_name", s.name || "Dorismon Language Institute");
        }
        setLogoUrl(url || null);
        setInstituteName(s.name || "Dorismon Language Institute");
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // V2.6.2 — TAMAÑOS MUY GRANDES (sin max-width que limite)
  const sizes = {
    sm: "h-16",                          // 64px — antes 48
    md: "h-24",                          // 96px — antes 80 (navbar, sidebar)
    lg: "h-40",                          // 160px — antes 128 (login)
    xl: "h-56 md:h-72",                  // 224-288px (hero)
  };
  const heightClass = sizes[size];

  // Source: custom subido → fallback a archivo local
  const logoSrc = logoUrl || (shieldOnly ? "/logo-shield.png" : "/logo-full.png");

  if (!loaded) {
    return <div className={`${heightClass} bg-slate-100 rounded animate-pulse`} style={{ width: 220 }} />;
  }

  const content = (
    <img
      src={logoSrc}
      alt={instituteName}
      className={`${heightClass} w-auto object-contain`}
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        if (img.src.includes("/logo-full.png") || img.src.includes("/logo-shield.png")) {
          return;
        }
        img.src = shieldOnly ? "/logo-shield.png" : "/logo-full.png";
      }}
    />
  );

  if (asLink) {
    return <Link href="/" className="inline-block">{content}</Link>;
  }
  return content;
}
