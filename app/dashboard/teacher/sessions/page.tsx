"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { teacherApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button } from "@/components/ui";

export default function TeacherSessionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
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
          {items.map((s: any) => (
            <Card key={s.id}>
              <CardBody className="flex items-center gap-3">
                <div className="text-center min-w-[60px]">
                  <p className="font-bold">{s.starts_at_utc && new Date(s.starts_at_utc).toLocaleString("es", { weekday: "short", day: "numeric" })}</p>
                  <p className="text-xs text-slate-500">{s.starts_at_utc && new Date(s.starts_at_utc).toLocaleString("es", { hour: "2-digit", minute: "2-digit", hour12: true })}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={s.modality === "online" ? "brand" : s.modality === "presencial" ? "accent" : "info"}>
                      {s.modality}
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
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
