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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [instituteName, setInstituteName] = useState<string>("Dorismon Language Institute");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // V2.7.4: cache v11
    const cached = typeof window !== "undefined" ? sessionStorage.getItem("institute_logo_v11") : null;
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
          for (let i = 1; i <= 10; i++) {
            sessionStorage.removeItem(i === 1 ? "institute_logo" : `institute_logo_v${i}`);
          }
          sessionStorage.setItem("institute_logo_v11", url);
          sessionStorage.setItem("institute_name", s.name || "Dorismon Language Institute");
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

  if (!loaded) {
    return <div className={`${heightClass} bg-slate-100 rounded animate-pulse`} style={{ width: 120 }} />;
  }

  // Si NO hay logo subido → fallback texto
  if (!logoUrl) {
    const fallback = (
      <div className={`${heightClass} flex items-center font-black tracking-tight ${textColor}`}>
        <span className={size === "xl" ? "text-3xl md:text-4xl" : size === "lg" ? "text-2xl" : size === "md" ? "text-xl" : "text-lg"}>
          DORISMON
        </span>
      </div>
    );
    if (asLink) {
      return <Link href="/" className="inline-block">{fallback}</Link>;
    }
    return fallback;
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
