"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { studentApi, studentPayments, placement, progress, events, publicApi, safeArray, safeObj, getLevelTheme } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, Card, CardBody, Badge, Button, showToast, CalendarButton, JoinClassButton, tieneEntradaOnline, ClassLocation } from "@/components/ui";
import MiProgresoNivel from "@/components/MiProgresoNivel";  // V3.9.53
import AvisosTelefono from "@/components/AvisosTelefono";  // V3.9.29
import { aFecha, modalidadLegible, rangoHora, estadoClase, useAhora, dentroDeVentanaEntrada } from "@/components/ClaseProfesor";  // GATE 3 (mismas funciones de presentación que Gate 2)
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
  // GATE 3 — Test de nivel pendiente PERO con clase autorizada: se deja entrar
  // al panel con un recordatorio (no se marca el test, no se asigna nivel).
  const [placementPendiente, setPlacementPendiente] = useState(false);
  const ahora = useAhora();  // GATE 3 — "En curso" sin recargar (sin peticiones)
  // V3.0: modal de avisar ausencia
  const [absenceModal, setAbsenceModal] = useState<any>(null);
  const [absenceReason, setAbsenceReason] = useState("");
  const [absenceSaving, setAbsenceSaving] = useState(false);
  // V3.9.12: avisos de "faltaste a clase" ya descartados (para ocultarlos al instante)
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  // V3.9.21: confirmación de asistencia a la próxima clase
  const [confirmedClass, setConfirmedClass] = useState(false);
  const [confirmingClass, setConfirmingClass] = useState(false);
  const confirmAttendance = async () => {
    const ns = (progressData as any)?.next_session;
    if (!ns?.id || confirmingClass) return;
    setConfirmingClass(true);
    try {
      await studentApi.confirmSession(ns.id);
      setConfirmedClass(true);
      showToast("success", "✔️ ¡Asistencia confirmada! Tu profesor lo verá.");
    } catch (e: any) { showToast("error", e.message); }
    finally { setConfirmingClass(false); }
  };
  // V3.9.17: WhatsApp del coordinador (de la configuración del instituto)
  const [waPhone, setWaPhone] = useState<string>("");
  useEffect(() => {
    publicApi.instituteSettings()
      .then((s: any) => {
        const raw = (s.contact_phone || "").replace(/[^0-9]/g, "");
        if (raw) setWaPhone(raw.length === 10 ? `1${raw}` : raw);
      })
      .catch(() => {});
  }, []);

  const dismissMissedAlert = async (notifId: string) => {
    setDismissedAlerts((prev) => [...prev, notifId]);  // ocultar de inmediato
    try { await studentApi.markRead(notifId); } catch {}
  };

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
    // GATE 4 — El test de nivel, el panel y el progreso se piden A LA VEZ
    // (antes: primero el test y después el resto = un viaje de red de más).
    // Son las mismas tres peticiones que ya se hacían en TODOS los casos;
    // eventos y clase de prueba se siguen pidiendo solo si el panel se va a
    // mostrar. La decisión es EXACTAMENTE la de Gate 3.
    // Nota: GET /student/dashboard actualiza el estado de una TrialClass
    // agendada que ya pasó (comportamiento existente, no se toca aquí).
    const pPanel = studentApi.dashboard();
    pPanel.catch(() => {});  // el error se trata abajo; evita aviso de promesa sin manejar
    const pCurso = progress.myCourse().catch(() => null);
    placement.status()
      .then(async (s: any) => {
        // GATE 3 — ÚNICO cambio en la regla del test de nivel.
        // Antes: test sin hacer → /placement, siempre.
        // Ahora: igual, SALVO que el estudiante ya tenga una clase que el
        // backend le autoriza a ver (mismo filtro central de audiencia que
        // usan /student/dashboard y /progress/my-course). En ese caso entra a
        // su panel con un recordatorio. No se marca el test, no se asigna
        // nivel, no se crea matrícula.
        let panel: Promise<any> = pPanel;
        if (!s.completed) {
          const previos = await Promise.all([pPanel.catch(() => null), pCurso]);
          const tieneClaseAutorizada =
            safeArray(previos[0]?.next_classes).length > 0 || !!previos[1]?.next_session;
          if (!tieneClaseAutorizada) {
            router.replace("/placement");
            return Promise.reject("redirect");
          }
          setPlacementPendiente(true);
          // Igual que en Gate 3: si el panel falló, se reintenta una vez.
          panel = previos[0] !== null ? Promise.resolve(previos[0]) : studentApi.dashboard();
        }
        return Promise.all([
          panel,
          pCurso,
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
  // V3.9.12: avisos de "faltaste a clase" (excluyendo los ya descartados en esta sesión)
  const missedAlerts = safeArray(d.missed_class_alerts).filter((a: any) => !dismissedAlerts.includes(a.notification_id));

  // V2.8 FIX: Mostrar el nivel REAL del estudiante (del placement test),
  // no el del enrollment (que puede ser distinto si admin lo inscribió en otro nivel)
  const levelCode = progressData?.level_code
    || (u as any)?.current_level_code
    || enrollments[0]?.level_code
    || null;
  const theme = getLevelTheme(levelCode || "B1");

  // GATE 3 — La próxima clase ya está en la tarjeta grande: la lista de
  // abajo no la repite.
  const ns = progressData?.next_session || null;
  const otrasClases = next_classes.filter((c: any) => !ns || c.id !== ns.id);
  const mostrarRuta = !!(progressData?.enrolled && progressData.modules?.length > 0);
  const pendTareas = Number(stats.pending_assignments || 0);
  const pendQuizzes = Number(stats.pending_quizzes || 0);

  return (
    <div className="-m-3 md:-m-8 p-3 md:p-8 min-h-screen bg-slate-50">
      {/* GATE 3 — Saludo compacto. Sin "Tu profesor" (con varias matrículas
          podía nombrar a otro docente; cada clase muestra el suyo) y sin
          progreso (se muestra una sola vez, en tu ruta). */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl md:rounded-3xl px-4 py-3 md:px-6 md:py-4 mb-4 shadow-lifted">
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl font-black tracking-tight text-white leading-tight">
              ¡Hola, {firstName}! <span className="inline-block">👋</span>
            </h1>
            <p className="text-slate-300 text-xs md:text-sm truncate">
              {progressData?.enrolled
                ? <><strong className="text-white">{progressData.course_name}</strong> · {progressData.completed_modules}/{progressData.total_modules} módulos</>
                : "Esperando inscripción a un curso."}
            </p>
          </div>
          {levelCode && (
            <span className={`flex-shrink-0 px-3 py-1.5 rounded-xl ${theme.bg} text-white text-sm font-black shadow-card`}>
              {levelCode}
            </span>
          )}
        </div>
      </div>

      {/* GATE 3 — Test de nivel pendiente: recordatorio, no bloqueo */}
      {placementPendiente && (
        <div className="mb-4 rounded-2xl border-2 border-violet-200 bg-violet-50 p-4 flex items-start gap-3 flex-wrap">
          <span className="text-2xl flex-shrink-0">🎯</span>
          <div className="flex-1 min-w-[180px]">
            <p className="font-bold text-violet-900 text-sm">Te falta completar tu test de nivel</p>
            <p className="text-xs text-violet-800 mt-0.5">
              Ya puedes ver y entrar a tus clases. El test (10-15 min) nos ayuda a ubicarte en tu ruta académica.
            </p>
          </div>
          <Link href="/placement">
            <Button size="sm">Hacer el test</Button>
          </Link>
        </div>
      )}

      {/* GATE 3 — 1º: PRÓXIMA CLASE / 🔴 EN CURSO */}
      <div className="mb-5">
        {/* V3.9.14: Si NO hay próxima clase, mostrar un mensaje amistoso en su lugar */}
        {progressData?.enrolled && !ns && (
          <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 rounded-2xl p-5 md:p-6 text-white shadow-lifted">
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent-200 mb-1">Tu próxima clase</p>
            <h3 className="font-black text-lg md:text-xl mb-1">Aún no tienes clases programadas</h3>
            <p className="text-sm text-brand-100">Tu profesor pronto agendará tus próximas clases. Te avisaremos.</p>
          </div>
        )}
        {ns && (() => {
          const isInProgress = estadoClase(ns, ahora) === "en_curso";
          const heroBg = isInProgress
            ? "bg-gradient-to-br from-red-600 via-red-700 to-red-800"
            : "bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800";
          const labelColor = isInProgress ? "text-red-100" : "text-accent-200";
          const labelText = isInProgress ? "🔴 EN CURSO AHORA" : "Tu próxima clase";
          const ini = aFecha(ns.starts_at_utc);
          return (
          <div className={`${heroBg} rounded-2xl p-5 md:p-7 text-white shadow-lifted relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-accent-500/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
            <div className="relative">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${labelColor} mb-1`}>{labelText}</p>
              <h3 className="font-black text-xl md:text-2xl mb-1">
                {ns.is_private && (
                  <span className="inline-block px-2 py-0.5 rounded-md text-xs font-bold bg-violet-500/30 text-white mr-2 align-middle">
                    👤 Privada
                  </span>
                )}
                {ns.title}
              </h3>
              <p className="text-sm text-white/90 flex items-center gap-x-3 gap-y-1 flex-wrap">
                <span className="inline-flex items-center gap-1.5 capitalize">
                  <Calendar size={14} />
                  {ini && ini.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold whitespace-nowrap"><Clock size={14} />{rangoHora(ns)}</span>
                <span className="whitespace-nowrap">{modalidadLegible(ns.modality)}</span>
              </p>
              <p className="text-xs text-white/80 mt-1">
                👨‍🏫 {ns.teacher_name}
              </p>
              <div className="flex gap-2 flex-wrap mt-4">
                {/* V3.9.65 — Una sola regla compartida: respeta la modalidad
                    (presencial nunca muestra entrada online) y no exige
                    `meeting_url` cuando el video es de Dorismon. */}
                {tieneEntradaOnline(ns) && (
                  <JoinClassButton session={ns} />
                )}
                <CalendarButton sessionId={ns.id} />
                {/* V3.9.21: confirmar asistencia */}
                {confirmedClass || ns.my_confirmed ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-100 border border-emerald-300/40 font-bold text-sm px-4 py-2 rounded-xl">
                    ✔️ Asistencia confirmada
                  </span>
                ) : (
                  <button
                    onClick={confirmAttendance}
                    disabled={confirmingClass}
                    className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white font-bold text-sm px-4 py-2 rounded-xl border border-white/30 transition"
                  >
                    {confirmingClass ? "Confirmando..." : "✔️ Confirmar asistencia"}
                  </button>
                )}
              </div>
              {/* V3.0.3: ubicación si es presencial/híbrida */}
              {ns.location && (
                <ClassLocation location={ns.location} />
              )}
              {ns.teacher_notes && (
                <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-accent-200 mb-1">📌 Nota del profesor</p>
                  <p className="text-sm text-white/90">{ns.teacher_notes}</p>
                </div>
              )}
            </div>
          </div>
          );
        })()}
      </div>


      {/* Clase de prueba / inscripción (sin cambios, solo sin matrícula) */}
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
                  <p><strong>📅 Fecha:</strong> {new Date(trialInfo.scheduled_at).toLocaleString("es", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hour12: true })}</p>
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
      {enrollments.length === 0 && (trialInfo?.status === "no_show" || trialInfo?.status === "cancelled") && (
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

      {/* V2.6b: Banner CTA solo si NO tiene inscripciones NI clase de prueba.
          GATE 3: ni una próxima clase autorizada (`ns`, calculada por el
          backend): a quien Dirección ya le asignó clase no se le dice
          "casi listo para empezar". */}
      {enrollments.length === 0 && !trialInfo && !ns && (
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

      {/* V1.4: Banner "esperando coordinador" si no tiene inscripción activa */}
      {!progressData?.enrolled && !progressData?.next_session && (
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

      {/* Cambios en tus clases (sin cambios) */}
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
                      {c.starts_at_utc && new Date(c.starts_at_utc).toLocaleString("es", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hour12: true })}
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

      {/* V3.9.12: Aviso de "faltaste a clase" (informativo, desaparece al leer) */}
      {missedAlerts.length > 0 && (
        <div className="space-y-3 mb-6">
          {missedAlerts.map((alert: any) => (
            <div key={alert.notification_id} className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">📌</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-amber-900 mb-1">{alert.title}</h3>
                  <p className="text-sm text-amber-800">{alert.body}</p>
                  <button
                    onClick={() => dismissMissedAlert(alert.notification_id)}
                    className="mt-3 text-sm font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg px-4 py-1.5 transition"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GATE 3 — 2º: PENDIENTE (datos que YA trae /student/dashboard) */}
      <Card className="mb-5">
        <CardBody>
          <h3 className="font-extrabold mb-3 text-slate-900">Pendiente</h3>
          {pendTareas === 0 && pendQuizzes === 0 ? (
            <p className="text-sm text-slate-500">🎉 Estás al día: no tienes tareas ni quizzes pendientes.</p>
          ) : (
            <div className="space-y-2">
              {pendTareas > 0 && (
                <Link href="/dashboard/student/assignments" className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition">
                  <span className="text-xl">📝</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-amber-900">
                      {pendTareas} {pendTareas === 1 ? "tarea pendiente" : "tareas pendientes"}
                    </p>
                    {d.next_assignment && (
                      <p className="text-xs text-amber-800 truncate">
                        Próxima: {d.next_assignment.title}
                        {d.next_assignment.due_at && <> · vence {aFecha(d.next_assignment.due_at)?.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "short" })}</>}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-amber-700 flex-shrink-0" />
                </Link>
              )}
              {pendQuizzes > 0 && (
                <Link href="/dashboard/student/quizzes" className="flex items-center gap-3 p-3 rounded-xl bg-brand-50 border border-brand-200 hover:bg-brand-100 transition">
                  <span className="text-xl">✅</span>
                  <p className="flex-1 font-bold text-sm text-brand-900">
                    {pendQuizzes} {pendQuizzes === 1 ? "quiz por realizar" : "quizzes por realizar"}
                  </p>
                  <ChevronRight size={16} className="text-brand-700 flex-shrink-0" />
                </Link>
              )}
            </div>
          )}
        </CardBody>
      </Card>


      {/* GATE 3 — 3º: PRÓXIMAS CLASES (sin repetir la de la tarjeta grande) */}
      <Card className="mb-5">
        <CardBody>
          <h3 className="font-extrabold mb-4 flex items-center justify-between">
            <span>📅 Próximas clases</span>
            <Link href="/dashboard/student/calendar" className={`text-xs font-bold ${theme.text} hover:underline`}>Ver todas →</Link>
          </h3>
          {otrasClases.length === 0 ? (
            <EmptyState
              icon="📅"
              title={ns ? "No hay más clases esta semana" : "Sin clases programadas"}
              description={ns ? "Tu próxima clase está arriba." : "Tu profesor pronto agendará clases."}
            />
          ) : (
            <div className="space-y-2">
              {otrasClases.slice(0, 4).map((c: any) => {
                const alreadyNotified = myAbsenceIds.includes(c.id);
                const enCurso = estadoClase(c, ahora) === "en_curso";
                const ini = aFecha(c.starts_at_utc);
                return (
                <div key={c.id} className={`p-3 rounded-xl ${enCurso ? "bg-red-50 border border-red-200" : "bg-slate-50"}`}>
                  {enCurso && (
                    <p className="text-[11px] font-black uppercase tracking-wider text-red-700 mb-1">
                      <span className="animate-pulse">🔴</span> En curso
                    </p>
                  )}
                  <p className="font-bold text-sm">{c.title}</p>
                  <p className="text-xs text-slate-600 flex items-center gap-x-3 gap-y-0.5 flex-wrap mt-0.5">
                    <span className="capitalize">{ini && ini.toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" })}</span>
                    <span className="font-semibold whitespace-nowrap">{rangoHora(c)}</span>
                    <span className="whitespace-nowrap">{modalidadLegible(c.modality)}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">👨‍🏫 {c.teacher_name}</p>
                  {/* V3.0.3: ubicación si es presencial */}
                  {c.location && (c.modality === "presencial" || c.modality === "hibrida") && (
                    <div className="mt-1">
                      <ClassLocation location={c.location} compact />
                    </div>
                  )}
                  {!c.location && (c.modality === "presencial" || c.modality === "hibrida") && (
                    <p className="text-xs text-amber-600 mt-1">📍 Ubicación por confirmar — consulta con el instituto</p>
                  )}
                  {/* GATE 3 — Entrar con el MISMO botón, solo dentro de la
                      ventana de la sala (función compartida). /join decide. */}
                  {tieneEntradaOnline(c) && dentroDeVentanaEntrada(c, ahora) && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <JoinClassButton session={c} />
                    </div>
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

      {/* GATE 3 — Asistencia (y progreso SOLO si no hay ruta que ya lo muestre).
          Sin asistencias registradas no se muestra un "0 %" que parece fallo. */}
      <div className={`grid ${mostrarRuta || !progressData?.enrolled ? "grid-cols-1" : "grid-cols-2"} gap-3 mb-5`}>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Trophy size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Asistencia</p>
            {Number(stats.attendance_records || 0) > 0 ? (
              <p className="text-2xl font-black text-slate-900">{stats.attendance_rate ?? 0}<span className="text-base">%</span></p>
            ) : (
              <p className="text-sm font-semibold text-slate-600">Aún sin clases registradas</p>
            )}
          </div>
        </div>
        {!mostrarRuta && progressData?.enrolled && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Progreso</p>
              <p className="text-2xl font-black text-slate-900">{progressData?.progress_pct ?? 0}<span className="text-base">%</span></p>
            </div>
          </div>
        )}
      </div>

      {/* 4º: tu ruta / progreso (sin cambios) */}
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

      <div className="mb-5">
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
      </div>

      <div className="mb-5">
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
      </div>

      {/* 5º: contenido secundario — eventos (sin cambios) */}
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
                  {e.starts_at_utc && new Date(e.starts_at_utc).toLocaleString("es", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true })}
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

      {/* GATE 3 — Avisos del teléfono AL FINAL: cargan solos y ya no empujan
          la próxima clase hacia abajo. */}
      <div className="mb-5"><AvisosTelefono /></div>

      {/* V3.9.17: hablar con el coordinador por WhatsApp.
          GATE 3 — En móvil ya NO flota: es un botón al final de la página, así
          nunca tapa contenido ni la barra inferior. En escritorio (lg) sigue
          flotando, donde hay espacio, por debajo de los modales (z-40 < z-50). */}
      {waPhone && (
        <a
          href={`https://wa.me/${waPhone}?text=${encodeURIComponent("¡Hola! Soy estudiante de Dorismon y tengo una pregunta. 😊")}`}
          target="_blank" rel="noopener noreferrer"
          className="lg:hidden mb-5 w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-soft transition px-4 py-3 flex items-center justify-center gap-2 font-bold text-sm"
          title="Hablar con el coordinador"
        >
          💬 <span>¿Dudas? Habla con el coordinador</span>
        </a>
      )}
      {waPhone && (
        <a
          href={`https://wa.me/${waPhone}?text=${encodeURIComponent("¡Hola! Soy estudiante de Dorismon y tengo una pregunta. 😊")}`}
          target="_blank" rel="noopener noreferrer"
          className="hidden lg:flex fixed bottom-5 right-5 z-40 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all px-5 py-3.5 items-center gap-2 font-bold text-sm"
          title="Hablar con el coordinador"
        >
          💬 <span>Coordinador</span>
        </a>
      )}

      {/* V3.0: Modal avisar ausencia */}
      {absenceModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-1 text-slate-900">¿No podrás asistir?</h3>
            <p className="text-sm text-slate-600 mb-1">{absenceModal.title}</p>
            <p className="text-xs text-slate-400 mb-4">
              {absenceModal.starts_at_utc && new Date(absenceModal.starts_at_utc).toLocaleString("es", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hour12: true })}
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
