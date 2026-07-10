"use client";
import { useEffect, useState } from "react";
import { adminHelpers, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Badge } from "@/components/ui";

export default function TeachersSchedulePage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = () => {
    setLoading(true);
    adminHelpers.teachersSchedule()
      .then((d: any) => {
        setTeachers(safeArray(d.teachers));
        setLoading(false);
      })
      .catch(e => { setErr(e.message); setLoading(false); });
  };

  useEffect(() => {
    load();
    // Refrescar cada 60s para ver "en curso" actualizado
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("es", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <>
      <PageHeader
        title="Agenda de profesores"
        subtitle="Qué tiene cada maestro ahora y sus próximas clases"
      />

      <p className="text-xs text-slate-400 mb-4">Se actualiza automáticamente cada minuto.</p>

      <div className="space-y-3">
        {teachers.length === 0 ? (
          <Card><CardBody><p className="text-sm text-slate-500">No hay profesores activos.</p></CardBody></Card>
        ) : (
          teachers.map((t: any) => (
            <Card key={t.teacher_id}>
              <CardBody>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {(t.teacher_name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{t.teacher_name}</p>
                      <p className="text-xs text-slate-500">{t.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="info">Hoy: {t.today_count}</Badge>
                    <Badge variant="brand">Semana: {t.week_count}</Badge>
                  </div>
                </div>

                {/* Estado actual */}
                <div className="mt-3 pl-1">
                  {t.in_progress ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">🔴 En clase ahora</p>
                      <p className="text-sm font-semibold text-slate-900">{t.in_progress.title}</p>
                      <p className="text-xs text-slate-600">
                        {fmt(t.in_progress.starts_at_utc)}
                        {t.current_location && <> · 📍 {t.current_location}</>}
                      </p>
                    </div>
                  ) : t.next_class ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Próxima clase</p>
                      <p className="text-sm font-semibold text-slate-900">{t.next_class.title}</p>
                      <p className="text-xs text-slate-600">
                        {fmt(t.next_class.starts_at_utc)}
                        {t.current_location && <> · 📍 {t.current_location}</>}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Sin clases próximas</p>
                  )}
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
