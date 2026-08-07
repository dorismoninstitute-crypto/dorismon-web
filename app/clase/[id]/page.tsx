"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * V3.9.28 — Esta ruta ya no muestra la clase: la clase ahora vive sobre el
 * panel para poder minimizarla y seguir navegando.
 *
 * Se conserva para los enlaces antiguos: manda al panel y abre la clase allá.
 */
export default function EntrarAClase() {
  const params = useParams();
  const router = useRouter();
  const sessionId = String(params?.id || "");

  useEffect(() => {
    if (!sessionId) return;
    try { sessionStorage.setItem("dorismon_abrir_clase", sessionId); } catch { /* modo privado */ }
    router.replace("/dashboard");
  }, [sessionId, router]);

  return (
    <div className="min-h-screen bg-[#0F1729] flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-7 h-7 text-white/60 animate-spin" />
      <p className="text-white/60 text-sm">Abriendo tu clase...</p>
    </div>
  );
}
