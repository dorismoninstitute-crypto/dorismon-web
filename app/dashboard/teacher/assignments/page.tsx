"use client";
import { useEffect, useState } from "react";
import { teacherApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Input, Textarea, Select, Modal, SuccessBox } from "@/components/ui";

export default function TeacherAssignmentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", instructions: "", level_id: "", max_score: 100, due_at: "" });
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    teacherApi.assignments()
      .then(d => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    setMsg("");
    try {
      await teacherApi.createAssignment({
        ...form,
        level_id: form.level_id ? parseInt(form.level_id) : null,
        due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
      });
      setMsg("✓ Tarea creada");
      setShowModal(false);
      setForm({ title: "", description: "", instructions: "", level_id: "", max_score: 100, due_at: "" });
      load();
    } catch (e: any) { setMsg("✗ " + e.message); }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader
        title="Tareas"
        subtitle={`${items.length} tareas asignadas`}
        action={<Button onClick={() => setShowModal(true)}>+ Nueva tarea</Button>}
      />
      {msg.startsWith("✓") && <div className="mb-4"><SuccessBox message={msg} /></div>}

      {items.length === 0 ? <EmptyState icon="📝" title="Aún no creaste tareas" /> : (
        <div className="space-y-2">
          {items.map((a: any) => (
            <Card key={a.id}>
              <CardBody className="flex items-center gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold">{a.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Máx: {a.max_score} pts · Entregadas: {a.submitted} · Calificadas: {a.graded}
                    {a.due_at && ` · Vence: ${new Date(a.due_at).toLocaleDateString("es")}`}
                  </p>
                </div>
                {a.submitted > a.graded && (
                  <Badge variant="warning">{a.submitted - a.graded} por calificar</Badge>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva tarea">
        <div className="space-y-3">
          <Input label="Título" value={form.title} onChange={(e: any) => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Descripción" value={form.description} onChange={(e: any) => setForm({ ...form, description: e.target.value })} />
          <Textarea label="Instrucciones" value={form.instructions} onChange={(e: any) => setForm({ ...form, instructions: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nivel ID (numérico)" value={form.level_id} onChange={(e: any) => setForm({ ...form, level_id: e.target.value })} />
            <Input label="Puntaje máx" type="number" value={form.max_score} onChange={(e: any) => setForm({ ...form, max_score: Number(e.target.value) })} />
          </div>
          <Input label="Fecha de entrega" type="datetime-local" value={form.due_at} onChange={(e: any) => setForm({ ...form, due_at: e.target.value })} />
          <Button onClick={submit} disabled={!form.title} className="w-full">Crear tarea</Button>
        </div>
      </Modal>
    </>
  );
}
