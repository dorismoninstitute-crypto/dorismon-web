"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { studentPayments } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Badge, Button, Input, Select, showToast } from "@/components/ui";
import { Gift, Calendar, CheckCircle2, Clock, User as UserIcon, Sparkles } from "lucide-react";

export default function StudentTrialPage() {
  const [trial, setTrial] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    modality: "online",
    preferred_level: "",
    preferred_date: "",
    preferred_time: "",
    notes: "",
  });

  const load = () => {
    setLoading(true);
    studentPayments.trialStatus()
      .then((d: any) => { setTrial(d); setLoading(false); })
      .catch((e: any) => { setErr(e.message); setLoading(false); });
  };
  useEffect(load, []);

  const submit = async () => {
    setSubmitting(true);
    try {
      await studentPayments.requestTrial(form);
      showToast("success", "🎁 ¡Solicitud enviada! Te asignaremos un profesor pronto.");
      load();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader
        title="🎁 Clase de prueba GRATIS"
        subtitle="Conoce nuestros profesores y metodología antes de inscribirte"
      />

      {trial?.has_trial ? (
        // YA TIENE TRIAL
        <Card>
          <CardBody>
            <div className="text-center py-6">
              {trial.status === "requested" && (
                <>
                  <Clock size={64} className="text-amber-500 mx-auto mb-3" />
                  <h2 className="font-black text-xl mb-2">⏳ Solicitud en revisión</h2>
                  <p className="text-slate-600 mb-4">
                    Estamos asignándote un profesor disponible. Te avisaremos en máximo 24h.
                  </p>
                  <Badge variant="warning">Pendiente agendar</Badge>
                </>
              )}

              {trial.status === "scheduled" && (
                <>
                  <Calendar size={64} className="text-emerald-500 mx-auto mb-3" />
                  <h2 className="font-black text-xl mb-2">✅ Tu clase está agendada</h2>
                  <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 rounded text-left max-w-md mx-auto my-4">
                    <p className="text-sm"><strong>Profesor:</strong> {trial.teacher_name}</p>
                    <p className="text-sm"><strong>Fecha:</strong> {new Date(trial.scheduled_at).toLocaleString("es-DO")}</p>
                    <p className="text-sm"><strong>Modalidad:</strong> {trial.modality}</p>
                  </div>
                  <Link href="/dashboard/student/calendar">
                    <Button>Ver en mi calendario</Button>
                  </Link>
                </>
              )}

              {trial.status === "completed" && (
                <>
                  <CheckCircle2 size={64} className="text-blue-500 mx-auto mb-3" />
                  <h2 className="font-black text-xl mb-2">🎉 ¡Completaste tu clase de prueba!</h2>
                  <p className="text-slate-600 mb-5">¿Te gustó? Ahora inscríbete a un plan para continuar.</p>
                  <Link href="/checkout">
                    <Button size="lg">Ver planes e inscribirme →</Button>
                  </Link>
                </>
              )}
            </div>
          </CardBody>
        </Card>
      ) : (
        // FORMULARIO PARA SOLICITAR
        <>
          <Card className="mb-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardBody>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={22} className="text-white" />
                </div>
                <div>
                  <p className="font-black text-amber-900">100% GRATIS · 1 sola vez</p>
                  <p className="text-sm text-amber-800 mt-1">
                    Una clase con un profesor real para que conozcas nuestra metodología.
                    Sin compromiso de compra.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="font-bold mb-4 text-slate-900">Detalles de tu clase de prueba</h3>
              <div className="space-y-3">
                <Select
                  label="¿Cómo prefieres tomarla? *"
                  value={form.modality}
                  onChange={(e: any) => setForm({ ...form, modality: e.target.value })}
                >
                  <option value="online">💻 Online (videollamada)</option>
                  <option value="presencial">🏫 Presencial (en el instituto)</option>
                </Select>

                <Select
                  label="Nivel aproximado (opcional)"
                  value={form.preferred_level}
                  onChange={(e: any) => setForm({ ...form, preferred_level: e.target.value })}
                >
                  <option value="">No estoy seguro / Que evalúen</option>
                  <option value="A1">A1 — Principiante</option>
                  <option value="A2">A2 — Elemental</option>
                  <option value="B1">B1 — Intermedio</option>
                  <option value="B2">B2 — Intermedio Alto</option>
                  <option value="C1">C1 — Avanzado</option>
                  <option value="C2">C2 — Experto</option>
                </Select>

                <Input
                  type="date"
                  label="Fecha preferida (opcional)"
                  value={form.preferred_date}
                  onChange={(e: any) => setForm({ ...form, preferred_date: e.target.value })}
                />

                <Select
                  label="Horario preferido (opcional)"
                  value={form.preferred_time}
                  onChange={(e: any) => setForm({ ...form, preferred_time: e.target.value })}
                >
                  <option value="">Cualquier horario</option>
                  <option value="morning">🌅 Mañana (8am - 12pm)</option>
                  <option value="afternoon">☀️ Tarde (12pm - 6pm)</option>
                  <option value="evening">🌙 Noche (6pm - 9pm)</option>
                </Select>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    placeholder="Cuéntanos qué quieres lograr aprendiendo inglés..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                  />
                </div>

                <Button onClick={submit} disabled={submitting} className="w-full" size="lg">
                  <Gift size={18} className="mr-2" />
                  {submitting ? "Enviando..." : "🎁 Solicitar mi clase gratis"}
                </Button>

                <p className="text-xs text-slate-500 text-center">
                  ⚠️ Solo puedes pedir UNA clase de prueba. Después de probar, podrás inscribirte a un plan.
                </p>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </>
  );
}
