"use client";
import { useEffect, useState } from "react";
import { adminApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge } from "@/components/ui";

export default function AdminPaymentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    adminApi.payments()
      .then(d => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader title="Pagos" subtitle={`${items.length} transacciones`} />
      {items.length === 0 ? <EmptyState icon="💰" title="Sin pagos" /> : (
        <Card>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {items.map((p: any) => (
                <div key={p.id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">{p.student_name}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(p.created_at).toLocaleDateString("es")} · {p.method || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">${p.amount} {p.currency}</span>
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
    </>
  );
}
