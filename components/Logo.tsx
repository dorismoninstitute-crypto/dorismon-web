"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { publicApi } from "@/lib/api";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "white" | "compact";
  withTagline?: boolean;
  asLink?: boolean;
}

/**
 * V2.5 — Logo dinámico: si el instituto subió un logo, lo muestra.
 * Si no, muestra el logo "DORISMON" por default.
 *
 * Variantes:
 * - default: texto oscuro + tagline (para uso general en fondos claros)
 * - white: texto blanco (para fondos oscuros)
 * - compact: solo "Dorismon" sin tagline (para espacios reducidos)
 */
export default function Logo({
  size = "md",
  variant = "default",
  withTagline = true,
  asLink = true,
}: LogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [instituteName, setInstituteName] = useState<string>("DORISMON");

  useEffect(() => {
    // Cargar logo del instituto (cache 1 hora)
    const cached = typeof window !== "undefined" ? sessionStorage.getItem("institute_logo") : null;
    const cachedName = typeof window !== "undefined" ? sessionStorage.getItem("institute_name") : null;

    if (cached !== null) {
      setLogoUrl(cached || null);
      if (cachedName) setInstituteName(cachedName);
      return;
    }

    publicApi.instituteSettings()
      .then((s: any) => {
        const url = s.logo_url || "";
        if (typeof window !== "undefined") {
          sessionStorage.setItem("institute_logo", url);
          sessionStorage.setItem("institute_name", s.name || "DORISMON");
        }
        setLogoUrl(url || null);
        setInstituteName(s.name || "DORISMON");
      })
      .catch(() => {});
  }, []);

  const sizes = {
    sm: { title: "text-base", tagline: "text-[9px]", img: "h-7" },
    md: { title: "text-xl", tagline: "text-[10px]", img: "h-9" },
    lg: { title: "text-2xl", tagline: "text-xs", img: "h-12" },
    xl: { title: "text-4xl md:text-5xl", tagline: "text-sm md:text-base", img: "h-16 md:h-20" },
  };
  const s = sizes[size];

  const titleColor = variant === "white" ? "text-white" : "text-slate-900";
  const taglineColor = variant === "white" ? "text-white/80" : "text-slate-500";
  const dotColor = variant === "white" ? "bg-accent-400" : "bg-brand-600";

  // Si hay logo configurado → mostrarlo
  if (logoUrl) {
    const content = (
      <div className="inline-flex items-center gap-2.5">
        <img src={logoUrl} alt={instituteName} className={`${s.img} w-auto object-contain`} />
      </div>
    );
    if (asLink) {
      return <Link href="/" className="inline-block">{content}</Link>;
    }
    return content;
  }

  // Fallback: logo por defecto DORISMON
  const titleText = instituteName.toUpperCase();
  const content = (
    <div className="inline-flex items-center gap-2.5 group">
      <div className="relative flex-shrink-0">
        <div className={`${
          size === "sm" ? "w-7 h-7" :
          size === "md" ? "w-9 h-9" :
          size === "lg" ? "w-11 h-11" :
          "w-14 h-14"
        } rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center font-black text-white shadow-md group-hover:shadow-lg transition-shadow ${
          size === "sm" ? "text-sm" :
          size === "md" ? "text-base" :
          size === "lg" ? "text-lg" :
          "text-2xl"
        }`}>
          {titleText[0] || "D"}
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 ${
          size === "sm" ? "w-2 h-2" :
          size === "md" ? "w-2.5 h-2.5" :
          "w-3 h-3"
        } ${dotColor} rounded-full ring-2 ring-white`} />
      </div>

      {variant !== "compact" || withTagline ? (
        <div className="flex flex-col leading-none">
          <span className={`${s.title} font-black tracking-tight ${titleColor}`}>
            {titleText}
          </span>
          {withTagline && variant !== "compact" && (
            <span className={`${s.tagline} font-semibold uppercase tracking-[0.18em] ${taglineColor} mt-0.5`}>
              Language Institute
            </span>
          )}
        </div>
      ) : (
        <span className={`${s.title} font-black tracking-tight ${titleColor}`}>
          {titleText}
        </span>
      )}
    </div>
  );

  if (asLink) {
    return <Link href="/" className="inline-block">{content}</Link>;
  }
  return content;
}
