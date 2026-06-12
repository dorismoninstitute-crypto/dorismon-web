"use client";

interface AvatarProps {
  name?: string | null;
  url?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "gradient" | "solid";
  ring?: boolean;
}

/**
 * V1.6.3 — Avatar reutilizable
 * Si tiene URL, muestra la imagen. Si no, muestra iniciales sobre gradient brand→accent.
 */
export default function Avatar({
  name = "?",
  url,
  size = "md",
  variant = "gradient",
  ring = false,
}: AvatarProps) {
  const sizes = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-2xl",
  };

  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const bgClass = variant === "gradient"
    ? "bg-gradient-to-br from-brand-500 to-accent-500"
    : "bg-brand-600";

  const ringClass = ring ? "ring-2 ring-white shadow-card" : "";

  if (url && url.trim()) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name || "Avatar"}
        className={`${sizes[size]} rounded-full object-cover ${ringClass}`}
        onError={(e) => {
          // Si falla la imagen, ocultarla para mostrar fallback
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} ${bgClass} ${ringClass} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
    >
      {initials || "?"}
    </div>
  );
}
