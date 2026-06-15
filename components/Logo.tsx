"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { publicApi } from "@/lib/api";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "white" | "compact";
  withTagline?: boolean;
  asLink?: boolean;
  /** V2.6b: forzar usar solo escudo (sin texto). Útil para sidebar/header pequeño */
  shieldOnly?: boolean;
}

/**
 * V2.6b — Logo dinámico mejorado.
 *
 * Prioridad de logo:
 * 1. Logo del instituto (subido en admin/settings) → si existe, se muestra
 * 2. Logo del archivo `/logo-shield.png` (escudo Dorismon) → fallback
 * 3. Logo generado por código (gradiente azul + "D") → fallback final
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
    // Cargar logo del instituto (cache session)
    const cached = typeof window !== "undefined" ? sessionStorage.getItem("institute_logo_v2") : null;
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
          sessionStorage.setItem("institute_logo_v2", url);
          sessionStorage.setItem("institute_name", s.name || "Dorismon Language Institute");
        }
        setLogoUrl(url || null);
        setInstituteName(s.name || "Dorismon Language Institute");
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Tamaños — V2.6b: más generosos para que el logo se vea bien
  const sizes = {
    sm: { img: "h-9 max-w-[120px]" },           // 36px
    md: { img: "h-12 max-w-[160px]" },          // 48px (antes 36)
    lg: { img: "h-16 max-w-[200px]" },          // 64px (antes 48)
    xl: { img: "h-24 md:h-28 max-w-[280px] md:max-w-[320px]" },  // 96-112px (antes 64-80)
  };
  const s = sizes[size];

  // Determinar qué fuente de logo usar
  // Prioridad: 1. Logo subido custom, 2. logo-shield.png (escudo Dorismon), 3. Fallback texto
  const logoSrc = logoUrl || (shieldOnly ? "/logo-shield.png" : "/logo-full.png");

  // Si todavía no cargó, mostrar placeholder
  if (!loaded) {
    return <div className={`${s.img} bg-slate-200 rounded animate-pulse`} style={{ width: 120 }} />;
  }

  const content = (
    <div className="inline-flex items-center gap-2">
      <img
        src={logoSrc}
        alt={instituteName}
        className={`${s.img} w-auto object-contain`}
        onError={(e) => {
          // Si el logo subido falla, intentar con archivo local
          const img = e.target as HTMLImageElement;
          if (img.src.includes("/logo-full.png") || img.src.includes("/logo-shield.png")) {
            // Ya estamos en fallback final, no hacer nada
            return;
          }
          img.src = shieldOnly ? "/logo-shield.png" : "/logo-full.png";
        }}
      />
    </div>
  );

  if (asLink) {
    return <Link href="/" className="inline-block">{content}</Link>;
  }
  return content;
}
