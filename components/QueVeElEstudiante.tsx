"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Eye, AlertTriangle, Users, User, Layers, Loader2 } from "lucide-react";

/**
 * V3.9.35 — "¿Qué clases ve este estudiante y por qué?"
 *
 * PARA QUÉ SIRVE: cuando un estudiante ve una clase que no le toca (o no ve
 * ninguna), aquí se ve el motivo sin adivinar. Dice si está filtrando por
 * grupo, por profesor o por nivel, y qué clases le van a aparecer.
 */

const ICONOS: Record<string, any> = { grupo: Users, profesor: User, nivel: Layers };

const TONOS: Record<string, string> = {
  grupo: "bg-emerald-50 border-emerald-200 text-emerald-900",
  profesor: "bg-sky-50 border-sky-200 text-sky-900",
  nivel: "bg-amber-50 border-amber-200 text-amber-900",
};

export default function QueVeElEstudiante({ studentId }: { studentId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [data, setData] = useState<any>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!abierto || data) return;
    setCargando(true);
    api(`/admin/students/${studentId}/what-they-see`, { auth: true })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setCargando(false));
  }, [abierto, data, studentId]);

  return (
    <div className="mt-3">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
      >
        <Eye className="w-3.5 h-3.5" />
        {abierto ? "Ocultar" : "¿Qué clases ve este estudiante?"}
      </button>

      {abierto && (
        <div className="mt-2">
          {cargando && (
            <p className="text-xs text-slate-400 flex items-center gap-1.5 py-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Revisando...
            </p>
          )}

          {data && (data.enrollments || []).length === 0 && (
            <p className="text-xs text-slate-500 py-2">
              No tiene inscripciones activas.
            </p>
          )}

          {data && (data.enrollments || []).map((e: any) => {
            const Icono = ICONOS[e.criterio] || Layers;
            const tono = TONOS[e.criterio] || TONOS.nivel;
            return (
              <div key={e.enrollment_id} className={`border rounded-xl p-3 mb-2 ${tono}`}>
                <div className="flex items-start gap-2 mb-2">
                  {e.criterio === "nivel"
                    ? <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    : <Icono className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                  <div className="min-w-0">
                    <p className="text-xs font-bold">
                      {e.course_name} · {e.level_code}
                      {e.group_name && ` · grupo ${e.group_name}`}
                      {!e.group_name && e.teacher_name && ` · ${e.teacher_name}`}
                    </p>
                    <p className="text-[11px] leading-relaxed mt-0.5 opacity-90">
                      {e.explicacion}
                    </p>
                  </div>
                </div>

                {e.upcoming_count === 0 ? (
                  <p className="text-[11px] bg-white/60 rounded-lg px-2.5 py-2">
                    No verá ninguna clase próxima
                    {e.criterio === "profesor" && " (su profesor no tiene clases proyectadas)"}.
                  </p>
                ) : (
                  <div className="bg-white/60 rounded-lg px-2.5 py-2 space-y-1">
                    <p className="text-[10px] font-semibold opacity-70">
                      Verá estas {e.upcoming_count}:
                    </p>
                    {e.upcoming.map((c: any) => (
                      <p key={c.id} className="text-[11px]">
                        · {c.title}
                        {c.teacher_name && <span className="opacity-70"> — {c.teacher_name}</span>}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {data && (data.private_classes || []).length > 0 && (
            <div className="border border-violet-200 bg-violet-50 rounded-xl p-3">
              <p className="text-xs font-bold text-violet-900 mb-1">
                Además, sus clases privadas ({data.private_classes.length})
              </p>
              <p className="text-[11px] text-violet-800">
                Estas las ve siempre, sin importar el grupo o el profesor.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
