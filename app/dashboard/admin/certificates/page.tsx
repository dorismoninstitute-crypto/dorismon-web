"use client";
import { useEffect, useState } from "react";
import { adminApi, adminHelpers, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Select, Input, Modal, SuccessBox } from "@/components/ui";

export default function AdminCertificatesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");
  // V3.9.28
  const [anulando, setAnulando] = useState<any>(null);
  const [motivo, setMotivo] = useState("");
  const [anulandoBusy, setAnulandoBusy] = useState(false);
  const [aviso, setAviso] = useState<any>(null);

  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);

  const [form, setForm] = useState({
    student_id: "", course_id: "", level_id: "",
    hours: 120, final_grade: 0,
  });

  const load = () => {
    setLoading(true);
    adminApi.certificates()
      .then(d => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const openModal = async () => {
    try {
      const [s, c] = await Promise.all([
        adminHelpers.studentsSimple(), adminApi.courses(),
      ]);
      setStudents(safeArray(s));
      setCourses(safeArray(c));
      setShow(true);
    } catch (e: any) { setMsg("✗ " + e.message); }
  };

  const onCourseChange = async (course_id: string) => {
    setForm({ ...form, course_id, level_id: "" });
    if (course_id) {
      try {
        const lvls = await adminHelpers.levelsByCourse(parseInt(course_id));
        setLevels(safeArray(lvls));
      } catch {}
    } else { setLevels([]); }
  };

  // V3.9.28 — Emitir con red de seguridad: si el estudiante no terminó el
  // nivel (o ya tiene certificado), el sistema avisa antes de emitir.
  const emitir = async (confirmarIgual = false) => {
    setMsg("");
    try {
      const r = await adminApi.issueCertificate({
        student_id: form.student_id,
        course_id: parseInt(form.course_id),
        level_id: parseInt(form.level_id),
        hours: form.hours,
        final_grade: form.final_grade > 0 ? form.final_grade : undefined,
        ...(confirmarIgual ? { confirmar_incompleto: true } : {}),
      });
      setMsg(`✓ Certificado emitido: ${r.code}`);
      setShow(false);
      setAviso(null);
      setForm({ student_id: "", course_id: "", level_id: "", hours: 120, final_grade: 0 });
      load();
    } catch (e: any) {
      // El backend devuelve 409 cuando hace falta confirmar
      if (e?.status === 409 && e?.detail?.necesita_confirmacion) {
        setAviso({ mensaje: e.detail.mensaje });
        return;
      }
      setMsg("✗ " + e.message);
    }
  };
  const create = () => emitir(false);

  const anular = async () => {
    if (!anulando || !motivo.trim()) return;
    setAnulandoBusy(true);
    try {
      await adminApi.revokeCertificate(anulando.id, motivo.trim());
      setMsg("✓ Certificado anulado");
      setAnulando(null);
      setMotivo("");
      load();
    } catch (e: any) { setMsg("✗ " + e.message); }
    finally { setAnulandoBusy(false); }
  };

  const restaurar = async (c: any) => {
    if (!confirm(`¿Deshacer la anulación del certificado ${c.code}?`)) return;
    try {
      await adminApi.restoreCertificate(c.id);
      setMsg("✓ Anulación deshecha");
      load();
    } catch (e: any) { setMsg("✗ " + e.message); }
  };

  const formValid = form.student_id && form.course_id && form.level_id;

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader
        title="Certificados emitidos"
        subtitle={`${items.length} certificados`}
        action={<Button onClick={openModal}>+ Emitir certificado</Button>}
      />
      {msg.startsWith("✓") && <div className="mb-4"><SuccessBox message={msg} /></div>}
      {msg.startsWith("✗") && <div className="mb-4"><ErrorBox message={msg.slice(2)} /></div>}

      {items.length === 0 ? <EmptyState icon="🎓" title="Sin certificados emitidos" description="Cuando un estudiante termine un nivel, emití su certificado." /> : (
        <Card>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {items.map((c: any) => (
                <div key={c.id} className="p-4 flex items-center gap-3">
                  <div className="text-3xl">🎓</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{c.student_name}</p>
                    <p className="text-xs text-slate-500">{c.course_name} · Nivel {c.level_code} · {c.hours} horas</p>
                    <p className="text-xs font-mono text-slate-400 mt-1">{c.code}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-500">{new Date(c.issued_at).toLocaleDateString("es")}</p>
                    {c.final_grade && <p className="text-sm font-bold text-emerald-600">{c.final_grade}%</p>}
                    {/* V3.9.28: anular un certificado emitido por error */}
                    {c.revoked ? (
                      <div className="mt-1">
                        <Badge variant="danger">Anulado</Badge>
                        <button
                          onClick={() => restaurar(c)}
                          className="block text-[11px] text-slate-500 hover:text-slate-700 mt-1 ml-auto"
                        >
                          Deshacer
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAnulando(c)}
                        className="text-[11px] text-red-600 hover:text-red-700 font-semibold mt-1"
                      >
                        Anular
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* V3.9.28 — Anular certificado */}
      <Modal open={!!anulando} onClose={() => setAnulando(null)} title="Anular certificado">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900">
            <p className="font-semibold mb-1">¿Qué pasa al anular?</p>
            <ul className="text-xs space-y-1 list-disc list-inside leading-relaxed">
              <li>Desaparece del panel del estudiante</li>
              <li>Su código deja de verificar como válido</li>
              <li>Se le avisa al estudiante con el motivo</li>
              <li>No se borra: queda el registro y se puede deshacer</li>
            </ul>
          </div>
          <Input
            label="Motivo de la anulación *"
            value={motivo}
            onChange={(e: any) => setMotivo(e.target.value)}
            placeholder="Ej: emitido por error, el estudiante no ha terminado el nivel"
          />
          <div className="flex gap-2">
            <Button onClick={anular} disabled={!motivo.trim() || anulandoBusy} variant="danger">
              {anulandoBusy ? "Anulando..." : "Anular certificado"}
            </Button>
            <Button onClick={() => setAnulando(null)} variant="secondary">Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* V3.9.28 — Aviso antes de certificar a alguien que no terminó */}
      <Modal open={!!aviso} onClose={() => setAviso(null)} title="Espera un momento">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-900 leading-relaxed">{aviso?.mensaje}</p>
          </div>
          <p className="text-sm text-slate-600">
            ¿Seguro que quieres emitir el certificado de todas formas?
          </p>
          <div className="flex gap-2">
            <Button onClick={() => emitir(true)} variant="primary">Sí, emitir igual</Button>
            <Button onClick={() => setAviso(null)} variant="secondary">Cancelar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={show} onClose={() => setShow(false)} title="Emitir certificado" size="lg">
        <div className="space-y-4">
          <Select label="Estudiante *" value={form.student_id} onChange={(e: any) => setForm({ ...form, student_id: e.target.value })}>
            <option value="">Seleccionar...</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </Select>

          <Select label="Curso *" value={form.course_id} onChange={(e: any) => onCourseChange(e.target.value)}>
            <option value="">Seleccionar...</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>

          <Select label="Nivel completado *" value={form.level_id} onChange={(e: any) => setForm({ ...form, level_id: e.target.value })} disabled={!levels.length}>
            <option value="">{levels.length ? "Seleccionar..." : "Curso primero"}</option>
            {levels.map(l => <option key={l.id} value={l.id}>{l.code} — {l.name}</option>)}
          </Select>

          <div className="grid md:grid-cols-2 gap-3">
            <Input label="Horas cursadas" type="number" value={form.hours} onChange={(e: any) => setForm({ ...form, hours: Number(e.target.value) })} />
            <Input label="Promedio final (0-100)" type="number" min="0" max="100" value={form.final_grade} onChange={(e: any) => setForm({ ...form, final_grade: Number(e.target.value) })} placeholder="opcional" />
          </div>

          <p className="text-xs text-slate-500">El estudiante recibirá una notificación con el código del certificado.</p>

          <Button onClick={create} disabled={!formValid} className="w-full" size="lg">
            Emitir certificado
          </Button>
        </div>
      </Modal>
    </>
  );
}
