"use client";
import { useEffect, useState } from "react";
import { adminApi, safeArray, safeObj } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button } from "@/components/ui";

export default function AdminAuditPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);

  const load = () => {
    setLoading(true);
    adminApi.auditLogs(page)
      .then(d => { setItems(safeArray(safeObj(d, {} as any).items)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, [page]);

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader title="Registro de auditoría" />
      {items.length === 0 ? <EmptyState icon="📋" title="Sin registros" /> : (
        <Card>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {items.map((l: any) => (
                <div key={l.id} className="p-3 grid grid-cols-12 gap-2 text-xs items-center">
                  <Badge variant="info" className="col-span-2 justify-center">{l.action}</Badge>
                  <span className="col-span-2 text-slate-500">{l.module}</span>
                  <span className="col-span-4 font-mono text-slate-400 truncate">
                    {(l.user_id || "anon").slice(0, 12)}{l.target_id ? ` → ${l.target_id.slice(0, 12)}` : ""}
                  </span>
                  <span className="col-span-4 text-right text-slate-500">{new Date(l.created_at).toLocaleString("es")}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
      <div className="flex justify-center gap-2 mt-6">
        <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>← Anterior</Button>
        <span className="px-4 py-1.5 text-sm font-semibold">Página {page}</span>
        <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={items.length < 50}>Siguiente →</Button>
      </div>
    </>
  );
}
