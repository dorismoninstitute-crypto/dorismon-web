"use client";
import { useEffect, useState } from "react";
import { adminApi, adminPayments, adminHelpers, adminPlans, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Input, Select, Modal, showToast } from "@/components/ui";

export default function AdminPaymentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const [students, setStudents] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [form, setForm] = useState({
    student_id: "", plan_id: "", amount: 0, currency: "USD",
    method: "cash", reference: "",
  });

  const load = () => {
    setLoading(true);
    adminApi.payments()
      .then(d => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const openCreate = async () => {
    try {
      const [s, p] = await Promise.all([
        adminHelpers.studentsSimple(),
        adminPlans.list(),
      ]);
      setStudents(safeArray(s));
      setPlans(safeArray(p));
      setForm({ student_id: "", plan_id: "", amount: 0, currency: "USD", method: "cash", reference: "" });
      setShowCreate(true);
    } catch (e: any) { showToast("error", e.message); }
  };

  const create = async () => {
    if (!form.student_id || !form.amount) {
      showToast("error", "Estudiante y monto son requeridos");
      return;
    }
    try {
      const body: any = {
        student_id: form.student_id,
        amount: form.amount,
        currency: form.currency,
        method: form.method,
      };
      if (form.plan_id) body.plan_id = parseInt(form.plan_id);
      if (form.reference) body.reference = form.reference;
      await adminPayments.create(body);
      showToast("success", "Pago registrado. El estudiante fue notificado.");
      setShowCreate(false);
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  // Cuando elige un plan, autocompleta el monto
  const onPlanChange = (planId: string) => {
    setForm({ ...form, plan_id: planId });
    if (planId) {
      const p = plans.find(pl => pl.id === parseInt(planId));
      if (p) setForm(prev => ({ ...prev, plan_id: planId, amount: parseFloat(p.price) }));
    }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader
        title="Pagos"
        subtitle={`${items.length} transacciones registradas`}
        action={<Button onClick={openCreate}>+ Registrar pago</Button>}
      />

      {items.length === 0 ? (
        <EmptyState
          icon="💰"
          title="Sin pagos registrados"
          description="Cuando registres un pago manualmente, aparecerá aquí."
        />
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {items.map((p: any) => (
                <div key={p.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{p.student_name}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(p.created_at).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}{p.method || "—"}
                      {p.reference && ` · Ref: ${p.reference}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg">${parseFloat(p.amount).toFixed(2)} {p.currency}</span>
                    <Badge variant={
                      p.status === "paid" ? "success" :
                      p.status === "pending" ? "warning" :
                      p.status === "failed" ? "danger" : "default"
                    }>{p.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Modal Registrar pago */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Registrar pago manual" size="lg">
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            💡 Usá esto para registrar pagos que recibiste por <strong>transferencia, depósito o efectivo</strong>.
            El estudiante recibirá una notificación de confirmación.
          </div>
          <Select label="Estudiante *" value={form.student_id} onChange={(e: any) => setForm({ ...form, student_id: e.target.value })}>
            <option value="">Seleccionar...</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </Select>
          <Select label="Plan (opcional, autocompleta el monto)" value={form.plan_id} onChange={(e: any) => onPlanChange(e.target.value)}>
            <option value="">Sin plan asociado</option>
            {plans.map(p => <option key={p.id} value={p.id}>{p.name} — ${parseFloat(p.price).toFixed(2)}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Monto *" type="number" step="0.01" value={form.amount} onChange={(e: any) => setForm({ ...form, amount: parseFloat(e.target.value) })} />
            <Select label="Moneda" value={form.currency} onChange={(e: any) => setForm({ ...form, currency: e.target.value })}>
              <option value="USD">USD</option>
              <option value="DOP">DOP</option>
            </Select>
          </div>
          <Select label="Método de pago" value={form.method} onChange={(e: any) => setForm({ ...form, method: e.target.value })}>
            <option value="cash">Efectivo</option>
            <option value="transfer">Transferencia bancaria</option>
            <option value="deposit">Depósito</option>
            <option value="card">Tarjeta</option>
            <option value="other">Otro</option>
          </Select>
          <Input label="Referencia (recibo, número de transferencia, etc.)" value={form.reference} onChange={(e: any) => setForm({ ...form, reference: e.target.value })} placeholder="Ej: Recibo-001, Transfer-XYZ123" />
          <Button onClick={create} className="w-full" size="lg" disabled={!form.student_id || !form.amount}>
            Registrar pago
          </Button>
        </div>
      </Modal>
    </>
  );
}
