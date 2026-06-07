"use client";
import { useEffect, useState } from "react";
import { adminApi, safeArray, safeObj } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Input, Select, Modal, SuccessBox } from "@/components/ui";

export default function AdminUsersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", phone: "", role: "student" });
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    adminApi.users({ page, limit: 20, q: q || undefined, role: role || undefined })
      .then(d => {
        const data = safeObj(d, {}) as any;
        setItems(safeArray(data.items));
        setTotal(data.total ?? 0);
        setLoading(false);
      })
      .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, [page, role]);

  const create = async () => {
    setMsg("");
    try {
      await adminApi.createUser(form);
      setMsg("✓ Usuario creado");
      setShow(false);
      setForm({ email: "", password: "", full_name: "", phone: "", role: "student" });
      load();
    } catch (e: any) { setMsg("✗ " + e.message); }
  };

  return (
    <>
      <PageHeader
        title={`Usuarios (${total})`}
        action={<Button onClick={() => setShow(true)}>+ Nuevo usuario</Button>}
      />
      {msg.startsWith("✓") && <div className="mb-4"><SuccessBox message={msg} /></div>}

      <div className="flex flex-wrap gap-3 mb-4">
        <Input placeholder="Buscar nombre o email..." value={q} onChange={(e: any) => setQ(e.target.value)} onKeyDown={(e: any) => e.key === "Enter" && load()} className="flex-1 min-w-[200px]" />
        <Select value={role} onChange={(e: any) => { setRole(e.target.value); setPage(1); }}>
          <option value="">Todos los roles</option>
          <option value="super_admin">Admin</option>
          <option value="teacher">Profesor</option>
          <option value="student">Estudiante</option>
        </Select>
        <Button onClick={() => { setPage(1); load(); }}>Buscar</Button>
      </div>

      {loading ? <LoadingScreen /> : err ? <ErrorBox message={err} /> :
       items.length === 0 ? <EmptyState icon="👥" title="Sin usuarios" /> : (
        <Card>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {items.map((u: any) => (
                <div key={u.id} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
                    {(u.full_name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{u.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                  <Badge variant={u.role === "super_admin" ? "danger" : u.role === "teacher" ? "accent" : "brand"}>
                    {u.role === "super_admin" ? "Admin" : u.role === "teacher" ? "Profe" : "Estudiante"}
                  </Badge>
                  {!u.is_active && <Badge variant="default">Inactivo</Badge>}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="flex justify-center gap-2 mt-6">
        <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>← Anterior</Button>
        <span className="px-4 py-1.5 text-sm font-semibold">Página {page}</span>
        <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={items.length < 20}>Siguiente →</Button>
      </div>

      <Modal open={show} onClose={() => setShow(false)} title="Nuevo usuario">
        <div className="space-y-3">
          <Input label="Nombre completo" value={form.full_name} onChange={(e: any) => setForm({ ...form, full_name: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} />
          <Input label="Contraseña" type="password" value={form.password} onChange={(e: any) => setForm({ ...form, password: e.target.value })} />
          <Input label="Teléfono (opcional)" value={form.phone} onChange={(e: any) => setForm({ ...form, phone: e.target.value })} />
          <Select label="Rol" value={form.role} onChange={(e: any) => setForm({ ...form, role: e.target.value })}>
            <option value="student">Estudiante</option>
            <option value="teacher">Profesor</option>
            <option value="super_admin">Admin</option>
          </Select>
          <Button onClick={create} disabled={!form.email || !form.password || !form.full_name} className="w-full">
            Crear usuario
          </Button>
        </div>
      </Modal>
    </>
  );
}
