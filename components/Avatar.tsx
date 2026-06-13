"use client";

interface AvatarProps {
  name?: string | null;
  url?: string | null;
  gender?: string | null;  // V1.6.4: 'male', 'female', 'other', null
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  ring?: boolean;
}

/**
 * V1.6.4 — Avatar reutilizable con gradient por género
 *
 * - Si tiene URL → muestra imagen (V1.6.5: upload real)
 * - Si gender='female' → gradient rosa → fucsia
 * - Si gender='male' → gradient azul → turquesa
 * - Si gender='other'/null → gradient slate neutro
 */
export default function Avatar({
  name = "?",
  url,
  gender,
  size = "md",
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

  // V1.6.4: gradient por género
  let gradientClass = "bg-gradient-to-br from-slate-400 to-slate-600";  // default neutro
  if (gender === "female") {
    gradientClass = "bg-gradient-to-br from-pink-400 to-fuchsia-500";
  } else if (gender === "male") {
    gradientClass = "bg-gradient-to-br from-blue-500 to-teal-500";
  }

  const ringClass = ring ? "ring-2 ring-white shadow-card" : "";

  if (url && url.trim()) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name || "Avatar"}
        className={`${sizes[size]} rounded-full object-cover ${ringClass}`}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} ${gradientClass} ${ringClass} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
    >
      {initials || "?"}
    </div>
  );
}
