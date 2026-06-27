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
 * V2.7.4 — Logo SIMPLE: solo muestra el logo subido por admin.
 * Si admin NO ha subido logo, muestra fallback "DORISMON" en texto.
 */
export default function Logo({
  size = "md",
  variant = "default",
  asLink = true,
}: LogoProps) {
  // V3.9.3: Leer el logo del caché persistente INMEDIATAMENTE (antes del primer render)
  // para que aparezca al instante sin esperar al servidor (que puede tardar por cold start).
  const getInitialLogo = (): string | null => {
    if (typeof window === "undefined") return null;
    try { return localStorage.getItem("institute_logo_v12"); } catch { return null; }
  };
  const getInitialName = (): string => {
    if (typeof window === "undefined") return "Dorismon Language Institute";
    try { return localStorage.getItem("institute_name") || "Dorismon Language Institute"; } catch { return "Dorismon Language Institute"; }
  };

  const [logoUrl, setLogoUrl] = useState<string | null>(getInitialLogo());
  const [instituteName, setInstituteName] = useState<string>(getInitialName());
  // Si ya teníamos algo en caché, arrancamos "cargados" (no mostramos el spinner gris)
  const [loaded, setLoaded] = useState<boolean>(() => getInitialLogo() !== null);

  useEffect(() => {
    // Siempre refrescamos del servidor en segundo plano (por si el admin cambió el logo),
    // pero sin bloquear: ya mostramos el del caché o el texto.
    publicApi.instituteSettings()
      .then((s: any) => {
        const url = s.logo_url || "";
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("institute_logo_v12", url);
            localStorage.setItem("institute_name", s.name || "Dorismon Language Institute");
          } catch {}
        }
        setLogoUrl(url || null);
        setInstituteName(s.name || "Dorismon Language Institute");
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Tamaños del logo
  const sizes = {
    sm: "h-10",
    md: "h-14",                 // 56px (navbar, sidebar)
    lg: "h-24",                 // 96px (login)
    xl: "h-32 md:h-40",         // 128-160px (hero)
  };
  const heightClass = sizes[size];

  // Color del texto fallback según variant
  const textColor = variant === "white" ? "text-white" : "text-slate-900";

  // Texto "DORISMON" reutilizable (fallback instantáneo)
  const textLogo = (
    <div className={`${heightClass} flex items-center font-black tracking-tight ${textColor}`}>
      <span className={size === "xl" ? "text-3xl md:text-4xl" : size === "lg" ? "text-2xl" : size === "md" ? "text-xl" : "text-lg"}>
        DORISMON
      </span>
    </div>
  );

  // V3.9.4: Mientras carga por primera vez (sin caché), mostramos un espacio
  // reservado INVISIBLE del tamaño correcto — NO el texto "DORISMON" (que
  // parpadeaba feo antes de aparecer el logo real). La página no salta y no se
  // ve texto temporal. Si resulta que no hay logo subido, el efecto siguiente
  // (abajo) muestra el texto como respaldo permanente.
  if (!loaded && !logoUrl) {
    const placeholder = <div className={heightClass} style={{ width: 140 }} aria-hidden="true" />;
    return asLink ? <Link href="/" className="inline-block">{placeholder}</Link> : placeholder;
  }

  // Si NO hay logo subido → fallback texto (respaldo permanente, correcto)
  if (!logoUrl) {
    if (asLink) {
      return <Link href="/" className="inline-block">{textLogo}</Link>;
    }
    return textLogo;
  }

  // Logo subido por admin
  const content = (
    <img
      src={logoUrl}
      alt={instituteName}
      className={`${heightClass} w-auto object-contain max-w-full`}
    />
  );

  if (asLink) {
    return <Link href="/" className="inline-block max-w-full">{content}</Link>;
  }
  return content;
}
