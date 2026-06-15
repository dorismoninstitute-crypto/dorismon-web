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
 * V2.6.1 — Logo dinámico MÁS GRANDE.
 *
 * Tamaños aumentados significativamente para que el logo del instituto
 * tenga el protagonismo visual de un título principal.
 *
 * Prioridad de logo:
 * 1. Logo del instituto subido (admin/settings) — si existe, se muestra
 * 2. /logo-full.png (escudo Dorismon completo) — fallback
 * 3. /logo-shield.png (solo escudo, sin texto) — para sidebar
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
    const cached = typeof window !== "undefined" ? sessionStorage.getItem("institute_logo_v3") : null;
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
          sessionStorage.setItem("institute_logo_v3", url);
          sessionStorage.setItem("institute_name", s.name || "Dorismon Language Institute");
        }
        setLogoUrl(url || null);
        setInstituteName(s.name || "Dorismon Language Institute");
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // V2.6.1 — TAMAÑOS GRANDES como pidió Luis (logo del tamaño de un título)
  const sizes = {
    sm: { img: "h-12 max-w-[140px]" },               // 48px (antes 36)
    md: { img: "h-20 max-w-[220px]" },               // 80px (antes 48) — sidebar/dashboard
    lg: { img: "h-32 max-w-[320px]" },               // 128px (antes 64) — login/landing
    xl: { img: "h-40 md:h-56 max-w-[440px] md:max-w-[600px]" },  // 160-224px (antes 96-112) — hero
  };
  const s = sizes[size];

  // Decidir qué archivo de logo usar
  // Si shieldOnly=true, usar solo el escudo (sin texto)
  // Si no, usar logo completo
  const logoSrc = logoUrl || (shieldOnly ? "/logo-shield.png" : "/logo-full.png");

  if (!loaded) {
    return <div className={`${s.img} bg-slate-100 rounded animate-pulse`} style={{ width: 220 }} />;
  }

  const content = (
    <div className="inline-flex items-center justify-center">
      <img
        src={logoSrc}
        alt={instituteName}
        className={`${s.img} w-auto object-contain`}
        onError={(e) => {
          const img = e.target as HTMLImageElement;
          // Si falla logo subido, intentar con local
          if (img.src.includes("/logo-full.png") || img.src.includes("/logo-shield.png")) {
            return;  // Ya en fallback final
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
