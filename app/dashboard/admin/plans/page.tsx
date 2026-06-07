"use client";
import { useEffect, useState } from "react";
import { adminApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Input, Textarea, Modal, SuccessBox } from "@/components/ui";

export default function AdminPlansPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", description: "", price: 0, duration_months: 1, features: "" });
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    adminApi.plans()
      .then(d => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    setMsg("");
    try {
      await adminApi.createPlan(form);
      setMsg("✓ Plan creado");
      setShow(false);
      setForm({ code: "", name: "", description: "", price: 0, duration_months: 1, features: "" });
      load();
    } catch (e: any) { setMsg("✗ " + e.message); }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader
        title="Planes y precios"
        subtitle={`${items.length} planes`}
        action={<Button onClick={() => setShow(true)}>+ Nuevo plan</Button>}
      />
      {msg.startsWith("✓") && <div className="mb-4"><SuccessBox message={msg} /></div>}

      {items.length === 0 ? <EmptyState icon="💳" title="Sin planes" /> : (
        <div className="grid md:grid-cols-3 gap-4">
          {items.map((p: any) => (
            <Card key={p.id}>
              <CardBody>
                <Badge variant="brand" className="uppercase mb-3">{p.code}</Badge>
                <h3 className="font-bold text-xl mb-1">{p.name}</h3>
                {p.description && <p className="text-sm text-slate-600 mb-3">{p.description}</p>}
                <p className="text-3xl font-bold text-brand-600 mb-3">
                  ${p.price} <span className="text-sm text-slate-500 font-normal">/{p.duration_months}m</span>
                </p>
                {p.features && (
                  <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans">{p.features}</pre>
                )}
                {!p.is_active && <Badge variant="danger" className="mt-3">Inactivo</Badge>}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={show} onClose={() => setShow(false)} title="Nuevo plan">
        <div className="space-y-3">
          <Input label="Código" value={form.code} onChange={(e: any) => setForm({ ...form, code: e.target.value })} />
          <Input label="Nombre" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} />
          <Textarea label="Descripción" value={form.description} onChange={(e: any) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Precio USD" type="number" value={form.price} onChange={(e: any) => setForm({ ...form, price: Number(e.target.value) })} />
            <Input label="Duración (meses)" type="number" value={form.duration_months} onChange={(e: any) => setForm({ ...form, duration_months: Number(e.target.value) })} />
          </div>
          <Textarea label="Features (una por línea)" value={form.features} onChange={(e: any) => setForm({ ...form, features: e.target.value })} />
          <Button onClick={create} disabled={!form.code || !form.name} className="w-full">Crear plan</Button>
        </div>
      </Modal>
    </>
  );
}
