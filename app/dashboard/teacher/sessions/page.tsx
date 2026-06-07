"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { teacherApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button } from "@/components/ui";

export default function TeacherSessionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    teacherApi.sessions()
      .then(d => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader title="Mis clases" subtitle={`${items.length} sesiones`} />
      {items.length === 0 ? <EmptyState icon="🗓" title="Sin sesiones asignadas" /> : (
        <div className="space-y-2">
          {items.map((s: any) => (
            <Card key={s.id}>
              <CardBody className="flex items-center gap-3">
                <div className="text-center min-w-[60px]">
                  <p className="font-bold">{s.starts_at_utc && new Date(s.starts_at_utc).toLocaleString("es", { weekday: "short", day: "numeric" })}</p>
                  <p className="text-xs text-slate-500">{s.starts_at_utc && new Date(s.starts_at_utc).toLocaleString("es", { hour: "2-digit", minute: "2-digit" })}</p>
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
