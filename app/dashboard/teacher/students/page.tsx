"use client";
import { useEffect, useState } from "react";
import { teacherStudents, safeArray, getLevelTheme } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge } from "@/components/ui";

export default function TeacherStudentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [byLevel, setByLevel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [view, setView] = useState<"list" | "byLevel">("list");

  useEffect(() => {
    Promise.all([teacherStudents.mine(), teacherStudents.byLevel()])
      .then(([s, l]) => {
        setItems(safeArray(s));
        setByLevel(safeArray(l));
        setLoading(false);
      })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader
        title="Mis estudiantes"
        subtitle={`${items.length} estudiantes asignados`}
      />

      {items.length === 0 ? (
        <EmptyState
          icon="👥"
          title="Aún no tenés estudiantes asignados"
          description="El administrador te asignará estudiantes al inscribirlos. Cuando esto pase, los verás acá."
        />
      ) : (
        <>
          <Card className="mb-4">
            <CardBody className="flex gap-2">
              <button
                onClick={() => setView("list")}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition ${
                  view === "list" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                📋 Lista completa
              </button>
              <button
                onClick={() => setView("byLevel")}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition ${
                  view === "byLevel" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                🎯 Por nivel
              </button>
            </CardBody>
          </Card>

          {view === "list" ? (
            <Card>
              <CardBody className="p-0">
                <div className="divide-y divide-slate-100">
                  {items.map((s: any) => {
                    const t = getLevelTheme(s.level_code);
                    return (
                      <div key={s.student_id} className={`p-4 flex items-center gap-3 flex-wrap ${s.is_paused ? "opacity-60" : ""}`}>
                        <div className={`w-12 h-12 rounded-2xl ${t.bg} text-white flex items-center justify-center font-extrabold flex-shrink-0`}>
                          {(s.full_name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold">{s.full_name}</p>
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${t.bg} text-white`}>{s.level_code}</span>
                            {s.is_paused && <Badge variant="warning">⏸ Pausado</Badge>}
                          </div>
                          <p className="text-xs text-slate-500">{s.email} · {s.course_name}</p>
                        </div>
                        <div className="text-right text-xs">
                          {s.attendance_pct !== null ? (
                            <>
                              <p className="font-bold text-emerald-700">{s.attendance_pct}%</p>
                              <p className="text-slate-500">{s.total_classes_with_me} clases</p>
                            </>
                          ) : (
                            <p className="text-slate-400">Sin clases aún</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-4">
              {byLevel.map((grp: any) => {
                const t = getLevelTheme(grp.level_code);
                return (
                  <Card key={grp.level_id}>
                    <div className={`${t.bg} text-white px-4 py-2 rounded-t-xl flex items-center justify-between`}>
                      <h3 className="font-extrabold">
                        Nivel {grp.level_code} — {grp.level_name}
                      </h3>
                      <Badge variant="default">{grp.count}</Badge>
                    </div>
                    <CardBody>
                      <div className="space-y-2">
                        {grp.students.map((st: any) => (
                          <div key={st.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                            <div className={`w-8 h-8 rounded-full ${t.bg} text-white flex items-center justify-center font-bold text-xs`}>
                              {(st.full_name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm">{st.full_name}</p>
                              <p className="text-xs text-slate-500">{st.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}
