"use client";

import { useEffect, useState } from "react";
import { api, safeArray } from "@/lib/api";
import { ErrorBox, LoadingScreen } from "@/components/ui";
import { AlertTriangle, BookOpenCheck, MessageCircle, Users } from "lucide-react";

export default function AcademicOverviewPage() {
  const [risk, setRisk] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    Promise.all([
      api("/admin/at-risk-overview", { auth: true }),
      api("/admin/academic-overview", { auth: true }),
    ])
      .then(([r, o]) => { setRisk(r); setOverview(o); })
      .catch((e: any) => setErr(e.message || "No se pudo cargar el seguimiento académico"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  const items = safeArray(risk?.items);
  const teachers = safeArray(overview?.teachers_pending);
  const assignments = overview?.assignments || {};

  const escribir = (s: any) => {
    const tel = (s.phone || "").replace(/\D/g, "");
    if (!tel) return;
    const numero = tel.length === 10 ? "1" + tel : tel;
    const nombre = (s.name || "").split(" ")[0];
    const msg = `Hola ${nombre}, te escribimos de Dorismon Language Institute. Queremos saber cómo vas y si necesitas apoyo con algo. ¡Estamos para ayudarte! 📚`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-800">Seguimiento académico</h1>
        <p className="text-sm text-slate-500 mt-1">
          Riesgo por matrícula y trabajo académico pendiente, sin mezclar cursos del mismo estudiante.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-100 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-rose-500 mb-2" />
          <p className="text-2xl font-black text-slate-800">{risk?.count || 0}</p>
          <p className="text-xs font-semibold text-slate-600">Matrículas en riesgo</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4">
          <BookOpenCheck className="w-5 h-5 text-sky-500 mb-2" />
          <p className="text-2xl font-black text-slate-800">{assignments.submitted || 0}</p>
          <p className="text-xs font-semibold text-slate-600">Entregas del período</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4">
          <BookOpenCheck className="w-5 h-5 text-amber-500 mb-2" />
          <p className="text-2xl font-black text-slate-800">{assignments.pending_grading || 0}</p>
          <p className="text-xs font-semibold text-slate-600">Pendientes de calificar</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4">
          <Users className="w-5 h-5 text-violet-500 mb-2" />
          <p className="text-2xl font-black text-slate-800">{teachers.length}</p>
          <p className="text-xs font-semibold text-slate-600">Profesores con pendientes</p>
        </div>
      </div>

      <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-sm">Estudiantes que necesitan atención</h2>
          <p className="text-xs text-slate-500 mt-0.5">Cada fila representa una matrícula específica.</p>
        </div>
        {items.length === 0 ? (
          <div className="p-8 text-center text-sm text-emerald-700">No hay matrículas en riesgo actualmente.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {items.map((s: any) => (
              <div key={s.enrollment_id || s.student_id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-800">{s.name}</p>
                      {s.course_name && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">{s.course_name}</span>}
                      {s.level_code && <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-bold">{s.level_code}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {safeArray(s.señales).map((sig: any, i: number) => (
                        <span key={i} className="text-[10px] bg-amber-50 text-amber-800 px-2 py-1 rounded-full">{sig.texto}</span>
                      ))}
                    </div>
                  </div>
                  {s.phone && (
                    <button
                      onClick={() => escribir(s)}
                      aria-label={`Escribir a ${s.name} por WhatsApp`}
                      className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {teachers.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-sm">Calificaciones pendientes por profesor</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {teachers.map((t: any) => (
              <div key={t.teacher_id} className="px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-700">{t.teacher_name}</span>
                <span className="text-sm font-black text-amber-600">{t.pending_grading}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
