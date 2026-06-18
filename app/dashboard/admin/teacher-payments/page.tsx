"use client";
import { useEffect, useState } from "react";
import { adminTeacherPayments, safeArray, safeObj } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Button, Modal, ConfirmModal, Input, Badge, showToast } from "@/components/ui";
import Avatar from "@/components/Avatar";
import { Wallet, ChevronLeft, ChevronRight, CheckCircle2, Clock, Edit, Settings, FileText, AlertTriangle } from "lucide-react";

const MONTH_NAMES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function AdminTeacherPaymentsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Detalle
  const [detailTeacher, setDetailTeacher] = useState<any>(null);
  const [detailData, setDetailData] = useState<any>(null);

  // Marcar como pagado
  const [paymentModal, setPaymentModal] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({ payment_method: "transferencia", reference: "", notes: "" });

  // Tarifas modal
  const [ratesModal, setRatesModal] = useState<any>(null);
  const [ratesForm, setRatesForm] = useState({ rate_group: 500, rate_private: 1000, rate_event: 750 });

  // Revertir pago
  const [revertModal, setRevertModal] = useState<any>(null);

  const load = () => {
    setLoading(true);
    adminTeacherPayments.list(year, month)
      .then((d: any) => { setData(d); setLoading(false); })
      .catch((e: any) => { setErr(e.message); setLoading(false); });
  };
  useEffect(load, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else setMonth(month + 1);
  };

  const openDetail = async (t: any) => {
    setDetailTeacher(t);
    setDetailData(null);
    try {
      const r = await adminTeacherPayments.detail(t.teacher_id, year, month);
      setDetailData(r);
    } catch (e: any) { showToast("error", e.message); }
  };

  const openPayment = (t: any) => {
    setPaymentModal(t);
    setPaymentForm({ payment_method: "transferencia", reference: "", notes: "" });
  };
  const submitPayment = async () => {
    if (!paymentModal) return;
    try {
      await adminTeacherPayments.markPaid({
        teacher_id: paymentModal.teacher_id, year, month,
        payment_method: paymentForm.payment_method,
        reference: paymentForm.reference || undefined,
        notes: paymentForm.notes || undefined,
      });
      showToast("success", `✅ Pago de ${paymentModal.teacher_name} registrado`);
      setPaymentModal(null);
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  const openRates = (t: any) => {
    setRatesModal(t);
    setRatesForm({
      rate_group: t.rate_group || 500,
      rate_private: t.rate_private || 1000,
      rate_event: t.rate_event || 750,
    });
  };
  const submitRates = async () => {
    if (!ratesModal) return;
    try {
      await adminTeacherPayments.updateRates(ratesModal.teacher_id, ratesForm);
      showToast("success", "Tarifas actualizadas");
      setRatesModal(null);
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  const doRevert = async () => {
    if (!revertModal) return;
    try {
      await adminTeacherPayments.delete(revertModal.payment_id);
      showToast("success", "Pago revertido");
      setRevertModal(null);
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  const d = safeObj(data, {}) as any;
  const items = safeArray(d.items);
  const summary = safeObj(d.summary, {}) as any;
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1);

  const fmt = (n: number) => `RD$ ${(n || 0).toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      <PageHeader title="Pagos a profesores" subtitle="Calcula y registra los pagos del período" />

      {/* V2.9: Banner explicativo - cómo funciona el sistema */}
      <Card className="mb-4 border-2 border-blue-200 bg-blue-50">
        <CardBody>
          <div className="flex items-start gap-3 flex-wrap">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-lg">💡</span>
            </div>
            <div className="flex-1 min-w-[200px]">
              <p className="font-bold text-blue-900 mb-1">¿Cómo funciona?</p>
              <p className="text-sm text-blue-800">
                El sistema calcula automáticamente los pagos del mes en base a las clases <strong>completadas</strong> por
                cada profesor (no las canceladas) y las tarifas configuradas. Marcas el pago una vez lo hayas hecho
                por banco/efectivo — esto registra el gasto en <strong>Contabilidad</strong>.
              </p>
              <ul className="mt-2 text-xs text-blue-700 list-disc list-inside space-y-0.5">
                <li><strong>Pendiente</strong>: aún no se ha pagado al profesor este mes</li>
                <li><strong>Pagado</strong>: ya se registró el pago — aparece como gasto</li>
                <li><strong>⚙️ Tarifas</strong>: configura cuánto cobra cada profesor por tipo de clase</li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>

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

      {/* Resumen */}
      <div className="grid md:grid-cols-3 gap-3 mb-5">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">A pagar</p>
            <Clock size={20} className="text-amber-600" />
          </div>
          <p className="text-3xl font-black text-amber-900">{fmt(summary.total_to_pay)}</p>
          <p className="text-xs text-amber-700 mt-1">{summary.teachers_pending || 0} profesores pendientes</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Pagado</p>
            <CheckCircle2 size={20} className="text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-900">{fmt(summary.total_paid)}</p>
          <p className="text-xs text-emerald-700 mt-1">{summary.teachers_paid || 0} profesores pagados</p>
        </div>

        <div className="bg-gradient-to-br from-brand-50 to-blue-50 border border-brand-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Total mes</p>
            <Wallet size={20} className="text-brand-600" />
          </div>
          <p className="text-3xl font-black text-brand-900">{fmt(summary.total_to_pay + summary.total_paid)}</p>
          <p className="text-xs text-brand-700 mt-1">{items.length} profesores</p>
        </div>
      </div>

      {/* Lista de profes */}
      <Card>
        <CardBody className="p-0">
          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p>No hay profesores activos en este período.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((t: any) => (
                <div key={t.teacher_id} className="p-4 flex items-center gap-3 hover:bg-slate-50 transition flex-wrap">
                  <Avatar name={t.teacher_name} gender={t.gender} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold">{t.teacher_name}</p>
                      {t.is_paid && <Badge variant="success">✅ Pagado</Badge>}
                      {!t.is_paid && t.total_amount > 0 && <Badge variant="warning">🟡 Pendiente</Badge>}
                      {t.total_amount === 0 && <Badge>Sin clases</Badge>}
                    </div>
                    <p className="text-xs text-slate-500">
                      {t.classes_count} clases · Grupal {t.group_count} · Privada {t.private_count} · Evento {t.event_count}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Tarifas: {fmt(t.rate_group)} / {fmt(t.rate_private)} / {fmt(t.rate_event)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-900">{fmt(t.total_amount)}</p>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => openDetail(t)}>
                      <FileText size={12} className="inline mr-1" /> Detalle
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openRates(t)}>
                      <Settings size={12} className="inline mr-1" /> Tarifas
                    </Button>
                    {t.is_paid ? (
                      <Button size="sm" variant="outline" onClick={() => setRevertModal(t)} className="text-red-600 border-red-200">
                        Revertir
                      </Button>
                    ) : t.total_amount > 0 ? (
                      <Button size="sm" onClick={() => openPayment(t)}>
                        💰 Marcar pagado
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Info card */}
      <Card className="mt-5 bg-blue-50 border-blue-200">
        <CardBody>
          <h4 className="font-bold text-blue-900 text-sm mb-2">📌 Cómo funciona el pago a profesores</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>✅ Solo se cuentan clases con <strong>asistencia tomada</strong> y que ya <strong>terminaron</strong></li>
            <li>✅ Las clases canceladas NO se pagan</li>
            <li>✅ Cada profesor tiene tarifas independientes (Grupal / Privada / Evento)</li>
            <li>✅ El sistema calcula automáticamente. Vos solo registrás cuando hayas hecho la transferencia</li>
            <li>⚠️ Por ahora <strong>las transferencias las haces manualmente</strong> (Banco / Efectivo). Stripe lo agregamos en V2.4+</li>
          </ul>
        </CardBody>
      </Card>

      {/* Modal detalle */}
      <Modal open={!!detailTeacher} onClose={() => { setDetailTeacher(null); setDetailData(null); }} title={`Detalle: ${detailTeacher?.teacher_name || ""}`} size="lg">
        {!detailData ? (
          <p className="text-sm text-slate-400 text-center py-6">Cargando...</p>
        ) : (
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-brand-50 to-blue-50 rounded-xl p-4 text-center">
              <p className="text-xs font-bold uppercase text-brand-700">Total del período</p>
              <p className="text-3xl font-black text-brand-900 my-1">{fmt(detailData.total_amount)}</p>
              <p className="text-xs text-brand-700">
                {detailData.classes_count} clases pagables ·
                G {detailData.group_count} ·
                P {detailData.private_count} ·
                E {detailData.event_count}
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto space-y-1">
              {safeArray(detailData.classes_detail).map((c: any) => (
                <div key={c.session_id} className={`p-2 rounded border ${c.counts_for_pay ? "border-emerald-200 bg-emerald-50" : "border-slate-100 bg-slate-50"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{c.title}</p>
                      <p className="text-[10px] text-slate-500">
                        {c.starts_at_utc && new Date(c.starts_at_utc).toLocaleString("es", { dateStyle: "short", timeStyle: "short" })}
                        {" · "}
                        {c.type} {c.has_attendance ? "· asist✓" : "· sin asist"}
                      </p>
                    </div>
                    <p className={`text-sm font-bold ${c.counts_for_pay ? "text-emerald-700" : "text-slate-400"}`}>
                      {fmt(c.rate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal marcar pagado */}
      <Modal open={!!paymentModal} onClose={() => setPaymentModal(null)} title={`Registrar pago: ${paymentModal?.teacher_name || ""}`}>
        <div className="space-y-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
            <p className="text-xs font-bold text-emerald-700 uppercase">Monto a pagar</p>
            <p className="text-3xl font-black text-emerald-900">{fmt(paymentModal?.total_amount || 0)}</p>
            <p className="text-xs text-emerald-700">{paymentModal?.classes_count} clases · {MONTH_NAMES[month]} {year}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Método de pago</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: "transferencia", l: "🏦 Transferencia" },
                { v: "efectivo", l: "💵 Efectivo" },
                { v: "cheque", l: "📝 Cheque" },
              ].map((m) => (
                <button
                  key={m.v}
                  type="button"
                  onClick={() => setPaymentForm({ ...paymentForm, payment_method: m.v })}
                  className={`p-2 rounded-lg border-2 text-xs font-bold ${
                    paymentForm.payment_method === m.v ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200"
                  }`}
                >
                  {m.l}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Referencia (opcional)"
            placeholder="Ej: TRX-12345"
            value={paymentForm.reference}
            onChange={(e: any) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Notas (opcional)</label>
            <textarea
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              rows={2}
              placeholder="Comentarios internos..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            ⚠️ Marcá como pagado SOLO después de hacer la transferencia. Esta acción notifica al profesor.
          </div>

          <Button onClick={submitPayment} className="w-full" size="lg">
            ✅ Confirmar y registrar pago
          </Button>
        </div>
      </Modal>

      {/* Modal tarifas */}
      <Modal open={!!ratesModal} onClose={() => setRatesModal(null)} title={`Tarifas: ${ratesModal?.teacher_name || ""}`}>
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            💡 Estas tarifas se aplican a clases NUEVAS. Los períodos ya pagados no se recalculan.
          </div>

          <Input
            label="Tarifa por clase GRUPAL (RD$)"
            type="number" step={0.01}
            value={ratesForm.rate_group}
            onChange={(e: any) => setRatesForm({ ...ratesForm, rate_group: parseFloat(e.target.value) || 0 })}
          />
          <Input
            label="Tarifa por clase PRIVADA 1-a-1 (RD$)"
            type="number" step={0.01}
            value={ratesForm.rate_private}
            onChange={(e: any) => setRatesForm({ ...ratesForm, rate_private: parseFloat(e.target.value) || 0 })}
          />
          <Input
            label="Tarifa por EVENTO/Workshop (RD$)"
            type="number" step={0.01}
            value={ratesForm.rate_event}
            onChange={(e: any) => setRatesForm({ ...ratesForm, rate_event: parseFloat(e.target.value) || 0 })}
          />

          <Button onClick={submitRates} className="w-full">
            Guardar tarifas
          </Button>
        </div>
      </Modal>

      {/* Confirm revert */}
      <ConfirmModal
        open={!!revertModal}
        onClose={() => setRevertModal(null)}
        onConfirm={doRevert}
        title="¿Revertir este pago?"
        message={`Vas a revertir el pago de ${revertModal?.teacher_name} por ${fmt(revertModal?.total_amount || 0)}. El sistema lo marcará como pendiente de nuevo.`}
        confirmLabel="Sí, revertir"
        confirmVariant="danger"
      />
    </>
  );
}
