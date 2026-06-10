"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { studentApi, placement, progress, events, safeArray, safeObj, getLevelTheme } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, Card, CardBody, Badge, Button, showToast, CalendarButton, JoinClassButton } from "@/components/ui";

export default function StudentDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [progressData, setProgressData] = useState<any>(null);
  const [openEvents, setOpenEvents] = useState<any[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

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
        ]);
      })
      .then(([d, p, ev]: any) => {
        if (d) {
          setData(d);
          setProgressData(p);
          setOpenEvents(safeArray(ev).slice(0, 3));
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

  // Color del nivel
  const levelCode = progressData?.level_code || enrollments[0]?.level_code || "B1";
  const theme = getLevelTheme(levelCode);

  return (
    <div className={`-m-3 md:-m-8 p-3 md:p-8 min-h-screen ${theme.bgSoft}`}>
      {/* V1.5: Hero rediseñado — fondo OSCURO uniforme + badge del nivel en color */}
      <div className="bg-slate-900 rounded-2xl md:rounded-3xl p-5 md:p-8 mb-5 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 md:w-48 md:h-48 bg-white/5 rounded-full"></div>
        <div className="absolute -bottom-8 -left-8 w-28 h-28 md:w-32 md:h-32 bg-white/5 rounded-full"></div>
        <div className="relative">
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
            Bienvenido de vuelta
          </p>
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
              ¡Hola, {firstName}! 👋
            </h1>
            {levelCode && (
              <span className={`inline-flex items-center px-3 py-1.5 rounded-xl ${theme.bg} text-white font-extrabold text-sm md:text-base shadow-lg`}>
                {levelCode}
              </span>
            )}
          </div>
          {progressData?.enrolled ? (
            <p className="text-slate-300 text-xs md:text-base">
              Estás en <strong className="text-white">{progressData.course_name}</strong> · {progressData.completed_modules}/{progressData.total_modules} módulos completados
            </p>
          ) : (
            <p className="text-slate-300 text-xs md:text-base">
              Esperando inscripción a un curso.
            </p>
          )}
          {/* V1.5: profe titular */}
          {enrollments.length > 0 && enrollments[0]?.teacher_name && (
            <p className="text-slate-400 text-xs md:text-sm mt-2">
              👨‍🏫 Profesor: <strong className="text-slate-200">{enrollments[0].teacher_name}</strong>
            </p>
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
                  Mientras tanto, podés explorar los <Link href="/dashboard/student/events" className="font-bold underline">eventos abiertos</Link> y la <Link href="/dashboard/student/library" className="font-bold underline">biblioteca</Link>.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Stats grandes coloridos — V1.4.1 más compactos en móvil */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-5">
        <Card className={`border-2 ${theme.border} hover:shadow-md transition`}>
          <CardBody className="text-center py-3 md:py-4">
            <div className="text-2xl md:text-3xl mb-1">📅</div>
            <p className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${theme.text}`}>Próx. clases</p>
            <p className="text-2xl md:text-3xl font-extrabold mt-1">{stats.next_classes ?? 0}</p>
          </CardBody>
        </Card>
        <Card className="border-2 border-amber-200 hover:shadow-md transition">
          <CardBody className="text-center py-3 md:py-4">
            <div className="text-2xl md:text-3xl mb-1">📝</div>
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-amber-700">Tareas</p>
            <p className="text-2xl md:text-3xl font-extrabold mt-1">{stats.pending_assignments ?? 0}</p>
          </CardBody>
        </Card>
        <Card className="border-2 border-violet-200 hover:shadow-md transition">
          <CardBody className="text-center py-3 md:py-4">
            <div className="text-2xl md:text-3xl mb-1">✓</div>
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-violet-700">Quizzes</p>
            <p className="text-2xl md:text-3xl font-extrabold mt-1">{stats.pending_quizzes ?? 0}</p>
          </CardBody>
        </Card>
        <Card className="border-2 border-emerald-200 hover:shadow-md transition">
          <CardBody className="text-center py-3 md:py-4">
            <div className="text-2xl md:text-3xl mb-1">🎯</div>
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-emerald-700">Asistencia</p>
            <p className="text-2xl md:text-3xl font-extrabold mt-1">{stats.attendance_rate ?? 0}%</p>
          </CardBody>
        </Card>
      </div>

      {/* BANNER de eventos abiertos */}
      {openEvents.length > 0 && (
        <Card className={`mb-6 ${theme.accent} border-2 ${theme.border}`}>
          <CardBody>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className={`font-extrabold ${theme.text} flex items-center gap-2`}>
                🎫 Eventos disponibles
              </h3>
              <Link href="/dashboard/student/events" className={`text-xs font-bold ${theme.text} hover:underline`}>
                Ver todos →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {openEvents.map((e: any) => (
                <div key={e.id} className="bg-white p-3 rounded-xl border border-slate-200">
                  <p className="font-bold text-sm mb-1 line-clamp-2">{e.title}</p>
                  <p className="text-xs text-slate-500 mb-2">
                    {e.starts_at_utc && new Date(e.starts_at_utc).toLocaleString("es", { weekday: "short", day: "numeric", month: "short", hour: "2-digit" })}
                  </p>
                  <p className="text-xs text-slate-600 mb-2">
                    👨‍🏫 {e.teacher_name}
                  </p>
                  {e.i_am_registered ? (
                    <Badge variant="success">✓ Anotado</Badge>
                  ) : e.is_full ? (
                    <Badge variant="danger">Lleno</Badge>
                  ) : (
                    <p className="text-xs font-semibold text-slate-700">{e.spots_left} cupos disponibles</p>
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* RUTA DEL CURSO */}
      {progressData?.enrolled && progressData.modules?.length > 0 && (
        <Card className="mb-6">
          <CardBody>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                🗺 Tu ruta en {levelCode}
              </h3>
              <Badge variant="brand">{progressData.progress_pct}% completado</Badge>
            </div>

            {/* Barra global de progreso */}
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full ${theme.bg} transition-all`}
                style={{ width: `${progressData.progress_pct}%` }}
              />
            </div>

            {/* Módulos como camino */}
            <div className="flex flex-wrap gap-2 mb-2">
              {progressData.modules.map((m: any, i: number) => {
                const completed = m.status === "completed";
                const inProgress = m.status === "in_progress";
                const locked = m.status === "locked";
                return (
                  <div key={m.id} className="flex items-center gap-2">
                    <div
                      title={m.name}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-sm transition-all
                        ${completed ? `${theme.bg} text-white shadow-md scale-100` : ""}
                        ${inProgress ? `${theme.accent} ${theme.text} ring-4 ring-offset-2 ${theme.border} scale-110 animate-pulse` : ""}
                        ${locked ? "bg-slate-100 text-slate-400" : ""}`}
                    >
                      {completed ? "✓" : inProgress ? "📍" : locked ? "🔒" : i + 1}
                    </div>
                    {i < progressData.modules.length - 1 && (
                      <div className={`w-2 h-1 ${completed ? theme.bg : "bg-slate-200"} rounded-full`} />
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
                  <div className={`mt-4 p-4 ${theme.accent} rounded-xl`}>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Estás aquí</p>
                    <p className="font-bold">{current.name}</p>
                    {current.description && <p className="text-sm text-slate-600 mt-1">{current.description}</p>}
                  </div>
                );
              }
              return null;
            })()}
          </CardBody>
        </Card>
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

        {/* Próxima clase como tarjeta destacada */}
        {progressData?.next_session && (
          <Card className={`border-2 ${theme.border} lg:col-span-2`}>
            <CardBody>
              <div className="flex items-center gap-4 flex-wrap">
                <div className={`w-16 h-16 ${theme.bg} text-white rounded-2xl flex items-center justify-center text-3xl`}>
                  ⏰
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold uppercase tracking-wider ${theme.text} mb-1`}>Próxima clase</p>
                  <h3 className="font-extrabold text-lg">{progressData.next_session.title}</h3>
                  <p className="text-sm text-slate-600">
                    {progressData.next_session.starts_at_utc && new Date(progressData.next_session.starts_at_utc).toLocaleString("es", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                    {" · "}{progressData.next_session.teacher_name}
                  </p>
                </div>
                {progressData.next_session.meeting_url && (
                  <JoinClassButton session={progressData.next_session} />
                )}
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <CalendarButton sessionId={progressData.next_session.id} />
              </div>
              {progressData.next_session.teacher_notes && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs font-bold text-slate-500 mb-1">📌 NOTA DEL PROFESOR:</p>
                  <p className="text-sm">{progressData.next_session.teacher_notes}</p>
                </div>
              )}
            </CardBody>
          </Card>
        )}

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
                {next_classes.slice(0, 4).map((c: any) => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-xl flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{c.title}</p>
                      <p className="text-xs text-slate-500">
                        {c.starts_at_utc && new Date(c.starts_at_utc).toLocaleString("es", { weekday: "short", day: "numeric", month: "short", hour: "2-digit" })}
                        {" · "}{c.teacher_name}
                      </p>
                    </div>
                    <Badge variant={c.modality === "online" ? "brand" : c.modality === "presencial" ? "accent" : "info"}>{c.modality}</Badge>
                  </div>
                ))}
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
    </div>
  );
}
