"use client";
import { useState, useEffect } from "react";
import { account, auth, safeObj } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Input, Button, SuccessBox } from "@/components/ui";

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    auth.me().then(u => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    if (form.new_password !== form.confirm) {
      setMsg("✗ Las contraseñas no coinciden");
      return;
    }
    if (form.new_password.length < 8) {
      setMsg("✗ La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    setSaving(true);
    try {
      await account.changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
      });
      setMsg("✓ Contraseña actualizada con éxito");
      setForm({ current_password: "", new_password: "", confirm: "" });
    } catch (e: any) {
      setMsg("✗ " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;
  const u = safeObj(user, {}) as any;

  return (
    <>
      <PageHeader title="Mi cuenta" subtitle="Tu información personal y seguridad" />

      {/* Info */}
      <Card className="mb-5">
        <CardBody>
          <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-slate-500">Información personal</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Nombre completo</p>
              <p className="font-semibold">{u.full_name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Email</p>
              <p className="font-semibold">{u.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Teléfono</p>
              <p className="font-semibold">{u.phone || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Rol</p>
              <p className="font-semibold capitalize">{(u.role || "").replace("_", " ")}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Cambiar contraseña */}
      <Card>
        <CardBody>
          <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-slate-500">Cambiar contraseña</h3>

          {msg.startsWith("✓") && <div className="mb-4"><SuccessBox message={msg} /></div>}
          {msg.startsWith("✗") && <div className="mb-4"><ErrorBox message={msg.slice(2)} /></div>}

          <form onSubmit={submit} className="space-y-3 max-w-md">
            <Input
              label="Contraseña actual"
              type="password"
              value={form.current_password}
              onChange={(e: any) => setForm({ ...form, current_password: e.target.value })}
              required
            />
            <Input
              label="Nueva contraseña (mínimo 8 caracteres)"
              type="password"
              minLength={8}
              value={form.new_password}
              onChange={(e: any) => setForm({ ...form, new_password: e.target.value })}
              required
            />
            <Input
              label="Confirmar nueva contraseña"
              type="password"
              minLength={8}
              value={form.confirm}
              onChange={(e: any) => setForm({ ...form, confirm: e.target.value })}
              required
            />
            <Button type="submit" disabled={saving}>
              {saving ? "Actualizando..." : "Actualizar contraseña"}
            </Button>
          </form>
        </CardBody>
      </Card>
    </>
  );
}
