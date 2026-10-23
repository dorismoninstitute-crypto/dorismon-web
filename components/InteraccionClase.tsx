"use client";
import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef, useMemo,
} from "react";
import { useRoomContext, useLayoutContext, useTracks, useLocalParticipantPermissions } from "@livekit/components-react";
import { RoomEvent, Track, type Participant } from "livekit-client";
import { api } from "@/lib/api";
import {
  sincronizar, horaServidor, conservarReferencia, REINTENTOS_RELOJ_MS, type Referencia,
} from "@/lib/relojClase";
import {
  Hand, Mic, Timer, Star, X, Smile, Play, Pause, RotateCcw, Square, Wrench,
} from "lucide-react";

/**
 * GATE 6F-A — Interacción para clases de idiomas.
 *
 * Dos tipos de información, a propósito separados:
 *
 *  · ESTADO ACTUAL (lo debe conocer también quien entra tarde):
 *      mano levantada  → atributo "dorismon.mano" de cada participante;
 *      turno, temporizador y foco → metadatos de la sala.
 *    Los escribe SOLO el servidor (POST /video/sessions/{id}/interaccion), que
 *    valida permisos. LiveKit los reparte a todos y los incluye al conectar, así
 *    que quien entra tarde, recarga o se reconecta los recibe sin pedir nada.
 *
 *  · EVENTOS PASAJEROS: reacciones. Van por el canal de datos de LiveKit (el
 *    mismo que ya existía) con su propio tema; el nombre se toma del remitente
 *    que certifica LiveKit, nunca del contenido del mensaje.
 *
 * Nada de esto se guarda en la base de datos, ni toca asistencia, ni avisa fuera
 * de la clase. El turno es una señal educativa: NO enciende micrófonos ni cambia
 * permisos. El foco solo dice a quién mostrar en grande: NO da permisos.
 */

export const ATRIBUTO_MANO = "dorismon.mano";
export const TEMA_REACCION = "dorismon-reaccion";
export const REACCIONES = ["👍", "👏", "❤️", "😂", "🎉"] as const;
const DURACION_REACCION_MS = 4000;
const MAX_REACCIONES_EN_PANTALLA = 6;

type Temporizador = { duracion: number; restante: number; inicio: number; pausado: boolean };
export type EstadoClase = {
  turno: string | null;
  foco: string | null;
  temporizador: Temporizador | null;
  ahora?: number;
};
const ESTADO_VACIO: EstadoClase = { turno: null, foco: null, temporizador: null };

/** Lee los metadatos de la sala. Cualquier cosa rara → estado vacío. */
export function leerEstadoClase(meta?: string | null): EstadoClase {
  if (!meta) return ESTADO_VACIO;
  try {
    const o = JSON.parse(meta);
    if (!o || typeof o !== "object") return ESTADO_VACIO;
    const id = (v: any) => (typeof v === "string" && v ? v : null);
    const t = o.temporizador;
    const temporizador = t && typeof t === "object"
      && [t.duracion, t.restante, t.inicio].every((n: any) => typeof n === "number" && isFinite(n))
      ? { duracion: t.duracion, restante: t.restante, inicio: t.inicio, pausado: !!t.pausado }
      : null;
    return {
      turno: id(o.turno), foco: id(o.foco), temporizador,
      ahora: typeof o.ahora === "number" ? o.ahora : undefined,
    };
  } catch {
    return ESTADO_VACIO;
  }
}

/** Nombre a mostrar de un participante de la sala (o null si ya no está). */
function participanteDe(room: ReturnType<typeof useRoomContext>, identity: string | null): Participant | null {
  if (!identity) return null;
  if (room.localParticipant?.identity === identity) return room.localParticipant;
  for (const p of Array.from(room.remoteParticipants.values())) if (p.identity === identity) return p;
  return null;
}
const nombreDe = (p: Participant | null) => (p ? p.name || "Participante" : "");

/* ----------------------------------------------------------- estado de la clase */

/** Toda la interacción de la llamada. Se usa UNA vez, en ContenidoLlamada, que
 *  sigue montado al pasar entre completa / dividida / mini (no se pierde nada). */
export function useInteraccionClase(sessionId: string) {
  const room = useRoomContext();
  const [version, setVersion] = useState(0);
  const refrescar = useCallback(() => setVersion((v) => v + 1), []);
  const [estado, setEstado] = useState<EstadoClase>(() => leerEstadoClase(room.metadata));
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    const alCambiarSala = (meta?: string) => setEstado(leerEstadoClase(meta));
    // Al conectar / reconectar: lo que traiga la sala (quien entra tarde)
    const releer = () => { setEstado(leerEstadoClase(room.metadata)); refrescar(); };
    releer();
    room
      .on(RoomEvent.RoomMetadataChanged, alCambiarSala)
      .on(RoomEvent.Connected, releer)
      .on(RoomEvent.Reconnected, releer)
      .on(RoomEvent.ParticipantAttributesChanged, refrescar)
      .on(RoomEvent.ParticipantConnected, refrescar)
      .on(RoomEvent.ParticipantDisconnected, refrescar)
      .on(RoomEvent.ParticipantNameChanged, refrescar);
    return () => {
      room
        .off(RoomEvent.RoomMetadataChanged, alCambiarSala)
        .off(RoomEvent.Connected, releer)
        .off(RoomEvent.Reconnected, releer)
        .off(RoomEvent.ParticipantAttributesChanged, refrescar)
        .off(RoomEvent.ParticipantConnected, refrescar)
        .off(RoomEvent.ParticipantDisconnected, refrescar)
        .off(RoomEvent.ParticipantNameChanged, refrescar);
    };
  }, [room, refrescar]);

  // El aviso de error desaparece solo
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(""), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  const enviar = useCallback(async (body: Record<string, unknown>) => {
    try {
      const r: any = await api(`/video/sessions/${sessionId}/interaccion`, {
        method: "POST", auth: true, body,
      });
      if (r?.estado) setEstado(leerEstadoClase(JSON.stringify(r.estado)));
      return true;
    } catch (e: any) {
      setAviso(e?.message || "No se pudo actualizar la clase.");
      return false;
    }
  }, [sessionId]);

  /* ---- manos (atributos) ---- */
  const yo = room.localParticipant?.identity || "";
  // Mientras se envía mi mano, se ve ya cambiada (sin esperar a LiveKit)
  const [miManoPendiente, setMiManoPendiente] = useState<boolean | null>(null);
  const enviandoMano = useRef(false);

  const manos = useMemo(() => {
    const m: Record<string, number> = {};
    const todos: Participant[] = [room.localParticipant, ...Array.from(room.remoteParticipants.values())];
    for (const p of todos) {
      const v = p?.attributes?.[ATRIBUTO_MANO];
      if (v) m[p.identity] = Number(v) || 1;
    }
    if (yo && miManoPendiente !== null) {
      if (miManoPendiente && !m[yo]) m[yo] = Date.now();
      if (!miManoPendiente) delete m[yo];
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, room, yo, miManoPendiente]);

  // Cuando llega el atributo real, deja de mandar la versión "pendiente"
  useEffect(() => { setMiManoPendiente(null); }, [version]);

  const miMano = !!manos[yo];

  const toggleMano = useCallback(async () => {
    if (enviandoMano.current) return;
    enviandoMano.current = true;
    const arriba = !miMano;
    setMiManoPendiente(arriba);
    const ok = await enviar({ accion: "mano", arriba });
    // Si falló, vuelve a lo real. Si salió bien, manda el atributo que llega de
    // LiveKit; por si ese aviso no llegara, lo provisional caduca en 4 s.
    if (!ok) setMiManoPendiente(null);
    else setTimeout(() => setMiManoPendiente(null), 4000);
    enviandoMano.current = false;
  }, [miMano, enviar]);

  /** Solo el profesor (lo valida el servidor): baja la mano de otra persona. */
  const bajarMano = useCallback((identity: string) => {
    void enviar({ accion: "mano", arriba: false, identity });
  }, [enviar]);

  /* ---- turno / foco / temporizador (metadatos de la sala) ---- */
  const darTurno = useCallback((identity: string | null) => enviar({ accion: "turno", identity }), [enviar]);
  const ponerFoco = useCallback((identity: string | null) => enviar({ accion: "foco", identity }), [enviar]);
  const temporizador = useCallback(
    (op: "iniciar" | "pausar" | "reanudar" | "cancelar", segundos?: number) =>
      enviar({ accion: "temporizador", op, ...(segundos ? { segundos } : {}) }),
    [enviar],
  );

  const turnoDe = participanteDe(room, estado.turno);
  const focoDe = participanteDe(room, estado.foco);
  // GATE 6F-A.1 — El tiempo restante se calcula con la HORA DEL SERVIDOR estimada
  // (lib/relojClase.ts), no con el reloj del teléfono, que puede estar adelantado o
  // atrasado. Se pide la hora unas pocas veces solo cuando hay temporizador, y otra
  // vez al reconectar o al volver a la pestaña; nunca cada segundo. Jamás se usa la
  // hora que trae un metadato de la sala (puede ser vieja).
  const referencia = useRef<Referencia | null>(null);
  const [relojListo, setRelojListo] = useState(false);
  const sincronizandoReloj = useRef(false);
  const reintentosReloj = useRef(0);
  const reintentoPendiente = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hayTemporizador = !!estado.temporizador;
  const sincronizarReloj = useCallback(async () => {
    if (sincronizandoReloj.current) return;
    sincronizandoReloj.current = true;
    try {
      const ref = await sincronizar(async () => {
        const r: any = await api("/video/hora", { auth: true });
        if (typeof r?.ahora !== "number") throw new Error("sin hora");
        return r.ahora;
      }, () => performance.now());
      // Si falla, se CONSERVA la última referencia válida (sigue con performance.now);
      // nunca se vuelve al reloj del dispositivo.
      referencia.current = conservarReferencia(referencia.current, ref);
    } finally {
      sincronizandoReloj.current = false;
      const listo = !!referencia.current;
      setRelojListo(listo);
      if (listo) {
        reintentosReloj.current = 0;
      } else if (!reintentoPendiente.current && reintentosReloj.current < REINTENTOS_RELOJ_MS.length) {
        // Aún nunca hubo hora: pocos reintentos y se para (sin sondeo continuo).
        const espera = REINTENTOS_RELOJ_MS[reintentosReloj.current++];
        reintentoPendiente.current = setTimeout(() => {
          reintentoPendiente.current = null;
          void sincronizarReloj();
        }, espera);
      }
    }
  }, []);
  useEffect(() => () => {
    if (reintentoPendiente.current) clearTimeout(reintentoPendiente.current);
  }, []);
  useEffect(() => {
    if (!hayTemporizador) return;
    if (!referencia.current) void sincronizarReloj();
    const otraVez = () => { void sincronizarReloj(); };
    const alVolver = () => { if (document.visibilityState === "visible") void sincronizarReloj(); };
    room.on(RoomEvent.Reconnected, otraVez);
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      room.off(RoomEvent.Reconnected, otraVez);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [hayTemporizador, room, sincronizarReloj]);
  const ahoraServidor = useCallback(
    // Sin hora del servidor no hay tiempo que mostrar (NaN): la interfaz enseña
    // "Sincronizando temporizador…" en vez de un tiempo posiblemente incorrecto.
    () => (referencia.current ? horaServidor(referencia.current, performance.now()) : NaN),
    [],
  );

  return {
    sessionId,   // GATE 6H-A
    yo, manos, miMano, toggleMano, bajarMano,
    estado, ahoraServidor, relojListo,
    turno: estado.turno, esMiTurno: !!estado.turno && estado.turno === yo,
    nombreTurno: nombreDe(turnoDe), turnoPresente: !!turnoDe,
    foco: focoDe ? estado.foco : null, nombreFoco: nombreDe(focoDe),
    darTurno, ponerFoco, temporizador,
    aviso, cerrarAviso: () => setAviso(""),
  };
}
export type Interaccion = ReturnType<typeof useInteraccionClase>;

/* ------------------------------------------------------------------ reacciones */

type Reaccion = { id: number; emoji: string; nombre: string };

/** Reacciones pasajeras (canal de datos). Cada cliente filtra lo que recibe:
 *  solo los emojis permitidos y como mucho 3 por persona cada 3 segundos. */
export function useReacciones() {
  const room = useRoomContext();
  const [lista, setLista] = useState<Reaccion[]>([]);
  const recientes = useRef(new Map<string, number[]>());
  const ultimoEnvio = useRef(0);
  const sig = useRef(1);

  const mostrar = useCallback((emoji: string, nombre: string, identity: string) => {
    const ahora = Date.now();
    const previas = (recientes.current.get(identity) || []).filter((t) => ahora - t < 3000);
    if (previas.length >= 3) return;
    recientes.current.set(identity, [...previas, ahora]);
    const id = sig.current++;
    setLista((l) => [...l, { id, emoji, nombre }].slice(-MAX_REACCIONES_EN_PANTALLA));
    setTimeout(() => setLista((l) => l.filter((r) => r.id !== id)), DURACION_REACCION_MS);
  }, []);

  useEffect(() => {
    const alRecibir = (payload: Uint8Array, participante?: Participant, _k?: unknown, tema?: string) => {
      if (tema !== TEMA_REACCION || !participante) return;
      try {
        const { e } = JSON.parse(new TextDecoder().decode(payload));
        if (!(REACCIONES as readonly string[]).includes(e)) return;
        mostrar(e, participante.name || "Participante", participante.identity);
      } catch { /* mensaje mal formado: se ignora */ }
    };
    room.on(RoomEvent.DataReceived, alRecibir);
    return () => { room.off(RoomEvent.DataReceived, alRecibir); };
  }, [room, mostrar]);

  const reaccionar = useCallback(async (emoji: string) => {
    if (!(REACCIONES as readonly string[]).includes(emoji)) return;
    const ahora = Date.now();
    if (ahora - ultimoEnvio.current < 700) return;
    ultimoEnvio.current = ahora;
    mostrar(emoji, "Tú", room.localParticipant?.identity || "yo");
    try {
      await room.localParticipant?.publishData(
        new TextEncoder().encode(JSON.stringify({ e: emoji })),
        { reliable: true, topic: TEMA_REACCION },
      );
    } catch { /* sin conexión: al menos se ve en mi pantalla */ }
  }, [room, mostrar]);

  return { reacciones: lista, reaccionar };
}

/* ------------------------------------------------------------ temporizador */

export function restanteMs(t: Temporizador | null, ahoraServidor: number): number {
  if (!t) return 0;
  if (t.pausado) return Math.max(0, t.restante);
  return Math.min(t.restante, Math.max(0, t.restante - (ahoraServidor - t.inicio)));
}
const mmss = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** Tiempo restante calculado EN CADA CLIENTE a partir de inicio + duración
 *  (no se envía nada cada segundo). */
export function useRestante(t: Temporizador | null, ahoraServidor: () => number) {
  const [, tic] = useState(0);
  useEffect(() => {
    if (!t || t.pausado) return;
    const i = setInterval(() => tic((x) => x + 1), 250);
    return () => clearInterval(i);
  }, [t]);
  const ahora = ahoraServidor();
  const restante = restanteMs(t, ahora);
  // Terminado hace cuánto (para dejar de mostrarlo pasado un rato)
  const terminadoHace = t && !t.pausado && restante === 0 ? ahora - (t.inicio + t.restante) : 0;
  return { restante, texto: mmss(restante), terminado: !!t && restante === 0, terminadoHace };
}

/* ---------------------------------------------------- presentación en la llamada */

/** Franja de la clase bajo la cabecera: temporizador, turno y foco. Pequeña,
 *  no tapa cámara ni controles. "Tu turno" se destaca solo para quien lo tiene. */
export function BarraClase({ ix, compacto = false }: { ix: Interaccion; compacto?: boolean }) {
  const t = ix.estado.temporizador;
  const { texto, terminado, terminadoHace } = useRestante(t, ix.ahoraServidor);
  // Hasta tener la hora del servidor (unos milisegundos) no se muestra un tiempo dudoso
  const verTemporizador = !!t && ix.relojListo && terminadoHace < 15000;
  const sincronizandoTemporizador = !!t && !ix.relojListo;
  const verTurno = !!ix.turno && ix.turnoPresente;
  if (!verTemporizador && !sincronizandoTemporizador && !verTurno && !(ix.foco && !compacto)) return null;

  const chip = compacto
    ? "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
    : "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold";

  return (
    <div
      className={`flex items-center justify-center flex-wrap gap-1.5 flex-shrink-0 ${compacto ? "px-2 py-1" : "px-3 py-1.5"} bg-white/5 border-b border-white/10`}
      data-barra-clase=""
      role="status"
      aria-live="polite"
    >
      {sincronizandoTemporizador && (
        <span className={`${chip} bg-white/10 text-white/60`} data-temporizador="sincronizando">
          <Timer className="w-3.5 h-3.5" />
          Sincronizando temporizador…
        </span>
      )}
      {verTemporizador && (
        <span
          className={`${chip} ${terminado ? "bg-red-500/25 text-red-100" : t!.pausado ? "bg-white/10 text-white/70" : "bg-sky-500/20 text-sky-100"}`}
          data-temporizador={terminado ? "terminado" : t!.pausado ? "pausado" : "corriendo"}
        >
          <Timer className="w-3.5 h-3.5" />
          <span className="tabular-nums">{terminado ? "¡Tiempo!" : texto}</span>
          {t!.pausado && !terminado && <span className="font-normal">(en pausa)</span>}
        </span>
      )}
      {verTurno && (ix.esMiTurno ? (
        <span className={`${chip} bg-emerald-400 text-emerald-950`} data-tu-turno="">
          <Mic className="w-3.5 h-3.5" />
          Tu turno para hablar
          {!compacto && <span className="font-normal hidden sm:inline">· activa tu micrófono cuando estés listo</span>}
        </span>
      ) : (
        <span className={`${chip} bg-emerald-500/15 text-emerald-100`} data-turno-de="">
          <Mic className="w-3.5 h-3.5" />
          <span className="truncate max-w-[10rem]">Turno de {ix.nombreTurno}</span>
        </span>
      ))}
      {ix.foco && !compacto && (
        <span className={`${chip} bg-amber-400/15 text-amber-100`} data-foco-de="">
          <Star className="w-3.5 h-3.5" />
          <span className="truncate max-w-[10rem]">En foco: {ix.nombreFoco}</span>
        </span>
      )}
    </div>
  );
}

/** Reacciones flotando sobre el video (abajo a la izquierda, sin tapar los
 *  controles; no captan toques). No se muestran en la ventanita mini. */
export function CapaReacciones({ reacciones }: { reacciones: Reaccion[] }) {
  if (!reacciones.length) return null;
  return (
    <div className="pointer-events-none absolute left-2 bottom-24 z-20 flex flex-col-reverse gap-1.5 max-w-[60%]" data-capa-reacciones="" aria-live="polite">
      {reacciones.map((r) => (
        <div key={r.id} className="ds-reaccion inline-flex items-center gap-1.5 bg-black/60 text-white rounded-full pl-1.5 pr-3 py-1 w-fit max-w-full" data-reaccion={r.emoji}>
          <span className="text-xl leading-none">{r.emoji}</span>
          <span className="text-xs font-semibold truncate">{r.nombre}</span>
        </div>
      ))}
    </div>
  );
}

/** Botón de reacciones (cabecera). Abre una fila de 5 emojis. */
export function BotonReacciones({ onReaccion }: { onReaccion: (e: string) => void }) {
  const [abierto, setAbierto] = useState(false);
  // La fila se coloca bajo el botón pero SIEMPRE dentro de la pantalla (a 320 px,
  // alineada al botón, se salía por la izquierda).
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const ANCHO_MENU = 5 * 44 + 4 * 4 + 12;
  const abrir = () => {
    const r = boton.current?.getBoundingClientRect();
    if (r) {
      const left = Math.min(Math.max(8, r.right - ANCHO_MENU), window.innerWidth - ANCHO_MENU - 8);
      setPos({ left: Math.max(8, left), top: r.bottom + 6 });
    }
    setAbierto((v) => !v);
  };
  return (
    <div className="relative">
      <button
        ref={boton}
        onClick={abrir}
        title="Reaccionar"
        aria-label="Reaccionar"
        aria-expanded={abierto}
        className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl transition min-h-[40px]"
        data-boton-reacciones=""
      >
        <Smile className="w-4 h-4" />
      </button>
      {abierto && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setAbierto(false)} />
          <div
            className="fixed z-40 flex gap-1 bg-[#182338] border border-white/10 rounded-xl p-1.5 shadow-2xl"
            style={pos ? { left: pos.left, top: pos.top } : { right: 8, top: 64 }}
            data-menu-reacciones=""
          >
            {REACCIONES.map((e) => (
              <button
                key={e}
                onClick={() => { onReaccion(e); setAbierto(false); }}
                className="w-11 h-11 rounded-lg hover:bg-white/10 text-2xl leading-none"
                aria-label={`Reaccionar ${e}`}
              >
                {e}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Aviso breve si el servidor rechazó / no pudo aplicar una acción. */
export function AvisoInteraccion({ ix }: { ix: Interaccion }) {
  if (!ix.aviso) return null;
  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 max-w-[90%] bg-slate-900/95 text-white text-xs px-3 py-2 rounded-xl shadow-lg flex items-center gap-2" role="alert" data-aviso-interaccion="">
      <span>{ix.aviso}</span>
      <button onClick={ix.cerrarAviso} aria-label="Cerrar" className="p-1 text-white/60 hover:text-white"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

/* --------------------------------------------- herramientas del profesor */

const DURACIONES: Array<[number, string]> = [[30, "30 s"], [60, "1 min"], [120, "2 min"], [180, "3 min"]];

/** Panel del profesor / Dirección: temporizador, turno y foco. Se abre desde el
 *  menú (no llena la cabecera). El servidor valida igualmente cada acción. */
export function PanelHerramientas({ ix, onClose }: { ix: Interaccion; onClose: () => void }) {
  const room = useRoomContext();
  const [, refrescar] = useState(0);
  useEffect(() => {
    const r = () => refrescar((x) => x + 1);
    room.on(RoomEvent.ParticipantConnected, r).on(RoomEvent.ParticipantDisconnected, r);
    return () => { room.off(RoomEvent.ParticipantConnected, r).off(RoomEvent.ParticipantDisconnected, r); };
  }, [room]);
  const [minutos, setMinutos] = useState("5");
  const [ocupado, setOcupado] = useState(false);
  const t = ix.estado.temporizador;
  const { texto, terminado } = useRestante(t, ix.ahoraServidor);

  const hacer = async (f: () => Promise<unknown>) => {
    if (ocupado) return;
    setOcupado(true);
    try { await f(); } finally { setOcupado(false); }
  };

  const participantes: Participant[] = [room.localParticipant, ...Array.from(room.remoteParticipants.values())];
  // Primero quien levantó la mano (en orden), luego el resto
  participantes.sort((a, b) => (ix.manos[a.identity] || Infinity) - (ix.manos[b.identity] || Infinity));

  const btn = "text-[11px] min-h-[36px] px-2.5 rounded-lg transition disabled:opacity-50";
  const segPersonalizados = Math.round(Number(minutos.replace(",", ".")) * 60);
  const personalizadoValido = isFinite(segPersonalizados) && segPersonalizados >= 10 && segPersonalizados <= 1800;

  return (
    <aside className="absolute right-0 top-0 bottom-0 w-full sm:w-80 bg-[#111C33] border-l border-white/10 z-30 flex flex-col" data-panel-herramientas="">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <p className="text-white font-semibold text-sm flex items-center gap-2">
          <Wrench className="w-4 h-4" /> Herramientas de clase
        </p>
        <button onClick={onClose} className="text-white/60 hover:text-white p-2" aria-label="Cerrar">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Temporizador */}
        <section className="bg-white/5 rounded-xl p-3" data-herramienta-temporizador="">
          <p className="text-white text-sm font-semibold flex items-center gap-2 mb-2">
            <Timer className="w-4 h-4" /> Temporizador
            {t && ix.relojListo && <span className="ml-auto tabular-nums text-sky-200">{terminado ? "¡Tiempo!" : texto}{t.pausado && !terminado ? " (pausa)" : ""}</span>}
            {t && !ix.relojListo && <span className="ml-auto text-white/50 text-xs font-normal">Sincronizando…</span>}
          </p>
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {DURACIONES.map(([s, etiqueta]) => (
              <button key={s} disabled={ocupado} onClick={() => hacer(() => ix.temporizador("iniciar", s))}
                className={`${btn} bg-white/10 hover:bg-white/20 text-white`}>{etiqueta}</button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 mb-2">
            <input
              type="number" min={0.5} max={30} step={0.5} inputMode="decimal"
              value={minutos} onChange={(e) => setMinutos(e.target.value)}
              className="w-16 min-h-[36px] rounded-lg bg-white/10 text-white text-sm px-2"
              aria-label="Minutos del temporizador"
            />
            <span className="text-white/60 text-xs">min</span>
            <button disabled={ocupado || !personalizadoValido} onClick={() => hacer(() => ix.temporizador("iniciar", segPersonalizados))}
              className={`${btn} bg-white/10 hover:bg-white/20 text-white ml-auto`}>Iniciar</button>
          </div>
          {t && (
            <div className="flex gap-1.5 flex-wrap">
              {!terminado && (t.pausado
                ? <button disabled={ocupado} onClick={() => hacer(() => ix.temporizador("reanudar"))} className={`${btn} bg-sky-500/20 text-sky-100 inline-flex items-center gap-1`}><Play className="w-3 h-3" /> Reanudar</button>
                : <button disabled={ocupado} onClick={() => hacer(() => ix.temporizador("pausar"))} className={`${btn} bg-white/10 text-white inline-flex items-center gap-1`}><Pause className="w-3 h-3" /> Pausar</button>)}
              <button disabled={ocupado} onClick={() => hacer(() => ix.temporizador("iniciar", Math.round(t.duracion / 1000)))} className={`${btn} bg-white/10 text-white inline-flex items-center gap-1`}><RotateCcw className="w-3 h-3" /> Reiniciar</button>
              <button disabled={ocupado} onClick={() => hacer(() => ix.temporizador("cancelar"))} className={`${btn} bg-red-500/20 text-red-100 inline-flex items-center gap-1`}><Square className="w-3 h-3" /> Quitar</button>
            </div>
          )}
        </section>

        {/* GATE 6H-A — Grabación (solo profesor / Dirección) */}
        <SeccionGrabacion sessionId={ix.sessionId} />

        {/* Turno y foco */}
        <section data-herramienta-turno-foco="">
          <p className="text-white text-sm font-semibold mb-1">Turno y foco</p>
          <p className="text-white/50 text-[11px] mb-2 leading-snug">
            El turno es solo un aviso: no enciende micrófonos. El foco muestra a esa persona en grande para todos (cada uno puede cambiar su vista).
          </p>
          <div className="space-y-1.5">
            {participantes.map((p) => {
              const mano = !!ix.manos[p.identity];
              const conTurno = ix.turno === p.identity;
              const enFoco = ix.foco === p.identity;
              return (
                <div key={p.identity} className="bg-white/5 rounded-xl p-2.5" data-fila-participante={p.identity}>
                  <div className="flex items-center gap-2 mb-1.5">
                    {mano && <Hand className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                    <p className="text-white text-sm truncate flex-1">{p.name || "Participante"}{p.isLocal ? " (tú)" : ""}</p>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <button disabled={ocupado} onClick={() => hacer(() => ix.darTurno(conTurno ? null : p.identity))}
                      className={`${btn} inline-flex items-center gap-1 ${conTurno ? "bg-emerald-400 text-emerald-950 font-bold" : "bg-emerald-500/15 text-emerald-100"}`}
                      data-dar-turno={p.identity}>
                      <Mic className="w-3 h-3" /> {conTurno ? "Quitar turno" : "Dar turno"}
                    </button>
                    <button disabled={ocupado} onClick={() => hacer(() => ix.ponerFoco(enFoco ? null : p.identity))}
                      className={`${btn} inline-flex items-center gap-1 ${enFoco ? "bg-amber-400 text-amber-950 font-bold" : "bg-amber-400/15 text-amber-100"}`}
                      data-poner-foco={p.identity}>
                      <Star className="w-3 h-3" /> {enFoco ? "Quitar foco" : "Foco para todos"}
                    </button>
                    {mano && !p.isLocal && (
                      <button disabled={ocupado} onClick={() => ix.bajarMano(p.identity)}
                        className={`${btn} bg-amber-400/20 text-amber-200`}>Bajar mano</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------- foco (spotlight) */

/** Identidad en foco que debe aplicar el video de la sala. */
export const FocoContexto = createContext<string | null>(null);

/**
 * Aplica el foco del profesor DENTRO de <VideoConference /> sin reemplazarlo:
 * se monta como su `SettingsComponent` (el único punto que LiveKit deja dentro
 * de su contexto de diseño) y usa el mismo "fijar" que el botón de cada video.
 *
 *  · Foco del profesor → todos fijan a esa persona en grande.
 *  · Fijar local (el botón de cada video) sigue siendo de cada uno: si alguien
 *    cambia su vista, no se le vuelve a imponer hasta que el profesor cambie el foco.
 *  · Compartir pantalla tiene prioridad (LiveKit la fija sola); al terminar,
 *    vuelve el foco.
 *  · Al quitar el foco se suelta, salvo que la persona haya fijado otra cosa.
 * El botón "Settings" que LiveKit añade por esto se oculta con CSS.
 */
export function AplicarFoco() {
  const foco = useContext(FocoContexto);
  const layout = useLayoutContext();
  const camaras = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], { onlySubscribed: false });
  const pantallas = useTracks([{ source: Track.Source.ScreenShare, withPlaceholder: false }], { onlySubscribed: false });
  const ref = foco ? camaras.find((c) => c.participant.identity === foco) : undefined;
  const hayPantalla = pantallas.length > 0;
  const pin = layout.pin.state?.[0];
  const clavePin = pin ? `${pin.participant.identity}:${pin.source}` : "";
  const aplicado = useRef<string | null>(null);

  useEffect(() => {
    if (!foco) {
      if (aplicado.current && pin && pin.participant.identity === aplicado.current
        && pin.source === Track.Source.Camera) {
        layout.pin.dispatch?.({ msg: "clear_pin" });
      }
      aplicado.current = null;
      return;
    }
    if (hayPantalla || !ref) { aplicado.current = null; return; }
    if (aplicado.current === foco) return;
    if (pin && pin.source === Track.Source.ScreenShare) return; // LiveKit la suelta enseguida
    layout.pin.dispatch?.({ msg: "set_pin", trackReference: ref });
    aplicado.current = foco;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foco, hayPantalla, !!ref, clavePin]);

  return null;
}

/* ------------------------------------------- GATE 6G-C — permisos del estudiante */

/** Explica lo que la barra de LiveKit ya hace cumplir (oculta lo no permitido):
 *  micrófono / cámara bloqueados por el profesor, y el permiso de pantalla cuando
 *  cambia. Nunca enciende nada. A profesor y Dirección no se les muestra (lo tienen todo). */
export function AvisoPermisos({ compacto = false }: { compacto?: boolean }) {
  const perm = useLocalParticipantPermissions();
  const fuentes: number[] = perm?.canPublishSources ?? [];
  // TrackSource (protocol de LiveKit): CAMERA = 1, MICROPHONE = 2, SCREEN_SHARE = 3
  const puede = (n: number) => !!perm?.canPublish && (fuentes.length === 0 || fuentes.includes(n));
  const micBloqueado = !!perm && !puede(2);
  const camBloqueada = !!perm && !puede(1);
  const pantalla = !!perm && puede(3);
  const anterior = useRef<boolean | null>(null);
  const [cambio, setCambio] = useState("");
  useEffect(() => {
    if (!perm) return;
    if (anterior.current !== null && anterior.current !== pantalla) {
      setCambio(pantalla
        ? "El profesor te permitió compartir pantalla. Usa el botón «Compartir pantalla» de la parte superior cuando quieras."
        : "El profesor retiró el permiso para compartir pantalla.");
    }
    anterior.current = pantalla;
  }, [pantalla, perm]);
  useEffect(() => {
    if (!cambio) return;
    const t = setTimeout(() => setCambio(""), 8000);
    return () => clearTimeout(t);
  }, [cambio]);

  const textos = [
    micBloqueado && "El profesor bloqueó temporalmente tu micrófono.",
    camBloqueada && "El profesor bloqueó temporalmente tu cámara.",
    !compacto && cambio,
  ].filter(Boolean) as string[];
  if (!textos.length) return null;
  return (
    <div className={`flex flex-col items-center gap-0.5 flex-shrink-0 bg-amber-500/15 text-amber-100 font-semibold ${compacto ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs"}`}
      role="status" aria-live="polite" data-aviso-permisos="">
      {textos.map((t) => <span key={t} className="text-center">{t}</span>)}
    </div>
  );
}

/* ------------------------------------------------------ GATE 6H-A — grabación */

/** ¿LiveKit está grabando ESTA sala? Viene del propio servidor (room.activeRecording):
 *  lo recibe quien entra tarde, quien se reconecta y quien vuelve (6E) sin pedirlo.
 *  Nunca se muestra "Grabando" solo porque alguien pulsó un botón. */
export function useSalaGrabando() {
  const room = useRoomContext();
  const [grabando, setGrabando] = useState<boolean>(room.isRecording);
  useEffect(() => {
    const actualizar = () => setGrabando(room.isRecording);
    actualizar();
    room.on(RoomEvent.RecordingStatusChanged, actualizar)
      .on(RoomEvent.Connected, actualizar)
      .on(RoomEvent.Reconnected, actualizar);
    return () => {
      room.off(RoomEvent.RecordingStatusChanged, actualizar)
        .off(RoomEvent.Connected, actualizar)
        .off(RoomEvent.Reconnected, actualizar);
    };
  }, [room]);
  return grabando;
}

/** Indicador para TODOS (completa, dividida, mini y móvil). No capta toques. Al empezar
 *  una grabación con gente dentro, el aviso se ve ampliado unos segundos. */
export function IndicadorGrabacion({ compacto = false }: { compacto?: boolean }) {
  const grabando = useSalaGrabando();
  const [recien, setRecien] = useState(false);
  const antes = useRef<boolean | null>(null);
  useEffect(() => {
    if (antes.current === false && grabando) {
      setRecien(true);
      const t = setTimeout(() => setRecien(false), 10_000);
      antes.current = grabando;
      return () => clearTimeout(t);
    }
    antes.current = grabando;
  }, [grabando]);
  if (!grabando) return null;
  return (
    <div className={`flex items-center justify-center gap-1.5 flex-shrink-0 bg-red-600/25 text-red-100 font-bold pointer-events-none ${compacto ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs"}`}
      role="status" aria-live="polite" data-indicador-grabacion="">
      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
      {recien && !compacto ? "Esta clase está siendo grabada." : "Grabando"}
    </div>
  );
}

type EstadoGrabacion = {
  grabacion: null | { estado: string; inicio?: string | null; duracion_segundos?: number | null; error?: string | null };
  almacenamiento_listo: boolean;
};
const TEXTO_ESTADO: Record<string, string> = {
  starting: "Iniciando…", recording: "Grabando", stopping: "Deteniendo…", processing: "Procesando el archivo…",
  ready: "Grabación lista", failed: "La grabación falló",
};

/** Controles del profesor / Dirección. El estado viene del backend (que lo reconcilia con
 *  LiveKit); nunca se finge: un botón a la vez, según el estado real. */
function SeccionGrabacion({ sessionId }: { sessionId: string }) {
  const [estado, setEstado] = useState<EstadoGrabacion | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState("");
  const cargar = useCallback(async () => {
    try { setEstado(await api(`/video/sessions/${sessionId}/grabacion`, { auth: true }) as any); } catch { /* sin estado */ }
  }, [sessionId]);
  const e = estado?.grabacion?.estado;
  const transitorio = !!e && ["starting", "stopping", "processing"].includes(e);
  useEffect(() => { void cargar(); }, [cargar]);
  useEffect(() => {
    if (!transitorio) return;
    const t = setInterval(() => { void cargar(); }, 4000);
    return () => clearInterval(t);
  }, [transitorio, cargar]);
  const accion = async (cual: "iniciar" | "detener") => {
    if (ocupado) return;
    setOcupado(true);
    setAviso("");
    try {
      await api(`/video/sessions/${sessionId}/grabacion/${cual}`, { method: "POST", auth: true });
    } catch (err: any) {
      setAviso(err?.message || "No se pudo completar la acción.");
    } finally {
      setOcupado(false);
      setConfirmar(false);
      void cargar();
    }
  };
  const activa = e === "starting" || e === "recording";
  const btn = "text-[11px] min-h-[36px] px-3 rounded-lg transition disabled:opacity-50";
  return (
    <section className="bg-white/5 rounded-xl p-3" data-herramienta-grabacion="">
      <p className="text-white text-sm font-semibold flex items-center gap-2 mb-2">
        <span className={`w-2.5 h-2.5 rounded-full ${e === "recording" ? "bg-red-500 animate-pulse" : "bg-white/30"}`} />
        Grabación
        {e && <span className="ml-auto text-xs font-normal text-white/70" data-estado-grabacion={e}>{TEXTO_ESTADO[e] || e}</span>}
      </p>
      {estado && !estado.almacenamiento_listo && !activa && (
        <p className="text-amber-200/90 text-[11px] mb-2">El almacenamiento privado de grabaciones no está configurado todavía.</p>
      )}
      {e === "failed" && estado?.grabacion?.error && <p className="text-red-200 text-[11px] mb-2">{estado.grabacion.error}</p>}
      {aviso && <p className="text-amber-200 text-[11px] mb-2" role="alert">{aviso}</p>}
      {confirmar ? (
        <div className="bg-black/30 rounded-lg p-2.5" data-confirmar-grabacion="">
          <p className="text-white text-xs mb-2">Todos los participantes serán avisados de que esta clase está siendo grabada.</p>
          <div className="flex gap-1.5">
            <button onClick={() => setConfirmar(false)} disabled={ocupado} className={`${btn} bg-white/10 text-white flex-1`}>Cancelar</button>
            <button onClick={() => accion("iniciar")} disabled={ocupado} className={`${btn} bg-red-600 text-white font-bold flex-1`}>Iniciar grabación</button>
          </div>
        </div>
      ) : activa ? (
        <button onClick={() => accion("detener")} disabled={ocupado || e === "starting"} className={`${btn} bg-white/15 text-white w-full`} data-detener-grabacion="">
          Detener grabación
        </button>
      ) : (
        <button onClick={() => setConfirmar(true)} disabled={ocupado || transitorio || !estado?.almacenamiento_listo}
          className={`${btn} bg-red-600/80 hover:bg-red-600 text-white w-full`} data-iniciar-grabacion="">
          Iniciar grabación
        </button>
      )}
    </section>
  );
}
