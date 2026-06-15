"use client";
import { useState, useEffect } from "react";
import { adminFinance, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Badge, Select } from "@/components/ui";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Calendar, ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";

export default function AdminFinancePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const load = () => {
    setLoading(true);
    Promise.all([
      adminFinance.summary(year, month),
      adminFinance.transactions(year, month),
    ])
      .then(([s, t]: any) => {
        setSummary(s);
        setTransactions(safeArray(t.transactions));
        setLoading(false);
      })
      .catch((e: any) => { setErr(e.message); setLoading(false); });
  };

  useEffect(load, [year, month]);

  if (loading && !summary) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  const fmt = (n: number) => `${summary?.currency || "RD$"} ${n.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;

  // Calcular años disponibles (5 atrás)
  const yearOptions = [];
  for (let y = now.getFullYear() + 1; y >= now.getFullYear() - 5; y--) yearOptions.push(y);

  return (
    <>
      <PageHeader
        title="💰 Dashboard Financiero"
        subtitle="Contabilidad del instituto: ingresos, gastos, pagos a profesores"
      />

      {/* Filtros año/mes */}
      <Card className="mb-5">
        <CardBody>
          <div className="flex items-center gap-3 flex-wrap">
            <Calendar size={20} className="text-brand-600" />
            <span className="font-bold text-slate-700">Período:</span>
            <Select value={String(month)} onChange={(e: any) => setMonth(parseInt(e.target.value))}>
              {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </Select>
            <Select value={String(year)} onChange={(e: any) => setYear(parseInt(e.target.value))}>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Cards principales */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {/* INGRESOS */}
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardBody>
            <div className="flex items-start justify-between mb-2">
              <TrendingUp size={24} className="text-emerald-600" />
              <Badge variant="success">Ingresos</Badge>
            </div>
            <p className="text-2xl font-black text-emerald-900">{fmt(summary?.income.total || 0)}</p>
            <p className="text-xs text-emerald-700 font-semibold mt-1">
              {summary?.income.count || 0} pagos cobrados
            </p>
          </CardBody>
        </Card>

        {/* GASTOS */}
        <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-white">
          <CardBody>
            <div className="flex items-start justify-between mb-2">
              <TrendingDown size={24} className="text-rose-600" />
              <Badge variant="danger">Gastos</Badge>
            </div>
            <p className="text-2xl font-black text-rose-900">{fmt(summary?.expenses.total || 0)}</p>
            <p className="text-xs text-rose-700 font-semibold mt-1">
              {summary?.expenses.count || 0} pagos a profesores
            </p>
          </CardBody>
        </Card>

        {/* BALANCE NETO */}
        <Card className={`${(summary?.balance.net || 0) >= 0 ? "border-blue-200 bg-gradient-to-br from-blue-50 to-white" : "border-orange-200 bg-gradient-to-br from-orange-50 to-white"}`}>
          <CardBody>
            <div className="flex items-start justify-between mb-2">
              <Wallet size={24} className={(summary?.balance.net || 0) >= 0 ? "text-blue-600" : "text-orange-600"} />
              <Badge variant={(summary?.balance.net || 0) >= 0 ? "info" : "warning"}>Balance neto</Badge>
            </div>
            <p className={`text-2xl font-black ${(summary?.balance.net || 0) >= 0 ? "text-blue-900" : "text-orange-900"}`}>
              {fmt(summary?.balance.net || 0)}
            </p>
            <p className={`text-xs font-semibold mt-1 ${(summary?.balance.net || 0) >= 0 ? "text-blue-700" : "text-orange-700"}`}>
              Cobrado - Pagado
            </p>
          </CardBody>
        </Card>

        {/* PROYECTADO */}
        <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-white">
          <CardBody>
            <div className="flex items-start justify-between mb-2">
              <DollarSign size={24} className="text-violet-600" />
              <Badge variant="brand">Proyectado</Badge>
            </div>
            <p className="text-2xl font-black text-violet-900">{fmt(summary?.balance.projected || 0)}</p>
            <p className="text-xs text-violet-700 font-semibold mt-1">
              Si cobras + pagas todo
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Pendientes (alertas) */}
      {((summary?.income.pending_count || 0) > 0 || (summary?.expenses.pending_count || 0) > 0) && (
        <div className="grid md:grid-cols-2 gap-3 mb-5">
          {(summary?.income.pending_count || 0) > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardBody>
                <div className="flex items-start gap-3">
                  <AlertCircle size={22} className="text-amber-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="font-bold text-amber-900">💵 Por cobrar</p>
                    <p className="text-2xl font-black text-amber-900 my-1">{fmt(summary?.income.pending_total || 0)}</p>
                    <p className="text-xs text-amber-800">
                      {summary?.income.pending_count} {summary?.income.pending_count === 1 ? "estudiante" : "estudiantes"} con pagos pendientes
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
          {(summary?.expenses.pending_count || 0) > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardBody>
                <div className="flex items-start gap-3">
                  <AlertCircle size={22} className="text-orange-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="font-bold text-orange-900">💸 Por pagar a profesores</p>
                    <p className="text-2xl font-black text-orange-900 my-1">{fmt(summary?.expenses.pending_total || 0)}</p>
                    <p className="text-xs text-orange-800">
                      {summary?.expenses.pending_count} {summary?.expenses.pending_count === 1 ? "profesor" : "profesores"} con saldo pendiente.
                      {" "}<a href="/dashboard/admin/teacher-payments" className="font-bold underline">Pagar ahora →</a>
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* Lista transacciones */}
      <Card>
        <CardBody>
          <h3 className="font-extrabold text-slate-900 text-lg mb-4">
            📋 Movimientos del período ({transactions.length})
          </h3>
          {transactions.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              No hay transacciones registradas en este período.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 -mx-3">
              {transactions.map(t => (
                <div key={t.id} className="px-3 py-3 flex items-center gap-3">
                  <div className={`p-2 rounded-full ${t.type === "income" ? "bg-emerald-100" : "bg-rose-100"}`}>
                    {t.type === "income" ? (
                      <ArrowUpCircle size={20} className="text-emerald-600" />
                    ) : (
                      <ArrowDownCircle size={20} className="text-rose-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{t.description}</p>
                    <p className="text-xs text-slate-500">
                      {t.date && new Date(t.date).toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" })}
                      {t.method && ` · ${t.method}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-black text-base ${t.type === "income" ? "text-emerald-700" : "text-rose-700"}`}>
                      {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                    </p>
                    {t.status === "paid" ? (
                      <Badge variant="success">Pagado</Badge>
                    ) : t.status === "pending" ? (
                      <Badge variant="warning">Pendiente</Badge>
                    ) : (
                      <Badge>{t.status}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Nota informativa */}
      <Card className="mt-5 border-slate-200 bg-slate-50">
        <CardBody>
          <p className="text-xs text-slate-600">
            <strong>💡 Tip:</strong> Los ingresos provienen de los pagos de estudiantes (sección Pagos).
            Los gastos provienen de los pagos a profesores (sección Pagos a Profesores).
            Cuando integres Stripe o pasarela de pago, los ingresos se registrarán automáticamente.
          </p>
        </CardBody>
      </Card>
    </>
  );
}
