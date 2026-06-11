"use client";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "white" | "compact";
  withTagline?: boolean;
  asLink?: boolean;
}

/**
 * V1.6.1 — Logo oficial de Dorismon Language Institute
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
  const sizes = {
    sm: { title: "text-base", tagline: "text-[9px]" },
    md: { title: "text-xl", tagline: "text-[10px]" },
    lg: { title: "text-2xl", tagline: "text-xs" },
    xl: { title: "text-4xl md:text-5xl", tagline: "text-sm md:text-base" },
  };
  const s = sizes[size];

  const titleColor = variant === "white" ? "text-white" : "text-slate-900";
  const taglineColor = variant === "white" ? "text-white/80" : "text-slate-500";
  const accentColor = variant === "white" ? "text-accent-300" : "text-brand-600";
  const dotColor = variant === "white" ? "bg-accent-400" : "bg-brand-600";

  const content = (
    <div className="inline-flex items-center gap-2.5 group">
      {/* Símbolo: cuadrado azul con letra D */}
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
          D
        </div>
        {/* Dot accent turquesa */}
        <div className={`absolute -bottom-0.5 -right-0.5 ${
          size === "sm" ? "w-2 h-2" :
          size === "md" ? "w-2.5 h-2.5" :
          "w-3 h-3"
        } ${dotColor} rounded-full ring-2 ring-white`} />
      </div>

      {/* Texto */}
      {variant !== "compact" || withTagline ? (
        <div className="flex flex-col leading-none">
          <span className={`${s.title} font-black tracking-tight ${titleColor}`}>
            DORISMON
          </span>
          {withTagline && variant !== "compact" && (
            <span className={`${s.tagline} font-semibold uppercase tracking-[0.18em] ${taglineColor} mt-0.5`}>
              Language Institute
            </span>
          )}
        </div>
      ) : (
        <span className={`${s.title} font-black tracking-tight ${titleColor}`}>
          DORISMON
        </span>
      )}
    </div>
  );

  if (asLink) {
    return <Link href="/" className="inline-block">{content}</Link>;
  }
  return content;
}
