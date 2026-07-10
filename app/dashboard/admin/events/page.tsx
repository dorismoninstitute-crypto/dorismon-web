"use client";
import { useEffect, useState } from "react";
import { adminApi, safeArray, safeObj } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge } from "@/components/ui";

export default function AdminEventsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    // Reuso /admin/sessions y filtro client-side
    adminApi.sessions(1)
      .then(d => {
        const all = safeArray(safeObj(d, {} as any).items);
        // Solo eventos abiertos (necesitamos hacer una request distinta o filtrar)
        // Hacemos fetch a /events/ que devuelve solo eventos
        return fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://dorismon-api.onrender.com"}/events/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
        });
      })
      .then(r => r?.json())
      .then(d => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader
        title="Eventos abiertos"
        subtitle="Talleres, clubs y actividades que cualquier estudiante puede registrarse. Crea nuevos desde 'Clases' marcando 'Evento abierto'."
      />

      {items.length === 0 ? (
        <EmptyState
          icon="🎫"
          title="Sin eventos creados"
          description="Ve a 'Clases' → '+ Nueva clase' y marcá 'Evento abierto'."
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((e: any) => {
            const fillPct = Math.round((e.registered_count / e.capacity) * 100);
            return (
              <Card key={e.id}>
                <CardBody>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant="brand">{e.modality}</Badge>
                    {e.is_full && <Badge variant="danger">Lleno</Badge>}
                  </div>
                  <h3 className="font-bold mb-1">{e.title}</h3>
                  {e.description && <p className="text-sm text-slate-600 mb-3">{e.description}</p>}
                  <div className="text-xs text-slate-500 space-y-1 mb-3">
                    <p>📅 {new Date(e.starts_at_utc).toLocaleString("es", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true })}</p>
                    <p>👨‍🏫 {e.teacher_name}</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Registrados</span>
                      <span className="font-semibold">{e.registered_count} / {e.capacity}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500" style={{ width: `${fillPct}%` }} />
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
