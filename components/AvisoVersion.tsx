"use client";
// ══ GATE 5B — "Hay una nueva versión de Dorismon disponible." ══
//
// Compara la versión de ESTE build (fijada al construir) con /version:
//   · al volver a la app (visibilitychange / focus);
//   · cada 45 minutos mientras la pestaña está visible.
// Nunca recarga sola: solo la persona decide con "Actualizar ahora", y antes
// se le recuerda guardar lo que esté haciendo. "Más tarde" lo pospone 4 horas.
//
// VIDEO DORISMON: mientras haya clase (mini, split o full → enLlamada) NO se
// ofrece actualizar; solo se informa. Lee useLlamada() sin tocar CallProvider.
// Debe montarse DENTRO de <CallProvider> (layout del panel).
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { useLlamada } from "@/components/CallProvider";

const MI_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "";
const CADA_MS = 45 * 60 * 1000;
const MIN_ENTRE_MS = 30 * 1000;          // no preguntar más de una vez cada 30 s
const POSPONER_MS = 4 * 60 * 60 * 1000;  // "Más tarde" = 4 horas
const CLAVE_POSPUESTO = "dorismon_version_pospuesta";

export default function AvisoVersion() {
  const { enLlamada } = useLlamada();
  const [nueva, setNueva] = useState(false);
  const [pospuesto, setPospuesto] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const ultima = useRef(0);

  const comprobar = useCallback(async () => {
    if (!MI_VERSION || document.visibilityState !== "visible") return;
    const ahora = Date.now();
    if (ahora - ultima.current < MIN_ENTRE_MS) return;
    ultima.current = ahora;
    try {
      const r = await fetch("/version", { cache: "no-store" });
      if (!r.ok) return;
      const { version } = await r.json();
      if (version && version !== MI_VERSION) {
        setNueva(true);
        try {
          const hasta = Number(sessionStorage.getItem(CLAVE_POSPUESTO) || 0);
          setPospuesto(Date.now() < hasta);
        } catch { setPospuesto(false); }
      }
    } catch { /* sin conexión: se vuelve a intentar más tarde */ }
  }, []);

  useEffect(() => {
    const alVolver = () => { if (document.visibilityState === "visible") comprobar(); };
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", alVolver);
    const t = setInterval(comprobar, CADA_MS);
    return () => {
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("focus", alVolver);
      clearInterval(t);
    };
  }, [comprobar]);

  // Si empieza una clase con la confirmación abierta, se cierra.
  useEffect(() => { if (enLlamada) setConfirmar(false); }, [enLlamada]);

  if (!nueva || pospuesto) return null;

  const masTarde = () => {
    try { sessionStorage.setItem(CLAVE_POSPUESTO, String(Date.now() + POSPONER_MS)); } catch { /* modo privado */ }
    setPospuesto(true);
    setConfirmar(false);
  };

  const actualizar = () => {
    if (enLlamada) return;  // doble seguro: nunca durante Video Dorismon
    window.location.reload();
  };

  return (
    <div
      className="fixed z-[80] left-4 right-4 bottom-20 lg:bottom-4 lg:right-auto lg:max-w-sm"
      role="status"
      aria-live="polite"
      data-aviso-version=""
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 text-sm">
        {enLlamada ? (
          <p className="text-slate-700 flex items-start gap-2">
            <RefreshCw className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
            Hay una actualización disponible. Podrás aplicarla al finalizar tu clase.
          </p>
        ) : confirmar ? (
          <>
            <p className="font-bold text-slate-900">Guarda lo que estés haciendo antes de actualizar.</p>
            <p className="text-slate-500 text-xs mt-1">La página se volverá a cargar con la versión nueva.</p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setConfirmar(false)} className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">
                Cancelar
              </button>
              <button onClick={actualizar} className="flex-1 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold">
                Actualizar
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start gap-2">
              <RefreshCw className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
              <p className="font-bold text-slate-900 flex-1">Hay una nueva versión de Dorismon disponible.</p>
              <button onClick={masTarde} aria-label="Cerrar" className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={masTarde} className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">
                Más tarde
              </button>
              <button onClick={() => setConfirmar(true)} className="flex-1 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold">
                Actualizar ahora
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
