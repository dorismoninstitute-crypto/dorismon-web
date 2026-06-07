"use client";
import { useEffect, useState } from "react";
import { studentApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge } from "@/components/ui";

const TYPE_ICONS: any = {
  new_assignment: "📝", new_quiz: "✓", grade_published: "📊",
  class_scheduled: "📅", reminder: "⏰", info: "ℹ️",
};

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = () => {
    setLoading(true);
    studentApi.notifications()
      .then(d => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    try {
      await studentApi.markRead(id);
      load();
    } catch {}
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader title="Notificaciones" subtitle={`${items.filter(n => !n.is_read).length} sin leer`} />
      {items.length === 0 ? <EmptyState icon="🔔" title="Sin notificaciones" /> : (
        <div className="space-y-2">
          {items.map((n: any) => (
            <Card key={n.id} className={n.is_read ? "opacity-70" : ""}>
              <CardBody className="flex items-start gap-4 cursor-pointer" onClick={() => !n.is_read && markRead(n.id)}>
                <div className="text-2xl">{TYPE_ICONS[n.type] || "🔔"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm">{n.title}</p>
                    {!n.is_read && <Badge variant="brand">Nueva</Badge>}
                  </div>
                  {n.body && <p className="text-sm text-slate-600">{n.body}</p>}
                  <p className="text-xs text-slate-400 mt-2">{new Date(n.created_at).toLocaleString("es")}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
