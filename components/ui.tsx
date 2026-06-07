"use client";
import React from "react";
import clsx from "clsx";

// Button
export function Button({
  children, variant = "primary", size = "md", className, ...props
}: any) {
  const base = "inline-flex items-center justify-center font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg";
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
    <button className={clsx(base, variants[variant], sizes[size], className)} {...props}>
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
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
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
