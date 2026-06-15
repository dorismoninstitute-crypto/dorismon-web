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
  horizontal?: boolean;
}

/**
 * V2.7.3 — Logo de ALTA CALIDAD definitivo.
 *
 * Archivos disponibles:
 * - /logo-horizontal.png — escudo a la izq + texto a la der (ratio 2.4)
 * - /logo-vertical.png   — escudo arriba + texto debajo (ratio 0.74)
 * - /logo-shield.png     — solo escudo
 *
 * En MÓVIL automáticamente usa shield (escudo solo) en navbar/sidebar
 * para evitar que se recorte.
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);

    const cached = typeof window !== "undefined" ? sessionStorage.getItem("institute_logo_v10") : null;
    const cachedName = typeof window !== "undefined" ? sessionStorage.getItem("institute_name") : null;

    if (cached !== null) {
      setLogoUrl(cached || null);
      if (cachedName) setInstituteName(cachedName);
      setLoaded(true);
      return () => window.removeEventListener("resize", check);
    }

    publicApi.instituteSettings()
      .then((s: any) => {
        const url = s.logo_url || "";
        if (typeof window !== "undefined") {
          for (let i = 1; i <= 9; i++) {
            sessionStorage.removeItem(i === 1 ? "institute_logo" : `institute_logo_v${i}`);
          }
          sessionStorage.setItem("institute_logo_v10", url);
          sessionStorage.setItem("institute_name", s.name || "Dorismon Language Institute");
        }
        setLogoUrl(url || null);
        setInstituteName(s.name || "Dorismon Language Institute");
        setLoaded(true);
      })
      .catch(() => setLoaded(true));

    return () => window.removeEventListener("resize", check);
  }, []);

  // Decidir si usar horizontal o vertical
  const wantsHorizontal = horizontal !== undefined
    ? horizontal
    : (size === "sm" || size === "md");

  // V2.7.3: En móvil con horizontal → usar shield (escudo solo)
  const useShieldOnly = shieldOnly || (wantsHorizontal && isMobile);
  const useHorizontal = wantsHorizontal && !isMobile;

  // Tamaños generosos
  const sizes = {
    sm: useShieldOnly ? "h-12" : (useHorizontal ? "h-14" : "h-16"),
    md: useShieldOnly ? "h-14" : (useHorizontal ? "h-20" : "h-24"),
    lg: useShieldOnly ? "h-20" : (useHorizontal ? "h-32" : "h-44"),
    xl: useShieldOnly ? "h-32 md:h-40" : (useHorizontal ? "h-40 md:h-48" : "h-56 md:h-72"),
  };
  const heightClass = sizes[size];

  // Decidir source
  let logoSrc: string;
  if (logoUrl) {
    logoSrc = logoUrl;
  } else if (useShieldOnly) {
    logoSrc = "/logo-shield.png";
  } else if (useHorizontal) {
    logoSrc = "/logo-horizontal.png";
  } else {
    logoSrc = "/logo-vertical.png";
  }

  if (!loaded) {
    return (
      <div className={`${heightClass} bg-slate-100 rounded animate-pulse`}
           style={{ width: useShieldOnly ? 60 : (useHorizontal ? 180 : 90) }} />
    );
  }

  const content = (
    <img
      src={logoSrc}
      alt={instituteName}
      className={`${heightClass} w-auto object-contain max-w-full`}
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        if (img.src.includes("/logo-horizontal.png")) img.src = "/logo-vertical.png";
        else if (img.src.includes("/logo-vertical.png")) img.src = "/logo-full.png";
        else if (img.src.includes("/logo-shield.png")) img.src = "/logo-vertical.png";
      }}
    />
  );

  if (asLink) {
    return <Link href="/" className="inline-block max-w-full">{content}</Link>;
  }
  return content;
}
