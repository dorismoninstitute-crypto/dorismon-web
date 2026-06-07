"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { studentApi, placement, safeArray, safeObj } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, StatCard, Card, CardBody, Badge, Button, PageHeader } from "@/components/ui";

export default function StudentDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar placement antes de cargar el dashboard
    placement.status()
      .then((s: any) => {
        if (!s.completed) {
          router.replace("/placement");
          return Promise.reject("redirect");
        }
        return studentApi.dashboard();
      })
      .then(d => { if (d) { setData(d); setLoading(false); } })
      .catch(e => {
        if (e === "redirect") return;
        setErr(typeof e === "string" ? e : e.message);
        setLoading(false);
      });
  }, [router]);

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;
  const d = safeObj(data, {}) as any;
  const u = safeObj(d.user, {}) as any;
  const stats = safeObj(d.stats, {}) as any;
  const next_classes = safeArray(d.next_classes);
  const enrollments = safeArray(d.enrollments);

  return (
    <>
      <PageHeader
        title={`Hola, ${u.full_name?.split(" ")[0] || "Estudiante"} 👋`}
        subtitle="Tu progreso académico de un vistazo"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="Cursos" value={stats.enrolled_courses} icon="📚" color="brand" />
        <StatCard label="Próximas clases" value={stats.next_classes} icon="📅" color="info" />
        <StatCard label="Tareas" value={stats.pending_assignments} icon="📝" color="warning" />
        <StatCard label="Quizzes" value={stats.pending_quizzes} icon="✓" color="purple" />
        <StatCard label="Asistencia" value={`${stats.attendance_rate || 0}%`} icon="✅" color="success" />
        <StatCard label="Certificados" value={stats.certificates} icon="🎓" color="accent" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardBody>
            <h3 className="font-bold mb-4 flex items-center justify-between">
              <span>📅 Próximas clases</span>
              <Link href="/dashboard/student/calendar" className="text-xs font-semibold text-brand-600 hover:text-brand-700">Ver todas →</Link>
            </h3>
            {next_classes.length === 0 ? (
              <EmptyState icon="📅" title="Sin clases programadas" description="Cuando tu profesor agende una clase, aparecerá aquí." />
            ) : (
              <div className="space-y-2">
                {next_classes.map((c: any) => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-lg flex items-center gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{c.title}</p>
                      <p className="text-xs text-slate-500">
                        {c.starts_at_utc && new Date(c.starts_at_utc).toLocaleString("es", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {" · "}{c.teacher_name}
                      </p>
                    </div>
                    <Badge variant={c.modality === "online" ? "brand" : c.modality === "presencial" ? "accent" : "info"}>
                      {c.modality}
                    </Badge>
                    {c.meeting_url && (
                      <a href={c.meeting_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm">Entrar</Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="font-bold mb-4 flex items-center justify-between">
              <span>📚 Mis cursos</span>
              <Link href="/dashboard/student/courses" className="text-xs font-semibold text-brand-600 hover:text-brand-700">Ver todos →</Link>
            </h3>
            {enrollments.length === 0 ? (
              <EmptyState icon="📚" title="Sin cursos inscritos" description="Un coordinador te asignará pronto a un curso." />
            ) : (
              <div className="space-y-2">
                {enrollments.map((e: any) => (
                  <div key={e.id} className="p-3 rounded-lg border border-slate-100 flex items-center gap-3"
                       style={{ borderLeftColor: e.color, borderLeftWidth: 4 }}>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{e.course_name}</p>
                      <p className="text-xs text-slate-500">Nivel {e.level_code} — {e.level_name}</p>
                    </div>
                    <Badge variant="brand">{e.level_code}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {d.next_assignment && (
          <Card className="lg:col-span-2 border-amber-200 bg-amber-50">
            <CardBody className="flex items-center gap-4">
              <div className="text-3xl">⏰</div>
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Próxima tarea</p>
                <p className="font-bold text-slate-900">{d.next_assignment.title}</p>
                {d.next_assignment.due_at && (
                  <p className="text-xs text-slate-600 mt-1">
                    Vence: {new Date(d.next_assignment.due_at).toLocaleString("es", { weekday: "long", day: "numeric", month: "short" })}
                  </p>
                )}
              </div>
              <Link href="/dashboard/student/assignments">
                <Button>Ver tarea →</Button>
              </Link>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
