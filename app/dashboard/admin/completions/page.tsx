"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, showToast } from "@/components/ui";
import { GraduationCap, Check, AlertTriangle, RotateCcw, ArrowRight } from "lucide-react";

/**
 * V3.9.53 P3 — Finalizaciones de nivel.
 *
 * Aquí Dirección aprueba oficialmente. Es el ÚNICO lugar donde un nivel pasa
 * a completado: ni el cálculo del sistema ni la recomendación del profesor lo
 * hacen por su cuenta.
 */
export default function FinalizacionesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      setData(await api("/admin/completion-queue", { auth: true }));
      setErr("");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const aprobar = async (x: any) => {
    const faltan = (x.requirements || []).filter((r: any) => !r.met);
    let body: any = {};

    if (faltan.length) {
      const lista = faltan.map((r: any) => r.label).join(", ");
      const motivo = prompt(
        `${x.student_name} todavía no cumple: ${lista}.\n\n` +
        `Puedes aprobarlo por excepción. ¿Por qué?`
      );
      if (!motivo?.trim()) return;
      body = { approve_exception: true, exception_reason: motivo.trim() };
    } else if (!confirm(`¿Aprobar la finalización de ${x.level_code} para ${x.student_name}?`)) {
      return;
    }

    setOcupado(x.enrollment_id);
    try {
      const r: any = await api(
        `/admin/enrollments/${x.enrollment_id}/approve-completion`,
        { method: "POST", auth: true, body });
      showToast("success", r.mensaje || "Nivel completado");
      await cargar();
    } catch (e: any) {
      showToast("error", e?.detail?.mensaje || e.message);
    } finally {
      setOcupado(null);
    }
  };

  const devolver = async (x: any, estado: string) => {
    const motivo = prompt(
      estado === "requires_reinforcement"
        ? "¿Qué debe reforzar?"
        : "¿Qué hay que reevaluar?");
    if (!motivo?.trim()) return;
    setOcupado(x.enrollment_id);
    try {
      await api(`/admin/enrollments/${x.enrollment_id}/return-to-teacher`, {
        method: "POST", auth: true,
        body: { status: estado, reason: motivo.trim() },
      });
      showToast("success", "Devuelto al profesor");
      await cargar();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setOcupado(null);
    }
  };

  const siguienteNivel = async (x: any) => {
    if (!confirm(`¿Crear la matrícula del siguiente nivel para ${x.student_name}?\n\n` +
                 `Su ${x.level_code} queda intacto en su historial.`)) return;
    setOcupado(x.enrollment_id);
    try {
      const r: any = await api(`/admin/enrollments/${x.enrollment_id}/next-level`, {
        method: "POST", auth: true, body: {},
      });
      showToast("success", r.mensaje || "Matrícula creada");
      await cargar();
    } catch (e: any) {
      showToast("error", e?.detail?.mensaje || e.message);
    } finally {
      setOcupado(null);
    }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  const items = data?.items || [];

  return (
    <div>
      <PageHeader
        title="Finalizaciones de nivel"
        subtitle="Estudiantes que el profesor recomendó para terminar su nivel."
      />

      {items.length === 0 ? (
        <Card><CardBody>
          <p className="text-sm text-slate-500 text-center py-10">
            No hay nadie esperando aprobación.
          </p>
        </CardBody></Card>
      ) : (
        <div className="space-y-3">
          {items.map((x: any) => {
            const faltan = (x.requirements || []).filter((r: any) => !r.met);
            const m = x.metrics || {};
            return (
              <Card key={x.enrollment_id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-bold text-slate-800">{x.student_name}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                          {x.level_code}
                        </span>
                        {x.eligible ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            Cumple todo
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            Le faltan {faltan.length}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{x.course_name}</p>
                    </div>
                    <button
                      onClick={() => setAbierto(abierto === x.enrollment_id ? null : x.enrollment_id)}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                    >
                      {abierto === x.enrollment_id ? "Ocultar detalle" : "Ver detalle"}
                    </button>
                  </div>

                  {/* Los números que importan */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    {[
                      { l: "Asistencia", v: m.attendance_pct, u: "%" },
                      { l: "Tareas", v: m.assignments_pct, u: "%" },
                      { l: "Quizzes", v: m.quiz_average, u: "" },
                      { l: "Habilidades", v: Object.keys(m.skills || {}).length, u: "/4" },
                    ].map((k) => (
                      <div key={k.l} className="bg-slate-50 rounded-lg px-2.5 py-2">
                        <p className="text-[10px] text-slate-500">{k.l}</p>
                        <p className="text-sm font-bold text-slate-800">
                          {k.v ?? "—"}{k.v != null ? k.u : ""}
                        </p>
                      </div>
                    ))}
                  </div>

                  {x.recommendation_comment && (
                    <div className="bg-sky-50 border border-sky-100 rounded-lg px-3 py-2 mb-3">
                      <p className="text-[11px] font-bold text-sky-900">
                        {x.teacher_name}: {x.recommendation === "recommend_promotion"
                          ? "recomienda promoción" : x.recommendation}
                      </p>
                      <p className="text-xs text-sky-800 italic">
                        &ldquo;{x.recommendation_comment}&rdquo;
                      </p>
                    </div>
                  )}

                  {abierto === x.enrollment_id && (
                    <div className="border-t border-slate-100 pt-3 mb-3 space-y-1.5">
                      {(x.requirements || []).map((r: any) => (
                        <div key={r.key} className="flex items-center gap-2 text-sm">
                          {r.met
                            ? <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            : <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                          <span className="flex-1 text-slate-700">{r.label}</span>
                          <span className="text-xs text-slate-500">
                            {r.no_data ? "sin datos"
                              : `${r.actual} de ${r.required}`}
                          </span>
                        </div>
                      ))}
                      {Object.keys(m.skills || {}).length > 0 && (
                        <p className="text-[11px] text-slate-500 pt-2">
                          {Object.entries(m.skills).map(([k, v]: any) =>
                            `${k}: ${v.score}`).join(" · ")}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => aprobar(x)}
                      disabled={ocupado === x.enrollment_id}
                      className={`inline-flex items-center gap-1.5 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition disabled:opacity-50 ${
                        x.eligible ? "bg-emerald-600 hover:bg-emerald-700"
                                   : "bg-amber-600 hover:bg-amber-700"}`}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      {x.eligible ? "Aprobar nivel" : "Aprobar por excepción"}
                    </button>
                    <button
                      onClick={() => devolver(x, "requires_reinforcement")}
                      disabled={ocupado === x.enrollment_id}
                      className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-2.5 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Devolver al profesor
                    </button>
                    {x.academic_status === "completed" && (
                      <button
                        onClick={() => siguienteNivel(x)}
                        disabled={ocupado === x.enrollment_id}
                        className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition disabled:opacity-50"
                      >
                        Siguiente nivel
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
