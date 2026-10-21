"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { teacherApi, safeArray, safeObj, getLevelTheme } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Button, JoinClassButton, tieneEntradaOnline, CalendarButton, showToast, ClassLocation, ConfirmModal } from "@/components/ui";
import AvisosTelefono from "@/components/AvisosTelefono";  // V3.9.29
import { borrarClaseActiva } from "@/components/CallProvider";  // GATE 6E
import { EntregasPendientes, EstudiantesEnRiesgo } from "@/components/PanelSeguimiento";  // V3.9.49
import PanelFinalizaciones from "@/components/PanelFinalizaciones";  // V3.9.53
import PendingAttendance from "@/components/PendingAttendance";
import Avatar from "@/components/Avatar";
import { aFecha, modalidadLegible, rangoHora, estadoClase, minutosHasta, useAhora } from "@/components/ClaseProfesor";  // GATE 2
import {
  Calendar, FileText, Users, TrendingUp, Clock, BookOpen,
  AlertTriangle, ChevronRight, Sparkles, GraduationCap, BarChart3,
  CheckCircle2,
} from "lucide-react";

export default function TeacherDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = () => {
    teacherApi.dashboard()
      .then((d: any) => { setData(d); setLoading(false); })
      .catch((e: any) => { setErr(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  // GATE 0 — Finalizar ya no es un toque accidental: primero se confirma
  // (`confirmarFinalizar`) y, mientras se envía, no se puede repetir.
  const [confirmarFinalizar, setConfirmarFinalizar] = useState<any>(null);
  const [finalizandoId, setFinalizandoId] = useState<string | null>(null);
  const finalizandoRef = useRef(false);

  // GATE 2 — Reloj de pantalla para "En curso" / "Próxima" (sin peticiones)
  const ahora = useAhora();

  // V3.9.19: finalizar clase manualmente (con recordatorio de asistencia)
  const finalizeClass = async (sessionId: string) => {
    if (finalizandoRef.current) return;  // GATE 0: sin doble envío
    finalizandoRef.current = true;
    setFinalizandoId(sessionId);
    try {
      const r: any = await teacherApi.finalizeSession(sessionId);
      borrarClaseActiva(sessionId);  // GATE 6E — ya no hay clase a la que volver
      if (r.attendance_taken) {
        showToast("success", "✅ Clase finalizada");
      } else {
        showToast("success", "✅ Clase finalizada — recuerda pasar la asistencia cuando puedas");
      }
      // GATE 6E — la clase quedó finalizada, pero LiveKit no confirmó el cierre de la sala
      if (r.video_room === "error") {
        showToast("error", "La clase se finalizó en Dorismon, pero hubo un problema cerrando la sala de video. Quien siga conectado no podrá volver a entrar.");
      }
      load();
    } catch (e: any) { showToast("error", e.message); }
    finally {
      finalizandoRef.current = false;
      setFinalizandoId(null);
    }
  };

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

  // GATE 2 — Qué destacar: la clase en curso; si no hay, la próxima de hoy.
  const enCurso = today.filter((s: any) => estadoClase(s, ahora) === "en_curso");
  const proxima = enCurso.length === 0
    ? today.find((s: any) => estadoClase(s, ahora) === "proxima") || null
    : null;

  return (
    <div className="-m-3 md:-m-8 p-3 md:p-8 min-h-screen bg-slate-50">
      {/* GATE 2 — Saludo compacto: lo primero que importa son las clases */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl md:rounded-3xl px-4 py-3 md:px-6 md:py-4 mb-4 shadow-lifted">
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative flex items-center gap-3">
          <Avatar name={u.full_name} gender={u.gender} size="md" ring />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl font-black tracking-tight text-white leading-tight">
              ¡Hola, {firstName}! 👋
            </h1>
            <p className="text-slate-300 text-xs md:text-sm">
              {today.length === 0 ? (
                <>No tienes clases hoy. <span className="text-white">Aprovecha para preparar las próximas.</span></>
              ) : (
                <>Tienes <strong className="text-white">{today.length}</strong> {today.length === 1 ? "clase" : "clases"} hoy.</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* GATE 2 — CLASES PRIMERO. Todo lo que carga después va DEBAJO, así
          ningún aviso empuja el botón de entrar. */}
      <Card className="mb-5">
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
                const estado = estadoClase(s, ahora);
                const esProxima = proxima && proxima.id === s.id;
                const faltan = esProxima ? minutosHasta(s.starts_at_utc, ahora) : null;
                return (
                  <div
                    key={s.id}
                    className={`p-4 rounded-xl border transition hover:shadow-card ${
                      estado === "en_curso"
                        ? "bg-red-50/60 border-red-200 ring-2 ring-red-100"
                        : esProxima
                        ? "bg-brand-50/50 border-brand-200"
                        : "bg-gradient-to-r from-slate-50 to-white border-slate-100"
                    }`}
                  >
                    {/* GATE 2 — Estado visible de un vistazo */}
                    {estado === "en_curso" && (
                      <p className="text-[11px] font-black uppercase tracking-wider text-red-700 mb-2">
                        <span className="animate-pulse">🔴</span> En curso
                      </p>
                    )}
                    {esProxima && faltan !== null && (
                      <p className="text-[11px] font-black uppercase tracking-wider text-brand-700 mb-2">
                        ⏭️ Próxima clase · {faltan < 60 ? `empieza en ${faltan} min` : `empieza a las ${rangoHora({ starts_at_utc: s.starts_at_utc })}`}
                      </p>
                    )}
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
                          {/* GATE 1 — Clase para estudiantes concretos */}
                          {s.audience_count > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                              👥 Clase especial · {s.audience_count} {s.audience_count === 1 ? "estudiante" : "estudiantes"}
                            </span>
                          )}
                          {s.is_open_event && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700">🎉 Evento</span>
                          )}
                          {s.is_trial && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">🎯 Clase de prueba</span>
                          )}
                        </div>
                        {/* GATE 2 — Inicio y fin + modalidad legible */}
                        <p className="text-xs text-slate-600 flex items-center gap-x-3 gap-y-1 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 font-semibold whitespace-nowrap">
                            <Clock size={11} />{rangoHora(s)}
                          </span>
                          <span className="whitespace-nowrap">{modalidadLegible(s.modality)}</span>
                        </p>
                      </div>
                    </div>
                    {/* GATE 2 — Dónde: solo presencial/híbrida (el backend ya
                        no manda ubicación para una clase online). */}
                    {s.location && (
                      <div className="mt-3">
                        <ClassLocation location={s.location} compact />
                      </div>
                    )}
                    {/* V3.9.65 — Misma regla compartida que el resto:
                        presencial no muestra entrada online; Video
                        Dorismon no exige enlace de respaldo. */}
                    {tieneEntradaOnline(s) && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <JoinClassButton session={s} />
                        <CalendarButton sessionId={s.id} />
                      </div>
                    )}
                    {/* V3.9.19: Finalizar clase (en curso o pasada, aún no completada)
                        GATE 0: separado de "Entrar" (línea divisoria, alineado
                        a la derecha, otro estilo) y siempre con confirmación. */}
                    {s.status !== "completed" && s.status !== "cancelled" && s.starts_at_utc && new Date(s.starts_at_utc) <= new Date() && (
                      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => setConfirmarFinalizar(s)}
                          disabled={finalizandoId !== null}
                          className="text-xs font-semibold text-slate-500 hover:text-red-700 border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-lg px-3 py-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {finalizandoId === s.id ? "Finalizando…" : "Finalizar clase"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Avisos que cargan solos (V3.9.49 / V3.9.53 / V3.9.22 / V3.9.29).
          GATE 2: van DEBAJO de las clases. "Entregas por calificar" queda
          aquí como ÚNICO lugar de las tareas por revisar. */}
      <PanelFinalizaciones />
      <EntregasPendientes />
      <EstudiantesEnRiesgo />
      <PendingAttendance />
      <div className="mb-5"><AvisosTelefono /></div>

      {/* GATE 2 — Métricas sin repetir lo que ya dicen el saludo y la lista
          ("clases hoy") ni el panel de entregas ("tareas por revisar"). */}
      <div className="grid grid-cols-2 gap-3 mb-6">
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
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Semana</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.next_week_classes ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">próximas clases</p>
        </div>
      </div>

      {/* Layout 2 columnas: próximas + side */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
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
                    const ini = aFecha(s.starts_at_utc);
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
                            {/* GATE 1 — Clase para estudiantes concretos */}
                            {s.audience_count > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 ml-1">
                                👥 Clase especial · {s.audience_count} {s.audience_count === 1 ? "estudiante" : "estudiantes"}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">
                            {ini && ini.toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" })}
                            {" · "}{rangoHora(s)}{" · "}{modalidadLegible(s.modality)}
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

        {/* Columna derecha: alertas + accesos + distribución */}
        <div className="space-y-5">
          {/* Estudiantes en riesgo (criterio actual, sin cambios) */}
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

          {/* GATE 2 — Distribución de niveles: se conserva, plegada */}
          {levels.length > 0 && (
            <Card>
              <CardBody>
                <details>
                  <summary className="cursor-pointer list-none font-extrabold text-slate-900 flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                      <BarChart3 size={18} />
                    </div>
                    <span className="flex-1">Distribución de niveles</span>
                    <ChevronRight size={16} className="text-slate-400" />
                  </summary>
                  {/* Barras horizontales CSS puro */}
                  <div className="space-y-3 mt-4">
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
                </details>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* GATE 0 — Confirmación explícita antes de finalizar */}
      <ConfirmModal
        open={!!confirmarFinalizar}
        onClose={() => setConfirmarFinalizar(null)}
        onConfirm={() => confirmarFinalizar && finalizeClass(confirmarFinalizar.id)}
        title="Finalizar clase"
        message="¿Seguro que deseas finalizar esta clase? Una vez finalizada dejará de aparecer como clase en curso y ya no se podrá entrar normalmente."
        confirmLabel="Sí, finalizar clase"
      />
    </div>
  );
}
