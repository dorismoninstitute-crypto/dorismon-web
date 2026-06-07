"use client";
import { useEffect, useState } from "react";
import { adminApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Input, Textarea, Modal, SuccessBox } from "@/components/ui";

export default function AdminCoursesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", description: "", color: "#4361ee" });
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    adminApi.courses()
      .then(d => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    setMsg("");
    try {
      await adminApi.createCourse(form);
      setMsg("✓ Curso creado");
      setShow(false);
      setForm({ code: "", name: "", description: "", color: "#4361ee" });
      load();
    } catch (e: any) { setMsg("✗ " + e.message); }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader
        title="Cursos"
        subtitle={`${items.length} cursos`}
        action={<Button onClick={() => setShow(true)}>+ Nuevo curso</Button>}
      />
      {msg.startsWith("✓") && <div className="mb-4"><SuccessBox message={msg} /></div>}

      {items.length === 0 ? <EmptyState icon="📚" title="Sin cursos" /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((c: any) => (
            <Card key={c.id} className="overflow-hidden">
              <div className="h-3" style={{ backgroundColor: c.color }} />
              <CardBody>
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="default" className="uppercase">{c.code}</Badge>
                  {!c.is_active && <Badge variant="danger">Inactivo</Badge>}
                </div>
                <h3 className="font-bold text-lg mb-1">{c.name}</h3>
                {c.description && <p className="text-sm text-slate-600 mb-3 line-clamp-2">{c.description}</p>}
                <p className="text-xs text-slate-500">{c.level_count} niveles</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={show} onClose={() => setShow(false)} title="Nuevo curso">
        <div className="space-y-3">
          <Input label="Código" value={form.code} onChange={(e: any) => setForm({ ...form, code: e.target.value })} placeholder="ej: english-general" />
          <Input label="Nombre" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} />
          <Textarea label="Descripción" value={form.description} onChange={(e: any) => setForm({ ...form, description: e.target.value })} />
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Color</label>
            <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-full h-12 rounded-lg cursor-pointer" />
          </div>
          <Button onClick={create} disabled={!form.code || !form.name} className="w-full">Crear curso</Button>
        </div>
      </Modal>
    </>
  );
}
