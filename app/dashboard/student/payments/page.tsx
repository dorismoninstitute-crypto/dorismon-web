"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { studentPayments, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Badge, Button } from "@/components/ui";
import { CreditCard, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

export default function StudentPaymentsPage() {
  const [proofs, setProofs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    studentPayments.myProofs()
      .then((d: any) => { setProofs(safeArray(d)); setLoading(false); })
      .catch((e: any) => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  const fmt = (n: number) => `RD$ ${n.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;

  return (
    <>
      <PageHeader
        title="💳 Mis pagos"
        subtitle="Historial de pagos enviados y su estado"
        action={
          <Link href="/checkout"><Button>Nuevo pago</Button></Link>
        }
      />

      {proofs.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <CreditCard size={48} className="text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700 mb-1">No has hecho pagos aún</p>
              <p className="text-sm text-slate-500 mb-4">Inscríbete a un plan para empezar tus clases.</p>
              <Link href="/checkout"><Button>Ver planes →</Button></Link>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {proofs.map(p => (
            <Card key={p.id} className={
              p.status === "approved" ? "border-emerald-200" :
              p.status === "rejected" ? "border-red-200" : "border-amber-200"
            }>
              <CardBody>
                <div className="flex items-start gap-3 flex-wrap">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    p.status === "approved" ? "bg-emerald-100" :
                    p.status === "rejected" ? "bg-red-100" : "bg-amber-100"
                  }`}>
                    {p.status === "approved" && <CheckCircle2 size={22} className="text-emerald-600" />}
                    {p.status === "rejected" && <XCircle size={22} className="text-red-600" />}
                    {p.status === "pending" && <Clock size={22} className="text-amber-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
                      <p className="font-bold text-slate-900">{p.plan_name}</p>
                      {p.status === "approved" && <Badge variant="success">✅ Aprobado</Badge>}
                      {p.status === "pending" && <Badge variant="warning">⏳ En revisión</Badge>}
                      {p.status === "rejected" && <Badge variant="danger">❌ Rechazado</Badge>}
                    </div>
                    <p className="text-2xl font-black text-emerald-700 mb-1">{fmt(p.amount)}</p>
                    <p className="text-xs text-slate-500">
                      {p.payment_date} · Ref: {p.reference_number}
                    </p>
                    {p.status === "rejected" && p.admin_notes && (
                      <div className="bg-red-50 border-l-2 border-red-400 p-2 rounded text-xs text-red-800 mt-2">
                        <strong>Motivo:</strong> {p.admin_notes}
                        <div className="mt-2">
                          <Link href="/checkout">
                            <Button size="sm" variant="danger">Volver a pagar</Button>
                          </Link>
                        </div>
                      </div>
                    )}
                    {p.status === "approved" && (
                      <p className="text-xs text-emerald-700 mt-1">
                        ✅ Inscripción confirmada. Ya puedes acceder a tu plan.
                      </p>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
