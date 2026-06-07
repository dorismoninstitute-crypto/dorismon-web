"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { teacherApi, safeArray, safeObj } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, StatCard } from "@/components/ui";

export default function TeacherDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    teacherApi.dashboard()
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;
  const d = safeObj(data, {}) as any;
  const u = safeObj(d.user, {}) as any;
  const stats = safeObj(d.stats, {}) as any;
  const today = safeArray(d.today_schedule);

  return (
    <>
      <PageHeader title={`Hola, ${u.full_name?.split(" ")[0] || "Profesor"} 👋`} subtitle="Tu agenda y pendientes de hoy" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Clases hoy" value={stats.today_classes} icon="📅" color="brand" />
        <StatCard label="Esta semana" value={stats.next_week_classes} icon="🗓" color="info" />
        <StatCard label="Por calificar" value={stats.pending_grading} icon="📝" color="warning" />
        <StatCard label="Estudiantes" value={stats.total_students} icon="👥" color="success" />
      </div>

      <Card>
        <CardBody>
          <h3 className="font-bold mb-4 flex items-center justify-between">
            <span>📅 Agenda de hoy</span>
            <Link href="/dashboard/teacher/sessions" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Ver todas →
            </Link>
          </h3>
          {today.length === 0 ? (
            <EmptyState icon="🌟" title="No tenés clases hoy" description="¡Disfrutá tu día libre!" />
          ) : (
            <div className="space-y-2">
              {today.map((c: any) => (
                <div key={c.id} className="p-3 bg-slate-50 rounded-lg flex items-center gap-3">
                  <div className="text-2xl">📚</div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{c.title}</p>
                    <p className="text-xs text-slate-500">
                      {c.starts_at_utc && new Date(c.starts_at_utc).toLocaleString("es", { hour: "2-digit", minute: "2-digit" })} · {c.modality}
                    </p>
                  </div>
                  <Link href={`/dashboard/teacher/sessions/${c.id}`}>
                    <Button size="sm">Asistencia</Button>
                  </Link>
                  {c.meeting_url && (
                    <a href={c.meeting_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">Entrar</Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
}
