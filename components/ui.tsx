"use client";
import React from "react";
import clsx from "clsx";

// Button
export function Button({
  children, variant = "primary", size = "md", className, loading, disabled, ...props
}: any) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg";
  const variants: any = {
    primary: "bg-brand-600 hover:bg-brand-700 text-white shadow-sm",
    accent: "bg-accent-500 hover:bg-accent-600 text-white shadow-sm",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-900",
    outline: "border border-slate-300 bg-white hover:bg-slate-50 text-slate-900",
    ghost: "hover:bg-slate-100 text-slate-700",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };
  const sizes: any = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return (
    <button className={clsx(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}

// Card
export function Card({ children, className, ...props }: any) {
  return (
    <div className={clsx("bg-white rounded-xl border border-slate-200 shadow-sm", className)} {...props}>
      {children}
    </div>
  );
}
export function CardHeader({ children, className }: any) {
  return <div className={clsx("px-5 py-4 border-b border-slate-100", className)}>{children}</div>;
}
export function CardBody({ children, className }: any) {
  return <div className={clsx("p-5", className)}>{children}</div>;
}
export function CardTitle({ children, className }: any) {
  return <h3 className={clsx("font-bold text-slate-900 tracking-tight", className)}>{children}</h3>;
}

// Badge
export function Badge({ children, variant = "default", className }: any) {
  const variants: any = {
    default: "bg-slate-100 text-slate-700",
    brand: "bg-brand-100 text-brand-700",
    accent: "bg-accent-100 text-accent-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-sky-100 text-sky-700",
  };
  return (
    <span className={clsx(
      "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold",
      variants[variant], className
    )}>
      {children}
    </span>
  );
}

// Input
export function Input({ label, error, className, ...props }: any) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-semibold text-slate-700">{label}</label>}
      <input
        className={clsx(
          "w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition",
          error ? "border-red-300" : "border-slate-300",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className, ...props }: any) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-semibold text-slate-700">{label}</label>}
      <textarea
        className={clsx(
          "w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm placeholder:text-slate-400 min-h-[100px] resize-y",
          "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition",
          error ? "border-red-300" : "border-slate-300",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className, ...props }: any) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-semibold text-slate-700">{label}</label>}
      <select
        className={clsx(
          "w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm",
          "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition",
          error ? "border-red-300" : "border-slate-300",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// LoadingState
export function LoadingScreen({ message = "Cargando..." }: { message?: string }) {
  // V3.9.15: si la carga tarda (cold start del servidor ~30-50s), mostrar un
  // hero motivacional tipo landing en vez del spinner aburrido. Aparece a los
  // 4 segundos — las cargas normales (rápidas) nunca lo ven.
  const [slow, setSlow] = React.useState(false);
  const [phraseIdx] = React.useState(() => Math.floor(Math.random() * 5));
  React.useEffect(() => {
    const t = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const phrases = [
    { en: "Every day is a new chance to learn.", es: "Cada día es una nueva oportunidad para aprender." },
    { en: "Practice makes progress.", es: "La práctica hace el progreso." },
    { en: "Your English journey continues here.", es: "Tu camino en inglés continúa aquí." },
    { en: "Small steps every day lead to big results.", es: "Pequeños pasos cada día llevan a grandes resultados." },
    { en: "The best time to learn is now.", es: "El mejor momento para aprender es ahora." },
  ];
  const phrase = phrases[phraseIdx];

  if (slow) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 text-white px-6 text-center overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
        <div className="relative flex flex-col items-center">
          <div className="bg-white rounded-2xl px-5 py-4 mb-8 shadow-xl">
            <img src="/logo-dorismon.svg" alt="Dorismon Language Institute" className="h-14 w-auto" />
          </div>
          <p className="text-xl md:text-2xl font-black mb-2 max-w-md">"{phrase.en}"</p>
          <p className="text-sm text-brand-200 mb-10 max-w-md">{phrase.es}</p>
          <div className="flex items-center gap-3 text-brand-100">
            <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <p className="text-sm">Preparando tu espacio de aprendizaje...</p>
          </div>
          <p className="absolute -bottom-24 text-xs text-brand-300/60">Dorismon Language Institute · Santo Domingo, RD 🇩🇴</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
      <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-brand-600 animate-spin mb-3" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function Skeleton({ className }: any) {
  return <div className={clsx("animate-pulse bg-slate-200 rounded-lg", className)} />;
}

// EmptyState
export function EmptyState({ icon = "📭", title, description, action }: any) {
  return (
    <div className="text-center py-12 px-6">
      <div className="text-5xl mb-4 opacity-60">{icon}</div>
      <h3 className="text-base font-bold text-slate-900 mb-2 tracking-tight">{title}</h3>
      {description && <p className="text-sm text-slate-500 mb-5 max-w-sm mx-auto">{description}</p>}
      {action}
    </div>
  );
}

// V2.9: Card de función bloqueada por plan
export function PlanLockedCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center max-w-lg mx-auto mt-6">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
        <span className="text-3xl">🔒</span>
      </div>
      <h3 className="mb-2 text-lg font-bold text-slate-900">{title}</h3>
      <p className="mb-5 text-sm text-slate-600">{message}</p>
      <a
        href="/checkout"
        className="inline-block rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition"
      >
        Mejorar mi plan →
      </a>
    </div>
  );
}

// ErrorBox
export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 font-medium">
      ⚠ {message}
    </div>
  );
}

// SuccessBox
export function SuccessBox({ message }: { message: string }) {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-700 font-medium">
      ✓ {message}
    </div>
  );
}

// StatCard
export function StatCard({ label, value, color = "brand", icon }: any) {
  const colors: any = {
    brand: "text-brand-600 bg-brand-50",
    accent: "text-accent-600 bg-accent-50",
    success: "text-emerald-600 bg-emerald-50",
    warning: "text-amber-600 bg-amber-50",
    info: "text-sky-600 bg-sky-50",
    purple: "text-purple-600 bg-purple-50",
  };
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        {icon && (
          <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center text-2xl", colors[color])}>
            {icon}
          </div>
        )}
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight mt-1">{value ?? "—"}</p>
        </div>
      </CardBody>
    </Card>
  );
}

// Modal
export function Modal({ open, onClose, title, children, size = "md" }: any) {
  if (!open) return null;
  const sizes: any = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in"
         onClick={onClose}>
      <div className={clsx("bg-white rounded-2xl shadow-xl w-full max-h-[90vh] overflow-y-auto animate-slide-up", sizes[size])}
           onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// PageHeader
export function PageHeader({ title, subtitle, action }: any) {
  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 md:gap-4 mb-5 md:mb-6">
      <div className="flex-1 min-w-0">
        <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="text-xs md:text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function Tabs({ tabs, active, onChange }: any) {
  return (
    <div className="border-b border-slate-200 mb-6">
      <nav className="flex gap-1 overflow-x-auto">
        {tabs.map((t: any) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={clsx(
              "px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap border-b-2",
              active === t.id
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}


// ConfirmModal — reemplaza el confirm() del navegador
export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = "Confirmar", confirmVariant = "danger" }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h3 className="text-lg font-bold tracking-tight mb-2">{title}</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant={confirmVariant} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

// Toast — mensajes flotantes que aparecen y desaparecen
type ToastMsg = { id: number; type: "success" | "error" | "info"; text: string };
const toastListeners: any[] = [];
let toastCounter = 0;

export function showToast(type: "success" | "error" | "info", text: string) {
  const t = { id: ++toastCounter, type, text };
  toastListeners.forEach(fn => fn(t));
}

import { useEffect as _useEffect } from "react";

export function ToastContainer() {
  const [toasts, setToasts] = React.useState<ToastMsg[]>([]);
  _useEffect(() => {
    const handler = (t: ToastMsg) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(p => p.id !== t.id)), 3500);
    };
    toastListeners.push(handler);
    return () => { const i = toastListeners.indexOf(handler); if (i > -1) toastListeners.splice(i, 1); };
  }, []);
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
      {toasts.map(t => {
        const colors: any = {
          success: "bg-emerald-600 text-white",
          error: "bg-red-600 text-white",
          info: "bg-brand-600 text-white",
        };
        const icons: any = { success: "✓", error: "✕", info: "ℹ" };
        return (
          <div key={t.id} className={clsx("px-4 py-3 rounded-lg shadow-lg animate-slide-up flex items-center gap-3", colors[t.type])}>
            <span className="text-xl font-bold">{icons[t.type]}</span>
            <span className="text-sm font-semibold">{t.text}</span>
          </div>
        );
      })}
    </div>
  );
}


// V1.4 — Botón "Agregar al calendario" con dropdown Google Calendar + .ics
export function CalendarButton({ sessionId }: { sessionId: string }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const addToGoogle = async () => {
    setLoading(true);
    try {
      const { calendarApi } = await import("@/lib/api");
      const r: any = await calendarApi.googleLink(sessionId);
      if (r.url) window.open(r.url, "_blank");
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const downloadIcs = async () => {
    setLoading(true);
    try {
      // Para descargar .ics, necesitamos enviar el token de auth → fetch + blob
      const base = (typeof window !== "undefined") ? localStorage.getItem("api_base") || (process.env.NEXT_PUBLIC_API_URL || "") : "";
      const token = localStorage.getItem("access_token");
      const url = `${base}/calendar/session/${sessionId}.ics`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("No se pudo descargar el calendario");
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `dorismon-clase-${sessionId.slice(0, 8)}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="px-3 py-1.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
      >
        📅 Agregar al calendario {open ? "▲" : "▼"}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-40 overflow-hidden">
            <button onClick={addToGoogle} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2">
              <span>🟦</span> Google Calendar
            </button>
            <button onClick={downloadIcs} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2">
              <span>📄</span> Apple / Outlook (.ics)
            </button>
          </div>
        </>
      )}
    </div>
  );
}


// V1.4 — Pantalla intermedia "Entrar a la clase" — V1.4.1: detecta plataforma
// V3.0.3: Ubicación de clase presencial/híbrida — dirección + botones mapa/teléfono
export function ClassLocation({ location, compact = false }: { location: any; compact?: boolean }) {
  if (!location) return null;
  const { branch_name, address, phone, classroom_name, maps_url } = location;
  if (!branch_name && !address && !classroom_name) return null;

  const mapsUrl = maps_url || (address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null);

  if (compact) {
    return (
      <p className="text-xs text-slate-600">
        📍 {branch_name}{classroom_name ? ` · ${classroom_name}` : ""}
      </p>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mt-2">
      <div className="flex items-start gap-2">
        <span className="text-lg flex-shrink-0">📍</span>
        <div className="flex-1 min-w-0">
          {branch_name && <p className="font-semibold text-sm text-slate-900">{branch_name}</p>}
          {classroom_name && <p className="text-xs text-slate-600">Aula: {classroom_name}</p>}
          {address && <p className="text-xs text-slate-500 mt-0.5">{address}</p>}
          <div className="flex gap-2 mt-2 flex-wrap">
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                <button className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1">
                  🗺️ Cómo llegar
                </button>
              </a>
            )}
            {phone && (
              <a href={`tel:${phone}`}>
                <button className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition flex items-center gap-1">
                  📞 Llamar a la sede
                </button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** V3.9.28 — Entra a la clase dentro de la plataforma (capa flotante) */
function BotonEntrarClasePropia({ session }: { session: any }) {
  // Import perezoso para no romper páginas fuera del panel
  const { useLlamada } = require("@/components/CallProvider");
  const { entrar, sessionId, enLlamada } = useLlamada();
  const finalizada = session?.status === "completed";
  const esEsta = enLlamada && sessionId === session.id;

  if (finalizada) {
    return (
      <span className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl bg-slate-100 text-slate-400">
        🎥 Clase finalizada
      </span>
    );
  }

  return (
    <button
      onClick={() => entrar(session.id)}
      className={`inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl transition ${
        esEsta ? "bg-emerald-500 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"
      }`}
    >
      🎥 {esEsta ? "Volver a la clase" : "Entrar a la clase"}
    </button>
  );
}

export function JoinClassButton({ session }: { session: any }) {
  const [showModal, setShowModal] = React.useState(false);

  // V3.9.26: si la clase usa el video propio de Dorismon, el botón lleva a
  // la sala interna en vez de a un enlace externo. Nada que instalar.
  const usaVideoPropio = session?.video_provider === "dorismon";

  // Detectar plataforma desde el link
  const url = session?.meeting_url || "";
  let platform: "zoom" | "google_meet" | "teams" | "other" | "none" = "none";
  let platformLabel = "";
  let platformIcon = "🎥";
  let platformInstructions = "";

  if (!url) {
    platform = "none";
  } else if (/^https?:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.zoom\.us\//i.test(url)) {
    platform = "zoom";
    platformLabel = "Zoom";
    platformIcon = "💙";
    platformInstructions = "Si Zoom pide instalar la app, puedes continuar desde el navegador haciendo click en 'Únete desde tu navegador'.";
  } else if (/^https?:\/\/meet\.google\.com\//i.test(url)) {
    platform = "google_meet";
    platformLabel = "Google Meet";
    platformIcon = "🟢";
    platformInstructions = "Si Meet pide permiso para unirse, esperá unos segundos a que el profesor te apruebe.";
  } else if (/^https?:\/\/teams\.microsoft\.com\//i.test(url)) {
    platform = "teams";
    platformLabel = "Microsoft Teams";
    platformIcon = "🟣";
    platformInstructions = "Si Teams pide instalar la app, puedes continuar desde el navegador.";
  } else {
    platform = "other";
    platformLabel = "Reunión externa";
    platformIcon = "🔗";
    platformInstructions = "Verificá que el link sea correcto. Si no funciona, contacta a tu profesor.";
  }

  // V3.9.28 — Video propio: la clase se abre SOBRE la plataforma, así se
  // puede minimizar y seguir navegando sin perder la conexión.
  if (usaVideoPropio) {
    return <BotonEntrarClasePropia session={session} />;
  }

  const open = () => {
    if (!url || url === "false" || url === "null" || url.trim() === "") {
      showToast("error", "Esta clase no tiene link de meeting configurado. Avisale a tu profesor.");
      return;
    }
    setShowModal(true);
  };

  const proceed = () => {
    window.open(url, "_blank", "noopener,noreferrer");
    setShowModal(false);
  };

  // V1.6.4: Lógica temporal inteligente
  const now = new Date();
  const startsAt = session?.starts_at_utc ? new Date(session.starts_at_utc) : null;
  const endsAt = session?.ends_at_utc ? new Date(session.ends_at_utc) : null;

  const minsUntilStart = startsAt ? Math.round((startsAt.getTime() - now.getTime()) / 60000) : null;
  const minsUntilEnd = endsAt ? Math.round((endsAt.getTime() - now.getTime()) / 60000) : null;

  // Estados temporales
  const isUpcomingFar = minsUntilStart !== null && minsUntilStart > 15;
  const isReadyToJoin = minsUntilStart !== null && minsUntilStart <= 15 && minsUntilStart > 0;
  // V3.9.19: si la clase fue FINALIZADA manualmente (status completed), ya no está en curso
  const wasFinalized = session?.status === "completed";
  const isInProgress = !wasFinalized && startsAt && endsAt && now >= startsAt && now <= endsAt;
  const isFinished = wasFinalized || (endsAt && now > endsAt);

  // Render del botón según estado temporal
  let btnLabel: string;
  let btnDisabled = false;
  let btnClassName = "";

  if (platform === "none") {
    btnLabel = "Sin link aún";
    btnDisabled = true;
  } else if (isFinished) {
    btnLabel = "✓ Clase finalizada";
    btnDisabled = true;
    btnClassName = "opacity-50";
  } else if (isInProgress) {
    btnLabel = `🔴 EN CURSO — Entrar a ${platformLabel}`;
    btnClassName = "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 animate-pulse-soft";
  } else if (isReadyToJoin) {
    btnLabel = `${platformIcon} Entrar a ${platformLabel} (empieza en ${minsUntilStart} min)`;
  } else if (isUpcomingFar) {
    const hrs = Math.floor(minsUntilStart! / 60);
    btnLabel = hrs >= 1
      ? `⏰ Empieza en ${hrs}h ${minsUntilStart! % 60}min`
      : `⏰ Empieza en ${minsUntilStart} min`;
    btnDisabled = true;
    btnClassName = "opacity-60";
  } else {
    btnLabel = `${platformIcon} Entrar a ${platformLabel} →`;
  }

  return (
    <>
      <Button onClick={open} disabled={btnDisabled} className={btnClassName}>
        {btnLabel}
      </Button>

      {showModal && url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">{platformIcon}</div>
              <h3 className="text-xl font-extrabold">Entrar a tu clase de {platformLabel}</h3>
              {session.title && <p className="text-sm text-slate-600 mt-1">{session.title}</p>}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs text-blue-900">
              <p className="font-bold mb-1">📌 Antes de entrar:</p>
              <p>{platformInstructions}</p>
            </div>

            <p className="text-xs text-slate-500 mb-4 break-all bg-slate-50 p-2 rounded font-mono">{url}</p>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
              <Button onClick={proceed} className="flex-1">Entrar ahora →</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


// V1.4 — Banner-guía para crear links Meet/Zoom correctamente
export function MeetingUrlGuide() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
      <p className="font-bold text-blue-900 mb-1">📌 Cómo crear el link correcto:</p>
      <ul className="text-blue-800 space-y-1">
        <li><strong>Google Meet:</strong> crea el evento desde Google Calendar y agrega videollamada (no uses meet.google.com directo, esos links piden permiso).</li>
        <li><strong>Zoom:</strong> programá la reunión desde la app y copiá el link de invitación.</li>
        <li><strong>Teams:</strong> crea la reunión desde Microsoft Teams y copiá el link.</li>
      </ul>
    </div>
  );
}


// V1.4.1 — Input de URL con validación en vivo (detecta plataforma)
export function MeetingUrlInput({
  value, onChange, label, required,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  required?: boolean;
}) {
  const [validation, setValidation] = React.useState<{ valid: boolean; type?: string; label?: string; warning?: string; reason?: string } | null>(null);

  const detectLocally = (url: string) => {
    if (!url || url.trim() === "") return null;
    const u = url.trim();
    if (/^https?:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.zoom\.us\/(j|my|webinar|s)\//i.test(u)) {
      return { valid: true, type: "zoom", label: "Zoom" };
    }
    if (/^https?:\/\/meet\.google\.com\//i.test(u)) {
      return { valid: true, type: "google_meet", label: "Google Meet" };
    }
    if (/^https?:\/\/teams\.microsoft\.com\/l\/meetup-join\//i.test(u)) {
      return { valid: true, type: "teams", label: "Microsoft Teams" };
    }
    if (/^https?:\/\/[^\s]+/i.test(u)) {
      return {
        valid: true, type: "other", label: "Link genérico",
        warning: "El link no es de Zoom, Meet ni Teams. Verificá que sea correcto.",
      };
    }
    return {
      valid: false,
      reason: "Link no válido. Debe empezar con https:// y ser de Zoom, Meet o Teams.",
    };
  };

  React.useEffect(() => {
    setValidation(detectLocally(value));
  }, [value]);

  const platformIcon = validation?.type === "zoom" ? "💙"
    : validation?.type === "google_meet" ? "🟢"
    : validation?.type === "teams" ? "🟣"
    : validation?.type === "other" ? "🔗"
    : "";

  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
        {label || "URL de Zoom/Meet/Teams"} {required && "*"}
      </label>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://us05web.zoom.us/j/... o https://meet.google.com/..."
        className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none transition ${
          !value ? "border-slate-200 focus:border-brand-500"
          : validation?.valid && validation.type !== "other"
            ? "border-emerald-500 focus:border-emerald-600 bg-emerald-50/30"
            : validation?.type === "other"
              ? "border-amber-400 focus:border-amber-500 bg-amber-50/30"
              : "border-red-400 focus:border-red-500 bg-red-50/30"
        }`}
      />
      {value && validation && (
        <div className="mt-1.5 text-xs">
          {validation.valid && validation.type !== "other" && (
            <p className="text-emerald-700 font-semibold">
              {platformIcon} Detectado: <strong>{validation.label}</strong> ✓
            </p>
          )}
          {validation.type === "other" && validation.warning && (
            <p className="text-amber-700 font-semibold">⚠️ {validation.warning}</p>
          )}
          {!validation.valid && (
            <p className="text-red-700 font-semibold">❌ {validation.reason}</p>
          )}
        </div>
      )}
    </div>
  );
}
