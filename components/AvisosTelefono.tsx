"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Bell, BellOff, Smartphone, Check, Loader2 } from "lucide-react";

/**
 * V3.9.29 — Activar los avisos en el teléfono.
 *
 * EN CRIOLLO: le pide permiso al teléfono y guarda su "dirección de entrega"
 * para que Dorismon pueda avisarle de sus clases y tareas aunque tenga la
 * plataforma cerrada.
 *
 * IPHONE: Apple obliga a que la plataforma esté agregada a la pantalla de
 * inicio. Si no lo está, se lo explicamos en vez de dejarlo con un botón
 * que no funciona.
 */

function base64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

const esIOS = () =>
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

const estaInstalada = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true);

export default function AvisosTelefono({ compacto = false }: { compacto?: boolean }) {
  const [soportado, setSoportado] = useState(false);
  const [configurado, setConfigurado] = useState(false);
  const [activo, setActivo] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const puede =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSoportado(puede);

    api("/push/config")
      .then((r: any) => setConfigurado(!!r?.ready))
      .catch(() => setConfigurado(false));

    if (puede) {
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setActivo(!!sub))
        .catch(() => {})
        .finally(() => setListo(true));
    } else {
      setListo(true);
    }
  }, []);

  const activar = async () => {
    setOcupado(true);
    setMensaje("");
    try {
      const cfg: any = await api("/push/config");
      if (!cfg?.ready || !cfg?.public_key) {
        setMensaje("Los avisos no están configurados todavía.");
        return;
      }

      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setMensaje("No diste permiso. Puedes activarlo desde los ajustes de tu navegador.");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ToUint8Array(cfg.public_key),
        });
      }

      await api("/push/subscribe", {
        method: "POST",
        auth: true,
        body: { subscription: sub.toJSON(), device: navigator.userAgent.slice(0, 100) },
      });

      setActivo(true);
      setMensaje("¡Listo! Te avisaremos de tus clases y tareas.");
      // Aviso de prueba para que compruebe que llega
      api("/push/test", { method: "POST", auth: true }).catch(() => {});
    } catch (e: any) {
      setMensaje(e?.message || "No se pudieron activar los avisos.");
    } finally {
      setOcupado(false);
    }
  };

  const desactivar = async () => {
    setOcupado(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api("/push/unsubscribe", {
          method: "POST", auth: true, body: { endpoint: sub.endpoint },
        }).catch(() => {});
        await sub.unsubscribe();
      }
      setActivo(false);
      setMensaje("Avisos desactivados en este dispositivo.");
    } catch {
      setMensaje("No se pudieron desactivar.");
    } finally {
      setOcupado(false);
    }
  };

  if (!listo || !configurado) return null;

  // iPhone sin instalar: explicar en vez de mostrar un botón que no sirve
  if (esIOS() && !estaInstalada()) {
    return (
      <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-sky-900 mb-1">Recibe avisos en tu iPhone</p>
            <p className="text-sky-800 text-xs leading-relaxed">
              Toca el botón de compartir de Safari, elige{" "}
              <strong>&ldquo;Agregar a inicio&rdquo;</strong>, y abre Dorismon desde ahí.
              Después podrás activar los avisos. (Apple lo pide así.)
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!soportado) return null;

  if (compacto) {
    return (
      <button
        onClick={activo ? desactivar : activar}
        disabled={ocupado}
        className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition disabled:opacity-50 ${
          activo
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
        }`}
      >
        {ocupado ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : activo ? <Check className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
        {activo ? "Avisos activados" : "Activar avisos"}
      </button>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-start gap-3 flex-wrap">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          activo ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-500"
        }`}>
          {activo ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-[180px]">
          <p className="font-bold text-sm text-slate-800">
            {activo ? "Avisos activados" : "Avisos en tu teléfono"}
          </p>
          <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
            {activo
              ? "Te avisamos de tus clases y tareas aunque tengas la plataforma cerrada."
              : "Recibe un aviso cuando tu clase esté por empezar o una tarea esté por vencer."}
          </p>
        </div>
        <button
          onClick={activo ? desactivar : activar}
          disabled={ocupado}
          className={`text-xs font-bold px-4 py-2.5 rounded-lg transition disabled:opacity-50 flex-shrink-0 ${
            activo
              ? "border border-slate-200 text-slate-600 hover:bg-slate-50"
              : "bg-brand-600 hover:bg-brand-700 text-white"
          }`}
        >
          {ocupado ? "Un momento..." : activo ? "Desactivar" : "Activar"}
        </button>
      </div>
      {mensaje && (
        <p className="text-xs text-slate-600 mt-3 bg-slate-50 rounded-lg px-3 py-2">{mensaje}</p>
      )}
    </div>
  );
}
