"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { teacherApi, safeArray, safeObj, getLevelTheme } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Button, JoinClassButton, CalendarButton } from "@/components/ui";
import Avatar from "@/components/Avatar";
import {
  Calendar, FileText, Users, TrendingUp, Clock, BookOpen,
  AlertTriangle, ChevronRight, Sparkles, GraduationCap, BarChart3,
  CheckCircle2,
} from "lucide-react";

export default function TeacherDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    teacherApi.dashboard()
      .then((d: any) => { setData(d); setLoading(false); })
      .catch((e: any) => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  const d = safeObj(data, {}) as any;
  const u = safeObj(d.user, {}) as any;
  const stats = safeObj(d.stats, {}) as any;
  const today = safeArray(d.today_schedule);
  const week = safeArray(d.week_schedule);
  const levels = safeArray(d.levels_distribution);
  const atRisk = safeArray(d.students_at_risk);

  const firstName = (u.full_name || "").split(" ")[0] || "Profe";
  const totalStudents = levels.reduce((acc: number, l: any) => acc + (l.student_count || 0), 0) || stats.total_students || 0;

  return (
    <div className="-m-3 md:-m-8 p-3 md:p-8 min-h-screen bg-slate-50">
      {/* V1.8: Hero profesor */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl md:rounded-3xl p-5 md:p-8 mb-6 shadow-lifted">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="relative">
          <div className="flex items-start gap-4 flex-wrap">
            <Avatar name={u.full_name} gender={u.gender} size="lg" ring />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                Centro de productividad
              </p>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white mb-1">
                ¡Hola, {firstName}! 👋
              </h1>
              <p className="text-slate-300 text-xs md:text-sm">
                {today.length === 0 ? (
                  <>No tienes clases hoy. <span className="text-white">Aprovecha para preparar las próximas.</span></>
                ) : (
                  <>Tenés <strong className="text-white">{today.length}</strong> {today.length === 1 ? "clase" : "clases"} hoy.</>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats premium */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft hover:shadow-card transition p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hoy</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.today_classes ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">clases programadas</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft hover:shadow-card transition p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estudiantes</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{totalStudents}</p>
          <p className="text-xs text-slate-500 mt-1">activos</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft hover:shadow-card transition p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tareas</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.pending_grading ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">por revisar</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft hover:shadow-card transition p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Semana</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.next_week_classes ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">próximas clases</p>
        </div>
      </div>

      {/* Layout 2 columnas: agenda + side */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Columna izquierda: agenda */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tus clases de hoy */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                    <Clock size={18} />
                  </div>
                  Tus clases de hoy
                </h3>
                <Link href="/dashboard/teacher/sessions" className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
                  Ver todas <ChevronRight size={12} />
                </Link>
              </div>

              {today.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Sparkles size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No tienes clases hoy.</p>
                  <p className="text-xs mt-1">Aprovecha para preparar las próximas.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {today.map((s: any) => {
                    const theme = s.level_code ? getLevelTheme(s.level_code) : null;
                    return (
                      <div key={s.id} className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100 hover:shadow-card transition">
                        <div className="flex items-start gap-3 flex-wrap">
                          {s.level_code && theme && (
                            <div className={`w-12 h-12 rounded-xl ${theme.bg} text-white flex items-center justify-center font-black flex-shrink-0`}>
                              {s.level_code}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="font-bold text-slate-900">{s.title}</p>
                              {s.is_private && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-100 text-violet-700">👤 Privada</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                              <Clock size={11} />
                              {s.starts_at_utc && new Date(s.starts_at_utc).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                              <span className="mx-1">·</span>
                              {s.modality}
                            </p>
                          </div>
                        </div>
                        {s.meeting_url && (
                          <div className="flex gap-2 mt-3 flex-wrap">
                            <JoinClassButton session={s} />
                            <CalendarButton sessionId={s.id} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Próximas clases de la semana */}
          {week.length > 0 && (
            <Card>
              <CardBody>
                <h3 className="font-extrabold text-slate-900 flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center">
                    <Calendar size={18} />
                  </div>
                  Próximas en la semana
                </h3>
                <div className="space-y-2">
                  {week.map((s: any) => {
                    const theme = s.level_code ? getLevelTheme(s.level_code) : null;
                    return (
                      <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition">
                        {s.level_code && theme && (
                          <div className={`w-9 h-9 rounded-lg ${theme.bg} text-white flex items-center justify-center font-bold text-xs flex-shrink-0`}>
                            {s.level_code}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {s.title}
                            {s.is_private && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 ml-1">👤</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">
                            {s.starts_at_utc && new Date(s.starts_at_utc).toLocaleString("es", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Columna derecha: alertas + distribución */}
        <div className="space-y-5">
          {/* Distribución de niveles */}
          {levels.length > 0 && (
            <Card>
              <CardBody>
                <h3 className="font-extrabold text-slate-900 flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                    <BarChart3 size={18} />
                  </div>
                  Distribución de niveles
                </h3>
                {/* Barras horizontales CSS puro */}
                <div className="space-y-3">
                  {levels.map((l: any) => {
                    const theme = getLevelTheme(l.level_code);
                    const pct = totalStudents > 0 ? Math.round((l.student_count / totalStudents) * 100) : 0;
                    return (
                      <div key={l.level_code}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`inline-block w-6 h-6 rounded ${theme.bg} text-white text-[10px] font-black flex items-center justify-center`}>
                              {l.level_code}
                            </span>
                            <span className="font-semibold text-slate-700">{l.level_name}</span>
                          </div>
                          <span className="font-bold text-slate-900">{l.student_count}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${theme.bg} transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Total</span>
                  <span className="text-slate-900 font-black text-base">{totalStudents}</span>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Estudiantes en riesgo */}
          {atRisk.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardBody>
                <h3 className="font-extrabold text-amber-900 flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <AlertTriangle size={18} />
                  </div>
                  Asistencia baja
                </h3>
                <p className="text-xs text-amber-800 mb-3">
                  <strong>{atRisk.length}</strong> {atRisk.length === 1 ? "estudiante" : "estudiantes"} con asistencia &lt; 70%. Considerá contactarlos.
                </p>
                <div className="space-y-2">
                  {atRisk.slice(0, 5).map((s: any) => (
                    <div key={s.student_id} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-amber-100">
                      <Avatar name={s.student_name} gender={s.gender} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{s.student_name}</p>
                        <p className="text-[10px] text-slate-500">{s.level_code} · {s.total_classes} clases</p>
                      </div>
                      <span className="text-sm font-black text-amber-700">{s.attendance_pct}%</span>
                    </div>
                  ))}
                </div>
                {atRisk.length > 5 && (
                  <Link href="/dashboard/teacher/students" className="block mt-3 text-xs font-bold text-amber-700 hover:text-amber-800 text-center">
                    Ver todos →
                  </Link>
                )}
              </CardBody>
            </Card>
          )}

          {/* Tareas pendientes */}
          {stats.pending_grading > 0 && (
            <Card className="border-brand-200 bg-brand-50">
              <CardBody>
                <h3 className="font-extrabold text-brand-900 flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  Por calificar
                </h3>
                <p className="text-sm text-brand-800 mb-3">
                  Tenés <strong>{stats.pending_grading}</strong> {stats.pending_grading === 1 ? "tarea" : "tareas"} esperando corrección.
                </p>
                <Link href="/dashboard/teacher/assignments">
                  <Button size="sm" className="w-full">
                    <CheckCircle2 size={14} className="inline mr-1.5" />
                    Ir a calificar
                  </Button>
                </Link>
              </CardBody>
            </Card>
          )}

          {/* Accesos rápidos */}
          <Card>
            <CardBody>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Accesos rápidos</p>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/dashboard/teacher/students" className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition text-center">
                  <Users size={20} className="mx-auto text-slate-600 mb-1" />
                  <p className="text-xs font-bold">Mis estudiantes</p>
                </Link>
                <Link href="/dashboard/teacher/sessions" className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition text-center">
                  <Calendar size={20} className="mx-auto text-slate-600 mb-1" />
                  <p className="text-xs font-bold">Mis clases</p>
                </Link>
                <Link href="/dashboard/teacher/assignments" className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition text-center">
                  <FileText size={20} className="mx-auto text-slate-600 mb-1" />
                  <p className="text-xs font-bold">Tareas</p>
                </Link>
                <Link href="/dashboard/teacher/materials" className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition text-center">
                  <BookOpen size={20} className="mx-auto text-slate-600 mb-1" />
                  <p className="text-xs font-bold">Materiales</p>
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
