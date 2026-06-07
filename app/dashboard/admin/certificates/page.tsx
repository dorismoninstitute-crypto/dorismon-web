"use client";
import { useEffect, useState } from "react";
import { adminApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge } from "@/components/ui";

export default function AdminCertificatesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    adminApi.certificates()
      .then(d => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader title="Certificados emitidos" subtitle={`${items.length} certificados`} />
      {items.length === 0 ? <EmptyState icon="🎓" title="Sin certificados emitidos" /> : (
        <Card>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {items.map((c: any) => (
                <div key={c.id} className="p-4 flex items-center gap-3">
                  <div className="text-3xl">🎓</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{c.student_name}</p>
                    <p className="text-xs text-slate-500">{c.course_name} · Nivel {c.level_code} · {c.hours} horas</p>
                    <p className="text-xs font-mono text-slate-400 mt-1">{c.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">{new Date(c.issued_at).toLocaleDateString("es")}</p>
                    {c.final_grade && <p className="text-sm font-bold text-emerald-600">{c.final_grade}%</p>}
                    {c.revoked && <Badge variant="danger">Revocado</Badge>}
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
