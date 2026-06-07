"use client";
import { useEffect, useState } from "react";
import { adminApi, safeArray, safeObj } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button } from "@/components/ui";

export default function AdminSessionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);

  const load = () => {
    setLoading(true);
    adminApi.sessions(page)
      .then(d => { setItems(safeArray(safeObj(d, {} as any).items)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, [page]);

  const cancel = async (id: string) => {
    if (!confirm("¿Cancelar esta clase?")) return;
    try { await adminApi.cancelSession(id); load(); }
    catch (e: any) { alert(e.message); }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader title="Clases programadas" />
      {items.length === 0 ? <EmptyState icon="📅" title="Sin clases" /> : (
        <Card>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {items.map((s: any) => (
                <div key={s.id} className={`p-4 flex flex-wrap items-center gap-3 ${s.status === "cancelled" ? "opacity-50" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant={s.modality === "online" ? "brand" : s.modality === "presencial" ? "accent" : "info"}>{s.modality}</Badge>
                      <Badge>{s.level_code}</Badge>
                      {s.status === "cancelled" && <Badge variant="danger">Cancelada</Badge>}
                    </div>
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-xs text-slate-500">
                      {s.starts_at_utc && new Date(s.starts_at_utc).toLocaleString("es", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {" · "}{s.teacher_name}{" · "}{s.course_name}
                    </p>
                  </div>
                  {s.status !== "cancelled" && (
                    <Button variant="danger" size="sm" onClick={() => cancel(s.id)}>Cancelar</Button>
                  )}
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
