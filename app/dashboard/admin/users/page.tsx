"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, adminEdit, adminPause, adminTeacherLevels, safeArray, safeObj, getLevelTheme } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Input, Select, Modal, ConfirmModal, showToast } from "@/components/ui";

export default function AdminUsersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [pausing, setPausing] = useState<any>(null);
  const [levelsEditing, setLevelsEditing] = useState<any>(null);
  const [teacherLevels, setTeacherLevels] = useState<string[]>([]);
  const [confirmResume, setConfirmResume] = useState<any>(null);

  const [form, setForm] = useState({ email: "", password: "", full_name: "", phone: "", role: "student" });
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", is_active: true });
  const [pauseReason, setPauseReason] = useState("");

  const load = () => {
    setLoading(true);
    adminApi.users({ page, limit: 20, q: q || undefined, role: role || undefined })
      .then(d => {
        const dd = safeObj(d, {} as any);
        setItems(safeArray(dd.items));
        setTotal(dd.total || 0);
        setLoading(false);
      })
      .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, [page, role]);

  // V1.6.4: Debounce search en vivo
  useEffect(() => {
    const t = setTimeout(() => { load(); }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const create = async () => {
    try {
      await adminApi.createUser(form);
      showToast("success", "Usuario creado");
      setShowCreate(false);
      setForm({ email: "", password: "", full_name: "", phone: "", role: "student" });
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  const openEdit = (u: any) => {
    setEditing(u);
    setEditForm({ full_name: u.full_name || "", phone: u.phone || "", is_active: u.is_active });
  };

  const saveEdit = async () => {
    try {
      await adminEdit.updateUser(editing.id, editForm);
      showToast("success", "Usuario actualizado");
      setEditing(null);
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  const doPause = async () => {
    try {
      await adminPause.pause(pausing.id, pauseReason || "Sin especificar");
      showToast("info", `${pausing.full_name} fue pausado`);
      setPausing(null);
      setPauseReason("");
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  const doResume = async (userId: string) => {
    try {
      await adminPause.resume(userId);
      showToast("success", "Estudiante reactivado");
      setConfirmResume(null);
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  // V1.5.1
  const openLevels = async (u: any) => {
    setLevelsEditing(u);
    try {
      const r: any = await adminTeacherLevels.get(u.id);
      setTeacherLevels(r.levels || []);
    } catch { setTeacherLevels([]); }
  };

  const toggleLevel = (code: string) => {
    setTeacherLevels(teacherLevels.includes(code)
      ? teacherLevels.filter(l => l !== code)
      : [...teacherLevels, code]
    );
  };

  const saveLevels = async () => {
    if (!levelsEditing) return;
    try {
      await adminTeacherLevels.set(levelsEditing.id, teacherLevels);
      showToast("success", `Niveles guardados para ${levelsEditing.full_name}`);
      setLevelsEditing(null);
    } catch (e: any) { showToast("error", e.message); }
  };

  if (loading && items.length === 0) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle={`${total} usuarios registrados`}
        action={<Button onClick={() => setShowCreate(true)}>+ Nuevo usuario</Button>}
      />

      <Card className="mb-4">
        <CardBody className="flex gap-3 flex-wrap">
          <Input placeholder="Buscar por nombre o email..." value={q} onChange={(e: any) => setQ(e.target.value)} onKeyDown={(e: any) => e.key === "Enter" && load()} className="flex-1 min-w-[200px]" />
          <Select value={role} onChange={(e: any) => setRole(e.target.value)} className="w-44">
            <option value="">Todos los roles</option>
            <option value="super_admin">Admin</option>
            <option value="teacher">Profesor</option>
            <option value="student">Estudiante</option>
          </Select>
          <Button variant="outline" onClick={load}>Buscar</Button>
        </CardBody>
      </Card>

      {items.length === 0 ? (
        <EmptyState icon="👥" title="Sin usuarios" />
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {items.map((u: any) => (
                <div key={u.id} className={`p-4 flex items-center gap-3 flex-wrap ${!u.is_active ? "opacity-60" : ""}`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
                    {(u.full_name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold">{u.full_name}</p>
                      <Badge variant={u.role === "super_admin" ? "danger" : u.role === "teacher" ? "brand" : "success"}>
                        {u.role === "super_admin" ? "Admin" : u.role === "teacher" ? "Profe" : "Estudiante"}
                      </Badge>
                      {/* V1.4: badge de nivel CEFR para estudiantes */}
                      {u.role === "student" && u.level_code && (() => {
                        const t = getLevelTheme(u.level_code);
                        return (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${t.bg} ${t.heroText}`}>
                            {u.level_code}
                          </span>
                        );
                      })()}
                      {u.role === "student" && !u.placement_done && (
                        <Badge variant="warning">⏳ Sin test</Badge>
                      )}
                      {u.is_paused && <Badge variant="warning">⏸ Pausado</Badge>}
                      {!u.is_active && <Badge variant="danger">Inactivo</Badge>}
                    </div>
                    <p className="text-xs text-slate-500">{u.email} · {u.phone || "sin teléfono"}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {u.role === "student" && (
                      <Link href={`/dashboard/admin/students/${u.id}/profile`}>
                        <Button size="sm" variant="outline">👤 Ver perfil</Button>
                      </Link>
                    )}
                    <Button size="sm" variant="outline" onClick={() => openEdit(u)}>Editar</Button>
                    {u.role === "teacher" && (
                      <Button size="sm" variant="outline" onClick={() => openLevels(u)}>🎯 Niveles</Button>
                    )}
                    {u.role === "student" && (
                      u.is_paused ? (
                        <Button size="sm" variant="primary" onClick={() => setConfirmResume(u)}>Reactivar</Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setPausing(u)}>⏸ Pausar</Button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="flex justify-center gap-2 mt-4">
        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>← Anterior</Button>
        <span className="px-3 py-1.5 text-sm font-semibold">Pág. {page}</span>
        <Button variant="outline" size="sm" disabled={items.length < 20} onClick={() => setPage(page + 1)}>Siguiente →</Button>
      </div>

      {/* Modal Crear */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo usuario">
        <div className="space-y-3">
          <Input label="Nombre completo *" value={form.full_name} onChange={(e: any) => setForm({ ...form, full_name: e.target.value })} />
          <Input label="Email *" type="email" value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} />
          <Input label="Contraseña inicial *" type="password" value={form.password} onChange={(e: any) => setForm({ ...form, password: e.target.value })} />
          <Input label="Teléfono" value={form.phone} onChange={(e: any) => setForm({ ...form, phone: e.target.value })} />
          <Select label="Rol *" value={form.role} onChange={(e: any) => setForm({ ...form, role: e.target.value })}>
            <option value="student">Estudiante</option>
            <option value="teacher">Profesor</option>
            <option value="super_admin">Admin</option>
          </Select>
          <Button onClick={create} className="w-full" size="lg">Crear usuario</Button>
        </div>
      </Modal>

      {/* Modal Editar */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Editar: ${editing?.full_name}`}>
        <div className="space-y-3">
          <Input label="Nombre completo" value={editForm.full_name} onChange={(e: any) => setEditForm({ ...editForm, full_name: e.target.value })} />
          <Input label="Teléfono" value={editForm.phone} onChange={(e: any) => setEditForm({ ...editForm, phone: e.target.value })} />
          <Select label="Estado" value={editForm.is_active ? "true" : "false"} onChange={(e: any) => setEditForm({ ...editForm, is_active: e.target.value === "true" })}>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </Select>
          <Button onClick={saveEdit} className="w-full" size="lg">Guardar cambios</Button>
        </div>
      </Modal>

      {/* Modal Pausar */}
      <Modal open={!!pausing} onClose={() => setPausing(null)} title={`Pausar a ${pausing?.full_name}`}>
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            El estudiante quedará pausado: no aparece en listas activas pero conserva todo su progreso. Puedes reactivarlo cuando quieras.
          </p>
          <Input label="Razón de la pausa" value={pauseReason} onChange={(e: any) => setPauseReason(e.target.value)} placeholder="ej: Solicitó vacaciones, pago atrasado, etc." />
          <Button onClick={doPause} className="w-full" variant="primary" size="lg">⏸ Pausar estudiante</Button>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirmResume}
        onClose={() => setConfirmResume(null)}
        onConfirm={() => confirmResume && doResume(confirmResume.id)}
        title="¿Reactivar estudiante?"
        message={`Vas a reactivar a ${confirmResume?.full_name}. Volverá a su progreso donde lo dejó.`}
        confirmLabel="Sí, reactivar"
        confirmVariant="primary"
      />

      {/* V1.5.1: Modal Niveles del profe */}
      <Modal open={!!levelsEditing} onClose={() => setLevelsEditing(null)} title={`Niveles que enseña ${levelsEditing?.full_name || ""}`}>
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Marcá los niveles CEFR que este profesor puede dar. El sistema usará esta información para auto-asignar estudiantes nuevos.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {["A1", "A2", "B1", "B2", "C1", "C2"].map(code => {
              const isChecked = teacherLevels.includes(code);
              const t = getLevelTheme(code);
              return (
                <button
                  key={code}
                  onClick={() => toggleLevel(code)}
                  className={`p-3 rounded-xl border-2 font-extrabold text-lg transition ${
                    isChecked
                      ? `${t.bg} text-white ${t.border} shadow-md`
                      : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {code}
                  {isChecked && <span className="block text-xs font-normal mt-1">✓ Marcado</span>}
                </button>
              );
            })}
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            💡 Si no marcás ningún nivel, el sistema considerará que el profe puede enseñar cualquier nivel.
          </div>
          <Button onClick={saveLevels} className="w-full" size="lg">Guardar niveles</Button>
        </div>
      </Modal>
    </>
  );
}
