"use client";
import { useEffect, useState } from "react";
import { adminApi, adminEdit, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Input, Textarea, Modal, ConfirmModal, showToast } from "@/components/ui";

export default function AdminCoursesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<number | null>(null);
  const [form, setForm] = useState({
    code: "", name: "", description: "", color: "#6366f1", icon: "📚",
  });

  const load = () => {
    setLoading(true);
    adminApi.courses()
      .then(d => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ code: "", name: "", description: "", color: "#6366f1", icon: "📚" }); setShow(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ code: c.code, name: c.name, description: c.description || "", color: c.color || "#6366f1", icon: c.icon || "📚" }); setShow(true); };

  const save = async () => {
    try {
      if (editing) {
        await adminEdit.updateCourse(editing.id, form);
        showToast("success", "Curso actualizado");
      } else {
        await adminApi.createCourse(form);
        showToast("success", "Curso creado");
      }
      setShow(false);
      setEditing(null);
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  const doDeactivate = async (id: number) => {
    try {
      const r = await adminEdit.deactivateCourse(id);
      showToast("info", r.had_enrollments ? "Curso desactivado (tiene estudiantes)" : "Curso desactivado");
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader
        title="Cursos"
        action={<Button onClick={openCreate}>+ Nuevo curso</Button>}
      />

      {items.length === 0 ? <EmptyState icon="📚" title="Sin cursos" /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((c: any) => (
            <Card key={c.id} className={!c.is_active ? "opacity-50" : ""}>
              <div className="h-2" style={{ background: c.color || "#6366f1" }} />
              <CardBody>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-3xl">{c.icon || "📚"}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold">{c.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{c.code}</p>
                  </div>
                  {!c.is_active && <Badge variant="danger">Inactivo</Badge>}
                </div>
                {c.description && <p className="text-sm text-slate-600 mb-3 line-clamp-2">{c.description}</p>}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(c)} className="flex-1">Editar</Button>
                  {c.is_active && (
                    <Button size="sm" variant="danger" onClick={() => setConfirmDeactivateId(c.id)}>Desactivar</Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={show} onClose={() => setShow(false)} title={editing ? "Editar curso" : "Nuevo curso"}>
        <div className="space-y-3">
          <Input label="Código *" value={form.code} onChange={(e: any) => setForm({ ...form, code: e.target.value })} disabled={!!editing} placeholder="ej: english-general" />
          <Input label="Nombre *" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} />
          <Textarea label="Descripción" value={form.description} onChange={(e: any) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Color" type="color" value={form.color} onChange={(e: any) => setForm({ ...form, color: e.target.value })} />
            <Input label="Icono (emoji)" value={form.icon} onChange={(e: any) => setForm({ ...form, icon: e.target.value })} maxLength={2} />
          </div>
          <Button onClick={save} className="w-full" size="lg">{editing ? "Guardar" : "Crear"}</Button>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirmDeactivateId}
        onClose={() => setConfirmDeactivateId(null)}
        onConfirm={() => confirmDeactivateId && doDeactivate(confirmDeactivateId)}
        title="¿Desactivar curso?"
        message="El curso quedará desactivado pero los estudiantes inscritos conservarán su progreso. No aparecerá en las opciones de inscripción nuevas."
        confirmLabel="Sí, desactivar"
      />
    </>
  );
}
