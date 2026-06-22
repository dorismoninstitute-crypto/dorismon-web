"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { studentApi, studentPayments, placement, progress, events, safeArray, safeObj, getLevelTheme } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, Card, CardBody, Badge, Button, showToast, CalendarButton, JoinClassButton, ClassLocation } from "@/components/ui";
import {
  Calendar, FileText, CheckCircle2, Target, Trophy, TrendingUp,
  Sparkles, GraduationCap, Clock, BookOpen, Award, ChevronRight,
  Lock, Play, Flame, Ticket, ArrowRight,
} from "lucide-react";

export default function StudentDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [progressData, setProgressData] = useState<any>(null);
  const [openEvents, setOpenEvents] = useState<any[]>([]);
  const [trialStatus, setTrialStatus] = useState<any>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  // V3.0: modal de avisar ausencia
  const [absenceModal, setAbsenceModal] = useState<any>(null);
  const [absenceReason, setAbsenceReason] = useState("");
  const [absenceSaving, setAbsenceSaving] = useState(false);

  const reload = () => {
    studentApi.dashboard().then((d: any) => d && setData(d)).catch(() => {});
  };

  const submitAbsence = async () => {
    if (absenceReason.trim().length < 5) {
      showToast("error", "Escribe un motivo (mínimo 5 caracteres)");
      return;
    }
    setAbsenceSaving(true);
    try {
      await studentApi.notifyAbsence(absenceModal.id, absenceReason.trim());
      showToast("success", "Avisaste que faltarás. Tu profesor fue notificado.");
      setAbsenceModal(null);
      setAbsenceReason("");
      reload();
    } catch (e: any) {
      showToast("error", e?.message || "No se pudo enviar el aviso");
    } finally {
      setAbsenceSaving(false);
    }
  };

  useEffect(() => {
    placement.status()
      .then((s: any) => {
        if (!s.completed) {
          router.replace("/placement");
          return Promise.reject("redirect");
        }
        return Promise.all([
          studentApi.dashboard(),
          progress.myCourse().catch(() => null),
          events.list().catch(() => []),
          studentPayments.trialStatus().catch(() => null),
        ]);
      })
      .then(([d, p, ev, trial]: any) => {
        if (d) {
          setData(d);
          setProgressData(p);
          setOpenEvents(safeArray(ev).slice(0, 3));
          setTrialStatus(trial);
          setLoading(false);
        }
      })
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
  const firstName = (u.full_name || "Estudiante").split(" ")[0];
  // V3.0: cancelaciones recientes + clases donde ya avisé ausencia
  const recentCancelled = safeArray(d.recent_cancelled);
  const myAbsenceIds: string[] = safeArray(d.my_absence_session_ids);
  const trialInfo = d.trial_info; // V3.0.1

  // V2.8 FIX: Mostrar el nivel REAL del estudiante (del placement test),
  // no el del enrollment (que puede ser distinto si admin lo inscribió en otro nivel)
  // Prioridad:
  // 1. progressData.level_code (nivel del progreso académico actual = donde está estudiando)
  // 2. u.current_level_code (nivel real del placement test del student)
  // 3. enrollments[0].level_code (último fallback)
  // 4. null si no hay ninguno
  const levelCode = progressData?.level_code
    || (u as any)?.current_level_code
    || enrollments[0]?.level_code
    || null;
  const theme = getLevelTheme(levelCode || "B1");

  return (
    <div className="-m-3 md:-m-8 p-3 md:p-8 min-h-screen bg-slate-50">
      {/* V3.0: Aviso de clases canceladas recientemente */}
      {recentCancelled.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-red-900 mb-1">
                {recentCancelled.length === 1 ? "Una de tus clases fue cancelada" : `${recentCancelled.length} de tus clases fueron canceladas`}
              </h3>
              <div className="space-y-2 mt-2">
                {recentCancelled.map((c: any) => (
                  <div key={c.id} className="text-sm bg-white/60 rounded-lg p-2.5">
                    <p className="font-semibold text-red-900">{c.title}</p>
                    <p className="text-xs text-red-700">
                      {c.starts_at_utc && new Date(c.starts_at_utc).toLocaleString("es", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {c.reason && <p className="text-xs text-slate-600 mt-1">Motivo: {c.reason}</p>}
                  </div>
                ))}
              </div>
              <p className="text-xs text-red-600 mt-2">
                Tu profesor o coordinador reagendará la clase. Si tienes dudas, escríbeles por Mensajes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* V3.0.1: Si tiene clase de prueba AGENDADA, mostrar tarjeta de confirmación */}
      {enrollments.length === 0 && trialInfo?.status === "scheduled" && (
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-2xl p-5 mb-6 shadow-md">
          <div className="flex items-start gap-3 flex-wrap md:flex-nowrap">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🎁</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-lg text-emerald-900 mb-1">¡Tu clase de prueba está agendada! ✅</h3>
              <div className="text-sm text-emerald-800 space-y-0.5 mb-3">
                {trialInfo.teacher_name && <p><strong>👨‍🏫 Profesor:</strong> {trialInfo.teacher_name}</p>}
                {trialInfo.scheduled_at && (
                  <p><strong>📅 Fecha:</strong> {new Date(trialInfo.scheduled_at).toLocaleString("es", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p>
                )}
                {trialInfo.modality && <p><strong>📍 Modalidad:</strong> {trialInfo.modality}</p>}
              </div>
              <a href="/dashboard/student/calendar">
                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg transition">
                  Ver en mi calendario →
                </button>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* V3.0.1: Si solicitó prueba pero aún no se la agendan */}
      {enrollments.length === 0 && trialInfo?.status === "requested" && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl p-5 mb-6 shadow-md">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">⏳</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-lg text-blue-900 mb-1">Tu clase de prueba está en proceso</h3>
              <p className="text-sm text-blue-800">
                Ya recibimos tu solicitud. En las próximas horas te asignaremos un profesor y te
                confirmaremos por email la fecha de tu clase de prueba gratis. 🎁
              </p>
            </div>
          </div>
        </div>
      )}

      {/* V3.0.2: Clase de prueba COMPLETADA (asistió) → invitar a inscribirse */}
      {enrollments.length === 0 && trialInfo?.status === "completed" && (
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-300 rounded-2xl p-5 mb-6 shadow-md">
          <div className="flex items-start gap-3 flex-wrap md:flex-nowrap">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🎉</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-lg text-violet-900 mb-1">¿Qué te pareció tu clase de prueba?</h3>
              <p className="text-sm text-violet-800 mb-3">
                Esperamos que la hayas disfrutado. ¡Da el siguiente paso y comienza tu camino con el inglés!
              </p>
              <a href="/checkout">
                <button className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-lg transition">
                  💎 Ver planes e inscribirme →
                </button>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* V3.0.2: Clase de prueba NO_SHOW (no asistió) → reagendar o inscribirse */}
      {enrollments.length === 0 && trialInfo?.status === "no_show" && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 mb-6 shadow-md">
          <div className="flex items-start gap-3 flex-wrap md:flex-nowrap">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">😔</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-lg text-amber-900 mb-1">Tu clase de prueba ya pasó</h3>
              {trialInfo.reschedule_requested ? (
                <p className="text-sm text-amber-800">
                  Ya pediste reagendar. Te contactaremos pronto para coordinar la nueva fecha. 📅
                </p>
              ) : (
                <>
                  <p className="text-sm text-amber-800 mb-3">
                    No pudimos verte esta vez. ¿Querés intentarlo de nuevo o ya estás listo para empezar?
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {trialInfo.can_reschedule && (
                      <button
                        onClick={async () => {
                          try {
                            await studentApi.rescheduleTrial();
                            showToast("success", "Solicitud enviada. Te contactaremos para la nueva fecha.");
                            reload();
                          } catch (e: any) { showToast("error", e?.message || "Error"); }
                        }}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-lg transition"
                      >
                        🔄 Reagendar mi clase
                      </button>
                    )}
                    <a href="/checkout">
                      <button className="px-4 py-2 bg-white hover:bg-amber-50 text-amber-900 font-bold text-sm rounded-lg border-2 border-amber-300 transition">
                        💎 Inscribirme a un plan
                      </button>
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* V2.6b: Banner CTA solo si NO tiene inscripciones NI clase de prueba */}
      {enrollments.length === 0 && !trialInfo && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 mb-6 shadow-md">
          <div className="flex items-start gap-3 flex-wrap md:flex-nowrap">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-lg text-amber-900 mb-1">¡Casi listo para empezar! 🚀</h3>
              <p className="text-sm text-amber-800 mb-3">
                Reserva tu <strong>clase de prueba GRATIS</strong> o inscríbete a un plan para comenzar tus clases de inglés.
              </p>
              <div className="flex gap-2 flex-wrap">
                <a href="/dashboard/student/trial">
                  <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-lg transition">
                    🎁 Reservar clase GRATIS
                  </button>
                </a>
                <a href="/checkout">
                  <button className="px-4 py-2 bg-white hover:bg-amber-50 text-amber-900 font-bold text-sm rounded-lg border-2 border-amber-300 transition">
                    💎 Ver planes e inscribirme
                  </button>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* V1.6.2: Hero premium con gradient slate + accent turquesa */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl md:rounded-3xl p-5 md:p-8 mb-6 shadow-lifted">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
            <div>
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                Bienvenido de vuelta
              </p>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white mb-1">
                ¡Hola, {firstName}! <span className="inline-block">👋</span>
              </h1>
              {progressData?.enrolled ? (
                <p className="text-slate-300 text-xs md:text-sm">
                  <strong className="text-white">{progressData.course_name}</strong> · {progressData.completed_modules}/{progressData.total_modules} módulos completados
                </p>
              ) : (
                <p className="text-slate-300 text-xs md:text-sm">
                  Esperando inscripción a un curso.
                </p>
              )}
            </div>
            {levelCode && (
              <div className={`flex flex-col items-center px-5 py-3 rounded-2xl ${theme.bg} text-white shadow-card`}>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-90">Nivel</p>
                <p className="text-3xl md:text-4xl font-black">{levelCode}</p>
              </div>
            )}
          </div>

          {/* Profe + última actividad */}
          {enrollments.length > 0 && enrollments[0]?.teacher_name && (
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {enrollments[0].teacher_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400">Tu profesor</p>
                <p className="font-bold text-white text-sm truncate">{enrollments[0].teacher_name}</p>
              </div>
              {progressData?.progress_pct !== undefined && (
                <div className="text-right">
                  <p className="text-xs text-slate-400">Tu progreso</p>
                  <p className="font-black text-accent-300 text-lg">{progressData.progress_pct}%</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* V1.4: Banner "esperando coordinador" si no tiene inscripción activa */}
      {!progressData?.enrolled && (
        <Card className="mb-6 border-2 border-amber-300 bg-amber-50">
          <CardBody>
            <div className="flex items-start gap-3">
              <div className="text-3xl flex-shrink-0">⏳</div>
              <div className="flex-1">
                <h3 className="font-extrabold text-amber-900 text-lg mb-1">Esperando asignación de coordinador</h3>
                <p className="text-sm text-amber-800 leading-relaxed">
                  Ya completaste tu test de nivel ({levelCode}). En las próximas 24-48 horas un coordinador
                  te contactará para confirmar tu nivel mediante una breve entrevista (evaluación de Listening,
                  Speaking y Writing) y asignarte a un grupo con tu profesor.
                </p>
                <p className="text-xs text-amber-700 mt-2">
                  Mientras tanto, puedes explorar los <Link href="/dashboard/student/events" className="font-bold underline">eventos abiertos</Link> y la <Link href="/dashboard/student/library" className="font-bold underline">biblioteca</Link>.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* V1.6.2: Stats premium con iconos Lucide */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft hover:shadow-card transition p-4">
          <div className="flex items-center justify-between mb-2">
            <div className={`w-10 h-10 rounded-xl ${theme.bgSoft} ${theme.text} flex items-center justify-center`}>
              <Target size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nivel</span>
          </div>
          <p className={`text-3xl font-black ${theme.text}`}>{levelCode}</p>
          <p className="text-xs text-slate-500 mt-1">{progressData?.level_name || "Tu nivel"}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft hover:shadow-card transition p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Progreso</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{progressData?.progress_pct ?? 0}<span className="text-xl">%</span></p>
          <p className="text-xs text-slate-500 mt-1">general</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft hover:shadow-card transition p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Clases</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.next_classes ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">próximas</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft hover:shadow-card transition p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Trophy size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Asistencia</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.attendance_rate ?? 0}<span className="text-xl">%</span></p>
          <p className="text-xs text-slate-500 mt-1">promedio</p>
        </div>
      </div>

      {/* V1.6.2: Banner eventos premium */}
      {openEvents.length > 0 && (
        <div className="mb-6 bg-gradient-to-br from-accent-50 via-white to-brand-50 rounded-2xl border border-accent-200 p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-accent-500 text-white flex items-center justify-center">
                <Ticket size={18} />
              </div>
              Eventos disponibles
            </h3>
            <Link href="/dashboard/student/events" className="text-xs font-bold text-accent-700 hover:text-accent-800 inline-flex items-center gap-1">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {openEvents.map((e: any) => (
              <Link
                key={e.id}
                href="/dashboard/student/events"
                className="bg-white p-4 rounded-xl border border-slate-100 hover:shadow-card hover:border-accent-200 transition"
              >
                <p className="font-bold text-sm mb-1 line-clamp-2 text-slate-900">{e.title}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                  <Clock size={12} />
                  {e.starts_at_utc && new Date(e.starts_at_utc).toLocaleString("es", { weekday: "short", day: "numeric", month: "short", hour: "2-digit" })}
                </div>
                <p className="text-xs text-slate-600 mb-2 truncate">👨‍🏫 {e.teacher_name}</p>
                {e.i_am_registered ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                    <CheckCircle2 size={11} /> Anotado
                  </span>
                ) : e.is_full ? (
                  <span className="inline-flex text-xs font-bold text-red-700 bg-red-50 px-2 py-1 rounded">
                    Lleno
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-slate-700">
                    <strong>{e.spots_left}</strong> cupos disponibles
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* V1.6.2: Ruta del curso premium estilo Duolingo profesional */}
      {progressData?.enrolled && progressData.modules?.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl border border-slate-100 shadow-soft p-5 md:p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${theme.bg} text-white flex items-center justify-center shadow-card`}>
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">Tu ruta en {levelCode}</h3>
                <p className="text-xs text-slate-500">{progressData.course_name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-slate-900">{progressData.progress_pct}<span className="text-base">%</span></p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Completado</p>
            </div>
          </div>

          {/* Barra global */}
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-5">
            <div
              className={`h-full bg-gradient-to-r ${theme.bg.replace("bg-", "from-")} to-${theme.bg.replace("bg-", "").replace("-600", "-400")} transition-all duration-700`}
              style={{ width: `${progressData.progress_pct}%` }}
            />
          </div>

          {/* Módulos como camino */}
          <div className="flex flex-wrap gap-3 mb-4">
            {progressData.modules.map((m: any, i: number) => {
              const completed = m.status === "completed";
              const inProgress = m.status === "in_progress";
              const locked = m.status === "locked";
              return (
                <div key={m.id} className="flex items-center gap-2 group">
                  <div
                    title={m.name}
                    className={`relative w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold transition-all
                      ${completed ? `${theme.bg} text-white shadow-card` : ""}
                      ${inProgress ? `bg-gradient-to-br from-brand-500 to-accent-500 text-white ring-4 ring-brand-100 scale-105 shadow-lifted` : ""}
                      ${locked ? "bg-slate-100 text-slate-400" : ""}`}
                  >
                    {completed ? (
                      <CheckCircle2 size={22} />
                    ) : inProgress ? (
                      <Play size={20} fill="currentColor" />
                    ) : locked ? (
                      <Lock size={18} />
                    ) : (
                      <span className="text-base">{i + 1}</span>
                    )}
                    {inProgress && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent-500 rounded-full ring-2 ring-white animate-pulse-soft" />
                    )}
                  </div>
                  {i < progressData.modules.length - 1 && (
                    <div className={`w-3 h-1 ${completed ? theme.bg : "bg-slate-200"} rounded-full`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Detalle del módulo actual */}
          {(() => {
            const current = progressData.modules.find((m: any) => m.status === "in_progress");
            if (current) {
              return (
                <div className="mt-4 p-4 bg-gradient-to-br from-brand-50 to-accent-50 rounded-xl border border-brand-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0">
                      <Sparkles size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700 mb-1">Estás aquí</p>
                      <p className="font-bold text-slate-900">{current.name}</p>
                      {current.description && <p className="text-sm text-slate-600 mt-1">{current.description}</p>}
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Última clase con notas del profe */}
        {progressData?.last_class?.teacher_notes && (
          <Card className="border-2 border-emerald-200 bg-emerald-50 lg:col-span-2">
            <CardBody>
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">📝 Nota del profesor de tu última clase</p>
              <p className="font-bold mb-1">{progressData.last_class.title}</p>
              <p className="text-sm text-slate-700 leading-relaxed">{progressData.last_class.teacher_notes}</p>
            </CardBody>
          </Card>
        )}

        {/* V1.6.2 + V1.6.4: Próxima clase como hero gigante destacado, con estado EN CURSO */}
        {progressData?.next_session && (() => {
          const now = new Date();
          const startsAt = progressData.next_session.starts_at_utc ? new Date(progressData.next_session.starts_at_utc) : null;
          const endsAt = progressData.next_session.ends_at_utc ? new Date(progressData.next_session.ends_at_utc) : null;
          const isInProgress = startsAt && endsAt && now >= startsAt && now <= endsAt;
          const heroBg = isInProgress
            ? "bg-gradient-to-br from-red-600 via-red-700 to-red-800"
            : "bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800";
          const labelColor = isInProgress ? "text-red-100" : "text-accent-200";
          const labelText = isInProgress ? "🔴 EN CURSO AHORA" : "Tu próxima clase";

          return (
          <div className={`lg:col-span-2 ${heroBg} rounded-2xl p-5 md:p-7 text-white shadow-lifted relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-accent-500/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
            <div className="relative">
              <div className="flex items-center gap-4 flex-wrap mb-4">
                <div className={`w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 ${isInProgress ? "animate-pulse-soft" : ""}`}>
                  <Clock size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${labelColor} mb-1`}>{labelText}</p>
                  <h3 className="font-black text-xl md:text-2xl mb-1">
                    {progressData.next_session.is_private && (
                      <span className="inline-block px-2 py-0.5 rounded-md text-xs font-bold bg-violet-500/30 text-white mr-2 align-middle">
                        👤 Privada
                      </span>
                    )}
                    {progressData.next_session.title}
                  </h3>
                  <p className="text-sm text-brand-100">
                    <Calendar size={14} className="inline mr-1.5 -mt-0.5" />
                    {progressData.next_session.starts_at_utc && new Date(progressData.next_session.starts_at_utc).toLocaleString("es", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-xs text-brand-200 mt-1">
                    👨‍🏫 {progressData.next_session.teacher_name}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap mt-4">
                {progressData.next_session.meeting_url && (
                  <JoinClassButton session={progressData.next_session} />
                )}
                <CalendarButton sessionId={progressData.next_session.id} />
              </div>
              {/* V3.0.3: ubicación si es presencial/híbrida */}
              {progressData.next_session.location && (
                <ClassLocation location={progressData.next_session.location} />
              )}
              {progressData.next_session.teacher_notes && (
                <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-accent-200 mb-1">📌 Nota del profesor</p>
                  <p className="text-sm text-white/90">{progressData.next_session.teacher_notes}</p>
                </div>
              )}
            </div>
          </div>
          );
        })()}

        {/* Próximas clases (lista) */}
        <Card>
          <CardBody>
            <h3 className="font-extrabold mb-4 flex items-center justify-between">
              <span>📅 Próximas clases</span>
              <Link href="/dashboard/student/calendar" className={`text-xs font-bold ${theme.text} hover:underline`}>Ver todas →</Link>
            </h3>
            {next_classes.length === 0 ? (
              <EmptyState icon="📅" title="Sin clases programadas" description="Tu profesor pronto agendará clases." />
            ) : (
              <div className="space-y-2">
                {next_classes.slice(0, 4).map((c: any) => {
                  const alreadyNotified = myAbsenceIds.includes(c.id);
                  return (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{c.title}</p>
                        <p className="text-xs text-slate-500">
                          {c.starts_at_utc && new Date(c.starts_at_utc).toLocaleString("es", { weekday: "short", day: "numeric", month: "short", hour: "2-digit" })}
                          {" · "}{c.teacher_name}
                        </p>
                      </div>
                      <Badge variant={c.modality === "online" ? "brand" : c.modality === "presencial" ? "accent" : "info"}>{c.modality}</Badge>
                    </div>
                    {/* V3.0.3: ubicación si es presencial */}
                    {c.location && (c.modality === "presencial" || c.modality === "hibrida") && (
                      <div className="mt-1">
                        <ClassLocation location={c.location} compact />
                      </div>
                    )}
                    {!c.location && (c.modality === "presencial" || c.modality === "hibrida") && (
                      <p className="text-xs text-amber-600 mt-1">📍 Ubicación por confirmar — consulta con el instituto</p>
                    )}
                    {/* V3.0: avisar ausencia */}
                    <div className="mt-2 flex justify-end">
                      {alreadyNotified ? (
                        <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                          ✓ Avisaste que faltarás
                        </span>
                      ) : (
                        <button
                          onClick={() => { setAbsenceModal(c); setAbsenceReason(""); }}
                          className="text-xs text-slate-500 hover:text-red-600 font-semibold"
                        >
                          No podré asistir
                        </button>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Mis cursos */}
        <Card>
          <CardBody>
            <h3 className="font-extrabold mb-4 flex items-center justify-between">
              <span>📚 Mis cursos</span>
              <Link href="/dashboard/student/courses" className={`text-xs font-bold ${theme.text} hover:underline`}>Ver todos →</Link>
            </h3>
            {enrollments.length === 0 ? (
              <EmptyState
                icon="📚"
                title="Esperando asignación"
                description="Ya hiciste tu test. Un coordinador te asignará curso y profe pronto."
              />
            ) : (
              <div className="space-y-2">
                {enrollments.map((e: any) => (
                  <div key={e.id} className={`p-3 rounded-xl border-2 ${theme.border} ${theme.bgSoft}`}>
                    <p className="font-bold text-sm">{e.course_name}</p>
                    <p className="text-xs text-slate-600 mt-1">Nivel {e.level_code} — {e.level_name}</p>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Tarea próxima */}
        {d.next_assignment && (
          <Card className="border-2 border-amber-300 bg-amber-50 lg:col-span-2">
            <CardBody className="flex items-center gap-4 flex-wrap">
              <div className="text-3xl">⏰</div>
              <div className="flex-1 min-w-0">
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

      {/* V3.0: Modal avisar ausencia */}
      {absenceModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-1 text-slate-900">¿No podrás asistir?</h3>
            <p className="text-sm text-slate-600 mb-1">{absenceModal.title}</p>
            <p className="text-xs text-slate-400 mb-4">
              {absenceModal.starts_at_utc && new Date(absenceModal.starts_at_utc).toLocaleString("es", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
            </p>
            <label className="block text-sm font-semibold mb-1">Cuéntale a tu profesor por qué:</label>
            <textarea
              value={absenceReason}
              onChange={(e) => setAbsenceReason(e.target.value)}
              placeholder="Ej: Tengo una cita médica ese día."
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-4"
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setAbsenceModal(null); setAbsenceReason(""); }} className="flex-1" disabled={absenceSaving}>
                Cancelar
              </Button>
              <Button onClick={submitAbsence} loading={absenceSaving} className="flex-1">
                Enviar aviso
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
