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
 * V2.7.1 — Logo MUY GRANDE FINAL.
 * Logos recortados sin espacio vacío + tamaños grandes garantizados.
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
    // V2.7.1: cache "v8" para forzar refresh tras recorte de logos
    const cached = typeof window !== "undefined" ? sessionStorage.getItem("institute_logo_v8") : null;
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
          for (let i = 1; i <= 7; i++) {
            sessionStorage.removeItem(`institute_logo${i === 1 ? '' : '_v' + i}`);
          }
          sessionStorage.setItem("institute_logo_v8", url);
          sessionStorage.setItem("institute_name", s.name || "Dorismon Language Institute");
        }
        setLogoUrl(url || null);
        setInstituteName(s.name || "Dorismon Language Institute");
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const useHorizontal = horizontal !== undefined
    ? horizontal
    : (size === "sm" || size === "md");

  // V2.7.1 — TAMAÑOS GRANDES (logo horizontal ahora ratio 2.40, recortado al límite)
  const sizes = {
    sm: useHorizontal ? "h-14" : "h-20",        // 56 / 80
    md: useHorizontal ? "h-20" : "h-28",        // 80 / 112 (navbar, sidebar)
    lg: useHorizontal ? "h-28" : "h-44",        // 112 / 176 (login)
    xl: useHorizontal ? "h-36 md:h-44" : "h-60 md:h-80",  // 144-176 / 240-320 (hero)
  };
  const heightClass = sizes[size];

  let logoSrc: string;
  if (logoUrl) {
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
        if (img.src.includes("/logo-horizontal.png")) {
          img.src = "/logo-full.png";
        } else if (img.src.includes("/logo-vertical.png")) {
          img.src = "/logo-full.png";
        } else if (img.src.includes("/logo-shield.png")) {
          img.src = "/logo-full.png";
        }
      }}
    />
  );

  if (asLink) {
    return <Link href="/" className="inline-block">{content}</Link>;
  }
  return content;
}
