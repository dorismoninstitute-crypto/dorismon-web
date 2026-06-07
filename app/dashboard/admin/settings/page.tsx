"use client";
import { useEffect, useState } from "react";
import { adminApi, safeObj } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Button, Input, Textarea, SuccessBox } from "@/components/ui";

export default function AdminSettingsPage() {
  const [s, setS] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    adminApi.settings()
      .then(d => { setS(safeObj(d, {})); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  const save = async () => {
    setMsg("");
    try {
      await adminApi.updateSettings(s);
      setMsg("✓ Configuración guardada");
    } catch (e: any) { setMsg("✗ " + e.message); }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader title="Configuración institucional" subtitle="Datos del instituto" />
      {msg.startsWith("✓") && <div className="mb-4"><SuccessBox message={msg} /></div>}

      <Card>
        <CardBody>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input label="Nombre del instituto" value={s?.name || ""} onChange={(e: any) => setS({ ...s, name: e.target.value })} />
            </div>
            <Input label="Email de contacto" type="email" value={s?.contact_email || ""} onChange={(e: any) => setS({ ...s, contact_email: e.target.value })} />
            <Input label="Teléfono" value={s?.contact_phone || ""} onChange={(e: any) => setS({ ...s, contact_phone: e.target.value })} />
            <div className="md:col-span-2">
              <Input label="Dirección" value={s?.address || ""} onChange={(e: any) => setS({ ...s, address: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Input label="URL del logo" value={s?.logo_url || ""} onChange={(e: any) => setS({ ...s, logo_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Color primario</label>
              <input type="color" value={s?.primary_color || "#4361ee"} onChange={e => setS({ ...s, primary_color: e.target.value })} className="w-full h-12 rounded-lg cursor-pointer" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Color acento</label>
              <input type="color" value={s?.accent_color || "#f4622a"} onChange={e => setS({ ...s, accent_color: e.target.value })} className="w-full h-12 rounded-lg cursor-pointer" />
            </div>
          </div>
          <Button onClick={save} size="lg" className="mt-6 w-full md:w-auto">Guardar cambios</Button>
        </CardBody>
      </Card>
    </>
  );
}
