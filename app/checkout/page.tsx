"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { studentPayments, adminPlans, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Badge, Button, Input, Select, Modal, showToast } from "@/components/ui";
import { CreditCard, Upload, CheckCircle2, AlertCircle, Building2, Copy, Sparkles } from "lucide-react";
import Link from "next/link";

const BANKS_RD = [
  "BHD León", "Banreservas", "Popular", "Scotiabank", "Banco Santa Cruz",
  "Banco Vimenca", "Banco Caribe", "Banesco", "Citibank", "APAP", "Otro",
];

function CheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planIdFromUrl = searchParams.get("plan");

  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);  // 1: elegir plan, 2: instrucciones, 3: subir comprobante
  const [showComingSoon, setShowComingSoon] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    bank_origin: "",
    payment_date: new Date().toISOString().split("T")[0],
    reference_number: "",
    amount: 0,
    method: "bank_transfer",
    modality: "online",
    voucher_url: "",
    student_notes: "",
  });

  useEffect(() => {
    Promise.all([
      adminPlans.list().catch(() => []),
      studentPayments.bankAccounts(),
    ])
      .then(([p, b]: any) => {
        const list = safeArray(p);
        setPlans(list);
        setBankAccounts(safeArray(b));
        if (planIdFromUrl) {
          const found = list.find((x: any) => String(x.id) === planIdFromUrl);
          if (found) {
            setSelectedPlan(found);
            setForm(f => ({ ...f, amount: parseFloat(found.price) }));
            setStep(2);
          }
        }
        setLoading(false);
      })
      .catch((e: any) => { setErr(e.message); setLoading(false); });
  }, [planIdFromUrl]);

  const selectPlan = (plan: any) => {
    setSelectedPlan(plan);
    setForm({ ...form, amount: parseFloat(plan.price) });
    setStep(2);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast("success", `${label} copiado`);
  };

  const handleVoucherUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("error", "El archivo debe ser una imagen");
      return;
    }
    if (file.size > 1024 * 1024) {
      showToast("error", "Imagen muy pesada (max 1MB). Compress con tinypng.com");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm({ ...form, voucher_url: ev.target?.result as string });
      showToast("success", "Comprobante cargado");
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!selectedPlan) { showToast("error", "Selecciona un plan"); return; }
    if (!form.bank_origin || !form.payment_date || !form.reference_number || !form.voucher_url) {
      showToast("error", "Completa todos los campos y sube el comprobante");
      return;
    }
    setSubmitting(true);
    try {
      await studentPayments.submitProof({
        plan_id: selectedPlan.id,
        amount: form.amount,
        payment_date: form.payment_date,
        reference_number: form.reference_number,
        voucher_url: form.voucher_url,
        bank_origin: form.bank_origin,
        method: form.method,
        modality: form.modality,
        student_notes: form.student_notes,
      });
      // Redirigir a confirmación
      router.push("/checkout/confirmation");
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  const fmt = (n: number) => `RD$ ${n.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6 text-xs font-bold">
          {[
            { n: 1, l: "Plan" },
            { n: 2, l: "Pago" },
            { n: 3, l: "Comprobante" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= s.n ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500"
              }`}>{s.n}</div>
              <span className={step >= s.n ? "text-slate-900" : "text-slate-400"}>{s.l}</span>
              {i < 2 && <div className="w-8 h-0.5 bg-slate-200" />}
            </div>
          ))}
        </div>

        {/* PASO 1: Elegir plan */}
        {step === 1 && (
          <>
            <PageHeader title="🎓 Elige tu plan" subtitle="Inscríbete y empieza tus clases de inglés" />

            <div className="grid md:grid-cols-2 gap-3 mb-5">
              {plans.map(p => (
                <Card key={p.id} className="hover:shadow-lg transition cursor-pointer">
                  <CardBody>
                    <div className="text-center">
                      <h3 className="font-black text-lg text-slate-900">{p.name}</h3>
                      <p className="text-3xl font-black text-brand-600 my-3">{fmt(parseFloat(p.price))}</p>
                      <p className="text-xs text-slate-500 mb-3">por {p.billing_cycle || "mes"}</p>
                      {p.description && <p className="text-sm text-slate-600 mb-4">{p.description}</p>}
                      <Button onClick={() => selectPlan(p)} className="w-full">
                        Elegir este plan →
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardBody>
                <div className="flex items-start gap-3">
                  <Sparkles className="text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-blue-900">¿No estás listo para pagar?</p>
                    <p className="text-sm text-blue-800 mt-1">
                      Reserva una <strong>clase de prueba GRATIS</strong> para conocer nuestros profesores.
                    </p>
                    <Link href="/dashboard/student/trial" className="inline-block mt-2">
                      <Button variant="outline" size="sm">🎁 Reservar clase gratis</Button>
                    </Link>
                  </div>
                </div>
              </CardBody>
            </Card>
          </>
        )}

        {/* PASO 2: Datos de pago + métodos */}
        {step === 2 && selectedPlan && (
          <>
            <PageHeader title="💳 Realiza tu pago" subtitle={`Plan: ${selectedPlan.name} · ${fmt(parseFloat(selectedPlan.price))}`} />

            {/* Métodos de pago */}
            <Card className="mb-4">
              <CardBody>
                <h3 className="font-bold mb-3 text-slate-900">Elige cómo pagar</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    onClick={() => {}}
                    className="p-3 border-2 border-brand-500 bg-brand-50 rounded-lg text-center"
                  >
                    <Building2 size={28} className="mx-auto text-brand-600 mb-1" />
                    <p className="text-xs font-bold text-brand-900">Transferencia</p>
                    <Badge variant="success" className="mt-1">Disponible</Badge>
                  </button>
                  <button
                    onClick={() => setShowComingSoon("Stripe")}
                    className="p-3 border-2 border-slate-200 hover:border-slate-300 rounded-lg text-center transition"
                  >
                    <CreditCard size={28} className="mx-auto text-slate-500 mb-1" />
                    <p className="text-xs font-bold text-slate-700">Stripe</p>
                    <Badge className="mt-1">Próximamente</Badge>
                  </button>
                  <button
                    onClick={() => setShowComingSoon("PayPal")}
                    className="p-3 border-2 border-slate-200 hover:border-slate-300 rounded-lg text-center transition"
                  >
                    <CreditCard size={28} className="mx-auto text-slate-500 mb-1" />
                    <p className="text-xs font-bold text-slate-700">PayPal</p>
                    <Badge className="mt-1">Próximamente</Badge>
                  </button>
                  <button
                    onClick={() => setShowComingSoon("Azul")}
                    className="p-3 border-2 border-slate-200 hover:border-slate-300 rounded-lg text-center transition"
                  >
                    <CreditCard size={28} className="mx-auto text-slate-500 mb-1" />
                    <p className="text-xs font-bold text-slate-700">Azul</p>
                    <Badge className="mt-1">Próximamente</Badge>
                  </button>
                </div>
              </CardBody>
            </Card>

            {/* Cuentas bancarias */}
            <Card className="mb-4">
              <CardBody>
                <h3 className="font-bold mb-3 text-slate-900">
                  🏦 Transfiere a UNA de estas cuentas
                </h3>
                {bankAccounts.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle size={32} className="mx-auto text-amber-500 mb-2" />
                    <p className="text-sm text-slate-600">No hay cuentas bancarias configuradas.</p>
                    <p className="text-xs text-slate-500">Contacta al administrador.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bankAccounts.map(b => (
                      <div key={b.id} className="border-2 border-slate-200 rounded-lg p-3 bg-white hover:border-brand-300 transition">
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                          <p className="font-black text-slate-900">{b.bank_name}</p>
                          <Badge variant={b.account_type === "savings" ? "info" : "brand"}>
                            {b.account_type_label}
                          </Badge>
                        </div>
                        <div className="grid md:grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-xs text-slate-500">Número:</span>
                            <button onClick={() => copyToClipboard(b.account_number, "Número")} className="block font-mono font-bold text-slate-900 hover:text-brand-600 transition">
                              {b.account_number} <Copy size={12} className="inline ml-1" />
                            </button>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500">Titular:</span>
                            <p className="font-semibold text-slate-900">{b.holder_name}</p>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500">Cédula:</span>
                            <button onClick={() => copyToClipboard(b.holder_document, "Cédula")} className="block font-mono font-semibold text-slate-700 hover:text-brand-600">
                              {b.holder_document} <Copy size={12} className="inline ml-1" />
                            </button>
                          </div>
                        </div>
                        {b.notes && <p className="text-xs text-slate-500 italic mt-2">{b.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded mt-4">
                  <p className="font-bold text-amber-900 text-sm">⚠️ IMPORTANTE</p>
                  <p className="text-xs text-amber-800 mt-1">
                    Monto a transferir: <strong>{fmt(parseFloat(selectedPlan.price))}</strong>
                  </p>
                  <p className="text-xs text-amber-800">
                    Guarda el comprobante o screenshot — lo subirás en el siguiente paso.
                  </p>
                </div>
              </CardBody>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                ← Cambiar plan
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1" disabled={bankAccounts.length === 0}>
                Ya transferí, subir comprobante →
              </Button>
            </div>
          </>
        )}

        {/* PASO 3: Subir comprobante */}
        {step === 3 && selectedPlan && (
          <>
            <PageHeader title="📎 Sube tu comprobante" subtitle="Datos del pago realizado" />

            <Card>
              <CardBody>
                <div className="space-y-3">
                  <Select
                    label="Banco desde donde transferiste *"
                    value={form.bank_origin}
                    onChange={(e: any) => setForm({ ...form, bank_origin: e.target.value })}
                  >
                    <option value="">Seleccionar...</option>
                    {BANKS_RD.map(b => <option key={b} value={b}>{b}</option>)}
                  </Select>

                  <div className="grid md:grid-cols-2 gap-3">
                    <Input
                      label="Fecha del pago *"
                      type="date"
                      value={form.payment_date}
                      onChange={(e: any) => setForm({ ...form, payment_date: e.target.value })}
                    />
                    <Input
                      label="Monto enviado (RD$) *"
                      type="number"
                      value={form.amount}
                      onChange={(e: any) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <Input
                    label="Número de referencia / transacción *"
                    value={form.reference_number}
                    onChange={(e: any) => setForm({ ...form, reference_number: e.target.value })}
                    placeholder="Ej: TXN-12345 o el número de tu transferencia"
                  />

                  <Select
                    label="Modalidad preferida *"
                    value={form.modality}
                    onChange={(e: any) => setForm({ ...form, modality: e.target.value })}
                  >
                    <option value="online">💻 Online</option>
                    <option value="presencial">🏫 Presencial</option>
                    <option value="hibrida">🔄 Híbrida</option>
                  </Select>

                  {/* Upload comprobante */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Comprobante (screenshot) *
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleVoucherUpload}
                      className="hidden"
                    />
                    {form.voucher_url ? (
                      <div className="border-2 border-emerald-300 bg-emerald-50 rounded-lg p-3">
                        <img src={form.voucher_url} alt="Voucher" className="max-h-48 mx-auto rounded mb-2" />
                        <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                          Cambiar imagen
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-brand-400 hover:bg-blue-50 transition text-center"
                      >
                        <Upload size={32} className="mx-auto text-slate-400 mb-2" />
                        <p className="font-bold text-slate-700">Subir comprobante</p>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG o WebP (max 1MB)</p>
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Notas adicionales (opcional)
                    </label>
                    <textarea
                      value={form.student_notes}
                      onChange={(e) => setForm({ ...form, student_notes: e.target.value })}
                      rows={2}
                      placeholder="Ej: Hice la transferencia el viernes en la tarde"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-5">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    ← Atrás
                  </Button>
                  <Button onClick={submit} disabled={submitting} className="flex-1" size="lg">
                    {submitting ? "Enviando..." : "✓ Enviar pago"}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </>
        )}
      </div>

      {/* Modal "Próximamente" */}
      <Modal open={!!showComingSoon} onClose={() => setShowComingSoon(null)} title="🔜 Próximamente" size="md">
        <div className="text-center py-3">
          <CreditCard size={48} className="text-brand-500 mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-2">{showComingSoon} estará disponible pronto</h3>
          <p className="text-sm text-slate-600 mb-4">
            Estamos trabajando para integrar {showComingSoon} como método de pago.
            Por ahora puedes pagar por <strong>transferencia bancaria</strong>.
          </p>
          <Button onClick={() => setShowComingSoon(null)} className="w-full">
            Continuar con transferencia
          </Button>
        </div>
      </Modal>
    </div>
  );
}


export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div></div>}>
      <CheckoutInner />
    </Suspense>
  );
}
