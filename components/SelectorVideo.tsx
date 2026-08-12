"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/**
 * V3.9.32 — Elegir dónde ocurre el video de una clase.
 *
 * ANTES este selector estaba SOLO en el formulario de clase suelta. Al
 * programar una serie, una privada o un evento solo pedía el link de Zoom o
 * Meet, así que no se podía usar el video propio en el caso más común:
 * programarle el horario a un estudiante nuevo.
 *
 * Ahora es un componente único que se usa en los cinco formularios.
 */
export default function SelectorVideo({
  value, onChange, compacto = false,
}: {
  value: string;
  onChange: (v: string) => void;
  compacto?: boolean;
}) {
  const [disponible, setDisponible] = useState(false);

  useEffect(() => {
    api("/video/status", { auth: true })
      .then((r: any) => setDisponible(!!r?.ready))
      .catch(() => setDisponible(false));
  }, []);

  const propio = value === "dorismon";

  return (
    <div className={compacto ? "" : "mb-3"}>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        ¿Dónde será el video?
      </label>
      <div className="grid sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange("dorismon")}
          disabled={!disponible}
          className={`text-left p-3 rounded-xl border-2 transition disabled:opacity-50 ${
            propio ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <p className="font-bold text-sm text-slate-800">🎥 Video de Dorismon</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {disponible
              ? "Dentro de la plataforma, con tu marca. No instalan nada."
              : "Falta configurar LiveKit en Render"}
          </p>
        </button>
        <button
          type="button"
          onClick={() => onChange("meet")}
          className={`text-left p-3 rounded-xl border-2 transition ${
            !propio ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <p className="font-bold text-sm text-slate-800">🔗 Enlace externo</p>
          <p className="text-xs text-slate-500 mt-0.5">Google Meet, Zoom o Teams.</p>
        </button>
      </div>
      {propio && (
        <p className="text-xs text-slate-500 bg-amber-50 border border-amber-100 rounded-lg p-2.5 mt-2">
          💡 Deja también un enlace de respaldo: si el video falla en vivo,
          cambias en segundos y la clase sigue.
        </p>
      )}
    </div>
  );
}
