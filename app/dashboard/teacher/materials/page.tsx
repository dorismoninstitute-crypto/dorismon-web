"use client";
import { useEffect, useState } from "react";
import { teacherApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Input, Textarea, Select, Modal, SuccessBox } from "@/components/ui";

const TYPE_ICONS: any = { pdf: "📄", video: "📹", audio: "🎧", document: "📝", image: "🖼", link: "🔗" };

export default function TeacherMaterialsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", type: "pdf", url: "" });
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    teacherApi.materials()
      .then(d => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    setMsg("");
    try {
      await teacherApi.uploadMaterial(form);
      setMsg("✓ Material agregado");
      setShow(false);
      setForm({ title: "", description: "", type: "pdf", url: "" });
      load();
    } catch (e: any) { setMsg("✗ " + e.message); }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader
        title="Materiales"
        subtitle={`${items.length} recursos en la biblioteca`}
        action={<Button onClick={() => setShow(true)}>+ Subir material</Button>}
      />
      {msg.startsWith("✓") && <div className="mb-4"><SuccessBox message={msg} /></div>}

      {items.length === 0 ? <EmptyState icon="📖" title="Sin materiales" /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((m: any) => (
            <Card key={m.id}>
              <CardBody>
                <div className="flex items-start gap-3 mb-2">
                  <div className="text-3xl">{TYPE_ICONS[m.type] || "📎"}</div>
                  <div className="flex-1 min-w-0">
                    <Badge variant="info" className="mb-1 uppercase">{m.type}</Badge>
                    <h3 className="font-bold text-sm">{m.title}</h3>
                  </div>
                </div>
                {m.description && <p className="text-xs text-slate-500">{m.description}</p>}
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="block mt-3 text-xs text-brand-600 font-semibold hover:underline">
                  Ver →
                </a>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={show} onClose={() => setShow(false)} title="Subir material">
        <div className="space-y-3">
          <Input label="Título" value={form.title} onChange={(e: any) => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Descripción" value={form.description} onChange={(e: any) => setForm({ ...form, description: e.target.value })} />
          <Select label="Tipo" value={form.type} onChange={(e: any) => setForm({ ...form, type: e.target.value })}>
            <option value="pdf">📄 PDF</option>
            <option value="video">📹 Video</option>
            <option value="audio">🎧 Audio</option>
            <option value="document">📝 Documento</option>
            <option value="image">🖼 Imagen</option>
            <option value="link">🔗 Enlace</option>
          </Select>
          <Input label="URL" value={form.url} onChange={(e: any) => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
          <Button onClick={submit} disabled={!form.title || !form.url} className="w-full">Guardar material</Button>
        </div>
      </Modal>
    </>
  );
}
