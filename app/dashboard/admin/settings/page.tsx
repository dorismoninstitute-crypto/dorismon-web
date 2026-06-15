"use client";
import { useEffect, useState, useRef } from "react";
import { adminApi, safeObj } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Button, Input, SuccessBox, showToast } from "@/components/ui";
import { Upload, Image as ImageIcon, X, Building2, Palette, Phone } from "lucide-react";

export default function AdminSettingsPage() {
  const [s, setS] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    adminApi.settings()
      .then(d => { setS(safeObj(d, {})); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      showToast("error", "El archivo debe ser una imagen (PNG, JPG, WebP o SVG)");
      return;
    }

    // Validar tamaño (max 800KB)
    if (file.size > 800 * 1024) {
      showToast("error", `La imagen pesa ${(file.size / 1024).toFixed(0)}KB. Máximo 800KB. Comprímela primero.`);
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setS({ ...s, logo_url: dataUrl });
      setUploading(false);
      showToast("success", "Logo cargado. Recuerda guardar los cambios.");
    };
    reader.onerror = () => {
      setUploading(false);
      showToast("error", "Error al leer el archivo");
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setS({ ...s, logo_url: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
    showToast("info", "Logo eliminado. Recuerda guardar los cambios.");
  };

  const save = async () => {
    setMsg("");
    try {
      await adminApi.updateSettings(s);
      setMsg("✓ Configuración guardada");
      showToast("success", "✓ Configuración guardada");
    } catch (e: any) {
      showToast("error", e.message);
      setMsg("✗ " + e.message);
    }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader title="Configuración institucional" subtitle="Datos, logo, colores e identidad" />
      {msg.startsWith("✓") && <div className="mb-4"><SuccessBox message={msg} /></div>}

      {/* LOGO */}
      <Card className="mb-4">
        <CardBody>
          <h3 className="flex items-center gap-2 font-extrabold text-slate-900 mb-4">
            <ImageIcon size={18} className="text-brand-600" />
            Logo del instituto
          </h3>

          {/* Preview actual */}
          <div className="mb-4 p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
            {s?.logo_url ? (
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center p-2 border border-slate-200 shadow-sm">
                  <img
                    src={s.logo_url}
                    alt="Logo Dorismon"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900">Logo actual</p>
                  <p className="text-xs text-slate-500 truncate">
                    {s.logo_url.startsWith("data:") ? "Subido directamente" : s.logo_url}
                  </p>
                  <button
                    onClick={removeLogo}
                    className="mt-2 text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                  >
                    <X size={14} /> Quitar logo
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Building2 size={48} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Sin logo configurado</p>
                <p className="text-xs text-slate-400">Sube uno para personalizar tu instituto</p>
              </div>
            )}
          </div>

          {/* Upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              variant="outline"
              size="md"
            >
              <Upload size={16} className="mr-2" />
              {uploading ? "Cargando..." : s?.logo_url ? "Cambiar logo" : "Subir logo"}
            </Button>
          </div>

          <div className="mt-3 text-xs text-slate-500 space-y-1">
            <p>📐 <strong>Formato:</strong> PNG, JPG, WebP o SVG</p>
            <p>📦 <strong>Tamaño máximo:</strong> 800KB</p>
            <p>📏 <strong>Recomendado:</strong> 200x200px (cuadrado) o 400x100px (horizontal)</p>
            <p className="pt-2 text-amber-700">
              💡 Si tu logo pesa más de 800KB, usa <a href="https://tinypng.com" target="_blank" rel="noreferrer" className="underline font-bold">tinypng.com</a> para comprimirlo gratis.
            </p>
          </div>

          {/* URL alternativa */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-700 mb-2">O usa una URL externa:</p>
            <Input
              value={s?.logo_url && !s.logo_url.startsWith("data:") ? s.logo_url : ""}
              onChange={(e: any) => setS({ ...s, logo_url: e.target.value })}
              placeholder="https://tu-cdn.com/logo.png"
            />
          </div>
        </CardBody>
      </Card>

      {/* DATOS GENERALES */}
      <Card className="mb-4">
        <CardBody>
          <h3 className="flex items-center gap-2 font-extrabold text-slate-900 mb-4">
            <Building2 size={18} className="text-brand-600" />
            Datos del instituto
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input label="Nombre del instituto" value={s?.name || ""} onChange={(e: any) => setS({ ...s, name: e.target.value })} placeholder="Dorismon Language Institute" />
            </div>
            <Input label="Email de contacto" type="email" value={s?.contact_email || ""} onChange={(e: any) => setS({ ...s, contact_email: e.target.value })} placeholder="info@dorismon.com" />
            <Input label="Teléfono" value={s?.contact_phone || ""} onChange={(e: any) => setS({ ...s, contact_phone: e.target.value })} placeholder="+1 809 555 0100" />
            <div className="md:col-span-2">
              <Input label="Dirección" value={s?.address || ""} onChange={(e: any) => setS({ ...s, address: e.target.value })} placeholder="Av. Lincoln, Santo Domingo" />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* COLORES */}
      <Card className="mb-4">
        <CardBody>
          <h3 className="flex items-center gap-2 font-extrabold text-slate-900 mb-4">
            <Palette size={18} className="text-brand-600" />
            Colores de la marca
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Color primario</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={s?.primary_color || "#4361ee"} onChange={e => setS({ ...s, primary_color: e.target.value })} className="h-12 w-20 rounded-lg cursor-pointer border border-slate-200" />
                <Input value={s?.primary_color || "#4361ee"} onChange={(e: any) => setS({ ...s, primary_color: e.target.value })} className="flex-1" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Color acento</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={s?.accent_color || "#f4622a"} onChange={e => setS({ ...s, accent_color: e.target.value })} className="h-12 w-20 rounded-lg cursor-pointer border border-slate-200" />
                <Input value={s?.accent_color || "#f4622a"} onChange={(e: any) => setS({ ...s, accent_color: e.target.value })} className="flex-1" />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Button onClick={save} size="lg" className="w-full md:w-auto">💾 Guardar configuración</Button>

      <p className="text-xs text-slate-500 text-center mt-4">
        Los cambios se aplican inmediatamente en toda la plataforma.
      </p>
    </>
  );
}
