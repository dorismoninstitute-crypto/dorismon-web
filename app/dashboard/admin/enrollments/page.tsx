"use client";
import { useEffect, useState } from "react";
import { adminApi, adminEdit, adminHelpers, adminPlans, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Select, Modal, ConfirmModal, showToast } from "@/components/ui";

export default function AdminEnrollmentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  const [form, setForm] = useState({
    student_id: "", course_id: "", level_id: "", teacher_id: "", plan_id: "",
  });
  const [editForm, setEditForm] = useState({ teacher_id: "", level_id: "", plan_id: "" });

  const load = () => {
    setLoading(true);
    adminApi.enrollments()
      .then(d => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const loadDropdowns = async () => {
    try {
      const [s, t, c, p] = await Promise.all([
        adminHelpers.studentsSimple(), adminHelpers.teachers(),
        adminApi.courses(), adminPlans.list(),
      ]);
      setStudents(safeArray(s));
      setTeachers(safeArray(t));
      setCourses(safeArray(c));
      setPlans(safeArray(p));
    } catch (e: any) { showToast("error", e.message); }
  };

  const openCreate = async () => {
    await loadDropdowns();
    setForm({ student_id: "", course_id: "", level_id: "", teacher_id: "", plan_id: "" });
    setShow(true);
  };

  const openEdit = async (e: any) => {
    await loadDropdowns();
    setEditing(e);
    setEditForm({ teacher_id: e.teacher_id || "", level_id: String(e.level_id || ""), plan_id: String(e.plan_id || "") });
    // Cargar niveles del curso
    try {
      const lvls = await adminHelpers.levelsByCourse(e.course_id);
      setLevels(safeArray(lvls));
    } catch {}
  };

  const onCourseChange = async (course_id: string) => {
    setForm({ ...form, course_id, level_id: "" });
    if (course_id) {
      try { setLevels(safeArray(await adminHelpers.levelsByCourse(parseInt(course_id)))); } catch {}
    } else { setLevels([]); }
  };

  const create = async () => {
    try {
      await adminApi.createEnrollment({
        student_id: form.student_id,
        course_id: parseInt(form.course_id),
        level_id: parseInt(form.level_id),
        teacher_id: form.teacher_id || undefined,
        plan_id: form.plan_id ? parseInt(form.plan_id) : undefined,
      });
      showToast("success", "Estudiante inscrito");
      setShow(false);
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const body: any = {};
      if (editForm.teacher_id) body.teacher_id = editForm.teacher_id;
      if (editForm.level_id) body.level_id = parseInt(editForm.level_id);
      if (editForm.plan_id) body.plan_id = parseInt(editForm.plan_id);
      await adminEdit.updateEnrollment(editing.id, body);
      showToast("success", "Inscripción actualizada. Estudiante notificado.");
      setEditing(null);
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  const doDelete = async (id: string) => {
    try {
      await adminEdit.deleteEnrollment(id);
      showToast("info", "Inscripción desactivada");
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  const formValid = form.student_id && form.course_id && form.level_id;

  return (
    <>
      <PageHeader
        title="Inscripciones"
        subtitle={`${items.length} inscripciones`}
        action={<Button onClick={openCreate}>+ Inscribir estudiante</Button>}
      />

      {items.length === 0 ? <EmptyState icon="📋" title="Sin inscripciones" /> : (
        <Card>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {items.map((e: any) => (
                <div key={e.id} className="p-4 flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold">{e.student_name}</p>
                    <p className="text-xs text-slate-500">
                      {e.course_name} · Nivel {e.level_code}
                      {e.teacher_name && ` · 👨‍🏫 ${e.teacher_name}`}
                    </p>
                  </div>
                  {e.is_active ? <Badge variant="success">Activa</Badge> : <Badge>Inactiva</Badge>}
                  <Button size="sm" variant="outline" onClick={() => openEdit(e)}>Editar</Button>
                  {e.is_active && (
                    <Button size="sm" variant="danger" onClick={() => setConfirmDeleteId(e.id)}>Desactivar</Button>
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Crear */}
      <Modal open={show} onClose={() => setShow(false)} title="Inscribir estudiante" size="lg">
        <div className="space-y-3">
          <Select label="Estudiante *" value={form.student_id} onChange={(e: any) => setForm({ ...form, student_id: e.target.value })}>
            <option value="">Seleccionar...</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </Select>
          <Select label="Curso *" value={form.course_id} onChange={(e: any) => onCourseChange(e.target.value)}>
            <option value="">Seleccionar...</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select label="Nivel *" value={form.level_id} onChange={(e: any) => setForm({ ...form, level_id: e.target.value })} disabled={!levels.length}>
            <option value="">{levels.length ? "Seleccionar..." : "Curso primero"}</option>
            {levels.map(l => <option key={l.id} value={l.id}>{l.code} — {l.name}</option>)}
          </Select>
          <Select label="Profesor (opcional)" value={form.teacher_id} onChange={(e: any) => setForm({ ...form, teacher_id: e.target.value })}>
            <option value="">Sin asignar</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </Select>
          <Select label="Plan (opcional)" value={form.plan_id} onChange={(e: any) => setForm({ ...form, plan_id: e.target.value })}>
            <option value="">Sin plan asignado</option>
            {plans.map(p => <option key={p.id} value={p.id}>{p.name} - ${parseFloat(p.price).toFixed(2)}/mes</option>)}
          </Select>
          <Button onClick={create} disabled={!formValid} className="w-full" size="lg">Inscribir</Button>
        </div>
      </Modal>

      {/* Editar */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Editar: ${editing?.student_name || ""}`} size="lg">
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Cambiar profesor, nivel o plan. El estudiante será notificado.</p>
          <Select label="Profesor" value={editForm.teacher_id} onChange={(e: any) => setEditForm({ ...editForm, teacher_id: e.target.value })}>
            <option value="">Sin asignar</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </Select>
          <Select label="Nivel" value={editForm.level_id} onChange={(e: any) => setEditForm({ ...editForm, level_id: e.target.value })}>
            <option value="">Seleccionar...</option>
            {levels.map(l => <option key={l.id} value={l.id}>{l.code} — {l.name}</option>)}
          </Select>
          <Select label="Plan" value={editForm.plan_id} onChange={(e: any) => setEditForm({ ...editForm, plan_id: e.target.value })}>
            <option value="">Sin plan</option>
            {plans.map(p => <option key={p.id} value={p.id}>{p.name} - ${parseFloat(p.price).toFixed(2)}/mes</option>)}
          </Select>
          <Button onClick={saveEdit} className="w-full" size="lg">Guardar cambios</Button>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && doDelete(confirmDeleteId)}
        title="¿Desactivar inscripción?"
        message="El estudiante deja de aparecer como inscrito activo, pero conserva su histórico y progreso. Podés reactivar después creando una nueva inscripción."
        confirmLabel="Sí, desactivar"
      />
    </>
  );
}
