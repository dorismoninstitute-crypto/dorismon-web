"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { teacherApi, adminHelpers, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Input, Textarea, Select, Modal, SuccessBox } from "@/components/ui";
import SelectorAudiencia from "@/components/SelectorAudiencia";  // V3.9.46
import SeguimientoTarea from "@/components/SeguimientoTarea";  // V3.9.49

export default function TeacherAssignmentsPage() {
  const [viendo, setViendo] = useState<any>(null);  // V3.9.49
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "", description: "", instructions: "",
    course_id: "", level_id: "",
    series_id: null as string | null,  // V3.9.46: a qué grupo va
    max_score: 100, due_at: "",
  });
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    teacherApi.assignments()
      .then(d => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const openModal = async () => {
    try {
      // Reusamos endpoint público de catálogo
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://dorismon-api.onrender.com"}/courses`);
      setCourses(await res.json());
      setShowModal(true);
    } catch {}
  };

  const onCourseChange = async (course_id: string) => {
    setForm({ ...form, course_id, level_id: "" });
    if (course_id) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://dorismon-api.onrender.com"}/courses/${course_id}`);
        const d = await res.json();
        setLevels(safeArray(d.levels));
      } catch {}
    } else { setLevels([]); }
  };

  const submit = async () => {
    setMsg("");
    try {
      await teacherApi.createAssignment({
        title: form.title,
        description: form.description || undefined,
        instructions: form.instructions || undefined,
        level_id: form.level_id ? parseInt(form.level_id) : null,
        series_id: form.series_id || null,  // V3.9.46
        max_score: form.max_score,
        due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
      });
      setMsg("✓ Tarea creada");
      setShowModal(false);
      setForm({ title: "", description: "", instructions: "", course_id: "", level_id: "", series_id: null, max_score: 100, due_at: "" });
      load();
    } catch (e: any) { setMsg("✗ " + e.message); }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      {viendo && (
        <SeguimientoTarea assignmentId={viendo.id} onClose={() => { setViendo(null); load(); }} />
      )}
      <PageHeader
        title="Tareas"
        subtitle={`${items.length} tareas asignadas`}
        action={<Button onClick={openModal}>
      {/* V3.9.42 — Los quizzes son un tipo de actividad más; que no haya que
          adivinar en qué menú se crea cada cosa. */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-3 flex-wrap">
        <p className="text-xs text-slate-600 flex-1 min-w-[180px]">
          ¿Buscas crear un <strong>quiz</strong>? Están en su propia sección.
        </p>
        <Link
          href="/dashboard/teacher/quizzes"
          className="text-xs font-bold text-brand-600 hover:text-brand-700"
        >
          Ir a Quizzes →
        </Link>
      </div>+ Nueva tarea</Button>}
      />
      {msg.startsWith("✓") && <div className="mb-4"><SuccessBox message={msg} /></div>}
      {msg.startsWith("✗") && <div className="mb-4"><ErrorBox message={msg.slice(2)} /></div>}

      {items.length === 0 ? <EmptyState icon="📝" title="Aún no creaste tareas" description="Haz clic en '+ Nueva tarea' para crear una." /> : (
        <div className="space-y-2">
          {items.map((a: any) => (
            <Card key={a.id}>
              <CardBody className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{a.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Máx: {a.max_score} pts · Entregadas: {a.submitted} · Calificadas: {a.graded}
                    {a.due_at && ` · Vence: ${new Date(a.due_at).toLocaleDateString("es")}`}
                  </p>
                </div>
                {a.submitted > a.graded && (
                  <Badge variant="warning">{a.submitted - a.graded} por calificar</Badge>
                )}
                {/* V3.9.49 P2 — quién entregó Y quién no */}
                <Button size="sm" variant="outline" onClick={() => setViendo(a)}>
                  👥 Quién entregó
                </Button>
                <Link href={`/dashboard/teacher/assignments/${a.id}`}>
                  <Button size="sm" variant="outline">Calificar</Button>
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva tarea" size="lg">
        <div className="space-y-3">
          <Input label="Título *" value={form.title} onChange={(e: any) => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Descripción" value={form.description} onChange={(e: any) => setForm({ ...form, description: e.target.value })} />
          <Textarea label="Instrucciones detalladas" value={form.instructions} onChange={(e: any) => setForm({ ...form, instructions: e.target.value })} placeholder="• Mínimo 200 palabras&#10;• Usar al menos 5 verbos en presente perfecto" />

          <div className="grid md:grid-cols-2 gap-3">
            <Select label="Curso" value={form.course_id} onChange={(e: any) => onCourseChange(e.target.value)}>
              <option value="">Seleccionar...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select label="Nivel *" value={form.level_id} onChange={(e: any) => setForm({ ...form, level_id: e.target.value })} disabled={!levels.length}>
              <option value="">{levels.length ? "Seleccionar..." : "Curso primero"}</option>
              {levels.map(l => <option key={l.id} value={l.id}>{l.code} — {l.name}</option>)}
            </Select>
          </div>

          {/* V3.9.46 P1 — A quién va la tarea, con nombres humanos */}
          {form.level_id && (
            <SelectorAudiencia
              levelId={form.level_id}
              value={{ series_id: form.series_id }}
              onChange={(v) => setForm({ ...form, series_id: v.series_id || null })}
              etiquetaTodos="Todos mis estudiantes de este nivel"
            />
          )}

          <div className="grid md:grid-cols-2 gap-3">
            <Input label="Puntaje máximo" type="number" value={form.max_score} onChange={(e: any) => setForm({ ...form, max_score: Number(e.target.value) })} />
            <Input label="Fecha de entrega" type="datetime-local" value={form.due_at} onChange={(e: any) => setForm({ ...form, due_at: e.target.value })} />
          </div>

          <Button onClick={submit} disabled={!form.title || !form.level_id} className="w-full" size="lg">Crear tarea</Button>
        </div>
      </Modal>
    </>
  );
}
