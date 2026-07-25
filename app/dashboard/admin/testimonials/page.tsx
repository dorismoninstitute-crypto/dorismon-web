"use client";
import { useEffect, useRef, useState } from "react";
import { adminApi } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, showToast } from "@/components/ui";
import { Plus, Trash2, Upload, Eye, EyeOff, Star } from "lucide-react";

/**
 * V3.9.23 — Testimonios de la landing.
 * La sección en la página pública SOLO aparece cuando hay al menos uno
 * activo: si está vacía, no se muestra y el diseño no se rompe.
 */
export default function TestimonialsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", role: "", text: "", rating: 5 });
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = async () => {
    try {
      const r: any = await adminApi.testimonials();
      setItems(Array.isArray(r?.items) ? r.items : []);
      setError("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim() || !form.text.trim()) {
      showToast("error", "El nombre y el testimonio son obligatorios");
      return;
    }
    setBusy("new");
    try {
      await adminApi.createTestimonial(form);
      showToast("success", "✅ Testimonio agregado");
      setForm({ name: "", role: "", text: "", rating: 5 });
      setCreating(false);
      await load();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setBusy(null);
    }
  };

  const toggle = async (t: any) => {
    setBusy(t.id);
    try {
      await adminApi.updateTestimonial(t.id, { is_active: !t.is_active });
      await load();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setBusy(null);
    }
  };

  const onPhoto = async (id: string, file?: File | null) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast("error", "La imagen es muy pesada. El máximo son 10 MB.");
      return;
    }
    setBusy(id);
    try {
      await adminApi.uploadTestimonialPhoto(id, file);
      showToast("success", "Foto actualizada");
      await load();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async (t: any) => {
    if (!confirm(`¿Eliminar el testimonio de ${t.name}?`)) return;
    setBusy(t.id);
    try {
      await adminApi.deleteTestimonial(t.id);
      showToast("success", "Testimonio eliminado");
      await load();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorBox message={error} />;

  const activos = items.filter((t) => t.is_active).length;

  return (
    <div>
      <PageHeader
        title="Testimonios"
        subtitle="Lo que dicen tus estudiantes reales en la página pública."
      />

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-800">
        <p className="leading-relaxed">
          {activos === 0 ? (
            <>
              <strong>La sección de testimonios está oculta</strong> en la página pública porque
              aún no hay ninguno activo. En cuanto agregues el primero, aparece sola.
            </>
          ) : (
            <>
              Hay <strong>{activos}</strong> testimonio{activos === 1 ? "" : "s"} visible
              {activos === 1 ? "" : "s"} en la página pública.
            </>
          )}
        </p>
        <p className="text-xs mt-2 text-blue-700">
          💡 Pídelos por WhatsApp a estudiantes actuales: dos líneas y una foto. Un testimonio
          real convierte mucho más que uno genérico. La foto debe ser cuadrada (se muestra en círculo).
        </p>
      </div>

      {!creating ? (
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm px-4 py-2.5 rounded-lg transition mb-6"
        >
          <Plus className="w-4 h-4" />
          Agregar testimonio
        </button>
      ) : (
        <Card className="mb-6">
          <CardBody>
            <h3 className="font-bold text-slate-800 mb-4">Nuevo testimonio</h3>
            <div className="grid gap-3 md:grid-cols-2 mb-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: María Fernández"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ocupación (opcional)</label>
                <input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="Ej: Arquitecta"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Testimonio *</label>
              <textarea
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                rows={3}
                placeholder="Lo que el estudiante dijo sobre su experiencia..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Estrellas</label>
              <select
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{"★".repeat(n)} ({n})</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={create}
                disabled={busy === "new"}
                className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm px-4 py-2 rounded-lg transition"
              >
                {busy === "new" ? "Guardando..." : "Guardar"}
              </button>
              <button
                onClick={() => { setCreating(false); setForm({ name: "", role: "", text: "", rating: 5 }); }}
                className="border border-slate-200 text-slate-600 text-sm px-4 py-2 rounded-lg hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              La foto se agrega después de guardar, con el botón de cada tarjeta.
            </p>
          </CardBody>
        </Card>
      )}

      {items.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500 text-center py-8">
              Aún no hay testimonios. Agrega el primero y la sección aparecerá en tu página.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((t) => (
            <Card key={t.id} className={t.is_active ? "" : "opacity-60"}>
              <CardBody>
                <div className="flex items-start gap-3 mb-3">
                  {t.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.photo_url} alt={t.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-sm flex-shrink-0">
                      {(t.name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 truncate">{t.name}</p>
                    {t.role && <p className="text-xs text-slate-500">{t.role}</p>}
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {Array.from({ length: t.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {t.is_active ? "Visible" : "Oculto"}
                  </span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mb-4 italic">&ldquo;{t.text}&rdquo;</p>

                <input
                  ref={(el) => { inputs.current[t.id] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPhoto(t.id, e.target.files?.[0])}
                />

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => inputs.current[t.id]?.click()}
                    disabled={busy === t.id}
                    className="inline-flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold px-3 py-2 rounded-lg transition disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {t.photo_url ? "Cambiar foto" : "Subir foto"}
                  </button>
                  <button
                    onClick={() => toggle(t)}
                    disabled={busy === t.id}
                    className="inline-flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold px-3 py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {t.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {t.is_active ? "Ocultar" : "Mostrar"}
                  </button>
                  <button
                    onClick={() => remove(t)}
                    disabled={busy === t.id}
                    className="inline-flex items-center gap-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold px-3 py-2 rounded-lg transition disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
