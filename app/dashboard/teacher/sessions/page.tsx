"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { teacherApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, JoinClassButton, tieneEntradaOnline } from "@/components/ui";
import PendingAttendance from "@/components/PendingAttendance";
import { aFecha, modalidadLegible, rangoHora, estadoClase, useAhora, dentroDeVentanaEntrada } from "@/components/ClaseProfesor";  // GATE 2

// GATE 2 — Cuándo OFRECER el botón aquí: clase con entrada online (misma
// regla compartida) y dentro de la ventana de /join. GATE 3: la ventana vive
// en UNA sola función compartida (ClaseProfesor.tsx). Solo decide si se
// muestra; quien autoriza la entrada sigue siendo /video/.../join.
function puedeMostrarEntrar(s: any, ahora: Date): boolean {
  return tieneEntradaOnline(s) && dentroDeVentanaEntrada(s, ahora);
}

export default function TeacherSessionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const ahora = useAhora();  // GATE 2
  const [period, setPeriod] = useState<"upcoming" | "this_week" | "this_month" | "past">("this_month");

  const load = (p: string) => {
    setLoading(true);
    teacherApi.sessions(p)
      .then((d: any) => {
        // V2.9.1: respuesta {items, filter_period}
        const list = Array.isArray(d) ? d : safeArray(d?.items);
        setItems(list);
        setLoading(false);
      })
      .catch(e => { setErr(e.message); setLoading(false); });
  };

  useEffect(() => { load(period); }, [period]);

  if (err) return <ErrorBox message={err} />;

  const PERIODS: { key: typeof period; label: string }[] = [
    { key: "this_month", label: "Este mes" },
    { key: "this_week", label: "Esta semana" },
    { key: "upcoming", label: "Próximas" },
    { key: "past", label: "Pasadas" },
  ];

  return (
    <>
      <PageHeader title="Mis clases" subtitle={`${items.length} clases`} />

      {/* V3.9.22: clases sin asistencia */}
      <PendingAttendance />

      {/* V2.9.1: Tabs de filtro por período */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              period === p.key
                ? "bg-brand-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingScreen /> : items.length === 0 ? (
        <EmptyState icon="🗓" title="Sin clases en este período" description="Cambia el filtro para ver otras clases." />
      ) : (
        <div className="space-y-2">
          {items.map((s: any) => {
            const ini = aFecha(s.starts_at_utc);
            const estado = estadoClase(s, ahora);
            const entrar = puedeMostrarEntrar(s, ahora);
            return (
            <Card key={s.id} className={estado === "en_curso" ? "border-red-200 ring-2 ring-red-100" : ""}>
              <CardBody>
                <div className="flex items-center gap-3">
                  <div className="text-center min-w-[60px]">
                    <p className="font-bold">{ini && ini.toLocaleDateString("es", { weekday: "short", day: "numeric" })}</p>
                    <p className="text-xs text-slate-500">{rangoHora(s)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {estado === "en_curso" && <Badge variant="danger">🔴 En curso</Badge>}
                      <Badge variant={s.modality === "online" ? "brand" : s.modality === "presencial" ? "accent" : "info"}>
                        {modalidadLegible(s.modality)}
                      </Badge>
                      <Badge>{s.level_code}</Badge>
                      {s.status === "cancelled" && <Badge variant="danger">Cancelada</Badge>}
                    </div>
                    <p className="font-semibold text-sm">{s.title}</p>
                    <p className="text-xs text-slate-500">{s.course_name}</p>
                  </div>
                  <Link href={`/dashboard/teacher/sessions/${s.id}`}>
                    <Button size="sm">Asistencia</Button>
                  </Link>
                </div>
                {/* GATE 2 — Entrar también desde aquí, con el MISMO botón y la
                    MISMA regla que el dashboard. /join sigue decidiendo. */}
                {entrar && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <JoinClassButton session={s} />
                  </div>
                )}
              </CardBody>
            </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
