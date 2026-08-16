"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { showToast } from "@/components/ui";
import { Bell, Check, Clock, Eye, FileEdit, AlertTriangle, X } from "lucide-react";

/**
 * V3.9.49 P2 — "¿Quién entregó y quién no?"
 *
 * Antes el profesor solo veía las entregas que existían: quien no entregaba
 * simplemente no aparecía, y no había forma de saber a quién le faltaba.
 *
 * El recordatorio va por notificación DENTRO de la plataforma, no por
 * WhatsApp.
 */

const ESTADOS: Record<string, { label: string; cls: string; Icono: any }> = {
  graded: { label: "Calificada", cls: "bg-emerald-100 text-emerald-700", Icono: Check },
  submitted: { label: "Entregada — falta calificar", cls: "bg-sky-100 text-sky-700", Icono: FileEdit },
  overdue: { label: "Atrasada", cls: "bg-rose-100 text-rose-700", Icono: AlertTriangle },
  in_progress: { label: "Empezada", cls: "bg-amber-100 text-amber-700", Icono: Clock },
  viewed: { label: "La vio", cls: "bg-slate-100 text-slate-600", Icono: Eye },
  assigned: { label: "Sin abrir", cls: "bg-slate-100 text-slate-500", Icono: Clock },
};

export default function SeguimientoTarea({
  assignmentId, onClose,
}: { assignmentId: number | string; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);

  const cargar = async () => {
    try {
      const r = await api(`/teacher/assignments/${assignmentId}/tracking`, { auth: true });
      setData(r);
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [assignmentId]);

  const recordar = async (studentId?: string, nombre?: string) => {
    const texto = studentId
      ? `¿Recordarle la tarea a ${nombre}?`
      : "¿Recordarles a todos los que no han entregado?";
    if (!confirm(texto)) return;
    setOcupado(true);
    try {
      const r: any = await api(`/teacher/assignments/${assignmentId}/remind`, {
        method: "POST", auth: true,
        body: studentId ? { student_id: studentId } : {},
      });
      showToast("success", r.mensaje || "Recordatorio enviado");
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setOcupado(false);
    }
  };

  const r = data?.resumen || {};
  const pendientes = (data?.items || []).filter((x: any) =>
    ["assigned", "viewed", "in_progress", "overdue"].includes(x.estado)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
         onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto"
           onClick={(e) => e.stopPropagation()}>

        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800">{data?.assignment?.title || "Seguimiento"}</h3>
            <p className="text-xs text-slate-500">¿Quién entregó y quién no?</p>
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
              {/* Resumen */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                {[
                  { l: "Estudiantes", v: r.total, cls: "text-slate-800" },
                  { l: "Sin entregar", v: r.sin_entregar, cls: r.sin_entregar ? "text-rose-600" : "text-slate-400" },
                  { l: "Por calificar", v: r.pendientes_calificar, cls: r.pendientes_calificar ? "text-sky-600" : "text-slate-400" },
                  { l: "Promedio", v: r.promedio != null ? r.promedio : "—", cls: "text-slate-800" },
                ].map((x) => (
                  <div key={x.l} className="bg-slate-50 rounded-xl px-3 py-2.5">
                    <p className="text-[11px] text-slate-500">{x.l}</p>
                    <p className={`text-xl font-bold ${x.cls}`}>{x.v ?? 0}</p>
                  </div>
                ))}
              </div>

              {pendientes.length > 0 && (
                <button
                  onClick={() => recordar()}
                  disabled={ocupado}
                  className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition mb-4"
                >
                  <Bell className="w-3.5 h-3.5" />
                  Recordarles a los {pendientes.length} pendientes
                </button>
              )}

              {/* Lista */}
              <div className="space-y-1.5">
                {(data?.items || []).map((x: any) => {
                  const e = ESTADOS[x.estado] || ESTADOS.assigned;
                  const falta = ["assigned", "viewed", "in_progress", "overdue"].includes(x.estado);
                  return (
                    <div key={x.student_id}
                         className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-100 flex-wrap">
                      <e.Icono className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-[120px]">
                        <p className="text-sm font-semibold text-slate-800">{x.name}</p>
                        {x.score != null && (
                          <p className="text-xs text-slate-500">
                            Nota: {x.score} / {x.max_score}
                          </p>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${e.cls}`}>
                        {e.label}
                      </span>
                      {falta && (
                        <button
                          onClick={() => recordar(x.student_id, x.name)}
                          disabled={ocupado}
                          title="Recordarle por notificación"
                          className="text-slate-300 hover:text-amber-600 p-1.5 transition"
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {(data?.items || []).length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">
                  Esta tarea no tiene estudiantes asignados.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
