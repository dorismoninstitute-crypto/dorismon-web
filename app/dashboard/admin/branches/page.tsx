"use client";
import { useEffect, useState } from "react";
import { adminApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Input, Textarea, Modal, SuccessBox } from "@/components/ui";

export default function AdminBranchesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", phone: "" });
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    adminApi.branches()
      .then(d => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    setMsg("");
    try {
      await adminApi.createBranch(form);
      setMsg("✓ Sede creada");
      setShow(false);
      setForm({ name: "", address: "", phone: "" });
      load();
    } catch (e: any) { setMsg("✗ " + e.message); }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader
        title="Sedes y aulas"
        subtitle={`${items.length} sedes`}
        action={<Button onClick={() => setShow(true)}>+ Nueva sede</Button>}
      />
      {msg.startsWith("✓") && <div className="mb-4"><SuccessBox message={msg} /></div>}

      {items.length === 0 ? <EmptyState icon="🏢" title="Sin sedes" /> : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((b: any) => (
            <Card key={b.id}>
              <CardBody>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">🏢</div>
                  <div>
                    <h3 className="font-bold">{b.name}</h3>
                    {b.address && <p className="text-xs text-slate-500">{b.address}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {b.phone && <span>📞 {b.phone}</span>}
                  <span>🚪 {b.classrooms_count} aulas</span>
                  {!b.is_active && <Badge variant="danger">Inactiva</Badge>}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={show} onClose={() => setShow(false)} title="Nueva sede">
        <div className="space-y-3">
          <Input label="Nombre" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} />
          <Textarea label="Dirección" value={form.address} onChange={(e: any) => setForm({ ...form, address: e.target.value })} />
          <Input label="Teléfono" value={form.phone} onChange={(e: any) => setForm({ ...form, phone: e.target.value })} />
          <Button onClick={create} disabled={!form.name} className="w-full">Crear sede</Button>
        </div>
      </Modal>
    </>
  );
}
