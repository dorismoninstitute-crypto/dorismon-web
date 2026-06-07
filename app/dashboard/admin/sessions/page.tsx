"use client";
import { useEffect, useState } from "react";
import { adminApi, adminHelpers, safeArray, safeObj } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Input, Textarea, Select, Modal, SuccessBox } from "@/components/ui";

export default function AdminSessionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");

  // Form
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);

  const [form, setForm] = useState({
    teacher_id: "", course_id: "", level_id: "",
    title: "", description: "", modality: "online",
    starts_at: "", duration_min: 90,
    meeting_url: "", branch_id: "", classroom_id: "",
    capacity: 12,
  });

  const load = () => {
    setLoading(true);
    adminApi.sessions(page)
      .then(d => { setItems(safeArray(safeObj(d, {} as any).items)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, [page]);

  const openModal = async () => {
    try {
      const [ts, cs, bs] = await Promise.all([
        adminHelpers.teachers(), adminApi.courses(), adminApi.branches(),
      ]);
      setTeachers(safeArray(ts));
      setCourses(safeArray(cs));
      setBranches(safeArray(bs));
      setShow(true);
    } catch (e: any) { setMsg("✗ " + e.message); }
  };

  // Cargar niveles cuando cambia el curso
  const onCourseChange = async (course_id: string) => {
    setForm({ ...form, course_id, level_id: "" });
    if (course_id) {
      try {
        const lvls = await adminHelpers.levelsByCourse(parseInt(course_id));
        setLevels(safeArray(lvls));
      } catch {}
    } else {
      setLevels([]);
    }
  };

  // Cargar aulas cuando cambia la sede
  const onBranchChange = async (branch_id: string) => {
    setForm({ ...form, branch_id, classroom_id: "" });
    if (branch_id) {
      try {
        const rooms = await adminApi.classrooms(parseInt(branch_id));
        setClassrooms(safeArray(rooms));
      } catch {}
    } else {
      setClassrooms([]);
    }
  };

  const create = async () => {
    setMsg("");
    try {
      const start = new Date(form.starts_at);
      const end = new Date(start.getTime() + form.duration_min * 60000);
      const body: any = {
        teacher_id: form.teacher_id,
        course_id: parseInt(form.course_id),
        level_id: parseInt(form.level_id),
        title: form.title,
        description: form.description || undefined,
        modality: form.modality,
        starts_at_utc: start.toISOString(),
        ends_at_utc: end.toISOString(),
        capacity: form.capacity,
      };
      if (form.modality === "online" || form.modality === "hibrida") {
        body.meeting_url = form.meeting_url;
      }
      if (form.modality === "presencial" || form.modality === "hibrida") {
        if (form.branch_id) body.branch_id = parseInt(form.branch_id);
        if (form.classroom_id) body.classroom_id = parseInt(form.classroom_id);
      }
      await adminApi.createSession(body);
      setMsg("✓ Clase programada con éxito");
      setShow(false);
      setForm({
        teacher_id: "", course_id: "", level_id: "",
        title: "", description: "", modality: "online",
        starts_at: "", duration_min: 90,
        meeting_url: "", branch_id: "", classroom_id: "", capacity: 12,
      });
      load();
    } catch (e: any) { setMsg("✗ " + e.message); }
  };

  const cancel = async (id: string) => {
    if (!confirm("¿Cancelar esta clase?")) return;
    try { await adminApi.cancelSession(id); load(); }
    catch (e: any) { alert(e.message); }
  };

  const formValid = form.teacher_id && form.course_id && form.level_id && form.title && form.starts_at &&
    (form.modality === "online" ? form.meeting_url :
     form.modality === "presencial" ? form.branch_id :
     (form.meeting_url && form.branch_id));

  return (
    <>
      <PageHeader
        title="Clases programadas"
        action={<Button onClick={openModal}>+ Nueva clase</Button>}
      />
      {msg.startsWith("✓") && <div className="mb-4"><SuccessBox message={msg} /></div>}
      {msg.startsWith("✗") && <div className="mb-4"><ErrorBox message={msg.slice(2)} /></div>}

      {loading ? <LoadingScreen /> : err ? <ErrorBox message={err} /> :
       items.length === 0 ? <EmptyState icon="📅" title="Sin clases" description="Hacé clic en '+ Nueva clase' para programar una." /> : (
        <Card>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {items.map((s: any) => (
                <div key={s.id} className={`p-4 flex flex-wrap items-center gap-3 ${s.status === "cancelled" ? "opacity-50" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant={s.modality === "online" ? "brand" : s.modality === "presencial" ? "accent" : "info"}>{s.modality}</Badge>
                      <Badge>{s.level_code}</Badge>
                      {s.status === "cancelled" && <Badge variant="danger">Cancelada</Badge>}
                    </div>
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-xs text-slate-500">
                      {s.starts_at_utc && new Date(s.starts_at_utc).toLocaleString("es", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {" · "}{s.teacher_name}{" · "}{s.course_name}
                    </p>
                  </div>
                  {s.status !== "cancelled" && (
                    <Button variant="danger" size="sm" onClick={() => cancel(s.id)}>Cancelar</Button>
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
      <div className="flex justify-center gap-2 mt-6">
        <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>← Anterior</Button>
        <span className="px-4 py-1.5 text-sm font-semibold">Página {page}</span>
        <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={items.length < 50}>Siguiente →</Button>
      </div>

      {/* Modal Nueva clase */}
      <Modal open={show} onClose={() => setShow(false)} title="Programar nueva clase" size="lg">
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <Select label="Profesor *" value={form.teacher_id} onChange={(e: any) => setForm({ ...form, teacher_id: e.target.value })}>
              <option value="">Seleccionar...</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </Select>
            <Select label="Curso *" value={form.course_id} onChange={(e: any) => onCourseChange(e.target.value)}>
              <option value="">Seleccionar...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>

          <Select label="Nivel *" value={form.level_id} onChange={(e: any) => setForm({ ...form, level_id: e.target.value })} disabled={!levels.length}>
            <option value="">{levels.length ? "Seleccionar..." : "Seleccioná un curso primero"}</option>
            {levels.map(l => <option key={l.id} value={l.id}>{l.code} — {l.name}</option>)}
          </Select>

          <Input label="Título de la clase *" value={form.title} onChange={(e: any) => setForm({ ...form, title: e.target.value })} placeholder="ej: Present perfect" />
          <Textarea label="Descripción" value={form.description} onChange={(e: any) => setForm({ ...form, description: e.target.value })} placeholder="Qué se va a enseñar" />

          <Select label="Modalidad *" value={form.modality} onChange={(e: any) => setForm({ ...form, modality: e.target.value })}>
            <option value="online">🌐 Online</option>
            <option value="presencial">🏢 Presencial</option>
            <option value="hibrida">🔀 Híbrida (ambas)</option>
          </Select>

          <div className="grid md:grid-cols-2 gap-3">
            <Input label="Fecha y hora inicio *" type="datetime-local" value={form.starts_at} onChange={(e: any) => setForm({ ...form, starts_at: e.target.value })} />
            <Input label="Duración (min)" type="number" value={form.duration_min} onChange={(e: any) => setForm({ ...form, duration_min: Number(e.target.value) })} />
          </div>

          {(form.modality === "online" || form.modality === "hibrida") && (
            <Input
              label={`URL de Zoom/Meet/Teams ${form.modality === "online" ? "*" : "(híbrida *)"}`}
              value={form.meeting_url}
              onChange={(e: any) => setForm({ ...form, meeting_url: e.target.value })}
              placeholder="https://meet.google.com/..."
            />
          )}

          {(form.modality === "presencial" || form.modality === "hibrida") && (
            <div className="grid md:grid-cols-2 gap-3">
              <Select label="Sede *" value={form.branch_id} onChange={(e: any) => onBranchChange(e.target.value)}>
                <option value="">Seleccionar sede...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
              <Select label="Aula" value={form.classroom_id} onChange={(e: any) => setForm({ ...form, classroom_id: e.target.value })} disabled={!classrooms.length}>
                <option value="">{classrooms.length ? "Seleccionar..." : "Sede primero"}</option>
                {classrooms.map(r => <option key={r.id} value={r.id}>{r.name} (cap. {r.capacity})</option>)}
              </Select>
            </div>
          )}

          <Input label="Capacidad" type="number" value={form.capacity} onChange={(e: any) => setForm({ ...form, capacity: Number(e.target.value) })} />

          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-3">Los estudiantes del nivel recibirán notificación automática.</p>
            <Button onClick={create} disabled={!formValid} className="w-full" size="lg">
              Programar clase
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
