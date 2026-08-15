"use client";
import { useEffect, useState } from "react";
import { teacherApi, safeArray, api } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Input, Textarea, Select, Modal, SuccessBox } from "@/components/ui";
import SelectorAudiencia from "@/components/SelectorAudiencia";  // V3.9.47

const TYPE_ICONS: any = { pdf: "📄", video: "📹", audio: "🎧", document: "📝", image: "🖼", link: "🔗" };

export default function TeacherMaterialsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", type: "pdf", url: "",
    // V3.9.47 — A quién va el material
    level_id: "" as any,
    series_id: null as string | null,
    student_id: null as string | null,
  });
  const [niveles, setNiveles] = useState<any[]>([]);
  const [misEstudiantes, setMisEstudiantes] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  // V3.9.47 — Para el selector: los niveles y estudiantes del profesor
  useEffect(() => {
    if (!show) return;
    api("/teacher/my-levels", { auth: true })
      .then((r: any) => setNiveles(r?.items || []))
      .catch(() => {});
    api("/teacher/my-students", { auth: true })
      .then((r: any) => setMisEstudiantes(safeArray(r?.items || r)))
      .catch(() => {});
  }, [show]);

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
      await teacherApi.uploadMaterial({
        ...form,
        level_id: form.level_id ? Number(form.level_id) : null,
        series_id: form.series_id || null,
        student_id: form.student_id || null,
      });
      setMsg("✓ Material agregado");
      setShow(false);
      setForm({ title: "", description: "", type: "pdf", url: "", level_id: "", series_id: null, student_id: null });
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

          {/* V3.9.47 — ¿A quién va este material? Con nombres humanos. */}
          <Select
            label="Nivel"
            value={form.level_id}
            onChange={(e: any) => setForm({ ...form, level_id: e.target.value, series_id: null })}
          >
            <option value="">Todos mis niveles</option>
            {niveles.map((l: any) => (
              <option key={l.id} value={l.id}>{l.code} — {l.name}</option>
            ))}
          </Select>

          {!form.student_id && (
            <SelectorAudiencia
              levelId={form.level_id || null}
              value={{ series_id: form.series_id }}
              onChange={(v) => setForm({ ...form, series_id: v.series_id || null })}
              etiquetaTodos="Todos mis estudiantes"
            />
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              ¿O es para un estudiante en particular?
            </label>
            <select
              value={form.student_id || ""}
              onChange={(e: any) => setForm({
                ...form,
                student_id: e.target.value || null,
                series_id: e.target.value ? null : form.series_id,
              })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">No — va al grupo elegido arriba</option>
              {misEstudiantes.map((s: any) => (
                <option key={s.student_id || s.id} value={s.student_id || s.id}>
                  Solo para {s.full_name || s.name}
                </option>
              ))}
            </select>
            {form.student_id && (
              <p className="text-[11px] text-slate-500 mt-2">
                💡 Solo esa persona lo verá. Útil para feedback o refuerzo.
              </p>
            )}
          </div>

          <Button onClick={submit} disabled={!form.title || !form.url} className="w-full">Guardar material</Button>
        </div>
      </Modal>
    </>
  );
}
