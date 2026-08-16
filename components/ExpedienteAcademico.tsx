"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { showToast } from "@/components/ui";
import { Check, X, AlertTriangle, GraduationCap, Star } from "lucide-react";

/**
 * V3.9.53 P3 — Expediente académico visto por el profesor.
 *
 * Evaluar habilidades y recomendar si el estudiante puede terminar el nivel.
 * El profesor RECOMIENDA; Dirección APRUEBA.
 */

const HABILIDADES = [
  { key: "speaking", label: "Speaking (hablar)" },
  { key: "listening", label: "Listening (escuchar)" },
  { key: "reading", label: "Reading (leer)" },
  { key: "writing", label: "Writing (escribir)" },
];

export default function ExpedienteAcademico({
  enrollmentId, onClose,
}: { enrollmentId: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState(false);
  const [comentario, setComentario] = useState("");

  const cargar = async () => {
    try {
      const r: any = await api(`/teacher/enrollments/${enrollmentId}/eligibility`,
                               { auth: true });
      setData(r);
      const n: Record<string, string> = {};
      Object.entries(r?.metrics?.skills || {}).forEach(([k, v]: any) => {
        n[k] = String(v.score);
      });
      setNotas(n);
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [enrollmentId]);

  const guardarNota = async (skill: string) => {
    const v = Number(notas[skill]);
    if (!(v >= 0 && v <= 100)) {
      showToast("error", "La nota va de 0 a 100");
      return;
    }
    setOcupado(true);
    try {
      await api(`/teacher/enrollments/${enrollmentId}/skills`, {
        method: "POST", auth: true, body: { skill, score: v },
      });
      showToast("success", "✅ Evaluación guardada");
      await cargar();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setOcupado(false);
    }
  };

  const recomendar = async (tipo: string) => {
    if (!comentario.trim()) {
      showToast("error", "Escribe un comentario explicando tu recomendación");
      return;
    }
    const textos: Record<string, string> = {
      recommend_promotion: "¿Recomendar que complete el nivel? Dirección lo revisará.",
      requires_reinforcement: "¿Marcar que necesita refuerzo?",
      requires_reevaluation: "¿Marcar que hay que reevaluarlo?",
    };
    if (!confirm(textos[tipo])) return;
    setOcupado(true);
    try {
      const r: any = await api(`/teacher/enrollments/${enrollmentId}/recommend`, {
        method: "POST", auth: true,
        body: { recommendation: tipo, comment: comentario.trim() },
      });
      showToast("success", r.mensaje || "Recomendación registrada");
      setComentario("");
      await cargar();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
         onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto"
           onClick={(e) => e.stopPropagation()}>

        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800">
              {data?.student?.name || "Expediente"}
            </h3>
            <p className="text-xs text-slate-500">
              {data?.course_name} · {data?.level_code} {data?.level_name}
              {data?.academic_status_label && ` · ${data.academic_status_label}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600"
                  aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {cargando ? (
            <p className="text-sm text-slate-400 py-8 text-center">Cargando...</p>
          ) : (
            <>
              {/* Veredicto */}
              <div className={`rounded-2xl p-4 mb-5 border-2 ${
                data?.eligible
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-amber-50 border-amber-200"}`}>
                <div className="flex items-start gap-2.5">
                  {data?.eligible
                    ? <GraduationCap className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    : <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />}
                  <div>
                    <p className={`font-bold text-sm ${
                      data?.eligible ? "text-emerald-900" : "text-amber-900"}`}>
                      {data?.eligible
                        ? "Cumple los requisitos del nivel"
                        : `Le faltan ${data?.pending?.length || 0} requisito(s)`}
                    </p>
                    <p className={`text-xs leading-relaxed ${
                      data?.eligible ? "text-emerald-800" : "text-amber-800"}`}>
                      {data?.eligible
                        ? "Puedes recomendarlo para revisión de Dirección."
                        : (data?.pending || []).join(" · ")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Requisito por requisito */}
              <h4 className="text-sm font-bold text-slate-700 mb-2">Requisitos</h4>
              <div className="space-y-1.5 mb-5">
                {(data?.requirements || []).map((r: any) => (
                  <div key={r.key}
                       className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-100">
                    {r.met
                      ? <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      : <X className="w-4 h-4 text-rose-400 flex-shrink-0" />}
                    <span className="text-sm text-slate-800 flex-1">{r.label}</span>
                    <span className="text-xs text-slate-500">
                      {r.no_data
                        ? "sin datos"
                        : `${r.actual}${r.unit === "%" ? "%" : " " + r.unit} de ${r.required}${r.unit === "%" ? "%" : ""}`}
                    </span>
                    {r.met_by_exception && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                        excepción
                      </span>
                    )}
                    {!r.met && r.missing != null && (
                      <span className="text-[10px] text-rose-600 font-semibold">
                        faltan {r.missing}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Habilidades */}
              <h4 className="text-sm font-bold text-slate-700 mb-1">
                Habilidades <span className="font-normal text-slate-400">(0 a 100)</span>
              </h4>
              <p className="text-[11px] text-slate-500 mb-2">
                Cada evaluación se guarda con su fecha. No se pierde la anterior.
              </p>
              <div className="space-y-2 mb-5">
                {HABILIDADES.map((h) => {
                  const actual = data?.metrics?.skills?.[h.key];
                  return (
                    <div key={h.key} className="flex items-center gap-2 flex-wrap">
                      <Star className={`w-4 h-4 flex-shrink-0 ${
                        actual ? "text-amber-400" : "text-slate-300"}`} />
                      <span className="text-sm text-slate-700 flex-1 min-w-[130px]">
                        {h.label}
                      </span>
                      <input
                        type="number" min={0} max={100}
                        value={notas[h.key] ?? ""}
                        onChange={(e) => setNotas({ ...notas, [h.key]: e.target.value })}
                        placeholder="—"
                        className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center"
                      />
                      <button
                        onClick={() => guardarNota(h.key)}
                        disabled={ocupado || !notas[h.key]}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-40 px-2 py-1"
                      >
                        Guardar
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Recomendación */}
              {data?.academic_status !== "completed" && (
                <>
                  <h4 className="text-sm font-bold text-slate-700 mb-2">
                    Tu recomendación
                  </h4>
                  <textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    rows={3}
                    placeholder="Ej: Cumplió los objetivos del nivel y está listo para avanzar."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2"
                  />
                  <p className="text-[11px] text-slate-500 mb-3">
                    Tu recomendación no completa el nivel: Dirección lo aprueba.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => recomendar("recommend_promotion")}
                      disabled={ocupado || !comentario.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition"
                    >
                      🎓 Recomendar promoción
                    </button>
                    <button
                      onClick={() => recomendar("requires_reinforcement")}
                      disabled={ocupado || !comentario.trim()}
                      className="border border-amber-300 text-amber-700 hover:bg-amber-50 text-xs font-bold px-4 py-2.5 rounded-lg transition disabled:opacity-50"
                    >
                      Necesita refuerzo
                    </button>
                    <button
                      onClick={() => recomendar("requires_reevaluation")}
                      disabled={ocupado || !comentario.trim()}
                      className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold px-4 py-2.5 rounded-lg transition disabled:opacity-50"
                    >
                      Reevaluar
                    </button>
                  </div>
                </>
              )}

              {(data?.reviews || []).length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 mb-2">
                    Recomendaciones anteriores
                  </h4>
                  {(data.reviews || []).slice(0, 3).map((r: any, i: number) => (
                    <p key={i} className="text-[11px] text-slate-500 mb-1">
                      · {r.recommendation === "recommend_promotion" ? "Promoción" :
                         r.recommendation === "requires_reinforcement" ? "Refuerzo" : "Reevaluar"}
                      {r.comment && ` — ${r.comment}`}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
