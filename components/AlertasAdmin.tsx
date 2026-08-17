"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { showToast } from "@/components/ui";
import {
  UserX, FileCheck, ClipboardX, MessageCircle, Check,
  X, Clock, ChevronRight,
} from "lucide-react";
import Link from "next/link";

/**
 * V3.9.30 — Alertas que se pueden resolver.
 *
 * EL PROBLEMA QUE RESOLVÍA: las alertas se quedaban ahí para siempre. Una
 * alerta sin salida deja de ser alerta y se vuelve ruido: al tercer día
 * nadie la mira, y tapa las que sí importan.
 *
 * Ahora cada una tiene salida (escribir, ya lo manejé, posponer) y se
 * resuelve sola si el estudiante vuelve a asistir.
 */

const ICONOS: Record<string, any> = {
  "user-off": UserX,
  "file-check": FileCheck,
  "clipboard-x": ClipboardX,
};

const TONOS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900", icon: "text-amber-600" },
  accent: { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-900", icon: "text-sky-600" },
};

const DESTINOS: Record<string, string> = {
  ungraded: "/dashboard/admin/students",
  no_attendance: "/dashboard/admin/sessions",
};

function telefonoWhatsApp(tel?: string | null): string | null {
  if (!tel) return null;
  const d = tel.replace(/\D/g, "");
  if (d.length < 10) return null;
  return d.length === 10 ? "1" + d : d;
}

export default function AlertasAdmin({
  initialData = null,
  showAllClear = true,
}: {
  initialData?: any;
  showAllClear?: boolean;
} = {}) {
  const [data, setData] = useState<any>(initialData);
  const [cargando, setCargando] = useState(!initialData);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const cargar = async () => {
    try {
      const r = await api("/admin/alerts", { auth: true });
      setData(r);
    } catch {
      setData(null);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setCargando(false);
      return;
    }
    cargar();
  }, [initialData]);

  const actuar = async (key: string, action: string, note?: string) => {
    setOcupado(key);
    try {
      await api("/admin/alerts/action", {
        method: "POST", auth: true, body: { key, action, note, days: 3 },
      });
      await cargar();
      showToast("success",
        action === "snoozed" ? "Te lo recordamos en 3 días" : "Alerta resuelta");
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setOcupado(null);
    }
  };

  const escribir = (p: any) => {
    const tel = telefonoWhatsApp(p.phone);
    if (!tel) {
      showToast("error", "Esta persona no tiene teléfono registrado");
      return;
    }
    const nombre = (p.name || "").split(" ")[0];
    const msg =
      `Hola ${nombre}, te escribimos de Dorismon Language Institute. ` +
      `Notamos que faltaste a tus últimas clases y queremos saber si todo está bien. ` +
      `Si necesitas cambiar de horario o ponerte al día, con gusto te ayudamos. 📚`;
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, "_blank");
    actuar(p.key, "resolved", "Contactado por WhatsApp");
  };

  if (cargando || !data) return null;

  const grupos = data.groups || [];

  // Sin nada pendiente: se felicita en vez de mostrar una caja vacía
  if (grupos.length === 0) {
    if (!showAllClear) return null;
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6 flex items-center gap-3">
        <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-bold text-emerald-900">Todo al día</p>
          <p className="text-emerald-700 text-xs">
            No hay nada pendiente de atender
            {data.resolved_this_week > 0 && ` · resolviste ${data.resolved_this_week} esta semana`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h2 className="font-bold text-slate-800">Requiere tu atención</h2>
        {data.resolved_this_week > 0 && (
          <p className="text-xs text-slate-500">
            {data.resolved_this_week} resueltas esta semana
          </p>
        )}
      </div>

      <div className="space-y-3">
        {grupos.map((g: any) => {
          const Icono = ICONOS[g.icon] || FileCheck;
          const t = TONOS[g.tone] || TONOS.accent;
          const destino = DESTINOS[g.type];

          return (
            <div key={g.type} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className={`flex items-center gap-3 px-4 py-3 ${t.bg} border-b ${t.border} flex-wrap`}>
                <Icono className={`w-5 h-5 flex-shrink-0 ${t.icon}`} />
                <div className="flex-1 min-w-[160px]">
                  <p className={`font-bold text-sm ${t.text}`}>{g.title}</p>
                  {g.subtitle && <p className={`text-xs ${t.text} opacity-75`}>{g.subtitle}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {destino && (
                    <Link
                      href={destino}
                      className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border ${t.border} ${t.text} hover:bg-white/60 transition`}
                    >
                      Ver
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                  {g.key && (
                    <button
                      onClick={() => actuar(g.key, "dismissed")}
                      disabled={ocupado === g.key}
                      title="Ocultar este aviso"
                      className={`p-1.5 rounded-lg ${t.text} opacity-60 hover:opacity-100 transition`}
                      aria-label="Descartar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {(g.items || []).map((p: any) => (
                <div
                  key={p.key}
                  className="px-4 py-3 border-b border-slate-100 last:border-b-0 flex items-center gap-3 flex-wrap"
                >
                  <div className="w-9 h-9 rounded-full bg-brand-500 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                    {(p.name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-[150px] leading-tight">
                    <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.detail}</p>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {p.urgency === "high" && p.phone && (
                      <button
                        onClick={() => escribir(p)}
                        disabled={ocupado === p.key}
                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition disabled:opacity-50"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Escribir
                      </button>
                    )}
                    <button
                      onClick={() => actuar(p.key, "resolved")}
                      disabled={ocupado === p.key}
                      className="text-xs font-semibold border border-slate-200 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                    >
                      Ya lo manejé
                    </button>
                    <button
                      onClick={() => actuar(p.key, "snoozed")}
                      disabled={ocupado === p.key}
                      title="Recordármelo en 3 días"
                      className="text-slate-400 hover:text-slate-600 p-2 rounded-lg transition"
                      aria-label="Posponer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
