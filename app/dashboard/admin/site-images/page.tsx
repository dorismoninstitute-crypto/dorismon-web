"use client";
import { useEffect, useRef, useState } from "react";
import { adminApi } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, showToast } from "@/components/ui";
import { Upload, Trash2, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";

/**
 * V3.9.23 — "Imágenes del sitio".
 * Luis sube las fotos de la página pública desde aquí, sin tocar código,
 * sin desplegar y sin entrar nunca a Cloudinary.
 */

const PRIORIDAD: Record<string, { label: string; cls: string }> = {
  imprescindible: { label: "Imprescindible", cls: "bg-red-100 text-red-700" },
  recomendada: { label: "Muy recomendada", cls: "bg-amber-100 text-amber-700" },
  opcional: { label: "Opcional", cls: "bg-slate-100 text-slate-600" },
};

export default function SiteImagesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [ready, setReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = async () => {
    try {
      const r: any = await adminApi.siteImages();
      setItems(Array.isArray(r?.items) ? r.items : []);
      setReady(!!r?.cloudinary_ready);
      setError("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pick = (slot: string) => inputs.current[slot]?.click();

  const onFile = async (slot: string, file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("error", "El archivo debe ser una imagen (JPG o PNG)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("error", "La imagen es muy pesada. El máximo son 10 MB.");
      return;
    }
    setBusy(slot);
    try {
      await adminApi.uploadSiteImage(slot, file);
      showToast("success", "✅ Imagen actualizada. Ya se ve en la página.");
      await load();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setBusy(null);
      if (inputs.current[slot]) inputs.current[slot]!.value = "";
    }
  };

  const remove = async (slot: string, label: string) => {
    if (!confirm(`¿Quitar la imagen de "${label}"?\n\nLa página volverá a mostrar el espacio vacío. Puedes subir otra cuando quieras.`)) return;
    setBusy(slot);
    try {
      await adminApi.deleteSiteImage(slot);
      showToast("success", "Imagen quitada");
      await load();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorBox message={error} />;

  return (
    <div>
      <PageHeader
        title="Imágenes del sitio"
        subtitle="Cambia las fotos de la página pública. Se actualizan al instante, sin desplegar."
      />

      {!ready && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-6 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-amber-900 mb-1">Falta conectar el almacén de imágenes</p>
            <p className="text-amber-800 leading-relaxed">
              Agrega la variable <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">CLOUDINARY_URL</code>{" "}
              en Render (servicio dorismon-api → Environment) y espera 2-3 minutos a que reinicie.
              Mientras tanto no se pueden subir imágenes, pero la página funciona normal.
            </p>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-xs text-blue-800 space-y-2">
        <p>
          🎨 <strong>Varios espacios ya muestran un dibujo</strong> hecho a medida, así tu página
          se ve completa desde hoy. Cuando subas una foto real, el dibujo desaparece solo.
        </p>
        <p>
          💡 Si dudas del tamaño, sube la imagen <strong>más grande</strong> que tengas: el sistema
          la optimiza sola. Lo que no se puede es agrandar una foto pequeña sin que se vea borrosa.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((it) => {
          const p = PRIORIDAD[it.priority] || PRIORIDAD.opcional;
          const isBusy = busy === it.slot;
          return (
            <Card key={it.slot}>
              <CardBody>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-slate-800">{it.label}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.cls}`}>
                        {p.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{it.description}</p>
                  </div>
                  {it.url && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-3">
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold">Tamaño recomendado:</span> {it.hint}
                  </p>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-40 flex items-center justify-center mb-3">
                  {it.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.url} alt={it.label} className="w-full h-full object-contain" />
                  ) : it.has_drawing ? (
                    <p className="text-xs text-slate-500 text-center px-4">
                      🎨 Mostrando un dibujo por ahora<br />
                      <span className="text-slate-400">Sube una imagen y la reemplaza sola</span>
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">Sin imagen todavía</p>
                  )}
                </div>

                <input
                  ref={(el) => { inputs.current[it.slot] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onFile(it.slot, e.target.files?.[0])}
                />

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => pick(it.slot)}
                    disabled={isBusy || !ready}
                    className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-lg transition"
                  >
                    <Upload className="w-4 h-4" />
                    {isBusy ? "Subiendo..." : it.url ? "Cambiar imagen" : "Subir imagen"}
                  </button>
                  {it.url && (
                    <>
                      <a
                        href={it.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 border border-slate-200 hover:border-slate-300 text-slate-600 text-sm px-3 py-2 rounded-lg transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver
                      </a>
                      <button
                        onClick={() => remove(it.slot, it.label)}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg transition disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Quitar
                      </button>
                    </>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
