"use client";
import { useState, useEffect } from "react";
import { adminTrialClasses, adminApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Badge, Button, Modal, Input, Select, showToast } from "@/components/ui";
import { Gift, Calendar, User as UserIcon, GraduationCap } from "lucide-react";

export default function AdminTrialClassesPage() {
  const [trials, setTrials] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [scheduling, setScheduling] = useState<any>(null);
  const [form, setForm] = useState({ teacher_id: "", date: "", time: "", meeting_url: "" });

  const load = () => {
    setLoading(true);
    Promise.all([
      adminTrialClasses.list(),
      adminApi.users({ role: "teacher" }),
    ])
      .then(([t, u]: any) => {
        setTrials(safeArray(t));
        const items = (u && u.items) ? u.items : safeArray(u);
        setTeachers(items.filter((x: any) => x.role === "teacher" && x.is_active));
        setLoading(false);
      })
      .catch((e: any) => { setErr(e.message); setLoading(false); });
  };
  useEffect(load, []);

  const schedule = async () => {
    if (!form.teacher_id || !form.date || !form.time) {
      showToast("error", "Completa profesor, fecha y hora");
      return;
    }
    try {
      const isoStr = `${form.date}T${form.time}:00-04:00`;  // RD timezone UTC-4
      await adminTrialClasses.schedule(scheduling.id, {
        teacher_id: form.teacher_id,
        scheduled_at: isoStr,
        meeting_url: form.meeting_url || undefined,
      });
      showToast("success", "✓ Clase de prueba agendada");
      setScheduling(null);
      setForm({ teacher_id: "", date: "", time: "", meeting_url: "" });
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader
        title="🎁 Clases de prueba"
        subtitle="Estudiantes que pidieron su clase gratis. Asigna profesor y hora."
      />

      {trials.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <Gift size={48} className="text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700">No hay clases de prueba pendientes</p>
              <p className="text-sm text-slate-500 mt-1">Cuando un estudiante reserve, aparecerá aquí.</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {trials.map(t => (
            <Card key={t.id} className={t.status === "requested" ? "border-amber-200" : ""}>
              <CardBody>
                <div className="flex items-start gap-3 flex-wrap md:flex-nowrap">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <Gift size={22} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                      <div>
                        <p className="font-bold text-slate-900">{t.student_name}</p>
                        <p className="text-xs text-slate-500">{t.student_email}</p>
                      </div>
                      {t.status === "requested" && <Badge variant="warning">Pendiente agendar</Badge>}
                      {t.status === "scheduled" && <Badge variant="success">Agendada</Badge>}
                      {t.status === "completed" && <Badge variant="info">Completada</Badge>}
                      {t.status === "cancelled" && <Badge variant="danger">Cancelada</Badge>}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-1 text-xs mb-2">
                      <div>
                        <span className="text-slate-500">Modalidad:</span><br />
                        <span className="font-semibold">
                          {t.modality === "online" && "💻 Online"}
                          {t.modality === "presencial" && "🏫 Presencial"}
                          {t.modality === "hibrida" && "🔄 Híbrida"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Nivel preferido:</span><br />
                        <span className="font-semibold">{t.preferred_level || "Por evaluar"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Fecha preferida:</span><br />
                        <span className="font-semibold">{t.preferred_date || "Flexible"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Horario:</span><br />
                        <span className="font-semibold">{t.preferred_time || "Flexible"}</span>
                      </div>
                    </div>

                    {t.notes && (
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded mb-2">
                        "📝 {t.notes}"
                      </p>
                    )}

                    {t.status === "requested" && (
                      <Button size="sm" onClick={() => { setScheduling(t); setForm({ teacher_id: "", date: "", time: "", meeting_url: "" }); }}>
                        <Calendar size={14} className="mr-1" /> Agendar clase
                      </Button>
                    )}
                    {t.status === "scheduled" && (
                      <p className="text-xs text-slate-700">
                        <Calendar size={12} className="inline mr-1" />
                        Programada: {new Date(t.scheduled_at).toLocaleString("es-DO")}
                      </p>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Modal agendar */}
      <Modal open={!!scheduling} onClose={() => setScheduling(null)} title="Agendar clase de prueba" size="md">
        {scheduling && (
          <div className="space-y-3">
            <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded text-sm">
              <p><strong>Estudiante:</strong> {scheduling.student_name}</p>
              <p><strong>Modalidad solicitada:</strong> {scheduling.modality}</p>
              <p><strong>Nivel:</strong> {scheduling.preferred_level || "Por evaluar"}</p>
            </div>

            <Select
              label="Profesor *"
              value={form.teacher_id}
              onChange={(e: any) => setForm({ ...form, teacher_id: e.target.value })}
            >
              <option value="">Seleccionar profesor...</option>
              {teachers.map(tc => (
                <option key={tc.id} value={tc.id}>{tc.full_name}</option>
              ))}
            </Select>

            <Input
              type="date"
              label="Fecha *"
              value={form.date}
              onChange={(e: any) => setForm({ ...form, date: e.target.value })}
            />

            <Input
              type="time"
              label="Hora *"
              value={form.time}
              onChange={(e: any) => setForm({ ...form, time: e.target.value })}
            />

            <Input
              type="url"
              label="Link de la clase (Zoom/Meet)"
              placeholder="https://meet.google.com/..."
              value={form.meeting_url}
              onChange={(e: any) => setForm({ ...form, meeting_url: e.target.value })}
            />
            <p className="text-xs text-slate-500 -mt-2 mb-2">
              💡 Para clases online, pega aquí el enlace. El estudiante lo verá en su calendario y recibirá por email.
            </p>

            <Button onClick={schedule} className="w-full" size="lg">
              <Calendar size={16} className="mr-2" />
              Agendar clase
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
