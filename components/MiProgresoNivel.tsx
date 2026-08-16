"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Check, AlertCircle, GraduationCap, Award } from "lucide-react";

/**
 * V3.9.53 P3 — "¿Qué me falta para terminar mi nivel?"
 *
 * No un porcentaje suelto. Requisito por requisito, con lo que se pide y lo
 * que lleva: "te faltan 12 puntos en quizzes" se entiende; "63%" no.
 */
export default function MiProgresoNivel() {
  const [data, setData] = useState<any>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    api("/student/my-progress", { auth: true })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setListo(true));
  }, []);

  if (!listo || !data) return null;

  const activas = data.active || [];
  const historial = data.history || [];
  if (!activas.length && !historial.length) return null;

  return (
    <div className="mb-6">
      {activas.map((m: any) => (
        <div key={m.enrollment_id}
             className="bg-white border-2 border-slate-100 rounded-2xl p-4 mb-3">
          <div className="flex items-start gap-2.5 mb-3">
            <GraduationCap className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              m.eligible ? "text-emerald-600" : "text-slate-400"}`} />
            <div className="min-w-0">
              <p className="font-bold text-slate-800 text-sm">
                {m.eligible
                  ? `¡Cumpliste los requisitos de ${m.level_code}!`
                  : `Tu camino en ${m.level_code}`}
              </p>
              <p className="text-xs text-slate-500">
                {m.course_name}
                {m.eligible
                  ? " · Tu profesor revisará tu caso"
                  : ` · ${m.met_count} de ${m.total_count} requisitos`}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            {(m.requirements || []).map((r: any) => (
              <div key={r.key} className="flex items-center gap-2.5 text-sm">
                {r.met
                  ? <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  : <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                <span className="flex-1 text-slate-700">{r.label}</span>
                <span className={`text-xs font-semibold ${
                  r.met ? "text-emerald-600" : "text-amber-600"}`}>
                  {r.no_data
                    ? "sin evaluar"
                    : `${r.actual}${r.unit === "%" ? "%" : " " + r.unit}`}
                </span>
                {!r.met && r.missing != null && (
                  <span className="text-[11px] text-slate-400">
                    faltan {r.missing}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Qué falta evaluar, dicho con nombre */}
          {(m.requirements || []).some((r: any) => r.missing_skills?.length) && (
            <p className="text-[11px] text-slate-500 mt-2.5 bg-slate-50 rounded-lg px-3 py-2">
              Tu profesor todavía debe evaluarte en:{" "}
              {(m.requirements.find((r: any) => r.missing_skills?.length)
                ?.missing_skills || []).join(", ")}
            </p>
          )}
        </div>
      ))}

      {historial.length > 0 && (
        <div className="bg-slate-50 rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-600 mb-2">
            Niveles que completaste
          </p>
          <div className="space-y-1.5">
            {historial.map((h: any) => (
              <div key={h.enrollment_id}
                   className="bg-white rounded-lg px-3 py-2 flex items-center gap-2 flex-wrap">
                <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="text-sm font-semibold text-slate-800">
                  {h.level_code}
                </span>
                <span className="text-xs text-slate-500 flex-1">
                  {h.course_name}
                  {h.final_score != null && ` · ${h.final_score}`}
                </span>
                {h.certificate_code && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    Certificado
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
