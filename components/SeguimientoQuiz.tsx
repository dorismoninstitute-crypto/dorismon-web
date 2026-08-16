"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { showToast } from "@/components/ui";
import { Check, AlertTriangle, Clock, X, PlusCircle } from "lucide-react";

/**
 * V3.9.49 P2 — "¿Quién hizo el quiz y cómo le fue?"
 *
 * Antes solo se contaban los intentos: no había forma de saber quién no lo
 * había hecho, ni quién agotó los intentos sin aprobar — que es justamente
 * quien necesita refuerzo.
 */

// V3.9.50 — Estados propios del quiz. Un quiz no se "califica": se aprueba
// o no. Cada etiqueta corresponde a un hecho real del backend.
const ESTADOS: Record<string, { label: string; cls: string; Icono: any }> = {
  passed: { label: "Aprobado", cls: "bg-emerald-100 text-emerald-700", Icono: Check },
  needs_review: { label: "Necesita refuerzo", cls: "bg-rose-100 text-rose-700", Icono: AlertTriangle },
  retry: { label: "No aprobó — le quedan intentos", cls: "bg-amber-100 text-amber-700", Icono: Clock },
  started: { label: "Empezado, sin enviar", cls: "bg-sky-100 text-sky-700", Icono: Clock },
  assigned: { label: "No lo ha intentado", cls: "bg-slate-100 text-slate-500", Icono: Clock },
};

export default function SeguimientoQuiz({
  quizId, onClose, puedeConceder = false,
}: { quizId: number | string; onClose: () => void; puedeConceder?: boolean }) {
  const [data, setData] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);

  const cargar = async () => {
    try {
      setData(await api(`/teacher/quizzes/${quizId}/tracking`, { auth: true }));
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [quizId]);

  const conceder = async (studentId: string, nombre: string) => {
    const motivo = prompt(`¿Por qué le das otro intento a ${nombre}?`);
    if (!motivo?.trim()) return;
    setOcupado(true);
    try {
      await api(`/admin/quizzes/${quizId}/grant-attempt`, {
        method: "POST", auth: true,
        body: { student_id: studentId, extra_attempts: 1, reason: motivo.trim() },
      });
      showToast("success", `✅ ${nombre} tiene un intento más`);
      await cargar();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setOcupado(false);
    }
  };

  const r = data?.resumen || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
         onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto"
           onClick={(e) => e.stopPropagation()}>

        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800">{data?.quiz?.title || "Seguimiento"}</h3>
            <p className="text-xs text-slate-500">
              {data?.quiz
                ? `${data.quiz.max_attempts} intentos · aprueba con ${data.quiz.passing_score}`
                : "¿Quién lo hizo y cómo le fue?"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600" aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {cargando ? (
            <p className="text-sm text-slate-400 py-8 text-center">Cargando...</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
                {[
                  { l: "Estudiantes", v: r.total, cls: "text-slate-800" },
                  { l: "Sin intentar", v: r.sin_intentar, cls: r.sin_intentar ? "text-amber-600" : "text-slate-400" },
                  { l: "Empezados", v: r.empezados_sin_enviar, cls: r.empezados_sin_enviar ? "text-sky-600" : "text-slate-400" },
                  { l: "Aprobados", v: r.aprobados, cls: "text-emerald-600" },
                  { l: "Necesitan refuerzo", v: r.necesitan_refuerzo, cls: r.necesitan_refuerzo ? "text-rose-600" : "text-slate-400" },
                ].map((x) => (
                  <div key={x.l} className="bg-slate-50 rounded-xl px-3 py-2.5">
                    <p className="text-[11px] text-slate-500">{x.l}</p>
                    <p className={`text-xl font-bold ${x.cls}`}>{x.v ?? 0}</p>
                  </div>
                ))}
              </div>

              {r.promedio != null && (
                <p className="text-xs text-slate-500 mb-4">
                  Promedio de los que lo hicieron: <strong>{r.promedio}</strong>
                </p>
              )}

              <div className="space-y-1.5">
                {(data?.items || []).map((x: any) => {
                  const e = ESTADOS[x.estado] || ESTADOS.assigned;
                  return (
                    <div key={x.student_id}
                         className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-100 flex-wrap">
                      <e.Icono className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-[120px]">
                        <p className="text-sm font-semibold text-slate-800">{x.name}</p>
                        <p className="text-xs text-slate-500">
                          {x.attempts_used} de {x.attempts_allowed} intentos
                          {x.extra_granted > 0 && ` (+${x.extra_granted} extra)`}
                          {x.best_score != null && ` · mejor nota: ${x.best_score}`}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${e.cls}`}>
                        {e.label}
                      </span>
                      {puedeConceder && x.estado === "needs_review" && (
                        <button
                          onClick={() => conceder(x.student_id, x.name)}
                          disabled={ocupado}
                          title="Darle un intento más"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-700 px-2 py-1"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Otro intento
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {(data?.items || []).length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">
                  Este quiz no tiene estudiantes asignados.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
