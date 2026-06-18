"use client";
import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { useFeatures } from "@/hooks/useFeatures";

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  /** Si true, en vez de mostrar UI bloqueada solo retorna null (oculta) */
  hideIfLocked?: boolean;
  /** Texto custom para el candado */
  lockedTitle?: string;
  lockedMessage?: string;
}

/**
 * V2.9: Wrapper que muestra contenido solo si el plan del usuario incluye la feature.
 *
 * Si NO tiene acceso → muestra un placeholder con candado 🔒 y CTA "Mejorar plan".
 *
 * Uso:
 *   <FeatureGate feature="certificates">
 *     <CertificatesList />
 *   </FeatureGate>
 *
 *   <FeatureGate feature="private_classes" hideIfLocked>
 *     <PrivateClassesCard />
 *   </FeatureGate>
 */
export default function FeatureGate({
  feature,
  children,
  hideIfLocked = false,
  lockedTitle = "Esta función no está en tu plan",
  lockedMessage = "Mejora tu plan para acceder a esta funcionalidad.",
}: FeatureGateProps) {
  const { hasFeature, loaded } = useFeatures();
  const router = useRouter();

  if (!loaded) return null;
  if (hasFeature(feature)) return <>{children}</>;
  if (hideIfLocked) return null;

  return (
    <div className="relative rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
        <span className="text-3xl">🔒</span>
      </div>
      <h3 className="mb-2 text-lg font-bold text-slate-900">{lockedTitle}</h3>
      <p className="mb-4 text-sm text-slate-600">{lockedMessage}</p>
      <button
        onClick={() => router.push("/dashboard/student/checkout")}
        className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Mejorar plan →
      </button>
    </div>
  );
}

/**
 * V2.9: Inline lock badge — para usar dentro de menús/cards
 * cuando NO querés bloquear toda la sección, solo marcar visualmente
 *
 * Uso:
 *   {!hasFeature("certificates") && <LockBadge />}
 */
export function LockBadge({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-amber-100 ${small ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"} font-semibold text-amber-900`}
      title="No incluido en tu plan"
    >
      🔒 {!small && "Bloqueado"}
    </span>
  );
}
