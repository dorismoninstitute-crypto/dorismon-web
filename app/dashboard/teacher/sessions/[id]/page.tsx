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
  // V2.9: estado para cancelar clase
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
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
        action={
          <div className="flex gap-2 flex-wrap">
            {session.status === "scheduled" && (
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(true)}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                🚫 Cancelar clase
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push("/dashboard/teacher/sessions")}>← Volver</Button>
          </div>
        }
      />

      {/* V2.9: Banner si la clase está cancelada */}
      {session.status === "cancelled" && (
        <Card className="mb-4 border-2 border-red-300 bg-red-50">
          <CardBody>
            <p className="font-bold text-red-900">🚫 Esta clase fue cancelada</p>
            {session.cancellation_reason && (
              <p className="text-sm text-red-800 mt-2">
                <span className="font-semibold">Motivo:</span> {session.cancellation_reason}
              </p>
            )}
          </CardBody>
        </Card>
      )}

      {/* Lista estudiantes */}
      <Card className="mb-4">
        <CardBody>
          <h3 className="font-bold mb-3">👥 Estudiantes ({students.length})</h3>
          {students.length === 0 ? (
            <p className="text-sm text-slate-500">Sin estudiantes asignados.</p>
          ) : (
            <div className="space-y-2">
              {students.map((s: any) => (
                <div key={s.student_id} className="p-3 bg-slate-50 rounded-lg flex flex-col gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
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
                  {/* V3.0: aviso de ausencia del estudiante */}
                  {s.absence_notice && (
                    <div className="ml-11 text-xs bg-amber-50 border border-amber-200 rounded-lg p-2">
                      <span className="font-semibold text-amber-900">
                        🙋 Avisó que faltará {s.absence_notice.in_advance ? "(con tiempo)" : "(a último momento)"}:
                      </span>{" "}
                      <span className="text-amber-800">{s.absence_notice.reason}</span>
                    </div>
                  )}
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

      {/* V2.9: Modal cancelar clase */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-2 text-red-900">🚫 Cancelar clase</h3>
            <p className="text-sm text-slate-600 mb-4">
              Los estudiantes recibirán notificación + email. <strong>Mínimo 2 horas de anticipación.</strong>
            </p>
            <label className="block text-sm font-semibold mb-1">Motivo (mínimo 20 caracteres):</label>
            <Textarea
              value={cancelReason}
              onChange={(e: any) => setCancelReason(e.target.value)}
              placeholder="Ej: Tengo una cita médica urgente. La clase se reagendará en pocos días."
              rows={4}
              className="mb-2"
            />
            <p className="text-xs text-slate-500 mb-4">{cancelReason.length}/20 caracteres mínimos</p>
            <div className="flex gap-3 flex-wrap">
              <Button
                variant="outline"
                onClick={() => { setShowCancelModal(false); setCancelReason(""); }}
                className="flex-1"
                disabled={cancelling}
              >
                No cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (cancelReason.trim().length < 20) {
                    showToast("error", "El motivo debe tener al menos 20 caracteres");
                    return;
                  }
                  setCancelling(true);
                  try {
                    const res: any = await teacherApi.cancelSession(sessionId, cancelReason.trim());
                    showToast("success", `Clase cancelada. Se notificaron ${res.students_notified} estudiantes.`);
                    setShowCancelModal(false);
                    setTimeout(() => router.push("/dashboard/teacher/sessions"), 1500);
                  } catch (e: any) {
                    showToast("error", e?.message || "Error al cancelar");
                    setCancelling(false);
                  }
                }}
                loading={cancelling}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Sí, cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
