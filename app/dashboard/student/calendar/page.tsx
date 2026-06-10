"use client";
import { useEffect, useState } from "react";
import { studentApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, CalendarButton, JoinClassButton } from "@/components/ui";

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    studentApi.calendar()
      .then(d => { setEvents(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  const byDay: Record<string, any[]> = {};
  events.forEach(e => {
    const day = e.starts_at ? new Date(e.starts_at).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" }) : "Sin fecha";
    byDay[day] = byDay[day] || [];
    byDay[day].push(e);
  });

  return (
    <>
      <PageHeader title="Mi calendario" subtitle={`${events.length} eventos en las próximas 4 semanas`} />
      {events.length === 0 ? <EmptyState icon="📅" title="Sin eventos próximos" /> : (
        <div className="space-y-6">
          {Object.entries(byDay).map(([day, items]) => (
            <div key={day}>
              <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-2 capitalize">{day}</h3>
              <div className="space-y-2">
                {items.map((e, i) => (
                  <Card key={`${e.type}-${e.id}-${i}`}>
                    <CardBody className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                           style={{ background: e.type === "class" ? "#e0e7ff" : "#fef3c7" }}>
                        {e.type === "class" ? "📅" : "📝"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={e.type === "class" ? "brand" : "warning"}>
                            {e.type === "class" ? "Clase" : "Tarea"}
                          </Badge>
                          {e.modality && <Badge>{e.modality}</Badge>}
                        </div>
                        <p className="font-semibold">{e.title}</p>
                        <p className="text-xs text-slate-500">
                          {e.starts_at && new Date(e.starts_at).toLocaleString("es", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      {e.type === "class" && (
                        <div className="flex flex-col gap-2">
                          {e.meeting_url && <JoinClassButton session={{ id: e.id, meeting_url: e.meeting_url }} />}
                          {e.id && <CalendarButton sessionId={e.id} />}
                        </div>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
