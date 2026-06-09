"use client";
import { useEffect, useState } from "react";
import { adminApi, adminEdit, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Input, Textarea, Modal, showToast } from "@/components/ui";

export default function AdminBranchesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [rooms, setRooms] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showBranch, setShowBranch] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [bForm, setBForm] = useState({ name: "", address: "", phone: "" });
  const [showRoom, setShowRoom] = useState<number | null>(null);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [rForm, setRForm] = useState({ name: "", capacity: 10 });

  const load = async () => {
    setLoading(true);
    try {
      const bs: any[] = safeArray(await adminApi.branches());
      setItems(bs);
      const roomMap: Record<number, any[]> = {};
      for (const b of bs) {
        try { roomMap[b.id] = safeArray(await adminApi.classrooms(b.id)); } catch { roomMap[b.id] = []; }
      }
      setRooms(roomMap);
      setLoading(false);
    } catch (e: any) { setErr(e.message); setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const saveBranch = async () => {
    try {
      if (editingBranch) {
        await adminEdit.updateBranch(editingBranch.id, bForm);
        showToast("success", "Sede actualizada");
      } else {
        await adminApi.createBranch(bForm);
        showToast("success", "Sede creada");
      }
      setShowBranch(false); setEditingBranch(null);
      setBForm({ name: "", address: "", phone: "" });
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  const saveRoom = async () => {
    try {
      if (editingRoom) {
        await adminEdit.updateClassroom(editingRoom.id, rForm);
        showToast("success", "Aula actualizada");
      } else {
        await adminApi.createClassroom({ ...rForm, branch_id: showRoom });
        showToast("success", "Aula creada");
      }
      setShowRoom(null); setEditingRoom(null);
      setRForm({ name: "", capacity: 10 });
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader title="Sedes y aulas" action={
        <Button onClick={() => { setEditingBranch(null); setBForm({ name: "", address: "", phone: "" }); setShowBranch(true); }}>+ Nueva sede</Button>
      } />

      {items.length === 0 ? <EmptyState icon="🏢" title="Sin sedes" /> : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((b: any) => (
            <Card key={b.id} className={!b.is_active ? "opacity-60" : ""}>
              <CardBody>
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex-1">
                    <h3 className="font-bold flex items-center gap-2">
                      🏢 {b.name}
                      {!b.is_active && <Badge variant="danger">Inactiva</Badge>}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{b.address}</p>
                    <p className="text-xs text-slate-500">📞 {b.phone}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditingBranch(b);
                    setBForm({ name: b.name, address: b.address || "", phone: b.phone || "" });
                    setShowBranch(true);
                  }}>Editar</Button>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Aulas ({rooms[b.id]?.length || 0})</p>
                    <button onClick={() => { setEditingRoom(null); setRForm({ name: "", capacity: 10 }); setShowRoom(b.id); }} className="text-xs font-bold text-brand-600 hover:text-brand-700">
                      + Agregar
                    </button>
                  </div>
                  <div className="space-y-1">
                    {(rooms[b.id] || []).map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded-lg group">
                        <span>{r.name} <span className="text-xs text-slate-400">· cap. {r.capacity}</span></span>
                        <button onClick={() => { setEditingRoom(r); setRForm({ name: r.name, capacity: r.capacity }); setShowRoom(b.id); }} className="text-xs text-brand-600 opacity-0 group-hover:opacity-100">Editar</button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showBranch} onClose={() => setShowBranch(false)} title={editingBranch ? "Editar sede" : "Nueva sede"}>
        <div className="space-y-3">
          <Input label="Nombre *" value={bForm.name} onChange={(e: any) => setBForm({ ...bForm, name: e.target.value })} />
          <Textarea label="Dirección" value={bForm.address} onChange={(e: any) => setBForm({ ...bForm, address: e.target.value })} />
          <Input label="Teléfono" value={bForm.phone} onChange={(e: any) => setBForm({ ...bForm, phone: e.target.value })} />
          <Button onClick={saveBranch} className="w-full" size="lg">{editingBranch ? "Guardar" : "Crear sede"}</Button>
        </div>
      </Modal>

      <Modal open={!!showRoom} onClose={() => setShowRoom(null)} title={editingRoom ? "Editar aula" : "Nueva aula"}>
        <div className="space-y-3">
          <Input label="Nombre *" value={rForm.name} onChange={(e: any) => setRForm({ ...rForm, name: e.target.value })} />
          <Input label="Capacidad" type="number" value={rForm.capacity} onChange={(e: any) => setRForm({ ...rForm, capacity: parseInt(e.target.value) })} />
          <Button onClick={saveRoom} className="w-full" size="lg">{editingRoom ? "Guardar" : "Crear aula"}</Button>
        </div>
      </Modal>
    </>
  );
}
