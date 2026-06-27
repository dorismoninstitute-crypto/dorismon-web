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
 * V3.9.5 — Logo con SVG integrado por defecto (aparece AL INSTANTE).
 * Usa el logo SVG que vive en /public/logo-dorismon.svg como valor por defecto,
 * así no hay que esperar al servidor ni que el admin lo suba. Si el admin SÍ
 * subió un logo personalizado, ese tiene prioridad (se carga en segundo plano).
 */
const DEFAULT_LOGO = "/logo-dorismon.svg";

export default function Logo({
  size = "md",
  variant = "default",
  asLink = true,
}: LogoProps) {
  // El logo personalizado del admin (si existe) se lee del caché para que aparezca
  // al instante en visitas siguientes.
  const getInitialCustomLogo = (): string | null => {
    if (typeof window === "undefined") return null;
    try { return localStorage.getItem("institute_logo_v12") || null; } catch { return null; }
  };
  const getInitialName = (): string => {
    if (typeof window === "undefined") return "Dorismon Language Institute";
    try { return localStorage.getItem("institute_name") || "Dorismon Language Institute"; } catch { return "Dorismon Language Institute"; }
  };

  // Empieza con el logo del admin (si está en caché) o con el SVG integrado por defecto.
  const [customLogo, setCustomLogo] = useState<string | null>(getInitialCustomLogo());
  const [instituteName, setInstituteName] = useState<string>(getInitialName());

  useEffect(() => {
    // Refrescamos del servidor en segundo plano por si el admin cambió el logo.
    publicApi.instituteSettings()
      .then((s: any) => {
        const url = s.logo_url || "";
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("institute_logo_v12", url);
            localStorage.setItem("institute_name", s.name || "Dorismon Language Institute");
          } catch {}
        }
        setCustomLogo(url || null);
        setInstituteName(s.name || "Dorismon Language Institute");
      })
      .catch(() => {});
  }, []);

  // Tamaños del logo
  const sizes = {
    sm: "h-10",
    md: "h-14",                 // 56px (navbar, sidebar)
    lg: "h-24",                 // 96px (login)
    xl: "h-32 md:h-40",         // 128-160px (hero)
  };
  const heightClass = sizes[size];

  // El logo a mostrar: el del admin si lo subió, si no el SVG integrado (instantáneo)
  const logoSrc = customLogo || DEFAULT_LOGO;

  const content = (
    <img
      src={logoSrc}
      alt={instituteName}
      className={`${heightClass} w-auto object-contain max-w-full`}
    />
  );

  if (asLink) {
    return <Link href="/" className="inline-block max-w-full">{content}</Link>;
  }
  return content;
}
