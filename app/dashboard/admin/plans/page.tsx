"use client";
import { useEffect, useState } from "react";
import { adminPlans, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Input, Textarea, Modal, ConfirmModal, showToast } from "@/components/ui";

export default function AdminPlansPage() {
  const [items, setItems] = useState<any[]>([]);
  const [features, setFeatures] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [newFeatureText, setNewFeatureText] = useState<Record<number, string>>({});

  const [form, setForm] = useState({
    code: "", name: "", price: 0, billing_cycle: "monthly", description: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const plans: any[] = safeArray(await adminPlans.list());
      setItems(plans);
      // Cargar features para cada plan
      const featMap: Record<number, any[]> = {};
      for (const p of plans) {
        try {
          featMap[p.id] = safeArray(await adminPlans.features(p.id));
        } catch { featMap[p.id] = []; }
      }
      setFeatures(featMap);
      setLoading(false);
    } catch (e: any) {
      setErr(e.message);
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ code: p.code, name: p.name, price: parseFloat(p.price), billing_cycle: p.billing_cycle || "monthly", description: p.description || "" });
  };
  const openCreate = () => {
    setCreating(true);
    setForm({ code: "", name: "", price: 0, billing_cycle: "monthly", description: "" });
  };

  const save = async () => {
    try {
      if (editing) {
        await adminPlans.update(editing.id, form);
        showToast("success", "Plan actualizado");
      } else {
        await adminPlans.create(form);
        showToast("success", "Plan creado");
      }
      setEditing(null);
      setCreating(false);
      load();
    } catch (e: any) {
      showToast("error", e.message);
    }
  };

  const doDelete = async (id: number) => {
    try {
      const r = await adminPlans.remove(id);
      showToast("info", r.deactivated ? "Plan desactivado (tiene inscripciones)" : "Plan eliminado");
      load();
    } catch (e: any) {
      showToast("error", e.message);
    }
  };

  const addFeature = async (planId: number) => {
    const text = newFeatureText[planId]?.trim();
    if (!text) return;
    try {
      await adminPlans.addFeature(planId, { feature: text, is_included: true, order_index: features[planId]?.length || 0 });
      setNewFeatureText({ ...newFeatureText, [planId]: "" });
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  const toggleFeature = async (featId: number, currentValue: boolean) => {
    try {
      await adminPlans.updateFeature(featId, { is_included: !currentValue });
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  const removeFeature = async (featId: number) => {
    try {
      await adminPlans.removeFeature(featId);
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader
        title="Planes"
        subtitle="Gestioná los planes de suscripción que ofrecés a los estudiantes"
        action={<Button onClick={openCreate}>+ Nuevo plan</Button>}
      />

      {items.length === 0 ? (
        <EmptyState icon="💳" title="Sin planes" description="Hacé clic en '+ Nuevo plan' para crear uno." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p: any) => {
            const planFeats = features[p.id] || [];
            const inputId = `feat-${p.id}`;
            return (
              <Card key={p.id} className={!p.is_active ? "opacity-60" : ""}>
                <CardBody>
                  <div className="flex items-start justify-between mb-3 gap-2 flex-wrap">
                    <div>
                      <h3 className="font-extrabold text-lg">{p.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">{p.code}</p>
                    </div>
                    {!p.is_active && <Badge variant="danger">Inactivo</Badge>}
                  </div>

                  <div className="mb-3">
                    <p className="text-3xl font-extrabold text-brand-600">${parseFloat(p.price).toFixed(2)}</p>
                    <p className="text-xs text-slate-500">por {p.billing_cycle === "monthly" ? "mes" : p.billing_cycle}</p>
                  </div>

                  {p.description && <p className="text-sm text-slate-600 mb-3">{p.description}</p>}

                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Features</p>
                    <ul className="space-y-1 mb-3">
                      {planFeats.map((f: any) => (
                        <li key={f.id} className="text-sm flex items-center gap-2 group">
                          <button onClick={() => toggleFeature(f.id, f.is_included)} className="flex-shrink-0">
                            {f.is_included ? "✅" : "❌"}
                          </button>
                          <span className={f.is_included ? "" : "line-through text-slate-400"}>{f.feature}</span>
                          <button onClick={() => removeFeature(f.id)} className="ml-auto opacity-0 group-hover:opacity-100 text-red-500 text-xs">×</button>
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-1">
                      <input
                        id={inputId}
                        value={newFeatureText[p.id] || ""}
                        onChange={(e) => setNewFeatureText({ ...newFeatureText, [p.id]: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && addFeature(p.id)}
                        placeholder="Agregar feature..."
                        className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-brand-500"
                      />
                      <button onClick={() => addFeature(p.id)} className="text-xs font-bold text-brand-600 hover:text-brand-700 px-2">+</button>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                    <Button size="sm" variant="outline" onClick={() => openEdit(p)} className="flex-1">Editar</Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteId(p.id)}>Eliminar</Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? "Editar plan" : "Nuevo plan"}>
        <div className="space-y-3">
          <Input label="Código (interno) *" value={form.code} onChange={(e: any) => setForm({ ...form, code: e.target.value })} placeholder="ej: starter" disabled={!!editing} />
          <Input label="Nombre *" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="ej: Starter" />
          <Input label="Precio (USD) *" type="number" step="0.01" value={form.price} onChange={(e: any) => setForm({ ...form, price: parseFloat(e.target.value) })} />
          <Textarea label="Descripción" value={form.description} onChange={(e: any) => setForm({ ...form, description: e.target.value })} />
          <p className="text-xs text-slate-500">Las features se editan directamente en cada tarjeta una vez creado el plan.</p>
          <Button onClick={save} className="w-full" size="lg" disabled={!form.code || !form.name}>
            {editing ? "Guardar cambios" : "Crear plan"}
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && doDelete(deleteId)}
        title="¿Eliminar plan?"
        message="Si el plan tiene estudiantes inscritos, se desactivará (mantiene histórico). Si no, se elimina por completo."
        confirmLabel="Sí, eliminar"
      />
    </>
  );
}
