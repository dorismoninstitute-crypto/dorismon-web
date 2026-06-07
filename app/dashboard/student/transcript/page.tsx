"use client";
import { useEffect, useState } from "react";
import { studentApi, safeObj, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, StatCard, Badge } from "@/components/ui";

export default function TranscriptPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    studentApi.transcript()
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;
  const d = safeObj(data, {}) as any;
  const s = safeObj(d.student, {}) as any;
  const stats = safeObj(d.stats, {}) as any;

  return (
    <>
      <PageHeader title="Mi expediente académico" subtitle="Tu historial completo en Dorismon" />

      {/* Datos personales */}
      <Card className="mb-5">
        <CardBody>
          <h3 className="font-bold mb-4">👤 Datos personales</h3>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Field label="Nombre" value={s.full_name} />
            <Field label="Email" value={s.email} />
            <Field label="Teléfono" value={s.phone} />
            <Field label="Inscrito desde" value={s.enrolled_at && new Date(s.enrolled_at).toLocaleDateString("es")} />
          </div>
        </CardBody>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard label="Asistencia" value={`${stats.attendance_rate || 0}%`} icon="✅" color="success" />
        <StatCard label="Promedio" value={stats.avg_grade ? `${stats.avg_grade}%` : "—"} icon="📊" color="brand" />
        <StatCard label="Tareas" value={stats.total_assignments} icon="📝" color="warning" />
        <StatCard label="Certificados" value={stats.total_certificates} icon="🎓" color="accent" />
      </div>

      {/* Niveles por destreza */}
      <Card className="mb-5">
        <CardBody>
          <h3 className="font-bold mb-4">🎯 Diagnóstico por destreza</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ["Speaking", s.speaking_score, "🗣"],
              ["Listening", s.listening_score, "👂"],
              ["Reading", s.reading_score, "📖"],
              ["Writing", s.writing_score, "✍️"],
            ].map(([name, score, icon]: any) => (
              <div key={name} className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl mb-1">{icon}</div>
                <p className="text-xs font-semibold text-slate-500">{name}</p>
                <p className="text-xl font-bold text-brand-600">{score ? `${score}%` : "—"}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Inscripciones */}
      <Card className="mb-5">
        <CardBody>
          <h3 className="font-bold mb-4">📚 Cursos cursados</h3>
          {safeArray(d.enrollments).length === 0 ? <EmptyState icon="📚" title="Sin cursos" /> : (
            <div className="space-y-2">
              {safeArray(d.enrollments).map((e: any, i: number) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{e.course_name}</p>
                    <p className="text-xs text-slate-500">Nivel {e.level_code} — {e.level_name}</p>
                  </div>
                  {e.is_active ? <Badge variant="success">En curso</Badge> :
                   e.completed_at ? <Badge variant="brand">Completado</Badge> :
                   <Badge>Inactivo</Badge>}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Calificaciones recientes */}
      <Card>
        <CardBody>
          <h3 className="font-bold mb-4">📊 Calificaciones recientes</h3>
          {safeArray(d.recent_grades).length === 0 ? <p className="text-sm text-slate-500">Sin calificaciones todavía</p> : (
            <div className="space-y-2">
              {safeArray(d.recent_grades).map((g: any, i: number) => {
                const pct = g.max_score ? Math.round(g.score * 100 / g.max_score) : 0;
                return (
                  <div key={i} className="flex items-center justify-between p-2 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="text-sm font-semibold">{g.title}</p>
                      {g.graded_at && <p className="text-xs text-slate-400">{new Date(g.graded_at).toLocaleDateString("es")}</p>}
                    </div>
                    <p className={`text-lg font-bold ${pct >= 70 ? "text-emerald-600" : "text-orange-600"}`}>{pct}%</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
}

function Field({ label, value }: any) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="font-semibold text-sm">{value || "—"}</p>
    </div>
  );
}
