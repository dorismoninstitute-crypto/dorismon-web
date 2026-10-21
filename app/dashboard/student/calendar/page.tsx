"use client";
import { useEffect, useState } from "react";
import { studentApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, CalendarButton, JoinClassButton, tieneEntradaOnline, ClassLocation } from "@/components/ui";
import { aFecha, modalidadLegible, rangoHora, estadoClase, useAhora, dentroDeVentanaEntrada } from "@/components/ClaseProfesor";  // GATE 3

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const ahora = useAhora();  // GATE 3

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
                {items.map((e, i) => {
                  // V3.9.64 — El botón recibe la clase completa (proveedor y
                  // horarios), no solo {id, meeting_url}.
                  const sesion = {
                    id: e.id,
                    meeting_url: e.meeting_url,
                    video_provider: e.video_provider,
                    starts_at_utc: e.starts_at_utc || e.starts_at,
                    ends_at_utc: e.ends_at_utc,
                    status: e.status,
                    modality: e.modality,
                  };
                  const enCurso = e.type === "class" && estadoClase(sesion, ahora) === "en_curso";
                  return (
                  <Card key={`${e.type}-${e.id}-${i}`} className={enCurso ? "border-red-200 ring-2 ring-red-100" : ""}>
                    {/* GATE 3 — Móvil: título arriba, datos debajo y botones en
                        su propia fila (antes se apretaban en una columna). */}
                    <CardBody>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                             style={{ background: e.type === "class" ? "#e0e7ff" : "#fef3c7" }}>
                          {e.type === "class" ? "📅" : "📝"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {enCurso && <Badge variant="danger">🔴 En curso</Badge>}
                            <Badge variant={e.type === "class" ? "brand" : "warning"}>
                              {e.type === "class" ? "Clase" : "Tarea"}
                            </Badge>
                            {e.modality && <Badge>{modalidadLegible(e.modality)}</Badge>}
                          </div>
                          <p className="font-semibold break-words">{e.title}</p>
                          <p className="text-xs text-slate-500">
                            {e.type === "class"
                              ? rangoHora(sesion)
                              : aFecha(e.starts_at)?.toLocaleTimeString("es", { hour: "numeric", minute: "2-digit", hour12: true })}
                          </p>
                        </div>
                      </div>
                      {/* V3.0.3: ubicación presencial */}
                      {e.location && <div className="mt-2"><ClassLocation location={e.location} /></div>}
                      {e.type === "class" && (
                        <div className="flex gap-2 flex-wrap mt-3">
                          {/* GATE 3 (L3) — Entrar solo dentro de la ventana de la
                              sala (función compartida). /join sigue decidiendo. */}
                          {tieneEntradaOnline(e) && dentroDeVentanaEntrada(sesion, ahora) && (
                            <JoinClassButton session={sesion} />
                          )}
                          {e.id && <CalendarButton sessionId={e.id} />}
                        </div>
                      )}
                    </CardBody>
                  </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
