"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { teacherApi, teacherNotes, safeArray, safeObj } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Badge, Button, Textarea, showToast } from "@/components/ui";

const STATES = [
  { v: "present", label: "Presente", color: "bg-emerald-600", emoji: "✅" },
  { v: "absent", label: "Ausente", color: "bg-red-600", emoji: "❌" },
  { v: "late", label: "Tardanza", color: "bg-amber-600", emoji: "⏰" },
  { v: "excused", label: "Excusado", color: "bg-purple-600", emoji: "📝" },
];

export default function AttendancePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id as string;
  const [data, setData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    teacherApi.attendance(sessionId)
      .then(d => {
        setData(d);
        const sess = safeObj(d, {} as any) as any;
        setStudents(safeArray(sess.students).map((s: any) => ({ ...s })));
        setNotes(sess.session?.teacher_notes || "");
        setLoading(false);
      })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, [sessionId]);

  const setState = (sid: string, state: string) => {
    setStudents(students.map(s => s.student_id === sid ? { ...s, state } : s));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      // 1. Guardar asistencia
      const records = students.map(s => ({ student_id: s.student_id, state: s.state }));
      await teacherApi.saveAttendance(sessionId, { records });
      // 2. Guardar notas
      if (notes.trim()) {
        await teacherNotes.save(sessionId, notes);
      }
      showToast("success", "Asistencia y notas guardadas. Estudiantes notificados.");
      setTimeout(() => router.push("/dashboard/teacher/sessions"), 800);
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;
  const sess = safeObj(data, {}) as any;
  const session = sess.session || {};

  return (
    <>
      <PageHeader
        title={session.title || "Asistencia"}
        subtitle={session.starts_at_utc && new Date(session.starts_at_utc).toLocaleString("es", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
        action={<Button variant="outline" onClick={() => router.push("/dashboard/teacher/sessions")}>← Volver</Button>}
      />

      {/* Lista estudiantes */}
      <Card className="mb-4">
        <CardBody>
          <h3 className="font-bold mb-3">👥 Estudiantes ({students.length})</h3>
          {students.length === 0 ? (
            <p className="text-sm text-slate-500">Sin estudiantes asignados.</p>
          ) : (
            <div className="space-y-2">
              {students.map((s: any) => (
                <div key={s.student_id} className="p-3 bg-slate-50 rounded-lg flex items-center gap-3 flex-wrap">
                  <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs">
                    {(s.full_name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                  </div>
                  <p className="flex-1 font-medium text-sm">{s.full_name}</p>
                  <div className="flex gap-1 flex-wrap">
                    {STATES.map(st => (
                      <button
                        key={st.v}
                        onClick={() => setState(s.student_id, st.v)}
                        className={`px-2 py-1 rounded-md text-xs font-semibold transition ${
                          s.state === st.v ? `${st.color} text-white shadow` : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        {st.emoji} {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Notas del profe */}
      <Card className="mb-4 border-2 border-emerald-200 bg-emerald-50">
        <CardBody>
          <h3 className="font-bold mb-2 flex items-center gap-2">📝 Notas para los estudiantes</h3>
          <p className="text-xs text-slate-600 mb-3">
            Estas notas las verán los estudiantes en su dashboard después de la clase. Útil para resúmenes, tareas o consejos para la próxima clase.
          </p>
          <Textarea
            value={notes}
            onChange={(e: any) => setNotes(e.target.value)}
            placeholder="Ej: Hoy vimos Present Perfect. Para la próxima clase: traer 5 ejemplos de noticias en inglés y repasar el verbo 'have'."
            rows={4}
          />
        </CardBody>
      </Card>

      <Button onClick={saveAll} className="w-full" size="lg" loading={saving}>
        Guardar asistencia y notas
      </Button>
    </>
  );
}
