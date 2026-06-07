"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { teacherApi, safeArray, safeObj } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, SuccessBox } from "@/components/ui";

const STATES = [
  { v: "present", label: "Presente", color: "bg-emerald-600" },
  { v: "absent", label: "Ausente", color: "bg-red-600" },
  { v: "late", label: "Tardanza", color: "bg-amber-600" },
  { v: "excused", label: "Excusado", color: "bg-purple-600" },
];

export default function AttendancePage() {
  const params = useParams();
  const sessionId = params?.id as string;
  const [data, setData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    teacherApi.attendance(sessionId)
      .then(d => {
        setData(d);
        setStudents(safeArray(safeObj(d, {} as any).students).map((s: any) => ({ ...s })));
        setLoading(false);
      })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, [sessionId]);

  const setState = (idx: number, val: string) => {
    setStudents(prev => prev.map((s, i) => i === idx ? { ...s, state: val } : s));
  };

  const save = async () => {
    setMsg("");
    try {
      const records = students.map(s => ({ student_id: s.student_id, state: s.state, notes: s.notes }));
      const r = await teacherApi.saveAttendance(sessionId, { records });
      setMsg(`✓ Asistencia guardada (${r.updated} estudiantes)`);
    } catch (e: any) { setMsg("✗ " + e.message); }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;
  const sess = safeObj(safeObj(data, {} as any).session, {}) as any;

  return (
    <>
      <PageHeader
        title="Tomar asistencia"
        subtitle={`${sess.title} · ${sess.starts_at_utc && new Date(sess.starts_at_utc).toLocaleString("es", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}`}
      />
      {msg.startsWith("✓") && <div className="mb-4"><SuccessBox message={msg} /></div>}
      {msg.startsWith("✗") && <div className="mb-4"><ErrorBox message={msg.slice(2)} /></div>}

      {students.length === 0 ? <EmptyState icon="👥" title="Sin estudiantes inscritos a esta clase" /> : (
        <>
          <Card className="mb-4">
            <CardBody>
              <div className="space-y-3">
                {students.map((s, idx) => (
                  <div key={s.student_id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
                        {(s.full_name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{s.full_name}</p>
                        <p className="text-xs text-slate-500 truncate">{s.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {STATES.map(st => (
                        <button
                          key={st.v}
                          onClick={() => setState(idx, st.v)}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                            s.state === st.v ? `${st.color} text-white` : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
          <Button onClick={save} size="lg" className="w-full">Guardar asistencia</Button>
        </>
      )}
    </>
  );
}
