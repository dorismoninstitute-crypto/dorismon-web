"use client";
import { useEffect, useState } from "react";
import { events, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, ConfirmModal, showToast } from "@/components/ui";

export default function StudentEventsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<any>(null);

  const load = () => {
    setLoading(true);
    events.list()
      .then(d => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const register = async (id: string) => {
    setBusyId(id);
    try {
      await events.register(id);
      showToast("success", "¡Te registraste al evento!");
      load();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setBusyId(null);
    }
  };

  const cancel = async (id: string) => {
    setBusyId(id);
    try {
      await events.cancel(id);
      showToast("info", "Registro cancelado");
      load();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader
        title="Eventos disponibles"
        subtitle="Talleres, clubs de conversación y actividades extras"
      />

      {items.length === 0 ? (
        <EmptyState
          icon="🎫"
          title="Sin eventos disponibles"
          description="Pronto habrá talleres y actividades para vos. ¡Volvé después!"
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((e: any) => {
            const date = new Date(e.starts_at_utc);
            const isFull = e.is_full;
            const registered = e.i_am_registered;
            const fillPct = Math.min(100, Math.round((e.registered_count / e.capacity) * 100));
            return (
              <Card key={e.id} className="overflow-hidden hover:shadow-md transition">
                <div className={`h-2 ${
                  registered ? "bg-emerald-500" :
                  isFull ? "bg-red-400" :
                  fillPct > 70 ? "bg-amber-500" : "bg-brand-500"
                }`} />
                <CardBody>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant={e.modality === "online" ? "brand" : e.modality === "presencial" ? "accent" : "info"}>
                      {e.modality}
                    </Badge>
                    {registered && <Badge variant="success">✓ Anotado</Badge>}
                    {isFull && !registered && <Badge variant="danger">Lleno</Badge>}
                    {!isFull && !registered && fillPct > 70 && <Badge variant="warning">Casi lleno</Badge>}
                  </div>

                  <h3 className="font-bold text-lg mb-1">{e.title}</h3>
                  {e.description && <p className="text-sm text-slate-600 mb-3 line-clamp-2">{e.description}</p>}

                  <div className="text-xs text-slate-500 space-y-1 mb-3">
                    <p>
                      📅 {date.toLocaleString("es", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p>👨‍🏫 {e.teacher_name}</p>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Cupos</span>
                      <span className="font-semibold">{e.registered_count} de {e.capacity}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isFull ? "bg-red-500" : fillPct > 70 ? "bg-amber-500" : "bg-brand-500"
                        }`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>

                  {registered ? (
                    <div className="flex gap-2">
                      {e.meeting_url && (
                        <a href={e.meeting_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <Button className="w-full" variant="primary">Entrar</Button>
                        </a>
                      )}
                      <Button
                        variant="outline"
                        loading={busyId === e.id}
                        onClick={() => setConfirmCancel(e)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : isFull ? (
                    <Button disabled className="w-full">Cupo agotado</Button>
                  ) : (
                    <Button
                      onClick={() => register(e.id)}
                      loading={busyId === e.id}
                      className="w-full"
                    >
                      Anotarme
                    </Button>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={!!confirmCancel}
        onClose={() => setConfirmCancel(null)}
        onConfirm={() => cancel(confirmCancel.id)}
        title="¿Cancelar registro?"
        message={`Vas a cancelar tu registro al evento "${confirmCancel?.title}". Puedes volver a anotarte si hay cupo disponible.`}
        confirmLabel="Sí, cancelar"
      />
    </>
  );
}
