"use client";
import { useEffect, useState } from "react";
import { adminApi, adminHelpers, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Select, Modal, SuccessBox } from "@/components/ui";

export default function AdminEnrollmentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");

  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);

  const [form, setForm] = useState({
    student_id: "", course_id: "", level_id: "", teacher_id: "",
  });

  const load = () => {
    setLoading(true);
    adminApi.enrollments()
      .then(d => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const openModal = async () => {
    try {
      const [s, t, c] = await Promise.all([
        adminHelpers.studentsSimple(), adminHelpers.teachers(), adminApi.courses(),
      ]);
      setStudents(safeArray(s));
      setTeachers(safeArray(t));
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

  const create = async () => {
    setMsg("");
    try {
      await adminApi.createEnrollment({
        student_id: form.student_id,
        course_id: parseInt(form.course_id),
        level_id: parseInt(form.level_id),
        teacher_id: form.teacher_id || undefined,
      });
      setMsg("✓ Estudiante inscrito");
      setShow(false);
      setForm({ student_id: "", course_id: "", level_id: "", teacher_id: "" });
      load();
    } catch (e: any) { setMsg("✗ " + e.message); }
  };

  const formValid = form.student_id && form.course_id && form.level_id;

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader
        title="Inscripciones"
        subtitle={`${items.length} inscripciones activas`}
        action={<Button onClick={openModal}>+ Inscribir estudiante</Button>}
      />
      {msg.startsWith("✓") && <div className="mb-4"><SuccessBox message={msg} /></div>}
      {msg.startsWith("✗") && <div className="mb-4"><ErrorBox message={msg.slice(2)} /></div>}

      {items.length === 0 ? <EmptyState icon="📋" title="Sin inscripciones" description="Hacé clic en '+ Inscribir estudiante' para empezar." /> : (
        <Card>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {items.map((e: any) => (
                <div key={e.id} className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{e.student_name}</p>
                    <p className="text-xs text-slate-500">{e.course_name} · Nivel {e.level_code}</p>
                  </div>
                  {e.is_active ? <Badge variant="success">Activa</Badge> : <Badge>Inactiva</Badge>}
                  <span className="text-xs text-slate-400 hidden sm:block">{e.enrolled_at && new Date(e.enrolled_at).toLocaleDateString("es")}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <Modal open={show} onClose={() => setShow(false)} title="Inscribir estudiante a curso" size="lg">
        <div className="space-y-4">
          <Select label="Estudiante *" value={form.student_id} onChange={(e: any) => setForm({ ...form, student_id: e.target.value })}>
            <option value="">Seleccionar...</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.full_name} — {s.email}</option>)}
          </Select>

          <Select label="Curso *" value={form.course_id} onChange={(e: any) => onCourseChange(e.target.value)}>
            <option value="">Seleccionar...</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>

          <Select label="Nivel *" value={form.level_id} onChange={(e: any) => setForm({ ...form, level_id: e.target.value })} disabled={!levels.length}>
            <option value="">{levels.length ? "Seleccionar..." : "Curso primero"}</option>
            {levels.map(l => <option key={l.id} value={l.id}>{l.code} — {l.name}</option>)}
          </Select>

          <Select label="Profesor asignado (opcional)" value={form.teacher_id} onChange={(e: any) => setForm({ ...form, teacher_id: e.target.value })}>
            <option value="">Sin asignar</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </Select>

          <Button onClick={create} disabled={!formValid} className="w-full" size="lg">
            Inscribir estudiante
          </Button>
        </div>
      </Modal>
    </>
  );
}
