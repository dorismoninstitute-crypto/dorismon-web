"use client";
import { useEffect, useState, useCallback } from "react";
import {
  useRoomContext, useParticipants, useLocalParticipant,
} from "@livekit/components-react";
import { api } from "@/lib/api";
import { Hand, MicOff, Mic, UserX, Users, X, PictureInPicture2 } from "lucide-react";

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

  const moderar = async (identity: string, action: "mute" | "remove") => {
    if (action === "remove" && !confirm("¿Sacar a esta persona de la clase?")) return;
    setOcupado(identity);
    setAviso("");
    try {
      await api(`/video/sessions/${sessionId}/moderate`, {
        method: "POST", auth: true, body: { action, identity },
      });
      if (action === "mute") setAviso("Micrófono silenciado");
      if (action === "remove") setAviso("Participante retirado");
    } catch (e: any) {
      setAviso(e?.message || "No se pudo aplicar");
    } finally {
      setOcupado(null);
    }
  };

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
              {esModerador && !p.isLocal && (
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
                </div>
              )}
            </div>
          );
        })}
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
