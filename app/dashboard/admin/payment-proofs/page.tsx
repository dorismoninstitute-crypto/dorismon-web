"use client";
import { useState, useEffect } from "react";
import { adminPaymentProofs, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Badge, Button, Modal, showToast } from "@/components/ui";
import { CheckCircle2, XCircle, Calendar, FileText, Building2, User as UserIcon, AlertCircle, Eye } from "lucide-react";

export default function AdminPaymentProofsPage() {
  const [proofs, setProofs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState<string>("pending");
  const [viewingProof, setViewingProof] = useState<any>(null);
  const [voucherFullView, setVoucherFullView] = useState<string | null>(null);
  const [rejectingProof, setRejectingProof] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = () => {
    setLoading(true);
    adminPaymentProofs.list(filter === "all" ? undefined : filter)
      .then((d: any) => { setProofs(safeArray(d)); setLoading(false); })
      .catch((e: any) => { setErr(e.message); setLoading(false); });
  };
  useEffect(load, [filter]);

  const approve = async (proof: any) => {
    setActionLoading(true);
    try {
      await adminPaymentProofs.approve(proof.id);
      showToast("success", `✓ Pago aprobado. ${proof.student_name} ha sido inscrito.`);
      setViewingProof(null);
      load();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async () => {
    if (!rejectReason || rejectReason.length < 10) {
      showToast("error", "El motivo debe tener al menos 10 caracteres");
      return;
    }
    setActionLoading(true);
    try {
      await adminPaymentProofs.reject(rejectingProof.id, rejectReason);
      showToast("success", "Pago rechazado. El estudiante fue notificado.");
      setRejectingProof(null);
      setRejectReason("");
      setViewingProof(null);
      load();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  const pendingCount = proofs.filter(p => p.status === "pending").length;
  const fmt = (n: number) => `RD$ ${n.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;

  return (
    <>
      <PageHeader
        title="💰 Verificar pagos"
        subtitle={`${pendingCount} ${pendingCount === 1 ? "pago pendiente" : "pagos pendientes"} de verificación`}
      />

      {/* Filtros */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { v: "pending", l: "⏳ Pendientes", color: "warning" },
          { v: "approved", l: "✅ Aprobados", color: "success" },
          { v: "rejected", l: "❌ Rechazados", color: "danger" },
          { v: "all", l: "Todos", color: "info" },
        ].map(f => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={`px-3 py-1.5 text-sm font-bold rounded-lg transition ${
              filter === f.v ? "bg-brand-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            {f.l}
          </button>
        ))}
      </div>

      {proofs.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <CheckCircle2 size={48} className="text-emerald-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700">No hay pagos {filter === "pending" ? "pendientes" : filter === "approved" ? "aprobados" : filter === "rejected" ? "rechazados" : ""}.</p>
              {filter === "pending" && (
                <p className="text-sm text-slate-500 mt-1">¡Todo al día!</p>
              )}
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {proofs.map(p => (
            <Card key={p.id} className={p.status === "pending" ? "border-amber-200" : ""}>
              <CardBody>
                <div className="flex items-start gap-4 flex-wrap md:flex-nowrap">
                  {/* Thumbnail voucher */}
                  <div
                    className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 cursor-pointer hover:opacity-80 flex-shrink-0 border border-slate-200"
                    onClick={() => setVoucherFullView(p.voucher_url)}
                  >
                    {p.voucher_url ? (
                      <img src={p.voucher_url} alt="Voucher" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                      <div>
                        <p className="font-bold text-slate-900">{p.student_name}</p>
                        <p className="text-xs text-slate-500">{p.student_email}</p>
                      </div>
                      {p.status === "pending" && <Badge variant="warning">Pendiente</Badge>}
                      {p.status === "approved" && <Badge variant="success">Aprobado</Badge>}
                      {p.status === "rejected" && <Badge variant="danger">Rechazado</Badge>}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-1 text-xs mb-3">
                      <div>
                        <span className="text-slate-500">Plan:</span><br />
                        <span className="font-semibold">{p.plan_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Monto:</span><br />
                        <span className="font-bold text-emerald-700">{fmt(p.amount)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Fecha pago:</span><br />
                        <span className="font-semibold">{p.payment_date}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Referencia:</span><br />
                        <span className="font-mono text-xs">{p.reference_number}</span>
                      </div>
                    </div>

                    {p.bank_origin && (
                      <p className="text-xs text-slate-600 mb-2">
                        <Building2 size={12} className="inline mr-1" />
                        Desde: <strong>{p.bank_origin}</strong>
                      </p>
                    )}

                    {p.admin_notes && p.status === "rejected" && (
                      <div className="bg-red-50 border-l-2 border-red-400 p-2 rounded text-xs text-red-800 mb-2">
                        <strong>Motivo rechazo:</strong> {p.admin_notes}
                      </div>
                    )}

                    {p.status === "pending" && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Button size="sm" onClick={() => setViewingProof(p)}>
                          <Eye size={14} className="mr-1" /> Revisar
                        </Button>
                        <Button size="sm" variant="success" onClick={() => approve(p)} disabled={actionLoading}>
                          <CheckCircle2 size={14} className="mr-1" /> Aprobar rápido
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setRejectingProof(p)}>
                          <XCircle size={14} className="mr-1" /> Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: ver detalle completo */}
      <Modal open={!!viewingProof} onClose={() => setViewingProof(null)} title="Verificar prueba de pago" size="xl">
        {viewingProof && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-bold mb-2 text-sm uppercase text-slate-700 tracking-wider">Estudiante</h4>
                <p className="font-bold text-lg">{viewingProof.student_name}</p>
                <p className="text-sm text-slate-600">{viewingProof.student_email}</p>
              </div>
              <div>
                <h4 className="font-bold mb-2 text-sm uppercase text-slate-700 tracking-wider">Plan a inscribir</h4>
                <p className="font-bold text-lg">{viewingProof.plan_name}</p>
                <p className="text-sm">Modalidad: {viewingProof.modality}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-bold mb-3 text-sm uppercase text-slate-700 tracking-wider">Datos del pago</h4>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">Monto:</span>
                  <p className="font-black text-2xl text-emerald-700">{fmt(viewingProof.amount)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Fecha del pago:</span>
                  <p className="font-bold">{viewingProof.payment_date}</p>
                </div>
                <div>
                  <span className="text-slate-500">Banco origen:</span>
                  <p className="font-bold">{viewingProof.bank_origin || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-500">Número de referencia:</span>
                  <p className="font-mono font-bold">{viewingProof.reference_number}</p>
                </div>
                <div>
                  <span className="text-slate-500">Método:</span>
                  <p className="font-bold capitalize">{viewingProof.method?.replace("_", " ")}</p>
                </div>
                <div>
                  <span className="text-slate-500">Recibido:</span>
                  <p className="font-bold">{viewingProof.created_at && new Date(viewingProof.created_at).toLocaleString("es-DO")}</p>
                </div>
              </div>
            </div>

            {viewingProof.voucher_url && (
              <div>
                <h4 className="font-bold mb-2 text-sm uppercase text-slate-700 tracking-wider">Comprobante</h4>
                <img
                  src={viewingProof.voucher_url}
                  alt="Voucher"
                  className="w-full max-h-96 object-contain rounded-lg border-2 border-slate-200 cursor-pointer"
                  onClick={() => setVoucherFullView(viewingProof.voucher_url)}
                />
                <p className="text-xs text-slate-500 mt-1 text-center">Click para ver más grande</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={() => approve(viewingProof)} disabled={actionLoading} variant="success" size="lg" className="flex-1">
                <CheckCircle2 size={18} className="mr-2" />
                {actionLoading ? "Procesando..." : "Aprobar e inscribir"}
              </Button>
              <Button onClick={() => { setRejectingProof(viewingProof); }} variant="danger" size="lg">
                <XCircle size={18} className="mr-2" /> Rechazar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: voucher en grande */}
      {voucherFullView && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setVoucherFullView(null)}
        >
          <img src={voucherFullView} alt="Voucher" className="max-w-full max-h-full object-contain" />
        </div>
      )}

      {/* Modal: rechazar con motivo */}
      <Modal open={!!rejectingProof} onClose={() => { setRejectingProof(null); setRejectReason(""); }} title="Rechazar pago" size="md">
        <div className="space-y-3">
          <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
            <p className="text-sm text-red-900 font-semibold">⚠️ Importante</p>
            <p className="text-xs text-red-700 mt-1">
              El estudiante recibirá un email con el motivo. Por favor sé claro y constructivo.
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Motivo del rechazo *
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Ej: El monto enviado no coincide con el del plan. Verificamos que enviaste RD$1,000 pero el plan cuesta RD$3,500. Por favor envía la diferencia y vuelve a subir el comprobante."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
            />
            <p className="text-xs text-slate-500 mt-1">Mínimo 10 caracteres ({rejectReason.length}/10)</p>
          </div>
          <Button onClick={reject} variant="danger" className="w-full" size="lg" disabled={actionLoading || rejectReason.length < 10}>
            <XCircle size={18} className="mr-2" />
            {actionLoading ? "Procesando..." : "Confirmar rechazo"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
