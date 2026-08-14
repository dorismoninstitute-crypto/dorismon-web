"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, showToast } from "@/components/ui";
import SelectorVideo from "@/components/SelectorVideo";  // V3.9.38
import { RotateCcw, Calendar, User, AlertTriangle, Check, X, Plus } from "lucide-react";

/**
 * V3.9.36 — Reposiciones de clases perdidas.
 *
 * El estudiante pide, tú apruebas y agendas. La clase de recuperación se
 * crea como clase suelta: LA SERIE NO SE TOCA, la recurrencia sigue igual.
 */

const ESTADOS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Esperando respuesta", cls: "bg-amber-100 text-amber-700" },
  scheduled: { label: "Ya tiene fecha", cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "No aprobada", cls: "bg-slate-100 text-slate-600" },
};

function fecha(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export default function ReposicionesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [filtro, setFiltro] = useState("pending");
  const [agendando, setAgendando] = useState<any>(null);
  const [cuando, setCuando] = useState("");
  const [duracion, setDuracion] = useState(60);
  const [ocupado, setOcupado] = useState(false);
  // V3.9.37 — Agendar una reposición sin esperar a que la pidan
  const [nueva, setNueva] = useState(false);
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [profesores, setProfesores] = useState<any[]>([]);
  const [faltadas, setFaltadas] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    student_id: "", original_session_id: "", teacher_id: "",
    starts_at_utc: "", duration_min: 60, modality: "online",
    counts_for_progress: false, reason: "",
    video_provider: "meet", meeting_url: "",
  });

  const cargar = async (f = filtro) => {
    setLoading(true);
    try {
      const r = await api(`/admin/makeup-requests?status=${f}`, { auth: true });
      setItems(r?.items || []);
      setErr("");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(filtro); /* eslint-disable-next-line */ }, [filtro]);

  useEffect(() => {
    if (!nueva || estudiantes.length) return;
    // V3.9.39 — Solo estudiantes CON INSCRIPCIÓN ACTIVA, con su nivel, grupo
    // y profesor. Antes salían todas las cuentas de estudiante (incluidas las
    // que nunca se inscribieron), y eso no sirve para agendar una reposición.
    api("/admin/students-for-makeup", { auth: true })
      .then((r: any) => {
        const lista = r?.items || [];
        setEstudiantes(lista);
        if (lista.length === 0) {
          showToast("error", "No hay estudiantes con inscripción activa.");
        }
      })
      .catch(() => showToast("error", "No se pudieron cargar los estudiantes. Recarga la página."));
    api("/admin/users?role=teacher", { auth: true })
      .then((r: any) => setProfesores(r?.items || []))
      .catch(() => {});
  }, [nueva, estudiantes.length]);

  // Al elegir estudiante, traer sus clases perdidas
  useEffect(() => {
    if (!form.student_id) { setFaltadas([]); return; }
    api(`/admin/students/${form.student_id}/missed-classes`, { auth: true })
      .then((r: any) => setFaltadas(r?.items || []))
      .catch(() => setFaltadas([]));
  }, [form.student_id]);

  const crearDirecta = async () => {
    if (!form.student_id || !form.starts_at_utc) {
      showToast("error", "Elige el estudiante y la fecha");
      return;
    }
    setOcupado(true);
    try {
      await api("/admin/makeup-requests/direct", {
        method: "POST", auth: true,
        body: {
          ...form,
          original_session_id: form.original_session_id || undefined,
          teacher_id: form.teacher_id || undefined,
          starts_at_utc: new Date(form.starts_at_utc).toISOString(),
        },
      });
      showToast("success", "✅ Reposición agendada. Se avisó al estudiante y al profesor.");
      setNueva(false);
      setForm({
        student_id: "", original_session_id: "", teacher_id: "",
        starts_at_utc: "", duration_min: 60, modality: "online",
        counts_for_progress: false, reason: "",
        video_provider: "meet", meeting_url: "",
      });
      await cargar();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setOcupado(false);
    }
  };

  const agendar = async () => {
    if (!cuando) {
      showToast("error", "Elige la fecha y hora de la reposición");
      return;
    }
    setOcupado(true);
    try {
      await api(`/admin/makeup-requests/${agendando.id}/schedule`, {
        method: "POST", auth: true,
        body: {
          starts_at_utc: new Date(cuando).toISOString(),
          duration_min: duracion,
        },
      });
      showToast("success", "✅ Reposición agendada. Se avisó al estudiante y al profesor.");
      setAgendando(null);
      setCuando("");
      await cargar();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setOcupado(false);
    }
  };

  const rechazar = async (r: any) => {
    const motivo = prompt("¿Por qué no se aprueba? (el estudiante lo verá)");
    if (!motivo?.trim()) return;
    try {
      await api(`/admin/makeup-requests/${r.id}/reject`, {
        method: "POST", auth: true, body: { note: motivo.trim() },
      });
      showToast("success", "Solicitud cerrada, se le avisó al estudiante");
      await cargar();
    } catch (e: any) {
      showToast("error", e.message);
    }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <div>
      <PageHeader
        title="Reposiciones"
        subtitle="Clases perdidas que se reponen en otra fecha. La serie no se toca."
        action={
          <button
            onClick={() => setNueva(true)}
            className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Agendar reposición
          </button>
        }
      />

      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { k: "pending", l: "Pendientes" },
          { k: "scheduled", l: "Agendadas" },
          { k: "rejected", l: "No aprobadas" },
          { k: "all", l: "Todas" },
        ].map((f) => (
          <button
            key={f.k}
            onClick={() => setFiltro(f.k)}
            className={`text-sm font-semibold px-4 py-2 rounded-xl border-2 transition ${
              filtro === f.k
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {f.l}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500 text-center py-10">
              {filtro === "pending"
                ? "No hay solicitudes esperando respuesta. 🎉"
                : "Nada por aquí."}
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const est = ESTADOS[r.status] || ESTADOS.pending;
            return (
              <Card key={r.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-bold text-slate-800">{r.student_name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${est.cls}`}>
                          {est.label}
                        </span>
                        {r.missed_by === "teacher" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                            ⚠️ Faltó el profesor
                          </span>
                        )}
                        {/* V3.9.37 — de dónde vino */}
                        {r.created_by === "admin" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            Agendada por ti
                          </span>
                        )}
                        {r.counts_for_progress && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                            Cuenta para el temario
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Perdió: <strong>{r.original_title}</strong> · {fecha(r.original_date)}
                      </p>
                      {r.teacher_name && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" /> {r.teacher_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {r.reason && (
                    <div className="bg-slate-50 rounded-lg px-3 py-2 mb-3">
                      <p className="text-xs text-slate-600 italic">&ldquo;{r.reason}&rdquo;</p>
                      {r.preferred_date && (
                        <p className="text-[11px] text-slate-500 mt-1">
                          Prefiere: {r.preferred_date}
                        </p>
                      )}
                    </div>
                  )}

                  {r.missed_by === "teacher" && r.status === "pending" && (
                    <div className="bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-3 flex gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-rose-800 leading-relaxed">
                        Al agendarla, la ausencia deja de contar contra el estudiante
                        (pasa a justificada).
                      </p>
                    </div>
                  )}

                  {r.status === "scheduled" && r.makeup_date && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-3">
                      <p className="text-xs text-emerald-800 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Repone el <strong>{fecha(r.makeup_date)}</strong>
                      </p>
                    </div>
                  )}

                  {r.status === "pending" && (
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => { setAgendando(r); setCuando(""); }}
                        className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Agendar reposición
                      </button>
                      <button
                        onClick={() => rechazar(r)}
                        className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-2.5 rounded-lg hover:bg-slate-50 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                        No aprobar
                      </button>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* V3.9.37 — Agendar una reposición sin que la pidan */}
      {nueva && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setNueva(false)}>
          <div className="bg-white rounded-2xl p-5 max-w-lg w-full my-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-slate-800 mb-1">Agendar una reposición</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Sin esperar a que la pidan. Se crea como clase suelta:
              <strong> el horario del estudiante no cambia</strong>.
            </p>

            <label className="block text-xs font-semibold text-slate-600 mb-1">Estudiante *</label>
            <select
              value={form.student_id}
              onChange={(e) => setForm({ ...form, student_id: e.target.value, original_session_id: "" })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm mb-3"
            >
              <option value="">— Elige el estudiante —</option>
              {estudiantes.map((s: any) => (
                <option key={s.student_id} value={s.student_id}>
                  {s.display}{s.is_paused ? " (en pausa)" : ""}
                </option>
              ))}
            </select>

            {form.student_id && (() => {
              const el = estudiantes.find((x: any) => x.student_id === form.student_id);
              if (!el) return null;
              return (
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-3 text-xs text-slate-600">
                  <strong>{el.name}</strong> · Nivel {el.level_code}
                  {el.group_name ? ` · Grupo ${el.group_name}` : " · sin grupo asignado"}
                  {el.teacher_name && ` · Profesor: ${el.teacher_name}`}
                </div>
              );
            })()}

            {form.student_id && (
              <>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ¿Qué clase repone? (opcional)
                </label>
                <select
                  value={form.original_session_id}
                  onChange={(e) => setForm({ ...form, original_session_id: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm mb-1"
                >
                  <option value="">Ninguna en particular</option>
                  {faltadas.map((f: any) => (
                    <option key={f.session_id} value={f.session_id} disabled={f.already_requested}>
                      {f.title} — {new Date(f.starts_at_utc).toLocaleDateString("es")}
                      {f.already_requested ? " (ya repuesta)" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mb-3">
                  {faltadas.length === 0
                    ? "Este estudiante no tiene faltas registradas — puedes agendar igual."
                    : "Déjalo en blanco si es una clase que le debes, no una falta."}
                </p>
              </>
            )}

            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha y hora *</label>
                <input
                  type="datetime-local"
                  value={form.starts_at_utc}
                  onChange={(e) => setForm({ ...form, starts_at_utc: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Duración (min)</label>
                <input
                  type="number" min={15} max={240} step={15}
                  value={form.duration_min}
                  onChange={(e) => setForm({ ...form, duration_min: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Profesor</label>
                <select
                  value={form.teacher_id}
                  onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                >
                  <option value="">El suyo de siempre</option>
                  {profesores.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Modalidad</label>
                <select
                  value={form.modality}
                  onChange={(e) => setForm({ ...form, modality: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                >
                  <option value="online">Online</option>
                  <option value="presencial">Presencial</option>
                  <option value="hibrida">Híbrida</option>
                </select>
              </div>
            </div>

            {/* V3.9.38 — Dónde será el video de esta reposición */}
            {form.modality !== "presencial" && (
              <div className="mb-3">
                <SelectorVideo
                  value={form.video_provider}
                  onChange={(v) => setForm({ ...form, video_provider: v })}
                />
                <input
                  value={form.meeting_url}
                  onChange={(e) => setForm({ ...form, meeting_url: e.target.value })}
                  placeholder={form.video_provider === "dorismon"
                    ? "Enlace de respaldo (recomendado)"
                    : "Link de Zoom / Meet / Teams"}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm mt-2"
                />
              </div>
            )}

            {/* La decisión que acordamos */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.counts_for_progress}
                  onChange={(e) => setForm({ ...form, counts_for_progress: e.target.checked })}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    Esta clase avanza el temario del curso
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                    Márcalo solo si es contenido <strong>nuevo</strong>. Si repone algo que
                    ya se vio, déjalo sin marcar para que no lo adelante dos veces.
                  </p>
                </div>
              </label>
            </div>

            <label className="block text-xs font-semibold text-slate-600 mb-1">Nota (opcional)</label>
            <input
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Ej: clase que quedó pendiente de la semana pasada"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={crearDirecta}
                disabled={ocupado || !form.student_id || !form.starts_at_utc}
                className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition"
              >
                {ocupado ? "Agendando..." : "Agendar reposición"}
              </button>
              <button
                onClick={() => setNueva(false)}
                className="border border-slate-200 text-slate-600 text-sm px-4 py-2.5 rounded-lg hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agendar */}
      {agendando && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setAgendando(null)}>
          <div className="bg-white rounded-2xl p-5 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-slate-800 mb-1">Agendar reposición</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Para <strong>{agendando.student_name}</strong>. Se crea una clase suelta:
              la serie y su recurrencia no se tocan.
            </p>

            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Fecha y hora
            </label>
            <input
              type="datetime-local"
              value={cuando}
              onChange={(e) => setCuando(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm mb-3"
            />

            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Duración (minutos)
            </label>
            <input
              type="number" min={15} max={240} step={15}
              value={duracion}
              onChange={(e) => setDuracion(Number(e.target.value))}
              className="w-28 border border-slate-200 rounded-lg px-3 py-2.5 text-sm mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={agendar}
                disabled={ocupado || !cuando}
                className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition"
              >
                <Check className="w-4 h-4 inline mr-1" />
                {ocupado ? "Agendando..." : "Agendar"}
              </button>
              <button
                onClick={() => setAgendando(null)}
                className="border border-slate-200 text-slate-600 text-sm px-4 py-2.5 rounded-lg hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
