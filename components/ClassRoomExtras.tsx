"use client";
import { useEffect, useState, useCallback } from "react";
import {
  useRoomContext, useParticipants, useLocalParticipant, useLocalParticipantPermissions,
} from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { api } from "@/lib/api";
import { FUENTE, puedePublicar, estadoCompartirPantalla, mensajeErrorPantalla } from "@/lib/videoControles";
import { Hand, MicOff, Mic, UserX, Users, X, PictureInPicture2, MonitorUp, MonitorX } from "lucide-react";

/**
 * V3.9.27 — Lo que le faltaba a la sala de clase.
 *
 * - Levantar la mano: el estudiante avisa sin interrumpir; al profesor le
 *   aparece en la lista, ordenada por quién levantó primero.
 * - Lista de participantes: quién está conectado ahora.
 * - Silenciar y sacar: solo el profesor. Se hace desde el servidor para que
 *   funcione de verdad (no depende del navegador del otro).
 * - Ventana flotante: achica el video y lo deja encima mientras el profesor
 *   navega la plataforma (para poner un quiz, revisar una tarea, etc).
 * - Aviso de presencia: cada minuto se avisa que la persona sigue en clase,
 *   para poder sugerir la asistencia después.
 */

const MANO_TEMA = "dorismon-mano";

// ---------------------------------------------------------------- Mano
export function useRaisedHands() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [manos, setManos] = useState<Record<string, number>>({});
  const [miMano, setMiMano] = useState(false);

  useEffect(() => {
    const onData = (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        if (msg?.tipo !== MANO_TEMA) return;
        setManos((prev) => {
          const next = { ...prev };
          if (msg.arriba) next[msg.identity] = msg.ts || Date.now();
          else delete next[msg.identity];
          return next;
        });
      } catch { /* mensaje de otro tipo */ }
    };
    room.on("dataReceived", onData);
    return () => { room.off("dataReceived", onData); };
  }, [room]);

  const toggleMano = useCallback(async () => {
    const arriba = !miMano;
    setMiMano(arriba);
    const identity = localParticipant?.identity || "";
    setManos((prev) => {
      const next = { ...prev };
      if (arriba) next[identity] = Date.now();
      else delete next[identity];
      return next;
    });
    try {
      await localParticipant?.publishData(
        new TextEncoder().encode(JSON.stringify({
          tipo: MANO_TEMA, identity, arriba, ts: Date.now(),
        })),
        { reliable: true }
      );
    } catch { /* si falla el envío, al menos se ve local */ }
  }, [miMano, localParticipant]);

  const bajarMano = useCallback((identity: string) => {
    setManos((prev) => { const n = { ...prev }; delete n[identity]; return n; });
  }, []);

  return { manos, miMano, toggleMano, bajarMano };
}

export function BotonMano({ miMano, onToggle }: { miMano: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={miMano ? "Bajar la mano" : "Levantar la mano"}
      className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition ${
        miMano ? "bg-amber-400 text-amber-950" : "bg-white/10 text-white hover:bg-white/20"
      }`}
    >
      <Hand className="w-4 h-4" />
      <span className="hidden sm:inline">{miMano ? "Bajar la mano" : "Levantar la mano"}</span>
    </button>
  );
}

// ------------------------------------------------- Panel de participantes
export function PanelParticipantes({
  sessionId, esModerador, manos, bajarMano, onClose,
}: {
  sessionId: string;
  esModerador: boolean;
  manos: Record<string, number>;
  bajarMano: (id: string) => void;
  onClose: () => void;
}) {
  const participants = useParticipants();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  // GATE 6G-A — Retirados de ESTA clase (el backend decide; aquí solo se muestra)
  const [retirados, setRetirados] = useState<{ user_id: string; name: string }[]>([]);
  const cargarRetirados = useCallback(async () => {
    if (!esModerador) return;
    try {
      const r: any = await api(`/video/sessions/${sessionId}/bloqueos`, { auth: true });
      setRetirados(Array.isArray(r?.items) ? r.items : []);
    } catch { /* sin lista: se ven igual los conectados */ }
  }, [esModerador, sessionId]);
  useEffect(() => { void cargarRetirados(); }, [cargarRetirados]);

  // GATE 6G-C — el estado de los permisos se lee de LiveKit (lo real), y se
  // vuelve a pintar cuando cambia; nunca se "finge" un cambio en la interfaz.
  const room = useRoomContext();
  const [, repintar] = useState(0);
  useEffect(() => {
    const r = () => repintar((x) => x + 1);
    room.on(RoomEvent.ParticipantPermissionsChanged, r);
    return () => { room.off(RoomEvent.ParticipantPermissionsChanged, r); };
  }, [room]);

  const moderar = async (identity: string, action: AccionModeracion, reintento = false) => {
    if (action === "remove" && !reintento && !confirm(
      "¿Sacar a esta persona de la clase?\n\nNo podrá volver a entrar a esta clase hasta que pulses «Permitir volver».",
    )) return;
    setOcupado(identity);
    setAviso("");
    try {
      const r: any = await api(`/video/sessions/${sessionId}/moderate`, {
        method: "POST", auth: true, body: { action, identity },
      });
      if (action === "mute") setAviso("Micrófono silenciado (puede volver a activarlo)");
      if (action === "remove") {
        setAviso(r?.desconectado === false
          ? "Acceso bloqueado. No estaba conectado a la sala."
          : "Participante retirado. No podrá volver hasta que pulses «Permitir volver».");
      }
      if (action === "allow") setAviso("Puede volver a entrar a la clase");
      if (action in TEXTO_PERMISO) setAviso(TEXTO_PERMISO[action]);
    } catch (e: any) {
      setAviso(e?.message || "No se pudo aplicar");
    } finally {
      setOcupado(null);
      if (action !== "mute") void cargarRetirados();
    }
  };
  const esRetirado = (identity: string) => retirados.some((r) => r.user_id === identity);
  const conectados = new Set(participants.map((p) => p.identity));
  const retiradosFuera = retirados.filter((r) => !conectados.has(r.user_id));

  // Los que levantaron la mano primero van arriba
  const ordenados = [...participants].sort((a, b) => {
    const ma = manos[a.identity] || Infinity;
    const mb = manos[b.identity] || Infinity;
    return ma - mb;
  });

  return (
    <aside className="absolute right-0 top-0 bottom-0 w-full sm:w-80 bg-[#111C33] border-l border-white/10 z-30 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <p className="text-white font-semibold text-sm flex items-center gap-2">
          <Users className="w-4 h-4" />
          En la clase ({participants.length})
        </p>
        <button onClick={onClose} className="text-white/60 hover:text-white p-1" aria-label="Cerrar">
          <X className="w-4 h-4" />
        </button>
      </div>

      {aviso && <p className="text-xs text-emerald-300 px-4 py-2 bg-emerald-500/10">{aviso}</p>}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {ordenados.map((p) => {
          const manoArriba = !!manos[p.identity];
          const retirado = esModerador && esRetirado(p.identity);
          // GATE 6G-A — al profesor de la clase y a Dirección no se les modera
          // (el backend lo rechaza igual); su token lleva metadata "teacher".
          const moderable = esModerador && !p.isLocal && p.metadata !== "teacher";
          return (
            <div key={p.identity} className="bg-white/5 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                {manoArriba && <Hand className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                <p className="text-white text-sm font-medium truncate flex-1">
                  {p.name || p.identity}
                </p>
                {p.isMicrophoneEnabled
                  ? <Mic className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  : <MicOff className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />}
              </div>
              {manoArriba && (
                <p className="text-[11px] text-amber-300/80 mb-2">Levantó la mano</p>
              )}
              {moderable && (retirado ? (
                <div className="flex gap-1.5 flex-wrap items-center" data-retirado={p.identity}>
                  <span className="text-[11px] text-red-200">Retirado de la clase</span>
                  {/* Sigue conectado (LiveKit no pudo desconectarlo): reintentar */}
                  <button
                    onClick={() => moderar(p.identity, "remove", true)}
                    disabled={ocupado === p.identity}
                    className="text-[11px] bg-red-500/20 hover:bg-red-500/30 text-red-200 px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
                  >
                    Volver a desconectar
                  </button>
                  <button
                    onClick={() => moderar(p.identity, "allow")}
                    disabled={ocupado === p.identity}
                    className="text-[11px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
                  >
                    Permitir volver
                  </button>
                </div>
              ) : (
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => moderar(p.identity, "mute")}
                    disabled={ocupado === p.identity}
                    className="text-[11px] bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
                  >
                    Silenciar
                  </button>
                  <button
                    onClick={() => moderar(p.identity, "remove")}
                    disabled={ocupado === p.identity}
                    className="text-[11px] bg-red-500/20 hover:bg-red-500/30 text-red-200 px-2.5 py-1.5 rounded-lg transition disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    <UserX className="w-3 h-3" /> Sacar
                  </button>
                  {manoArriba && (
                    <button
                      onClick={() => bajarMano(p.identity)}
                      className="text-[11px] bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 px-2.5 py-1.5 rounded-lg transition"
                    >
                      Bajar mano
                    </button>
                  )}
                  {/* GATE 6G-C — permisos de esa persona en ESTA clase (no encienden nada) */}
                  <div className="w-full flex gap-1.5 flex-wrap pt-1" data-permisos={p.identity}>
                    {([
                      [FUENTE.pantalla, "permitir_pantalla", "quitar_pantalla", "Permitir pantalla", "Quitar pantalla"],
                      [FUENTE.microfono, "permitir_microfono", "bloquear_microfono", "Permitir micrófono", "Bloquear micrófono"],
                      [FUENTE.camara, "permitir_camara", "bloquear_camara", "Permitir cámara", "Bloquear cámara"],
                    ] as const).map(([fuente, permitir, quitar, txtPermitir, txtQuitar]) => {
                      const tiene = puedePublicar(p, fuente);
                      return (
                        <button
                          key={permitir}
                          onClick={() => moderar(p.identity, tiene ? quitar : permitir)}
                          disabled={ocupado === p.identity}
                          data-permiso={tiene ? quitar : permitir}
                          className={`text-[11px] px-2.5 py-1.5 rounded-lg transition disabled:opacity-50 ${
                            tiene ? "bg-white/10 hover:bg-white/20 text-white/80" : "bg-sky-500/20 hover:bg-sky-500/30 text-sky-100"
                          }`}
                        >
                          {tiene ? txtQuitar : txtPermitir}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {/* GATE 6G-A — Retirados que ya no están conectados */}
        {esModerador && retiradosFuera.length > 0 && (
          <div className="pt-2" data-retirados="">
            <p className="text-white/50 text-[11px] font-semibold uppercase tracking-wide mb-1.5 px-1">
              Retirados de la clase
            </p>
            {retiradosFuera.map((r) => (
              <div key={r.user_id} className="bg-red-500/10 rounded-xl p-3 mb-2 flex items-center gap-2" data-retirado={r.user_id}>
                <UserX className="w-4 h-4 text-red-300 flex-shrink-0" />
                <p className="text-white text-sm truncate flex-1">{r.name}</p>
                <button
                  onClick={() => moderar(r.user_id, "allow")}
                  disabled={ocupado === r.user_id}
                  className="text-[11px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
                >
                  Permitir volver
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

// -------------------------------------------- Ventana flotante (modo mini)
export function BotonVentanaFlotante() {
  const [soportado, setSoportado] = useState(false);

  useEffect(() => {
    setSoportado(
      typeof document !== "undefined" &&
      "pictureInPictureEnabled" in document &&
      (document as any).pictureInPictureEnabled
    );
  }, []);

  const activar = async () => {
    // Busca el video más grande de la sala y lo saca en ventana flotante
    const videos = Array.from(document.querySelectorAll("video")) as HTMLVideoElement[];
    const activo = videos
      .filter((v) => v.readyState > 0 && !v.paused)
      .sort((a, b) => (b.videoWidth * b.videoHeight) - (a.videoWidth * a.videoHeight))[0];
    if (!activo) {
      alert("Espera a que la clase esté en video para usar la ventana flotante.");
      return;
    }
    try {
      if ((document as any).pictureInPictureElement) {
        await (document as any).exitPictureInPicture();
      } else {
        await (activo as any).requestPictureInPicture();
      }
    } catch {
      alert("Tu navegador no permitió la ventana flotante. Prueba con Chrome en la computadora.");
    }
  };

  if (!soportado) return null;

  return (
    <button
      onClick={activar}
      title="Achicar el video y seguir en la plataforma"
      className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
    >
      <PictureInPicture2 className="w-4 h-4" />
      <span className="hidden sm:inline">Ventana flotante</span>
    </button>
  );
}

// -------------------------------------------------- Aviso de presencia
export function AvisoDePresencia({ sessionId }: { sessionId: string }) {
  useEffect(() => {
    let vivo = true;
    const avisar = () => {
      if (!vivo) return;
      api(`/video/sessions/${sessionId}/heartbeat`, { method: "POST", auth: true }).catch(() => {});
    };
    avisar();
    const t = setInterval(avisar, 60_000);
    return () => { vivo = false; clearInterval(t); };
  }, [sessionId]);
  return null;
}

// ------------------------------------------------ GATE 6G-C — permisos dinámicos
// La regla vive en lib/videoControles (lógica pura, la misma que usan las pruebas).
export { FUENTE, puedePublicar };

// ------------------------------------- HOTFIX v3.9.76 — compartir pantalla visible
/** Botón Dorismon "Compartir pantalla" / "Dejar de compartir" para quien no modera.
 *  - Solo aparece si LiveKit permite REALMENTE publicar SCREEN_SHARE (el profesor lo concede con
 *    "Permitir pantalla"); el permiso se lee de LiveKit y se repinta con sus eventos, sin recargar.
 *  - Nunca empieza a compartir solo: lo decide la persona con un clic.
 *  - Si el profesor retira el permiso mientras comparte, se detiene la pista local.
 *  - El moderador conserva su comportamiento actual (botón de la barra de LiveKit). */
export function BotonCompartirPantalla({ esModerador }: { esModerador: boolean }) {
  const { localParticipant, isScreenShareEnabled } = useLocalParticipant();
  const permisos = useLocalParticipantPermissions();
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const estado = estadoCompartirPantalla({ permisos, compartiendo: isScreenShareEnabled, esModerador });

  useEffect(() => {
    if (!estado.detenerPorPermisoRetirado) return;
    localParticipant.setScreenShareEnabled(false).catch(() => { /* LiveKit ya la retiró */ });
  }, [estado.detenerPorPermisoRetirado, localParticipant]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 8000);
    return () => clearTimeout(t);
  }, [error]);

  if (!estado.mostrar) return null;

  const alternar = async () => {
    if (ocupado) return;
    setOcupado(true);
    setError("");
    try {
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
    } catch (e) {
      setError(mensajeErrorPantalla(e));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={alternar}
        disabled={ocupado}
        title={estado.etiqueta || undefined}
        aria-pressed={isScreenShareEnabled}
        data-compartir-pantalla={isScreenShareEnabled ? "activo" : "disponible"}
        className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 min-h-[40px] rounded-xl transition disabled:opacity-60 ${
          isScreenShareEnabled ? "bg-red-500/25 hover:bg-red-500/35 text-red-100" : "bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-50"
        }`}
      >
        {isScreenShareEnabled ? <MonitorX className="w-4 h-4" /> : <MonitorUp className="w-4 h-4" />}
        <span>{estado.etiqueta}</span>
      </button>
      {error && (
        <p role="alert" data-error-pantalla=""
          className="absolute right-0 top-full mt-1.5 z-40 w-64 bg-[#182338] border border-red-400/40 text-red-100 text-xs rounded-xl px-3 py-2 shadow-2xl">
          {error}
        </p>
      )}
    </div>
  );
}

type AccionModeracion = "mute" | "remove" | "allow"
  | "permitir_pantalla" | "quitar_pantalla" | "bloquear_microfono" | "permitir_microfono"
  | "bloquear_camara" | "permitir_camara";

const TEXTO_PERMISO: Record<string, string> = {
  permitir_pantalla: "Puede compartir pantalla (no se activa sola: lo decide esa persona)",
  quitar_pantalla: "Ya no puede compartir pantalla",
  bloquear_microfono: "Micrófono bloqueado: no puede activarlo hasta que lo permitas",
  permitir_microfono: "Micrófono permitido (no se enciende solo)",
  bloquear_camara: "Cámara bloqueada: no puede activarla hasta que lo permitas",
  permitir_camara: "Cámara permitida (no se enciende sola)",
};
