"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, adminAssign, api, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, showToast } from "@/components/ui";
import AlertasAdmin from "@/components/AlertasAdmin";
import {
  Users, GraduationCap, Calendar, DollarSign, AlertTriangle, Clock,
  ArrowRight, CheckCircle2, UserPlus, CalendarPlus, CreditCard,
  LayoutGrid, TrendingUp, MapPin, Video, BookOpen, UserCheck,
} from "lucide-react";

/**
 * V3.9.60 FIX — Panel de Dirección.
 *
 * Reorganización visual sin perder capacidades del dashboard anterior.
 * No crea endpoints ni cambia contratos: reutiliza únicamente APIs existentes.
 */

function formatMoney(value: number, currency = "RD$") {
  const n = Math.round(Number(value) || 0).toLocaleString("es-DO");
  return `${currency}${n}`;
}

function saludo() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

const hoyLargo = () =>
  new Date().toLocaleDateString("es-DO", {
    weekday: "long", day: "numeric", month: "long",
  });

const hora12 = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString("es-DO", {
      hour: "numeric", minute: "2-digit", hour12: true,
      timeZone: "America/Santo_Domingo",
    });
  } catch { return ""; }
};

function faltan(iso: string): string | null {
  try {
    const min = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
    if (min < 0 || min > 600) return null;
    if (min < 60) return `en ${min} min`;
    return `en ${Math.floor(min / 60)}h ${min % 60}m`;
  } catch { return null; }
}

export default function AdminDashboard() {
  const [d, setD] = useState<any>(null);
  const [finance, setFinance] = useState<any>(null);
  const [alertas, setAlertas] = useState<any>({});
  const [clases, setClases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoAssignBusy, setAutoAssignBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const dash = await adminApi.dashboard();
        setD(dash);

        // Todos son endpoints existentes. Un panel secundario puede fallar sin
        // impedir que Dirección vea el resto del dashboard.
        const [sinHorario, riesgo, revision, pagos, sesiones, finanzas, actionables] =
          await Promise.allSettled([
            api("/admin/students-without-schedule", { auth: true }),
            api("/admin/at-risk-overview", { auth: true }),
            api("/admin/completion-queue", { auth: true }),
            api("/admin/payment-proofs?status=pending", { auth: true }),
            api("/admin/sessions?filter_period=upcoming&limit=6", { auth: true }),
            adminApi.financeSummary(),
            api("/admin/alerts", { auth: true }),
          ]);

        const val = (r: PromiseSettledResult<any>) =>
          r.status === "fulfilled" ? r.value : null;

        setAlertas({
          sinHorario: val(sinHorario),
          riesgo: val(riesgo),
          revision: val(revision),
          // /admin/payment-proofs devuelve ARRAY directamente.
          pagos: val(pagos),
          actionables: val(actionables),
        });
        setClases(safeArray(val(sesiones)?.items).slice(0, 5));
        setFinance(val(finanzas));
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const autoAsignar = async () => {
    setAutoAssignBusy(true);
    try {
      const r: any = await adminAssign.autoAssign();
      showToast(
        "success",
        `${r.assigned || 0} estudiantes auto-asignados. ${r.skipped || 0} sin profesor disponible.`
      );
      setTimeout(() => window.location.reload(), 900);
    } catch (e: any) {
      showToast("error", e.message || "No se pudo completar la auto-asignación");
    } finally {
      setAutoAssignBusy(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err.includes("403") ? "Necesitas rol admin" : err} />;

  const s = d?.stats || {};
  const currency = finance?.currency || "RD$";
  const incomeMonth = finance?.income_month ?? s.income_month ?? 0;
  const nSinHorario = safeArray(alertas.sinHorario?.items).length
    || alertas.sinHorario?.count || 0;
  const nRiesgo = alertas.riesgo?.count || 0;
  const nRevision = alertas.revision?.count || 0;
  const nPagos = safeArray(alertas.pagos).length;
  const nActionables = Number(alertas.actionables?.pending || 0);

  const filas = ([
    {
      key: "sin-horario", n: nSinHorario, Icono: Calendar,
      color: "text-amber-600 bg-amber-50",
      texto: "sin horario asignado — no ven ninguna clase",
      href: "/dashboard/admin/groups",
      gente: safeArray(alertas.sinHorario?.items).slice(0, 3),
    },
    {
      key: "riesgo", n: nRiesgo, Icono: AlertTriangle,
      color: "text-rose-600 bg-rose-50",
      texto: "matrículas en riesgo académico",
      href: "/dashboard/admin/academic-overview",
      gente: safeArray(alertas.riesgo?.items).slice(0, 3),
    },
    {
      key: "pagos", n: nPagos, Icono: CreditCard,
      color: "text-sky-600 bg-sky-50",
      texto: "comprobantes de pago por verificar",
      href: "/dashboard/admin/payment-proofs",
      gente: [],
    },
    {
      key: "revision", n: nRevision, Icono: GraduationCap,
      color: "text-emerald-600 bg-emerald-50",
      texto: "pendientes de revisión final de nivel",
      href: "/dashboard/admin/completions",
      gente: safeArray(alertas.revision?.items).slice(0, 3),
    },
  ]).filter((x) => x.n > 0);

  const haySetupPendiente = s.total_modules === 0
    || s.unassigned_students > 0
    || s.teachers_without_students > 0;
  const todoAlDia = filas.length === 0 && nActionables === 0 && !haySetupPendiente;

  const kpis = [
    {
      label: "Estudiantes", valor: s.total_students ?? 0,
      sub: s.new_students_month ? `+${s.new_students_month} este mes` : null,
      Icono: Users, color: "text-brand-600 bg-brand-50",
      href: "/dashboard/admin/students-by-teacher",
    },
    {
      label: "Profesores", valor: s.total_teachers ?? 0,
      sub: s.teachers_without_students
        ? `${s.teachers_without_students} sin estudiantes` : null,
      Icono: GraduationCap, color: "text-violet-600 bg-violet-50",
      href: "/dashboard/admin/teachers-schedule",
    },
    {
      label: "Clases programadas", valor: s.scheduled_classes ?? 0,
      sub: clases.length ? `${clases.length} próximas` : null,
      Icono: Calendar, color: "text-sky-600 bg-sky-50",
      href: "/dashboard/admin/sessions",
    },
    {
      label: "Ingresos del mes", valor: formatMoney(incomeMonth, currency),
      sub: finance?.active_subscriptions != null
        ? `${finance.active_subscriptions} suscripciones activas`
        : null,
      Icono: DollarSign, color: "text-emerald-600 bg-emerald-50",
      href: "/dashboard/admin/finance", esTexto: true,
    },
  ];

  const accesos = [
    { href: "/dashboard/admin/enrollments", label: "Inscribir", Icono: UserPlus },
    { href: "/dashboard/admin/sessions", label: "Crear clase", Icono: CalendarPlus },
    { href: "/dashboard/admin/groups", label: "Crear grupo", Icono: Users },
    { href: "/dashboard/admin/payments", label: "Registrar pago", Icono: CreditCard },
    { href: "/dashboard/admin/users?role=teacher", label: "Crear profesor", Icono: GraduationCap },
    { href: "/dashboard/admin/audit", label: "Auditoría", Icono: LayoutGrid },
  ];

  return (
    <div className="space-y-5">
      {/* Saludo */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-800">
          {saludo()}
          {d?.user?.full_name ? `, ${d.user.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-slate-500 capitalize">{hoyLargo()}</p>
      </div>

      {/* KPIs: 2x2 móvil, fila desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-slate-200 hover:shadow-sm transition"
          >
            <div className={`w-9 h-9 rounded-xl ${k.color} flex items-center justify-center mb-2.5`}>
              <k.Icono className="w-4 h-4" strokeWidth={2.2} />
            </div>
            <p className={`font-black text-slate-800 leading-tight ${
              k.esTexto ? "text-lg md:text-xl" : "text-2xl md:text-3xl"
            }`}>
              {k.valor}
            </p>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">{k.label}</p>
            {k.sub && <p className="text-[11px] text-slate-400 mt-0.5">{k.sub}</p>}
          </Link>
        ))}
      </div>

      {/* Alertas accionables históricas: WhatsApp, resolver y posponer. */}
      <AlertasAdmin initialData={alertas.actionables} showAllClear={false} />

      {/* Pendientes que no pertenecen al motor de /admin/alerts */}
      {filas.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-slate-800 text-sm">Otros pendientes</h2>
            <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              {filas.length}
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {filas.map((f) => (
              <Link
                key={f.key}
                href={f.href}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition"
              >
                <div className={`w-9 h-9 rounded-xl ${f.color} flex items-center justify-center flex-shrink-0`}>
                  <f.Icono className="w-4 h-4" strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-800">
                    <span className="font-black">{f.n}</span>{" "}
                    <span className="text-slate-600">{f.texto}</span>
                  </p>
                  {f.gente.length > 0 && (
                    <p className="text-[11px] text-slate-400 truncate">
                      {f.gente.map((g: any) => g.name || g.full_name || g.student_name)
                        .filter(Boolean).join(" · ")}
                      {f.n > f.gente.length && ` y ${f.n - f.gente.length} más`}
                    </p>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Capacidades del dashboard anterior que no deben desaparecer. */}
      {haySetupPendiente && (
        <section className="grid md:grid-cols-2 gap-3">
          {s.total_modules === 0 && (
            <Link
              href="/dashboard/admin/content"
              className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 hover:border-amber-300 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-amber-600 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-amber-900">Falta configurar contenido académico</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  No hay módulos cargados; el progreso académico necesita contenido vinculado.
                </p>
                <p className="text-xs font-bold text-amber-700 mt-2">Ir a Contenido →</p>
              </div>
            </Link>
          )}

          {(s.unassigned_students > 0 || s.teachers_without_students > 0) && (
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-sky-600 flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-sky-900">Asignación de profesores</p>
                <p className="text-xs text-sky-800 mt-0.5">
                  {s.unassigned_students > 0 && `${s.unassigned_students} estudiante${s.unassigned_students === 1 ? "" : "s"} sin profesor`}
                  {s.unassigned_students > 0 && s.teachers_without_students > 0 && " · "}
                  {s.teachers_without_students > 0 && `${s.teachers_without_students} profesor${s.teachers_without_students === 1 ? "" : "es"} sin estudiantes`}
                </p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {s.unassigned_students > 0 && (
                    <button
                      onClick={autoAsignar}
                      disabled={autoAssignBusy}
                      className="text-xs font-bold px-3 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 transition"
                    >
                      {autoAssignBusy ? "Asignando..." : "Auto-asignar"}
                    </button>
                  )}
                  <Link
                    href="/dashboard/admin/enrollments"
                    className="text-xs font-bold px-3 py-2 rounded-lg bg-white border border-sky-200 text-sky-800 hover:bg-sky-100 transition"
                  >
                    Revisar inscripciones
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {todoAlDia && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-emerald-900 text-sm">Todo al día</p>
            <p className="text-xs text-emerald-700">No hay pendientes administrativos detectados ahora mismo.</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Próximas clases */}
        <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-500" />
            <h2 className="font-bold text-slate-800 text-sm">Próximas clases</h2>
            <Link
              href="/dashboard/admin/sessions"
              className="ml-auto text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Ver agenda
            </Link>
          </div>

          {clases.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 mb-1">No hay clases próximas.</p>
              <Link
                href="/dashboard/admin/sessions"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                Programar una clase
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {clases.map((c: any) => {
                const falta = faltan(c.starts_at_utc);
                return (
                  <div key={c.id} className="px-4 py-3">
                    <div className="flex items-start gap-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{c.title}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {[c.course_name, c.level_code, c.teacher_name]
                            .filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-slate-700">{hora12(c.starts_at_utc)}</p>
                        {falta && <p className="text-[11px] font-semibold text-sky-600">{falta}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {c.modality === "online" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                          <Video className="w-3 h-3" /> Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">
                          <MapPin className="w-3 h-3" /> Presencial
                        </span>
                      )}
                      {c.is_trial && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Prueba</span>
                      )}
                      {c.is_open_event && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Evento</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Salud académica */}
        <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h2 className="font-bold text-slate-800 text-sm">Salud académica</h2>
          </div>
          <div className="p-3 space-y-1">
            {[
              { l: "En riesgo académico", v: nRiesgo, cls: "text-rose-600",
                href: "/dashboard/admin/academic-overview" },
              { l: "Sin horario asignado", v: nSinHorario, cls: "text-amber-600",
                href: "/dashboard/admin/groups" },
              { l: "Listos para revisión final", v: nRevision, cls: "text-emerald-600",
                href: "/dashboard/admin/completions" },
              { l: "Certificados emitidos", v: s.certificates_issued ?? 0,
                cls: "text-slate-700", href: "/dashboard/admin/certificates" },
            ].map((x) => (
              <Link
                key={x.l}
                href={x.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition"
              >
                <span className="text-sm text-slate-600 flex-1">{x.l}</span>
                <span className={`text-lg font-black ${x.cls}`}>{x.v}</span>
              </Link>
            ))}
            {nRiesgo === 0 && (
              <p className="text-[11px] text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 mx-1">
                Ninguna matrícula en riesgo ahora mismo.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Finanzas */}
      <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <h2 className="font-bold text-slate-800 text-sm">Finanzas del mes</h2>
          <Link
            href="/dashboard/admin/finance"
            className="ml-auto text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            Ver resumen
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { l: "Ingresos", v: formatMoney(incomeMonth, currency), cls: "text-emerald-600" },
            { l: "Pendiente de cobro", v: formatMoney(finance?.pending_amount ?? 0, currency), cls: "text-amber-600" },
            { l: "Por verificar", v: nPagos, cls: "text-sky-600" },
            { l: "Suscripciones activas", v: finance?.active_subscriptions ?? 0, cls: "text-brand-600" },
          ].map((x) => (
            <div key={x.l} className="px-4 py-3 border-b md:border-b-0 border-r last:border-r-0 border-slate-50">
              <p className="text-[11px] text-slate-500">{x.l}</p>
              <p className={`text-lg font-black ${x.cls}`}>{x.v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Accesos rápidos */}
      <section>
        <h2 className="font-bold text-slate-800 text-sm mb-2.5 px-1">Accesos rápidos</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
          {accesos.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="bg-white rounded-2xl border border-slate-100 p-3 flex flex-col items-center gap-1.5 text-center hover:border-brand-200 hover:shadow-sm transition min-h-[76px] justify-center"
            >
              <a.Icono className="w-5 h-5 text-brand-600" strokeWidth={2.2} />
              <span className="text-[11px] font-semibold text-slate-600 leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
