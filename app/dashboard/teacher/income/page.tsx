"use client";
import { useEffect, useState } from "react";
import { teacherIncomeApi, safeArray, safeObj } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Button, Badge } from "@/components/ui";
import { Wallet, Calendar, CheckCircle2, Clock, TrendingUp, FileText, ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_NAMES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function TeacherIncomePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      teacherIncomeApi.current(year, month).catch((e: any) => ({ _err: e.message })),
      teacherIncomeApi.history().catch(() => []),
    ])
      .then(([d, h]) => {
        if (d?._err) { setErr(d._err); }
        else { setData(d); }
        setHistory(safeArray(h));
        setLoading(false);
      })
      .catch((e: any) => { setErr(e.message); setLoading(false); });
  }, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else setMonth(month + 1);
  };

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1);

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  const d = safeObj(data, {}) as any;
  const details = safeArray(d.classes_detail);
  const fmt = (n: number) => `RD$ ${(n || 0).toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      <PageHeader title="Mis ingresos" subtitle="Cálculo de lo que ganaste por clases dictadas" />

      {/* Navegación mes */}
      <Card className="mb-5">
        <CardBody>
          <div className="flex items-center justify-between">
            <Button onClick={prevMonth} variant="outline" size="sm">
              <ChevronLeft size={14} className="inline" /> Anterior
            </Button>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Período</p>
              <p className="text-lg font-extrabold text-slate-900">{MONTH_NAMES[month]} {year}</p>
              {isCurrentMonth && <p className="text-xs text-brand-600 font-semibold">Mes actual</p>}
              {isFuture && <p className="text-xs text-slate-400">Aún no empezó</p>}
            </div>
            <Button onClick={nextMonth} variant="outline" size="sm" disabled={isFuture}>
              Siguiente <ChevronRight size={14} className="inline" />
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Total grande */}
      <div className={`rounded-2xl p-6 md:p-8 mb-5 text-white relative overflow-hidden ${
        d.is_paid
          ? "bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800"
          : "bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800"
      }`}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="relative">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">
                {d.is_paid ? "✅ Pagado" : isCurrentMonth ? "Ingresos del mes (en curso)" : "Ingresos del período"}
              </p>
              <p className="text-4xl md:text-5xl font-black tracking-tight">{fmt(d.total_amount)}</p>
              <p className="text-sm text-white/80 mt-2">
                <strong>{d.classes_count || 0}</strong> {d.classes_count === 1 ? "clase" : "clases"} con asistencia tomada
              </p>
            </div>
            <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Wallet size={24} />
            </div>
          </div>

          {d.is_paid && d.paid_at && (
            <div className="mt-4 p-3 bg-white/10 rounded-lg text-xs">
              <p>
                <CheckCircle2 size={12} className="inline mr-1 -mt-0.5" />
                Pagado el {new Date(d.paid_at).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}
                {d.payment_method && <span> · Vía {d.payment_method}</span>}
                {d.reference && <span> · Ref: {d.reference}</span>}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Desglose por tipo */}
      <div className="grid md:grid-cols-3 gap-3 mb-5">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Grupales</p>
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{d.group_count || 0}</p>
            <p className="text-xs text-slate-500 mt-1">× {fmt(d?.rates?.group || 0)} = {fmt((d.group_count || 0) * (d?.rates?.group || 0))}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Privadas</p>
              <span className="text-2xl">👤</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{d.private_count || 0}</p>
            <p className="text-xs text-slate-500 mt-1">× {fmt(d?.rates?.private || 0)} = {fmt((d.private_count || 0) * (d?.rates?.private || 0))}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Eventos</p>
              <span className="text-2xl">🎫</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{d.event_count || 0}</p>
            <p className="text-xs text-slate-500 mt-1">× {fmt(d?.rates?.event || 0)} = {fmt((d.event_count || 0) * (d?.rates?.event || 0))}</p>
          </CardBody>
        </Card>
      </div>

      {/* Detalle por clase del período */}
      <Card className="mb-5">
        <CardBody>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
              <FileText size={18} />
              Detalle del período
            </h3>
            <span className="text-xs text-slate-500">{details.length} clases programadas</span>
          </div>
          {details.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No tienes clases en este período.</p>
          ) : (
            <div className="space-y-2">
              {details.map((c: any) => (
                <div key={c.session_id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                  c.counts_for_pay ? "border-emerald-200 bg-emerald-50" : "border-slate-100 bg-slate-50"
                }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    c.counts_for_pay ? "bg-emerald-500 text-white" : "bg-slate-300 text-slate-600"
                  }`}>
                    {c.counts_for_pay ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{c.title}</p>
                    <p className="text-xs text-slate-500">
                      {c.starts_at_utc && new Date(c.starts_at_utc).toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true })}
                      {" · "}
                      <Badge variant={c.type === "private" ? "info" : c.type === "event" ? "warning" : "brand"}>
                        {c.type === "group" ? "Grupal" : c.type === "private" ? "Privada" : "Evento"}
                      </Badge>
                    </p>
                    {!c.counts_for_pay && (
                      <p className="text-[10px] text-amber-600 mt-1">
                        {!c.already_ended ? "⏳ Aún no terminó" : !c.has_attendance ? "📋 Falta tomar asistencia" : ""}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-black ${c.counts_for_pay ? "text-emerald-700" : "text-slate-400"}`}>
                      {fmt(c.rate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Reglas de pago */}
      <Card className="mb-5 bg-blue-50 border-blue-200">
        <CardBody>
          <h4 className="font-bold text-blue-900 text-sm mb-2">📌 Cómo se calculan tus ingresos</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>✅ Solo se contabilizan clases con asistencia <strong>tomada por vos</strong></li>
            <li>✅ La clase debe haber <strong>terminado</strong> (pasó la hora de fin)</li>
            <li>❌ Las clases canceladas NO se pagan</li>
            <li>📅 El corte es mensual. El admin procesa los pagos al inicio del mes siguiente</li>
            <li>💵 Tarifas configuradas por el admin (no puedes modificarlas)</li>
          </ul>
        </CardBody>
      </Card>

      {/* Historial */}
      {history.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="font-extrabold text-slate-900 flex items-center gap-2 mb-3">
              <TrendingUp size={18} />
              Historial de pagos recibidos
            </h3>
            <div className="space-y-2">
              {history.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{MONTH_NAMES[p.period_month]} {p.period_year}</p>
                    <p className="text-xs text-slate-600">
                      {p.classes_count} clases · Pagado el {p.paid_at && new Date(p.paid_at).toLocaleDateString("es")}
                      {p.payment_method && <> · {p.payment_method}</>}
                      {p.reference && <> · Ref: {p.reference}</>}
                    </p>
                  </div>
                  <p className="font-black text-emerald-700 text-lg">{fmt(p.total_amount)}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </>
  );
}
