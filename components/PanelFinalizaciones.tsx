"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { GraduationCap, AlertTriangle } from "lucide-react";
import ExpedienteAcademico from "@/components/ExpedienteAcademico";

/**
 * V3.9.53 P3 — Bloque del panel del profesor.
 *
 * "3 estudiantes listos para revisión final" con acceso directo al
 * expediente. Sin esto, el profesor no se entera de que alguien terminó.
 */
export default function PanelFinalizaciones() {
  const [data, setData] = useState<any>(null);
  const [abierto, setAbierto] = useState<string | null>(null);

  const cargar = () => {
    api("/teacher/completion-queue", { auth: true })
      .then(setData)
      .catch(() => setData(null));
  };

  useEffect(() => { cargar(); }, []);

  if (!data) return null;
  const listos = data.ready_for_review || [];
  const refuerzo = data.needs_reinforcement || [];
  if (!listos.length && !refuerzo.length) return null;

  return (
    <>
      {abierto && (
        <ExpedienteAcademico
          enrollmentId={abierto}
          onClose={() => { setAbierto(null); cargar(); }}
        />
      )}

      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 mb-5">
        <div className="flex items-start gap-3 mb-3">
          <GraduationCap className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-bold text-emerald-900 text-sm">
              {listos.length === 1
                ? "1 estudiante listo para revisión final"
                : `${listos.length} estudiantes listos para revisión final`}
              {refuerzo.length > 0 && ` · ${refuerzo.length} necesita refuerzo`}
            </p>
            <p className="text-xs text-emerald-800">
              Revisa su expediente y decide si recomiendas la promoción.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          {[...listos, ...refuerzo].slice(0, 6).map((x: any) => (
            <button
              key={x.enrollment_id}
              onClick={() => setAbierto(x.enrollment_id)}
              className="w-full bg-white rounded-lg px-3 py-2 flex items-center gap-2 flex-wrap text-left hover:bg-slate-50 transition"
            >
              <span className="text-sm font-semibold text-slate-800 flex-1 min-w-[110px]">
                {x.student_name}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                {x.level_code}
              </span>
              {x.eligible ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Cumple todo
                </span>
              ) : (
                <span className="text-[10px] text-amber-700 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {x.met_count}/{x.total_count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
