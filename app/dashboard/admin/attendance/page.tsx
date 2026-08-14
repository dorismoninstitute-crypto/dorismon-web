"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, showToast } from "@/components/ui";
import { ClipboardCheck, ClipboardX, Bell, AlertTriangle, Check, X, Clock } from "lucide-react";

/**
 * V3.9.40 — Asistencia vista desde el admin.
 *
 * ANTES solo se veía entrando estudiante por estudiante. No había forma de
 * saber qué clases quedaron sin lista — que son justamente las que NO se le
 * pagan al profesor.
 */

const ESTADOS: Record<string, { label: string; cls: string }> = {
  present: { label: "Presente", cls: "bg-emerald-100 text-emerald-700" },
  absent: { label: "Ausente", cls: "bg-rose-100 text-rose-700" },
  excused: { label: "Justificado", cls: "bg-amber-100 text-amber-700" },
  late: { label: "Tarde", cls: "bg-sky-100 text-sky-700" },
};

function fecha(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export default function AsistenciaPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [dias, setDias] = useState(14);
  const [filtro, setFiltro] = useState<"todas" | "sin_lista">("todas");
  const [abierta, setAbierta] = useState<string | null>(null);
  const [avisando, setAvisando] = useState(false);

  const cargar = async (d = dias) => {
    setLoading(true);
    try {
      const r = await api(`/admin/attendance-overview?days=${d}`, { auth: true });
      setData(r);
      setErr("");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(dias); /* eslint-disable-next-line */ }, [dias]);

  const avisar = async (teacherId?: string, nombre?: string) => {
    const texto = teacherId
      ? `¿Enviarle un recordatorio a ${nombre} para que pase la lista?`
      : "¿Avisarle a TODOS los profesores que tienen clases sin lista?";
    if (!confirm(texto)) return;
    setAvisando(true);
    try {
      const r: any = await api("/admin/remind-attendance", {
        method: "POST", auth: true,
        body: { days: dias, ...(teacherId ? { teacher_id: teacherId } : {}) },
      });
      showToast("success", r.mensaje || "Aviso enviado");
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setAvisando(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  const t = data?.totals || {};
  const faltantes = data?.teachers_missing_attendance || [];
  const clases = (data?.classes || []).filter((c: any) =>
    filtro === "todas" ? true : !c.has_attendance
  );

  return (
    <div>
      <PageHeader
        title="Asistencia"
        subtitle="Quién asistió, quién no, y qué clases quedaron sin lista."
      />

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Card><CardBody className="py-4">
          <p className="text-xs text-slate-500 mb-1">Clases dadas</p>
          <p className="text-2xl font-bold text-slate-800">{t.classes ?? 0}</p>
        </CardBody></Card>
        <Card><CardBody className="py-4">
          <p className="text-xs text-slate-500 mb-1">Con lista pasada</p>
          <p className="text-2xl font-bold text-emerald-600">{t.with_attendance ?? 0}</p>
        </CardBody></Card>
        <Card><CardBody className="py-4">
          <p className="text-xs text-slate-500 mb-1">Sin lista</p>
          <p className={`text-2xl font-bold ${t.without_attendance ? "text-rose-600" : "text-slate-400"}`}>
            {t.without_attendance ?? 0}
          </p>
        </CardBody></Card>
        <Card><CardBody className="py-4">
          <p className="text-xs text-slate-500 mb-1">Asistencia promedio</p>
          <p className="text-2xl font-bold text-slate-800">
            {t.attendance_rate != null ? `${t.attendance_rate}%` : "—"}
          </p>
        </CardBody></Card>
      </div>

      {/* Profesores que no pasaron lista */}
      {faltantes.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-5">
          <div className="flex items-start gap-3 mb-3 flex-wrap">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-[200px]">
              <p className="font-bold text-amber-900 text-sm">
                {faltantes.length === 1
                  ? "1 profesor tiene clases sin pasar lista"
                  : `${faltantes.length} profesores tienen clases sin pasar lista`}
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                Sin la lista, esas clases <strong>no cuentan para su pago</strong>.
              </p>
            </div>
            <button
              onClick={() => avisar()}
              disabled={avisando}
              className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition"
            >
              <Bell className="w-3.5 h-3.5" />
              Avisarles a todos
            </button>
          </div>

          <div className="space-y-2">
            {faltantes.map((p: any) => (
              <div key={p.teacher_id} className="bg-white rounded-xl px-3 py-2.5 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[140px]">
                  <p className="text-sm font-semibold text-slate-800">{p.teacher_name}</p>
                  <p className="text-xs text-slate-500">
                    {p.count} clase{p.count === 1 ? "" : "s"} sin lista
                  </p>
                </div>
                <button
                  onClick={() => avisar(p.teacher_id, p.teacher_name)}
                  disabled={avisando}
                  className="inline-flex items-center gap-1.5 border border-amber-300 text-amber-700 hover:bg-amber-50 text-xs font-bold px-3 py-2 rounded-lg transition disabled:opacity-50"
                >
                  <Bell className="w-3.5 h-3.5" />
                  Recordarle
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        {[{ k: "todas", l: "Todas las clases" }, { k: "sin_lista", l: "Solo sin lista" }].map((f) => (
          <button
            key={f.k}
            onClick={() => setFiltro(f.k as any)}
            className={`text-sm font-semibold px-4 py-2 rounded-xl border-2 transition ${
              filtro === f.k
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {f.l}
          </button>
        ))}
        <select
          value={dias}
          onChange={(e) => setDias(Number(e.target.value))}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white ml-auto"
        >
          <option value={7}>Últimos 7 días</option>
          <option value={14}>Últimos 14 días</option>
          <option value={30}>Últimos 30 días</option>
          <option value={90}>Últimos 3 meses</option>
        </select>
      </div>

      {/* Listado */}
      {clases.length === 0 ? (
        <Card><CardBody>
          <p className="text-sm text-slate-500 text-center py-10">
            {filtro === "sin_lista"
              ? "Todas las clases tienen su lista pasada. 🎉"
              : "No hay clases en este periodo."}
          </p>
        </CardBody></Card>
      ) : (
        <div className="space-y-2">
          {clases.map((c: any) => (
            <Card key={c.id}>
              <CardBody className="py-3">
                <div className="flex items-center gap-3 flex-wrap">
                  {c.has_attendance
                    ? <ClipboardCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    : <ClipboardX className="w-5 h-5 text-rose-500 flex-shrink-0" />}

                  <div className="flex-1 min-w-[160px]">
                    <p className="text-sm font-semibold text-slate-800">{c.title}</p>
                    <p className="text-xs text-slate-500">
                      {fecha(c.starts_at_utc)}
                      {c.teacher_name && ` · ${c.teacher_name}`}
                    </p>
                  </div>

                  {c.has_attendance ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        {c.present} presente{c.present === 1 ? "" : "s"}
                      </span>
                      {c.absent > 0 && (
                        <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg">
                          {c.absent} ausente{c.absent === 1 ? "" : "s"}
                        </span>
                      )}
                      {c.excused > 0 && (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                          {c.excused} justificado{c.excused === 1 ? "" : "s"}
                        </span>
                      )}
                      <button
                        onClick={() => setAbierta(abierta === c.id ? null : c.id)}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                      >
                        {abierta === c.id ? "Ocultar" : "Ver quiénes"}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg">
                      ⚠️ Sin lista — no se paga
                    </span>
                  )}
                </div>

                {abierta === c.id && c.students?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                    {c.students.map((s: any) => {
                      const e = ESTADOS[s.state] || { label: s.state, cls: "bg-slate-100 text-slate-600" };
                      return (
                        <div key={s.student_id} className="flex items-center gap-2 text-sm">
                          <span className="flex-1 text-slate-700 truncate">{s.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${e.cls}`}>
                            {e.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
