"use client";
import React, {
  createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, useLayoutEffect,
} from "react";
import "@livekit/components-styles";
import {
  LiveKitRoom, VideoConference, useRoomContext, useLocalParticipant,
  useConnectionState, useConnectionQualityIndicator,
} from "@livekit/components-react";
import {
  ConnectionState, ConnectionQuality, DisconnectReason, MediaDeviceFailure,
  ConnectionError, RoomEvent, Track, type RoomOptions,
} from "livekit-client";
import { api, auth } from "@/lib/api";
import { aFecha, VENTANA_MIN_GRACIA } from "@/components/ClaseProfesor";
import PreEntrada, { type Eleccion, type InfoClase } from "@/components/PreEntrada";
import {
  BotonMano, PanelParticipantes, AvisoDePresencia,
  BotonCompartirPantalla,  // HOTFIX v3.9.76
} from "@/components/ClassRoomExtras";
import { accionesDirectasVista } from "@/lib/videoControles";  // HOTFIX v3.9.76
// GATE 6F-A — mano (ahora sincronizada para todos), reacciones, turno, temporizador y foco
import {
  useInteraccionClase, useReacciones, BarraClase, CapaReacciones, BotonReacciones,
  AvisoInteraccion, PanelHerramientas, FocoContexto, AplicarFoco,
  AvisoPermisos,  // GATE 6G-C
  IndicadorGrabacion,  // GATE 6H-A
} from "@/components/InteraccionClase";
// GATE 6F-B — vocabulario, frases, notas y enlaces de la clase (la base es la fuente de verdad)
import { useContenidoClase, BotonContenido, PanelContenido, IndicadorContenido } from "@/components/ContenidoClase";
import {
  Minimize2, Maximize2, PhoneOff, Users, Hand, AlertTriangle, Loader2, GripVertical,
  ZoomIn, ZoomOut, Columns2, MoreVertical, LifeBuoy, WifiOff, VideoOff, MicOff, X,
  RefreshCw, LogOut, SwitchCamera, Flag, Video, Wrench,
} from "lucide-react";

/* ------------------------------ GATE 6E — clase activa (recuperación tras recarga) */

/** Referencia MÍNIMA a la clase en la que la persona estaba conectada. Sobrevive a
 *  una recarga, a la recarga que provoca Next tras un deploy y (si el navegador
 *  conserva el almacenamiento) a cerrar y abrir la PWA. NUNCA guarda tokens ni
 *  secretos: solo qué clase, de quién, hasta cuándo y en qué modo estaba. */
const CLAVE_CLASE_ACTIVA = "dorismon_clase_activa_v1";
type ClaseActiva = {
  v: 1;
  session_id: string;
  user_id: string;
  titulo?: string;
  fin?: string | null;
  expira: number;      // ms: fin de la clase + margen de entrada (o 3 h si no se conoce)
  modo?: ModoVista;
};

function leerClaseActiva(): ClaseActiva | null {
  try {
    const crudo = localStorage.getItem(CLAVE_CLASE_ACTIVA);
    if (!crudo) return null;
    const c = JSON.parse(crudo);
    return c && c.v === 1 && c.session_id && c.user_id && typeof c.expira === "number" ? c : null;
  } catch { return null; }
}
function guardarClaseActiva(c: ClaseActiva) {
  try { localStorage.setItem(CLAVE_CLASE_ACTIVA, JSON.stringify(c)); } catch { /* sin almacenamiento */ }
}
/** Borra la referencia (si se indica la clase, solo si es esa). Se llama ante
 *  HECHOS definitivos: salida voluntaria, clase finalizada / sala cerrada,
 *  retirado, /join rechazado, vencida u otro usuario. Nunca por recargar. */
export function borrarClaseActiva(sessionId?: string) {
  try {
    if (sessionId) {
      const c = leerClaseActiva();
      if (c && c.session_id !== sessionId) return;
    }
    localStorage.removeItem(CLAVE_CLASE_ACTIVA);
  } catch { /* sin almacenamiento */ }
}
/** Vence con la ventana real de la clase: fin + el mismo margen que usa /join
 *  (VENTANA_MIN_GRACIA). Si el frontend no conoce el fin, 3 h como máximo. */
function vencimiento(fin?: string | null): number {
  const f = aFecha(fin);
  return f ? f.getTime() + VENTANA_MIN_GRACIA * 60_000 : Date.now() + 3 * 60 * 60_000;
}
/** El modo anterior solo vuelve si sigue siendo válido en este dispositivo
 *  (6D: "split" no existe en pantallas pequeñas). */
function modoValido(m?: ModoVista): ModoVista {
  if (m === "split" && typeof window !== "undefined" && window.innerWidth < 768) return "full";
  return m === "mini" || m === "split" ? m : "full";
}

/* ------------------------------------------- GATE 6D — ventana mini en móvil */

/** Márgenes seguros reales del dispositivo (notch, Dynamic Island, indicador
 *  de inicio): se leen de env(safe-area-inset-*) con un elemento invisible. */
let sondaSegura: HTMLDivElement | null = null;
function margenesSeguros() {
  if (typeof document === "undefined") return { top: 0, right: 0, bottom: 0, left: 0 };
  if (!sondaSegura) {
    sondaSegura = document.createElement("div");
    sondaSegura.setAttribute("aria-hidden", "true");
    sondaSegura.style.cssText = "position:fixed;visibility:hidden;pointer-events:none;top:0;left:0;"
      + "padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)";
    document.body.appendChild(sondaSegura);
  }
  const c = getComputedStyle(sondaSegura);
  return {
    top: parseFloat(c.paddingTop) || 0, right: parseFloat(c.paddingRight) || 0,
    bottom: parseFloat(c.paddingBottom) || 0, left: parseFloat(c.paddingLeft) || 0,
  };
}

/** Alto ocupado por la barra inferior del panel (estudiante/profesor/Dirección)
 *  cuando está visible; 0 si no hay barra (escritorio o páginas sin ella). */
function alturaBarraInferior(): number {
  const barras = Array.from(document.querySelectorAll<HTMLElement>("[data-barra-inferior]"));
  for (const b of barras) {
    const r = b.getBoundingClientRect();
    if (r.height > 0 && getComputedStyle(b).display !== "none") return Math.max(0, window.innerHeight - r.top);
  }
  return 0;
}

type Punto = { x: number; y: number };
const ESQUINA: Punto = { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY };  // abajo a la derecha

/** Deja la ventana mini dentro de la pantalla, fuera de las zonas no seguras
 *  y sin tapar la barra inferior. */
function encajarMini(p: Punto, el: HTMLElement | null): Punto {
  const w = el?.offsetWidth || 300;
  const h = el?.offsetHeight || 232;
  const s = margenesSeguros();
  const m = 8;
  const minX = m + s.left;
  const maxX = Math.max(minX, window.innerWidth - w - m - s.right);
  const minY = m + s.top;
  const maxY = Math.max(minY, window.innerHeight - h - m - Math.max(alturaBarraInferior(), s.bottom));
  return { x: Math.min(maxX, Math.max(minX, p.x)), y: Math.min(maxY, Math.max(minY, p.y)) };
}

/** GATE 6A — Opciones de la sala (versiones ya instaladas, sin tocar códec,
 *  resolución ni bitrate):
 *  - adaptiveStream: cada video se pide al tamaño en que se ve (y se pausa si
 *    no se ve), así la ventanita mini o las miniaturas no gastan como un 720p.
 *  - dynacast: si nadie mira una calidad de tu cámara, se deja de enviar.
 *  Constante fuera del componente: LiveKitRoom recrea la sala si cambian. */
const OPCIONES_SALA: RoomOptions = { adaptiveStream: true, dynacast: true };

type TipoMedio = "camara" | "microfono" | "altavoz";

/** GATE 6A — Mensaje claro, en español, cuando falla la cámara o el micrófono.
 *  Nunca obliga a salir: se puede seguir en clase sin video. */
function mensajeMedio(tipo: TipoMedio, fallo?: MediaDeviceFailure | "perdido"): string {
  if (tipo === "altavoz") return "No pudimos usar el altavoz seleccionado. Se usará el predeterminado.";
  const cam = tipo === "camara";
  switch (fallo) {
    case MediaDeviceFailure.PermissionDenied:
      return cam
        ? "No pudimos acceder a tu cámara. Puedes continuar sin video o revisar los permisos del navegador."
        : "No pudimos acceder a tu micrófono. Revisa los permisos del navegador para poder hablar en clase.";
    case MediaDeviceFailure.NotFound:
      return cam
        ? "No encontramos una cámara en este dispositivo. Puedes continuar la clase sin video."
        : "No encontramos un micrófono. Conecta uno o revisa los ajustes para poder hablar en clase.";
    case MediaDeviceFailure.DeviceInUse:
      return cam
        ? "Tu cámara está siendo usada por otra aplicación. Ciérrala y vuelve a activar la cámara."
        : "Tu micrófono está siendo usado por otra aplicación. Ciérrala y vuelve a activar el micrófono.";
    case "perdido":
      return cam
        ? "Se desconectó tu cámara. Puedes continuar sin video o conectar otra."
        : "Se desconectó tu micrófono. Conecta otro o revisa los ajustes para poder hablar en clase.";
    default:
      return cam
        ? "No pudimos encender tu cámara. Puedes continuar sin video o intentarlo de nuevo."
        : "No pudimos encender tu micrófono. Revisa los ajustes para poder hablar en clase.";
  }
}

/** GATE 6B — HECHOS de esta conexión (no tiempos ni suposiciones):
 *  - conectadaAlgunaVez: LiveKit avisó "Connected" al menos una vez.
 *  - reconectando: LiveKit avisó "Reconnecting" y todavía no "Reconnected".
 *  - salidaPedida: la persona pulsó un botón de salir (cualquiera de ellos).
 *  - errorConexion: LiveKit rechazó la conexión (onError con ConnectionError).
 *  Se reinician con cada token nuevo (cada entrada por /join). */
type Hechos = {
  conectadaAlgunaVez: boolean;
  reconectando: boolean;
  salidaPedida: boolean;
  errorConexion: boolean;
  // GATE 6G-B — la sala avisó (metadatos) que la clase se finalizó
  claseFinalizada: boolean;
};
const hechosNuevos = (): Hechos => ({
  conectadaAlgunaVez: false, reconectando: false, salidaPedida: false, errorConexion: false,
  claseFinalizada: false,
});

/** GATE 6B — Pantalla final dentro de Video Dorismon (la clase ya no desaparece). */
type Terminal = {
  tipo: "red" | "retirado" | "otro-dispositivo" | "finalizada" | "servidor"
    | "fallo-inicial" | "cerrada" | "rechazado";
  titulo: string;
  mensaje: string;
  recuperable: boolean;  // ¿se ofrece "Volver a entrar" / "Intentar de nuevo"?
};

const TERMINAL_FALLO_INICIAL: Terminal = {
  tipo: "fallo-inicial",
  titulo: "No pudimos conectar con la clase.",
  mensaje: "Revisa tu conexión a internet e inténtalo de nuevo.",
  recuperable: true,
};

/** GATE 6B — Qué pasó, usando el motivo REAL de LiveKit (enum, no números) y
 *  los hechos de la sesión. null = salida voluntaria (se cierra sin mensaje).
 *
 *  Motivos que se pueden mapear con seguridad (los envía el servidor):
 *    PARTICIPANT_REMOVED, DUPLICATE_IDENTITY, ROOM_DELETED / ROOM_CLOSED,
 *    SERVER_SHUTDOWN / MIGRATION.
 *  Motivos que NO dicen por sí solos qué pasó y se resuelven con hechos:
 *    CLIENT_INITIATED (salida pedida, abandono interno de LiveKit al conectar),
 *    undefined (LiveKit agotó los reintentos), UNKNOWN_REASON, JOIN_FAILURE,
 *    USER_REJECTED, CONNECTION_TIMEOUT, SIGNAL_CLOSE.
 *  Lo que no se puede saber se dice de forma neutra; nunca se inventa. */
function clasificarDesconexion(motivo: DisconnectReason | undefined, h: Hechos): Terminal | null {
  if (h.salidaPedida) return null;
  switch (motivo) {
    case DisconnectReason.PARTICIPANT_REMOVED:
      // GATE 6G-B — al finalizar, el backend revoca los tokens (RemoveParticipant)
      // DESPUÉS de marcar la clase como finalizada: eso no es "te retiraron".
      if (h.claseFinalizada) {
        return { tipo: "finalizada", titulo: "La clase ha finalizado.", mensaje: "La sala de esta clase se cerró.", recuperable: false };
      }
      return { tipo: "retirado", titulo: "Saliste de la clase", mensaje: "El profesor te retiró de la clase.", recuperable: false };
    case DisconnectReason.DUPLICATE_IDENTITY:
      return {
        tipo: "otro-dispositivo", titulo: "Saliste de la clase",
        mensaje: "Esta clase se abrió desde otro dispositivo. Si vuelves a entrar aquí, se cerrará en el otro.",
        recuperable: true,
      };
    case DisconnectReason.ROOM_DELETED:
    case DisconnectReason.ROOM_CLOSED:
      return { tipo: "finalizada", titulo: "La clase ha finalizado.", mensaje: "La sala de esta clase se cerró.", recuperable: false };
    case DisconnectReason.SERVER_SHUTDOWN:
    case DisconnectReason.MIGRATION:
      return {
        tipo: "servidor", titulo: "Se interrumpió el video",
        mensaje: "El servicio de video se reinició. Puedes volver a entrar a la clase.",
        recuperable: true,
      };
  }
  // Nunca llegó a conectarse y nadie pidió salir: falló la conexión inicial.
  if (!h.conectadaAlgunaVez) return TERMINAL_FALLO_INICIAL;
  // Estaba reconectando y LiveKit se rindió, o el motivo es de red.
  if (h.reconectando
    || motivo === DisconnectReason.CONNECTION_TIMEOUT
    || motivo === DisconnectReason.SIGNAL_CLOSE) {
    return {
      tipo: "red", titulo: "Se perdió la conexión con la clase.",
      mensaje: "Revisa tu conexión a internet y vuelve a entrar.", recuperable: true,
    };
  }
  // Caso indistinguible (p. ej. CLIENT_INITIATED tras estar conectada sin que
  // la persona pulsara salir): se informa sin inventar la causa.
  return {
    tipo: "cerrada", titulo: "Se cerró la conexión con la clase.",
    mensaje: "Puedes volver a entrar.", recuperable: true,
  };
}

/**
 * V3.9.28 — La clase vive POR ENCIMA de toda la plataforma.
 *
 * EL PROBLEMA QUE RESUELVE: antes la clase era una página. Si el profesor o
 * el estudiante querían ver una tarea o un quiz, tenían que salir — y salir
 * los desconectaba. Inservible en una clase real.
 *
 * CÓMO FUNCIONA AHORA: la llamada vive en una capa sobre el panel. Se puede
 * minimizar a una esquina (arrastrable) y seguir navegando: tareas, quizzes,
 * asistencia, lo que sea. LA CONEXIÓN NUNCA SE CORTA, porque el componente
 * de video no se desmonta al cambiar de página.
 */

/** V3.9.33 — Tres formas de tener la clase en pantalla:
 *  - "full":  pantalla completa, para dar clase
 *  - "split": dividida — video a un lado, plataforma al otro (para poner un
 *             quiz o revisar una tarea SIN dejar de ver a los estudiantes)
 *  - "mini":  ventanita flotante, para moverte por todo el sistema
 */
type ModoVista = "full" | "split" | "mini";

type EstadoLlamada = {
  sessionId: string;
  datos: any;
  modo: ModoVista;
  info?: InfoClase;  // GATE 6C — profesor y hora para la pantalla previa (si se conocen)
};

type CtxLlamada = {
  enLlamada: boolean;
  sessionId: string | null;
  modo: ModoVista;
  entrar: (sessionId: string, info?: InfoClase, modoInicial?: ModoVista) => void;
  salir: () => void;
  cambiarModo: (m: ModoVista) => void;
  minimizar: () => void;
  maximizar: () => void;
};

const Ctx = createContext<CtxLlamada>({
  enLlamada: false, sessionId: null, modo: "full",
  entrar: () => {}, salir: () => {}, cambiarModo: () => {},
  minimizar: () => {}, maximizar: () => {},
});

export const useLlamada = () => useContext(Ctx);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [llamada, setLlamada] = useState<EstadoLlamada | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const entrar = useCallback(async (sessionId: string, info?: InfoClase, modoInicial?: ModoVista) => {
    if (llamada?.sessionId === sessionId) {
      setLlamada((l) => (l ? { ...l, modo: "full" } : l));
      return;
    }
    setCargando(true);
    setError("");
    try {
      const datos = await api(`/video/sessions/${sessionId}/join`, { method: "POST", auth: true });
      // GATE 6E — al volver tras una recarga se restaura el modo anterior (si
      // es válido aquí). La pantalla previa (6C) se ve igual primero.
      setLlamada({ sessionId, datos, modo: modoValido(modoInicial), info });
    } catch (e: any) {
      // GATE 6E — si el backend rechaza (finalizada, cancelada, no autorizado,
      // fuera de ventana) la referencia guardada de ESA clase ya no sirve.
      // Un fallo de red NO la borra (se podrá intentar de nuevo).
      if ([400, 403, 404].includes(e?.status)) borrarClaseActiva(sessionId);
      setError(e?.message || "No se pudo entrar a la clase");
    } finally {
      setCargando(false);
    }
  }, [llamada]);

  // Salir (cabecera, mini, "Salir" de la pantalla final, Cancelar en la
  // pantalla previa) es SIEMPRE una decisión de la persona: se borra la
  // referencia de clase activa (GATE 6E).
  const salir = useCallback(() => { borrarClaseActiva(); setLlamada(null); }, []);
  // GATE 6B — Volver a entrar / Intentar de nuevo: SIEMPRE pide permiso otra
  // vez al backend (/join), que vuelve a comprobar usuario, audiencia, ventana,
  // completed/cancelled y modalidad. Nunca se reutiliza el token viejo.
  const reentrar = useCallback(async (sessionId: string): Promise<{ ok: boolean; error?: string; esperar?: boolean }> => {
    try {
      const datos = await api(`/video/sessions/${sessionId}/join`, { method: "POST", auth: true });
      setLlamada((l) => (l && l.sessionId === sessionId ? { ...l, datos } : l));
      return { ok: true };
    } catch (e: any) {
      // GATE 6G-D — 429 = demasiados intentos seguidos: se puede volver a intentar
      return { ok: false, error: e?.message || "No se pudo volver a entrar a la clase.", esperar: e?.status === 429 };
    }
  }, []);
  const cambiarModo = useCallback((m: ModoVista) => {
    // V3.9.39 — El modo dividido NO existe en celular: no cabe y dejaba al
    // usuario atrapado sin ver nada. En pantalla chica se fuerza a completa.
    const esChica = typeof window !== "undefined" && window.innerWidth < 768;
    const destino = (m === "split" && esChica) ? "full" : m;
    setLlamada((l) => (l ? { ...l, modo: destino } : l));
  }, []);
  const minimizar = useCallback(() => cambiarModo("mini"), [cambiarModo]);
  const maximizar = useCallback(() => cambiarModo("full"), [cambiarModo]);

  // Si llegamos desde un enlace directo /clase/{id}, abrir esa clase
  useEffect(() => {
    try {
      const pendiente = sessionStorage.getItem("dorismon_abrir_clase");
      if (pendiente) {
        sessionStorage.removeItem("dorismon_abrir_clase");
        entrar(pendiente);
      }
    } catch { /* modo privado del navegador */ }
    // solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // V3.9.39 — Si giran el teléfono o achican la ventana estando en modo
  // dividido, se vuelve a pantalla completa para que no quede roto.
  useEffect(() => {
    if (llamada?.modo !== "split") return;
    const alCambiar = () => {
      if (window.innerWidth < 768) {
        setLlamada((l) => (l ? { ...l, modo: "full" } : l));
      }
    };
    window.addEventListener("resize", alCambiar);
    return () => window.removeEventListener("resize", alCambiar);
  }, [llamada?.modo]);

  // GATE 6E — ¿Estaba en una clase antes de recargar / reabrir la app? Solo se
  // ofrece (no se entra solo, no se llama a /join para comprobarla: /join crea
  // presencia). Debe ser del MISMO usuario y no estar vencida.
  const [recuperable, setRecuperable] = useState<ClaseActiva | null>(null);
  useEffect(() => {
    if (llamada) { setRecuperable(null); return; }
    const c = leerClaseActiva();
    if (!c) { setRecuperable(null); return; }
    if (Date.now() > c.expira) { borrarClaseActiva(); setRecuperable(null); return; }
    let vivo = true;
    auth.me().then((me: any) => {
      if (!vivo) return;
      if (!me?.id || me.id !== c.user_id) { borrarClaseActiva(); setRecuperable(null); return; }
      setRecuperable(c);
    }).catch(() => { /* sin sesión: no se ofrece */ });
    return () => { vivo = false; };
  }, [llamada]);

  const volverALaClase = () => {
    const c = recuperable;
    if (!c) return;
    setRecuperable(null);
    entrar(c.session_id, { fin: c.fin ?? null }, c.modo);   // /join NUEVO → pantalla previa (OFF/OFF)
  };
  const descartarClase = () => { borrarClaseActiva(); setRecuperable(null); };

  // Avisar antes de cerrar la pestaña si hay una clase en curso
  useEffect(() => {
    if (!llamada) return;
    const aviso = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [llamada]);

  return (
    <Ctx.Provider value={{
      enLlamada: !!llamada, sessionId: llamada?.sessionId || null,
      modo: llamada?.modo || "full",
      entrar, salir, cambiarModo, minimizar, maximizar,
    }}>
      {/* V3.9.33: en modo dividido, el contenido se corre para dejar sitio
          al video. Así se ven las dos cosas a la vez, sin tapar nada. */}
      {/* V3.9.39 — El contenido se corre solo en pantalla grande. Antes se
          duplicaba y en celular quedaba oculto detrás del video. */}
      <div
        style={llamada?.modo === "split" && typeof window !== "undefined" && window.innerWidth >= 768
          ? { marginRight: "min(42vw, 560px)", transition: "margin 0.2s" }
          : undefined}
      >
        {children}
      </div>

      {cargando && (
        <div className="fixed inset-0 z-[100] bg-[#0F1729]/95 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 text-white/70 animate-spin" />
          <p className="text-white/70 text-sm">Preparando tu clase...</p>
        </div>
      )}

      {error && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h2 className="font-bold text-slate-800 mb-2">No pudiste entrar</h2>
            <p className="text-sm text-slate-600 mb-5 leading-relaxed">{error}</p>
            <button
              onClick={() => setError("")}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl w-full"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {recuperable && !llamada && !cargando && !error && (
        <div
          className="fixed z-[60] left-4 right-4 bottom-20 lg:bottom-4 lg:right-auto lg:max-w-sm"
          role="status"
          aria-live="polite"
          data-clase-recuperable=""
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 text-sm">
            <p className="font-bold text-slate-900 flex items-center gap-2">
              <Video className="w-4 h-4 text-brand-600 flex-shrink-0" />
              Estabas en una clase.
            </p>
            {recuperable.titulo && <p className="text-slate-500 text-xs mt-1 truncate">{recuperable.titulo}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={descartarClase} className="flex-1 min-h-[44px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">
                Descartar
              </button>
              <button onClick={volverALaClase} className="flex-[2] min-h-[44px] rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold">
                Volver a la clase
              </button>
            </div>
          </div>
        </div>
      )}

      {llamada && (
        <CapaDeLlamada
          key={llamada.sessionId}
          estado={llamada}
          onSalir={salir}
          onReentrar={reentrar}
          onModo={cambiarModo}
        />
      )}
    </Ctx.Provider>
  );
}

/* -------------------------------------------------------------- La capa */

function CapaDeLlamada({
  estado, onSalir, onReentrar, onModo,
}: {
  estado: EstadoLlamada;
  onSalir: () => void;
  onReentrar: (sessionId: string) => Promise<{ ok: boolean; error?: string; esperar?: boolean }>;
  onModo: (m: ModoVista) => void;
}) {
  const { datos, sessionId, modo } = estado;

  // GATE 6B — Estado explícito de la conexión. Mientras LiveKit reconecta, la
  // sala sigue montada (misma Room, mismo token, sin /join). Solo una
  // desconexión DEFINITIVA lleva a la pantalla final, dentro de la capa.
  const hechos = useRef<Hechos>(hechosNuevos());
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [reentrando, setReentrando] = useState(false);

  // GATE 6C — Primero la pantalla previa: la sala NO se monta hasta que la
  // persona decide cámara y micrófono (ambos apagados por defecto) y pulsa
  // "Entrar a la clase". Cada entrada (y cada "Volver a entrar") empieza aquí.
  const [eleccion, setEleccion] = useState<Eleccion | null>(null);
  const opcionVideo = useMemo(
    () => (eleccion?.camara ? (eleccion.camaraId ? { deviceId: eleccion.camaraId } : true) : false),
    [eleccion],
  );
  const opcionAudio = useMemo(
    () => (eleccion?.microfono ? (eleccion.microfonoId ? { deviceId: eleccion.microfonoId } : true) : false),
    [eleccion],
  );

  const marcarSalida = useCallback(() => { hechos.current.salidaPedida = true; }, []);
  const marcarClaseFinalizada = useCallback(() => { hechos.current.claseFinalizada = true; }, []);
  // GATE 6G-D — demasiados intentos seguidos: aviso breve y se puede reintentar
  const terminalEspera = (mensaje?: string): Terminal => ({
    tipo: "red", titulo: "Espera un momento",
    mensaje: mensaje || "Has realizado demasiadas acciones en poco tiempo. Espera unos segundos e inténtalo de nuevo.",
    recuperable: true,
  });

  // Cada entrada (token) tiene sus propios avisos: si una sala ANTERIOR avisa
  // tarde (error o desconexión), no se confunde con la entrada actual.
  const tokenVigente = useRef(datos.token);
  tokenVigente.current = datos.token;
  const token = datos.token;

  const alConectarse = useCallback(() => {
    if (tokenVigente.current !== token) return;
    hechos.current.conectadaAlgunaVez = true;
    hechos.current.reconectando = false;
  }, [token]);

  const alDesconectarse = useCallback((motivo?: DisconnectReason) => {
    if (tokenVigente.current !== token) return;
    const t = clasificarDesconexion(motivo, hechos.current);
    if (!t) { onSalir(); return; }   // salida voluntaria: se cierra normal
    setTerminal((prev) => prev ?? t);
  }, [onSalir, token]);

  // onError de LiveKitRoom: si LiveKit RECHAZÓ la conexión (ConnectionError)
  // antes de conectarse, es un fallo de conexión inicial demostrado. Los
  // errores de cámara/micrófono no son ConnectionError (los maneja 6A).
  const alFallarConexion = useCallback((e: Error) => {
    if (tokenVigente.current !== token) return;
    if (!(e instanceof ConnectionError)) return;
    hechos.current.errorConexion = true;
    if (hechos.current.salidaPedida || hechos.current.conectadaAlgunaVez) return;
    setTerminal((prev) => prev ?? TERMINAL_FALLO_INICIAL);
  }, [token]);

  // GATE 6E — hechos definitivos: la referencia de clase activa ya no sirve
  useEffect(() => {
    if (terminal && ["finalizada", "retirado", "rechazado"].includes(terminal.tipo)) borrarClaseActiva(sessionId);
  }, [terminal, sessionId]);

  // GATE 6E — "Finalizar clase para todos" (lo confirma el backend). La sala se
  // cierra en el servidor; aquí se muestra el final sin esperar al evento.
  const alFinalizarParaTodos = useCallback((videoRoom: string) => {
    borrarClaseActiva(sessionId);
    setTerminal({
      tipo: "finalizada",
      titulo: "La clase ha finalizado.",
      mensaje: videoRoom === "error"
        ? "La clase se finalizó en Dorismon, pero hubo un problema cerrando la sala de video. Quien siga conectado no podrá volver a entrar."
        : videoRoom === "ya_finalizada"   // GATE 6G-D — otra petición ya la había finalizado
          ? "La clase ya estaba finalizada."
          : "Finalizaste la clase para todos.",
      recuperable: false,
    });
  }, [sessionId]);

  // GATE 6G-B — El token vive poco (min(fin + 15 min, ahora + 30 min)) y LiveKit
  // solo lo mira al CONECTAR. Si la persona se quedó en la pantalla previa y al
  // token le quedan menos de 20 s, se pide uno NUEVO a /join antes de conectar
  // (nunca se conecta con un token vencido). Tiempo medido con reloj monotónico.
  const tokenPedidoEn = useRef(performance.now());
  useEffect(() => { tokenPedidoEn.current = performance.now(); }, [datos.token]);
  const [preparando, setPreparando] = useState(false);
  const entrarDesdePrevia = useCallback(async (e: Eleccion) => {
    const vida = typeof datos.expires_in === "number" ? datos.expires_in * 1000 : Infinity;
    if (performance.now() - tokenPedidoEn.current > vida - 20_000) {
      setPreparando(true);
      const r = await onReentrar(sessionId);
      setPreparando(false);
      if (!r.ok) {
        setTerminal(r.esperar ? terminalEspera(r.error) : {
          tipo: "rechazado", titulo: "No pudiste entrar",
          mensaje: r.error || "No se pudo entrar a la clase.", recuperable: false,
        });
        return;
      }
    }
    setEleccion(e);
  }, [datos.expires_in, onReentrar, sessionId]);

  const volverAEntrar = useCallback(async () => {
    setReentrando(true);
    const r = await onReentrar(sessionId);
    setReentrando(false);
    if (r.ok) {
      hechos.current = hechosNuevos();
      setAvisosMedios({});
      setEleccion(null);   // GATE 6C — de vuelta a la pantalla previa (todo apagado)
      setTerminal(null);
    } else {
      setTerminal(r.esperar ? terminalEspera(r.error) : {
        tipo: "rechazado", titulo: "No pudiste volver a entrar",
        mensaje: r.error || "No se pudo volver a entrar a la clase.", recuperable: false,
      });
    }
  }, [onReentrar, sessionId]);
  // GATE 6A — avisos de cámara/micrófono (uno por tipo; el nuevo reemplaza)
  const [avisosMedios, setAvisosMedios] = useState<Partial<Record<TipoMedio, string>>>({});
  const avisarMedio = useCallback((tipo: TipoMedio, fallo?: MediaDeviceFailure | "perdido") => {
    setAvisosMedios((a) => ({ ...a, [tipo]: mensajeMedio(tipo, fallo) }));
  }, []);
  const quitarAvisoMedio = useCallback((tipo: TipoMedio) => {
    setAvisosMedios((a) => { const n = { ...a }; delete n[tipo]; return n; });
  }, []);
  const alFallarDispositivo = useCallback((fallo?: MediaDeviceFailure, kind?: MediaDeviceKind) => {
    avisarMedio(kind === "videoinput" ? "camara" : kind === "audiooutput" ? "altavoz" : "microfono", fallo);
  }, [avisarMedio]);
  // GATE 6C — La pantalla previa siempre se ve completa (necesita espacio para
  // la vista de la cámara); al entrar, la clase vuelve al modo que tenía.
  const enPrevia = !terminal && !eleccion;
  const vista: ModoVista = enPrevia ? "full" : modo;
  const minimizada = vista === "mini";
  // GATE 6D — Ventana mini: posición (izquierda/arriba) siempre encajada en la
  // pantalla, fuera de zonas no seguras y SIN tapar la barra inferior. Se mueve
  // con Pointer Events (dedo y ratón). Moverla no toca la sala.
  const capaRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Punto | null>(null);
  const arrastre = useRef<{ id: number; dx: number; dy: number } | null>(null);
  const reencajar = useCallback(() => setPos((p) => encajarMini(p ?? ESQUINA, capaRef.current)), []);

  useLayoutEffect(() => {
    if (minimizada) reencajar();
  }, [minimizada, reencajar]);

  // Girar el teléfono, cambiar el tamaño o que la ventanita crezca (avisos):
  // se vuelve a encajar.
  useEffect(() => {
    if (!minimizada) return;
    window.addEventListener("resize", reencajar);
    window.addEventListener("orientationchange", reencajar);
    window.visualViewport?.addEventListener("resize", reencajar);
    const ro = typeof ResizeObserver !== "undefined" && capaRef.current ? new ResizeObserver(reencajar) : null;
    if (ro && capaRef.current) ro.observe(capaRef.current);
    return () => {
      window.removeEventListener("resize", reencajar);
      window.removeEventListener("orientationchange", reencajar);
      window.visualViewport?.removeEventListener("resize", reencajar);
      ro?.disconnect();
    };
  }, [minimizada, reencajar]);

  const arrastrar = useMemo(() => ({
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const r = capaRef.current?.getBoundingClientRect();
      if (!r) return;
      arrastre.current = { id: e.pointerId, dx: e.clientX - r.left, dy: e.clientY - r.top };
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* puntero sintético */ }
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const a = arrastre.current;
      if (!a || a.id !== e.pointerId) return;
      setPos(encajarMini({ x: e.clientX - a.dx, y: e.clientY - a.dy }, capaRef.current));
    },
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
      if (arrastre.current?.id === e.pointerId) arrastre.current = null;
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ya liberado */ }
    },
    onPointerCancel: (e: React.PointerEvent<HTMLElement>) => {
      if (arrastre.current?.id === e.pointerId) arrastre.current = null;
    },
  }), []);

  // Si se abre un diálogo de la plataforma (fixed inset-0 z-50), la ventanita
  // pasa por DEBAJO para no tapar sus botones; al cerrarlo vuelve arriba.
  const [hayDialogo, setHayDialogo] = useState(false);
  useEffect(() => {
    if (!minimizada) { setHayDialogo(false); return; }
    let pendiente = false;
    const revisar = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        pendiente = false;
        setHayDialogo(!!document.querySelector("div.fixed.inset-0.z-50"));
      });
    };
    revisar();
    const mo = new MutationObserver(revisar);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [minimizada]);

  // Teclado en el móvil (p. ej. el chat): la capa completa se ajusta a la parte
  // visible de la pantalla para que el cuadro de texto no quede tapado.
  const [areaVisible, setAreaVisible] = useState<{ top: number; height: number } | null>(null);
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (minimizada || !vv) { setAreaVisible(null); return; }
    const medir = () => {
      const teclado = vv.scale === 1 && vv.height < window.innerHeight - 80;
      setAreaVisible(teclado ? { top: vv.offsetTop, height: vv.height } : null);
    };
    medir();
    vv.addEventListener("resize", medir);
    vv.addEventListener("scroll", medir);
    return () => { vv.removeEventListener("resize", medir); vv.removeEventListener("scroll", medir); };
  }, [minimizada]);

  // Notch / Dynamic Island / indicador de inicio (full y split)
  const estiloSeguro: React.CSSProperties = {
    paddingTop: "env(safe-area-inset-top)",
    paddingBottom: "env(safe-area-inset-bottom)",
    paddingLeft: "env(safe-area-inset-left)",
    paddingRight: "env(safe-area-inset-right)",
    ...(areaVisible ? { top: areaVisible.top, height: areaVisible.height, bottom: "auto" } : {}),
  };

  return (
    <div
      ref={capaRef}
      data-capa-llamada={vista}
      className={
        vista === "mini"
          ? `ds-capa-llamada fixed ${hayDialogo ? "z-[45]" : "z-[90]"} w-[min(300px,calc(100vw-16px))] sm:w-[320px] rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-[#0F1729]`
          : vista === "split"
          // V3.9.33 — Pantalla dividida: el video ocupa la derecha y la
          // plataforma queda usable a la izquierda. En celular no cabe, así
          // que ahí se comporta como pantalla completa.
          ? "ds-capa-llamada fixed top-0 right-0 bottom-0 z-[90] w-full md:w-[min(42vw,560px)] bg-[#0F1729] flex flex-col border-l border-white/10"
          : "ds-capa-llamada fixed inset-0 z-[90] bg-[#0F1729] flex flex-col"
      }
      style={vista === "mini" ? { left: pos?.x ?? 0, top: pos?.y ?? 0, visibility: pos ? undefined : "hidden" } : estiloSeguro}
      data-lk-theme="default"
      // GATE 6B — El botón "Leave" de la barra de LiveKit también es una
      // salida voluntaria: se registra el HECHO (clic) antes de que desconecte.
      onClickCapture={(e) => {
        if ((e.target as HTMLElement).closest?.(".lk-disconnect-button")) marcarSalida();
      }}
    >
      {/* GATE 6H-A — quien entra mientras se graba lo sabe ANTES de entrar */}
      {!terminal && !eleccion && datos.grabando === true && (
        <div className="absolute top-0 inset-x-0 z-[65] bg-red-700 text-white text-sm font-semibold text-center px-3 py-2 flex items-center justify-center gap-2"
          role="status" data-aviso-grabacion-previa="">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" aria-hidden="true" />
          Esta clase está siendo grabada.
        </div>
      )}
      {/* GATE 6G-B — pidiendo un token nuevo justo antes de conectar */}
      {preparando && !terminal && (
        <div className="absolute inset-0 z-[70] bg-[#0B1220]/80 flex items-center justify-center text-white/90 text-sm gap-2" role="status" data-preparando-entrada="">
          <Loader2 className="w-4 h-4 animate-spin" /> Preparando tu entrada…
        </div>
      )}
      {terminal ? (
        <PantallaTerminal
          terminal={terminal}
          titulo={datos.title}
          compacto={minimizada}
          reentrando={reentrando}
          onReentrar={volverAEntrar}
          onSalir={onSalir}
        />
      ) : !eleccion ? (
        <PreEntrada
          titulo={datos.title}
          info={estado.info}
          onEntrar={entrarDesdePrevia}
          onCancelar={onSalir}
        />
      ) : (
      <LiveKitRoom
        // Cada token nuevo (nueva entrada por /join) es una sala nueva.
        key={datos.token}
        token={datos.token}
        serverUrl={datos.url}
        connect
        video={opcionVideo}
        audio={opcionAudio}
        options={OPCIONES_SALA}
        onConnected={alConectarse}
        onDisconnected={alDesconectarse}
        onError={alFallarConexion}
        onMediaDeviceFailure={alFallarDispositivo}
        style={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        <VigiaReconexion hechos={hechos} />
        <RegistrarClaseActiva sessionId={sessionId} titulo={datos.title} fin={estado.info?.fin} modo={modo} />
        <VigilarFinDeClase onFinalizada={marcarClaseFinalizada} />
        <AplicarAltavoz deviceId={eleccion.salidaId} />
        <ContenidoLlamada
          sessionId={sessionId}
          datos={datos}
          modo={modo}
          onSalir={onSalir}
          marcarSalida={marcarSalida}
          onFinalizada={alFinalizarParaTodos}
          onModo={onModo}
          avisosMedios={avisosMedios}
          avisarMedio={avisarMedio}
          quitarAvisoMedio={quitarAvisoMedio}
          arrastrar={arrastrar}
        />
        {/* GATE 6A — Sin <RoomAudioRenderer /> aquí: <VideoConference /> ya monta
            el suyo (el mismo componente) en full, split y mini. Con dos, cada
            voz se reproducía en DOS <audio> a la vez. */}
      </LiveKitRoom>
      )}
    </div>
  );
}

function ContenidoLlamada({
  sessionId, datos, modo, onSalir, marcarSalida, onFinalizada, onModo, arrastrar,
  avisosMedios, avisarMedio, quitarAvisoMedio,
}: any) {
  const minimizada = modo === "mini";
  // HOTFIX v3.9.76 — en "split" el panel mide ~min(42vw,560px), pero los breakpoints (sm/lg) miran
  // la ventana: la cabecera no se ajustaba y "Más opciones" quedaba fuera. En split la fila se
  // ajusta en varias líneas y "Agrandar" / "Minimizar" quedan como botones directos.
  const dividida = modo === "split";
  const room = useRoomContext();
  useDispositivoPerdido(avisarMedio);
  // GATE 6F-A — Antes la mano viajaba solo por mensajes de datos: quien entraba
  // tarde no la veía y "Bajar mano" del profesor solo cambiaba SU pantalla. Ahora
  // es un atributo de la sala que escribe el servidor (llega a todos, también tarde).
  const ix = useInteraccionClase(sessionId);
  const { manos, miMano, toggleMano, bajarMano } = ix;
  const { reacciones, reaccionar } = useReacciones();
  const [herramientas, setHerramientas] = useState(false);
  const [panel, setPanel] = useState(false);
  const cc = useContenidoClase(sessionId);            // GATE 6F-B
  const [contenido, setContenido] = useState(false);  // GATE 6F-B — panel "Contenido de la clase"
  // V3.9.28: acercar la pantalla compartida (útil en celular, donde una
  // pantalla de computadora completa se ve diminuta)
  const [acercar, setAcercar] = useState(false);
  const [menu, setMenu] = useState(false);  // V3.9.39: menú de opciones
  // GATE 6E — Finalizar clase para todos (confirmación explícita, sin doble envío)
  const [confirmarFin, setConfirmarFin] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [errorFin, setErrorFin] = useState("");
  const enviandoFin = useRef(false);
  const finalizarParaTodos = async () => {
    if (enviandoFin.current) return;
    enviandoFin.current = true;
    setFinalizando(true);
    setErrorFin("");
    try {
      const r: any = await api(`/teacher/sessions/${sessionId}/finalize`, { method: "POST", auth: true });
      setConfirmarFin(false);
      onFinalizada(r?.video_room || "no_aplica");
    } catch (e: any) {
      setErrorFin(e?.message || "No se pudo finalizar la clase.");
    } finally {
      enviandoFin.current = false;
      setFinalizando(false);
    }
  };
  const manosArriba = Object.keys(manos).length;

  const colgar = () => {
    marcarSalida();  // GATE 6B — salida voluntaria: hecho registrado antes de desconectar
    try { room.disconnect(); } catch { /* ya desconectado */ }
    onSalir();
  };

  // -------------------- Ventanita minimizada --------------------
  if (minimizada) {
    return (
      <>
        <AvisoDePresencia sessionId={sessionId} />
        <div
          {...arrastrar}
          data-arrastre-mini=""
          title="Arrastra para mover la ventana"
          className="flex items-center gap-2 px-3 min-h-[44px] bg-white/5 cursor-move select-none"
          style={{ touchAction: "none" }}
        >
          <GripVertical className="w-4 h-4 text-white/40" />
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          <p className="text-white text-xs font-semibold truncate flex-1">
            {datos.title || "Clase en curso"}
          </p>
          {manosArriba > 0 && (
            <span className="bg-amber-400 text-amber-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              ✋ {manosArriba}
            </span>
          )}
        </div>
        <EstadoConexion compacto />
        <AvisosMedios avisos={avisosMedios} onQuitar={quitarAvisoMedio} compacto />
        {/* GATE 6F-A — en la ventanita solo temporizador y turno, compactos
            (sin reacciones: no deben tapar ni bloquear la mini) */}
        <BarraClase ix={ix} compacto />
        <IndicadorGrabacion compacto />
        <AvisoPermisos compacto />
        <IndicadorContenido cc={cc} />

        {/* GATE 6D — en pantallas bajas (teléfono acostado) el video de la
            ventanita es más bajo para no ocupar casi toda la altura */}
        <div className="h-[150px] [@media(max-height:500px)]:h-[96px] relative bg-black ds-mini ds-lk-stage">
          <FocoContexto.Provider value={ix.foco}>
            <VideoConference SettingsComponent={AplicarFoco} />
          </FocoContexto.Provider>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-2 bg-white/5">
          <button
            onClick={() => onModo("split")}
            title="Ver el video al lado de la plataforma"
            className="hidden md:inline-flex flex-1 items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold min-h-[44px] rounded-lg transition"
          >
            <Columns2 className="w-3.5 h-3.5" />
            Dividir
          </button>
          <button
            onClick={() => onModo("full")}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold min-h-[44px] rounded-lg transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Agrandar
          </button>
          {/* Salir separado de "Agrandar" para no pulsarlo por error */}
          <span className="w-2 flex-shrink-0" aria-hidden="true" />
          <button
            onClick={colgar}
            className="inline-flex items-center justify-center bg-red-500/25 hover:bg-red-500/35 text-red-100 min-w-[44px] min-h-[44px] rounded-lg transition"
            aria-label="Salir de la clase"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </>
    );
  }

  // -------------------- Pantalla completa --------------------
  return (
    <>
      <AvisoDePresencia sessionId={sessionId} />

      {/* GATE 6D — En el móvil el título va en su propia línea (no lo cortan los
          botones) y los controles, de 44 px, en la siguiente. Orden de
          prioridad: estado, mano, (cambiar cámara), participantes, menú, salir. */}
      <header
        data-cabecera-modo={modo}
        className={dividida
          ? "ds-cabecera-llamada flex flex-wrap items-center justify-between px-3 py-2 border-b border-white/10 flex-shrink-0 gap-x-2 gap-y-1.5"
          : "ds-cabecera-llamada flex flex-wrap sm:flex-nowrap items-center justify-between px-3 sm:px-4 py-2 border-b border-white/10 flex-shrink-0 gap-x-2 gap-y-1.5"}
      >
        <div className={dividida
          ? "flex items-center gap-2 min-w-0 w-full"
          : "flex items-center gap-2 min-w-0 w-full sm:w-auto sm:flex-1"}>
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          <p className="text-white text-sm font-semibold leading-snug line-clamp-2 break-words" data-titulo-clase="">{datos.title}</p>
          {datos.is_moderator && (
            <span className="hidden sm:inline text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded-full flex-shrink-0">
              Moderador
            </span>
          )}
        </div>

        {/* V3.9.39 — En celular solo lo esencial: mano, participantes y salir.
            Lo demás va en un menú, para que nada quede fuera de la pantalla.
            Antes había 6 botones apretados y varios quedaban ocultos. */}
        <div className={dividida
          ? "flex flex-wrap items-center justify-end gap-1.5 w-full"
          // HOTFIX v3.9.76 (auditoría) — en el móvil la fila puede envolver: con el botón de
          // pantalla ningún control queda fuera a 320–375 px. Desde sm (640 px) sigue en una línea.
          : "flex flex-wrap sm:flex-nowrap items-center justify-end gap-1.5 flex-shrink-0 ml-auto max-w-full"}>
          {/* HOTFIX v3.9.76 — en split, volver a pantalla completa o minimizar sin depender del menú */}
          {accionesDirectasVista(modo).map((destino) => (
            <button
              key={destino}
              onClick={() => onModo(destino)}
              title={destino === "full" ? "Ver la clase en pantalla completa" : "Minimizar la clase y seguir navegando"}
              data-accion-vista={destino}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 min-h-[40px] rounded-xl transition ${
                destino === "full" ? "bg-white/15 hover:bg-white/25 text-white" : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100"
              }`}
            >
              {destino === "full" ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              <span>{destino === "full" ? "Agrandar" : "Minimizar"}</span>
            </button>
          ))}
          <BotonCompartirPantalla esModerador={!!datos.is_moderator} />
          <BotonMano miMano={miMano} onToggle={toggleMano} />
          <BotonReacciones onReaccion={reaccionar} />
          <BotonCambiarCamara />

          {/* Abre; si ya se ve (sin herramientas encima), cierra */}
          <BotonContenido cc={cc} onClick={() => { const abrir = herramientas || panel || !contenido; setHerramientas(false); setPanel(false); setContenido(abrir); }} />

          <button
            onClick={() => { setHerramientas(false); setContenido(false); setPanel((v) => !v); }}
            title="Participantes"
            className="relative inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-3 py-2 rounded-xl transition"
          >
            <Users className="w-4 h-4" />
            <span className={dividida ? "hidden" : "hidden lg:inline"}>Participantes</span>
            {manosArriba > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-amber-950 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {manosArriba}
              </span>
            )}
          </button>

          {/* Menú con el resto de opciones */}
          <div className="relative">
            <button
              onClick={() => setMenu((v) => !v)}
              title="Más opciones"
              className="inline-flex items-center bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl transition"
              aria-label="Más opciones"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} />
                <div className="absolute right-0 top-full mt-1.5 z-40 w-56 bg-[#182338] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                  <button
                    onClick={() => { setAcercar((v) => !v); setMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-white text-sm hover:bg-white/10 transition text-left"
                  >
                    {acercar ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                    {acercar ? "Alejar pantalla compartida" : "Acercar pantalla compartida"}
                  </button>

                  {/* El modo dividido solo existe en computadora */}
                  <button
                    onClick={() => { onModo(modo === "split" ? "full" : "split"); setMenu(false); }}
                    className="hidden md:flex w-full items-center gap-2.5 px-4 py-3 text-white text-sm hover:bg-white/10 transition text-left"
                  >
                    <Columns2 className="w-4 h-4" />
                    {modo === "split" ? "Ver pantalla completa" : "Ver al lado de la plataforma"}
                  </button>

                  <button
                    onClick={() => { onModo("mini"); setMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-emerald-200 text-sm hover:bg-white/10 transition text-left"
                  >
                    <Minimize2 className="w-4 h-4" />
                    Minimizar y seguir navegando
                  </button>

                  {/* GATE 6F-A — temporizador, turno y foco: solo el moderador
                      (el servidor lo valida igualmente) */}
                  {datos.is_moderator && (
                    <button
                      onClick={() => { setMenu(false); setPanel(false); setHerramientas(true); }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-white text-sm hover:bg-white/10 transition text-left border-t border-white/10"
                      data-abrir-herramientas=""
                    >
                      <Wrench className="w-4 h-4" />
                      Herramientas de clase
                    </button>
                  )}

                  {/* GATE 6E — solo quien puede finalizar (profesor de la clase o
                      Dirección = moderador); el backend decide igualmente. */}
                  {datos.is_moderator && (
                    <button
                      onClick={() => { setMenu(false); setErrorFin(""); setConfirmarFin(true); }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-red-200 text-sm hover:bg-white/10 transition text-left border-t border-white/10"
                      data-finalizar-para-todos=""
                    >
                      <Flag className="w-4 h-4" />
                      Finalizar clase para todos
                    </button>
                  )}

                  {/* Plan B a un toque, para cuando el video falla en vivo */}
                  {datos.fallback_url && (
                    <a
                      href={datos.fallback_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMenu(false)}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-amber-200 text-sm hover:bg-white/10 transition text-left border-t border-white/10"
                    >
                      <LifeBuoy className="w-4 h-4" />
                      Usar el enlace de respaldo
                    </a>
                  )}
                </div>
              </>
            )}
          </div>

          <button
            onClick={colgar}
            title="Salir de la clase"
            className="inline-flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-sm font-semibold px-3 py-2 rounded-xl transition"
          >
            <PhoneOff className="w-4 h-4" />
            <span className={dividida ? "hidden" : "hidden lg:inline"}>Salir</span>
          </button>
        </div>
      </header>

      <EstadoConexion />
      <AvisosMedios avisos={avisosMedios} onQuitar={quitarAvisoMedio} />
      <BarraClase ix={ix} />
      <IndicadorGrabacion />
      <AvisoPermisos />
      <AvisoInteraccion ix={ix} />

      {confirmarFin && (
        <div className="absolute inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" role="alertdialog" aria-modal="true" data-confirmar-finalizar="">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full text-center">
            <Flag className="w-9 h-9 text-red-500 mx-auto mb-2" />
            <h2 className="font-bold text-slate-900 mb-1">¿Finalizar la clase para todos?</h2>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Esto finalizará la clase y desconectará a todos los participantes.
            </p>
            {errorFin && <p className="text-sm text-red-600 mb-3" role="alert">{errorFin}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmarFin(false)}
                disabled={finalizando}
                className="flex-1 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={finalizarParaTodos}
                disabled={finalizando}
                className="flex-1 min-h-[44px] rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {finalizando && <Loader2 className="w-4 h-4 animate-spin" />}
                Sí, finalizar para todos
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`flex-1 min-h-0 relative ds-lk-stage ${acercar ? "ds-zoom-share" : ""}`}>
        {/* Aviso de manos levantadas para el profesor. GATE 6F-A: dentro de la zona
            de video (antes, a 64 px del borde, tapaba los botones de la cabecera
            en el teléfono, donde la cabecera ocupa dos líneas). */}
        {datos.is_moderator && manosArriba > 0 && !panel && !herramientas && (
          <button
            onClick={() => setPanel(true)}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-2 bg-amber-400 text-amber-950 text-xs font-bold px-4 py-2 rounded-full shadow-lg animate-pulse whitespace-nowrap"
            data-aviso-manos=""
          >
            <Hand className="w-3.5 h-3.5" />
            {manosArriba === 1 ? "1 estudiante levantó la mano" : `${manosArriba} levantaron la mano`}
          </button>
        )}
        <FocoContexto.Provider value={ix.foco}>
          <VideoConference SettingsComponent={AplicarFoco} />
        </FocoContexto.Provider>
        <CapaReacciones reacciones={reacciones} />
        {herramientas && datos.is_moderator && (
          <PanelHerramientas ix={ix} onClose={() => setHerramientas(false)} />
        )}
        {contenido && !herramientas && <PanelContenido cc={cc} onClose={() => setContenido(false)} />}
        {panel && (
          <PanelParticipantes
            sessionId={sessionId}
            esModerador={!!datos.is_moderator}
            manos={manos}
            bajarMano={bajarMano}
            onClose={() => setPanel(false)}
          />
        )}
      </div>

      {datos.fallback_url && datos.is_moderator && (
        <div className="px-4 py-1.5 bg-white/5 border-t border-white/10 flex-shrink-0">
          <p className="text-white/40 text-[11px] text-center">
            ¿Problemas de conexión?{" "}
            <a href={datos.fallback_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-white/70">
              Usar el enlace de respaldo
            </a>
          </p>
        </div>
      )}
    </>
  );
}

/* --------------------------------------- GATE 6A — estado de la conexión */

/** Reemplaza el aviso en inglés de LiveKit ("Connecting", "Reconnecting").
 *  Solo PRESENTACIÓN: la reconexión la sigue haciendo LiveKit por dentro. */
function EstadoConexion({ compacto = false }: { compacto?: boolean }) {
  const estado = useConnectionState();
  const room = useRoomContext();
  const { quality } = useConnectionQualityIndicator({ participant: room.localParticipant });

  let texto = "";
  let inestable = false;
  if (estado === ConnectionState.Connecting) {
    texto = "Conectando con la clase…";
  } else if (estado === ConnectionState.Reconnecting || estado === ConnectionState.SignalReconnecting) {
    texto = "Reconectando… tu clase sigue aquí.";
  } else if (estado === ConnectionState.Connected
    && (quality === ConnectionQuality.Poor || quality === ConnectionQuality.Lost)) {
    texto = "La conexión está inestable.";
    inestable = true;
  }
  if (!texto) return null;

  const tono = estado === ConnectionState.Connecting
    ? "bg-sky-500/15 text-sky-100"
    : "bg-amber-500/20 text-amber-100";

  return (
    <div
      role="status"
      aria-live="polite"
      data-estado-conexion={inestable ? "inestable" : estado}
      className={`flex items-center justify-center gap-2 flex-shrink-0 font-semibold ${tono} ${
        compacto ? "px-2 py-1 text-[11px]" : "px-4 py-1.5 text-xs"
      }`}
    >
      {inestable
        ? <WifiOff className="w-3.5 h-3.5" />
        : <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {texto}
    </div>
  );
}

/* ------------------------------- GATE 6A — avisos de cámara y micrófono */

function AvisosMedios({
  avisos, onQuitar, compacto = false,
}: {
  avisos: Partial<Record<TipoMedio, string>>;
  onQuitar: (t: TipoMedio) => void;
  compacto?: boolean;
}) {
  const tipos = Object.keys(avisos) as TipoMedio[];
  if (tipos.length === 0) return null;
  return (
    <div className="flex-shrink-0" role="alert" data-avisos-medios="">
      {tipos.map((t) => (
        <div
          key={t}
          className={`flex items-start gap-2 bg-amber-400/15 text-amber-50 border-b border-amber-300/20 ${
            compacto ? "px-2 py-1.5 text-[11px]" : "px-4 py-2 text-xs sm:text-sm"
          }`}
        >
          {t === "camara"
            ? <VideoOff className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-300" />
            : <MicOff className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-300" />}
          <p className="flex-1 leading-snug">{avisos[t]}</p>
          <button
            onClick={() => onQuitar(t)}
            aria-label="Cerrar aviso"
            className="text-amber-200/70 hover:text-white p-1 -m-1 flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Si se desconecta la cámara o el micrófono en plena clase, LiveKit intenta
 *  usar otro y, si no puede, lo silencia SIN avisar. Aquí se avisa. */
function useDispositivoPerdido(avisar: (t: TipoMedio, f: "perdido") => void) {
  const room = useRoomContext();
  useEffect(() => {
    let vivo = true;
    const revisar = async () => {
      // Darle tiempo a LiveKit para cambiar al dispositivo predeterminado
      await new Promise((r) => setTimeout(r, 1500));
      if (!vivo) return;
      let lista: MediaDeviceInfo[] = [];
      try { lista = await navigator.mediaDevices.enumerateDevices(); } catch { return; }
      const lp = room.localParticipant;
      const casos: [TipoMedio, Track.Source, MediaDeviceKind][] = [
        ["camara", Track.Source.Camera, "videoinput"],
        ["microfono", Track.Source.Microphone, "audioinput"],
      ];
      for (const [tipo, fuente, kind] of casos) {
        const pub = lp.getTrackPublication(fuente);
        if (!pub?.track) continue;  // no lo estaba usando: no hay nada que avisar
        const sinNinguno = !lista.some((d) => d.kind === kind);
        const terminado = pub.track.mediaStreamTrack?.readyState === "ended";
        if (vivo && (sinNinguno || terminado)) avisar(tipo, "perdido");
      }
    };
    room.on(RoomEvent.MediaDevicesChanged, revisar);
    return () => { vivo = false; room.off(RoomEvent.MediaDevicesChanged, revisar); };
  }, [room, avisar]);
}

/* ------------------------------------- GATE 6B — reconexión y pantalla final */

/** Escucha los eventos REALES de LiveKit para saber si la sala está
 *  reconectando. No hace nada más: la reconexión la sigue haciendo LiveKit. */
function VigiaReconexion({ hechos }: { hechos: React.MutableRefObject<Hechos> }) {
  const room = useRoomContext();
  useEffect(() => {
    const empieza = () => { hechos.current.reconectando = true; };
    const termina = () => { hechos.current.reconectando = false; };
    room
      .on(RoomEvent.Reconnecting, empieza)
      .on(RoomEvent.SignalReconnecting, empieza)
      .on(RoomEvent.Reconnected, termina);
    return () => {
      room
        .off(RoomEvent.Reconnecting, empieza)
        .off(RoomEvent.SignalReconnecting, empieza)
        .off(RoomEvent.Reconnected, termina);
    };
  }, [room, hechos]);
  return null;
}

/** La clase terminó sin que la persona saliera: se explica dentro de la capa
 *  (en el modo en que estaba) y se ofrece volver a entrar cuando tiene sentido. */
function PantallaTerminal({
  terminal, titulo, compacto, reentrando, onReentrar, onSalir,
}: {
  terminal: Terminal;
  titulo?: string;
  compacto: boolean;
  reentrando: boolean;
  onReentrar: () => void;
  onSalir: () => void;
}) {
  const etiquetaReentrar = terminal.tipo === "fallo-inicial" ? "Intentar de nuevo" : "Volver a entrar";
  return (
    <div
      className={`flex flex-col items-center justify-center text-center flex-1 ${compacto ? "p-4 gap-2" : "p-6 gap-3"}`}
      role="alertdialog"
      aria-live="assertive"
      data-terminal={terminal.tipo}
    >
      <WifiOff className={`${compacto ? "w-7 h-7" : "w-10 h-10"} text-white/50`} />
      {titulo && !compacto && <p className="text-white/50 text-xs truncate max-w-full">{titulo}</p>}
      <h2 className={`text-white font-bold ${compacto ? "text-sm" : "text-lg"}`}>{terminal.titulo}</h2>
      <p className={`text-white/70 leading-relaxed max-w-sm ${compacto ? "text-xs" : "text-sm"}`}>{terminal.mensaje}</p>
      <div className={`flex gap-2 w-full max-w-xs ${compacto ? "mt-1" : "mt-3"}`}>
        {terminal.recuperable && (
          <button
            onClick={onReentrar}
            disabled={reentrando}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition"
          >
            {reentrando ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {reentrando ? "Entrando…" : etiquetaReentrar}
          </button>
        )}
        <button
          onClick={onSalir}
          disabled={reentrando}
          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-60 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition"
        >
          <LogOut className="w-4 h-4" />
          Salir
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------- GATE 6C — altavoz elegido */

/** Si en la pantalla previa se eligió un altavoz (solo donde el navegador lo
 *  permite), la sala lo usa. Las opciones de la sala (6A) no cambian. */
function AplicarAltavoz({ deviceId }: { deviceId?: string }) {
  const room = useRoomContext();
  useEffect(() => {
    if (!deviceId) return;
    room.switchActiveDevice("audiooutput", deviceId).catch(() => { /* se queda el predeterminado */ });
  }, [room, deviceId]);
  return null;
}

/* ------------------------------------- GATE 6D — cambiar de cámara (móvil) */

/** Solo si la cámara está encendida y el navegador enumera MÁS de una cámara.
 *  Pasa a la siguiente de la lista real (no se suponen nombres "frontal" /
 *  "trasera"). enumerateDevices no pide permisos: la cámara ya está en uso. */
function BotonCambiarCamara() {
  const room = useRoomContext();
  const { isCameraEnabled } = useLocalParticipant();
  const [camaras, setCamaras] = useState<MediaDeviceInfo[]>([]);
  const [cambiando, setCambiando] = useState(false);

  useEffect(() => {
    if (!isCameraEnabled) { setCamaras([]); return; }
    let vivo = true;
    const leer = () => navigator.mediaDevices?.enumerateDevices()
      .then((d) => { if (vivo) setCamaras(d.filter((x) => x.kind === "videoinput" && x.deviceId)); })
      .catch(() => {});
    leer();
    navigator.mediaDevices?.addEventListener?.("devicechange", leer);
    return () => { vivo = false; navigator.mediaDevices?.removeEventListener?.("devicechange", leer); };
  }, [isCameraEnabled]);

  if (!isCameraEnabled || camaras.length < 2) return null;

  const cambiar = async () => {
    setCambiando(true);
    try {
      // La cámara REAL en uso (si LiveKit dice "default", se mira la pista)
      const enUso = room.localParticipant.getTrackPublication(Track.Source.Camera)
        ?.track?.mediaStreamTrack?.getSettings?.().deviceId;
      const actual = enUso || room.getActiveDevice("videoinput");
      const i = camaras.findIndex((c) => c.deviceId === actual);
      const siguiente = camaras[(i + 1) % camaras.length];
      await room.switchActiveDevice("videoinput", siguiente.deviceId);
    } catch { /* se queda la cámara actual */ }
    setCambiando(false);
  };

  return (
    <button
      onClick={cambiar}
      disabled={cambiando}
      title="Cambiar de cámara"
      aria-label="Cambiar de cámara"
      data-cambiar-camara=""
      className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 disabled:opacity-60 text-white rounded-xl transition"
    >
      <SwitchCamera className="w-4 h-4" />
    </button>
  );
}

/* ------------------------------ GATE 6E — guardar la clase activa al conectar */

/** Solo cuando la sala llega DE VERDAD a "Connected" se guarda la referencia
 *  (con el usuario real: la identidad de LiveKit es el id del usuario). */
/** GATE 6G-B — Si los metadatos de la sala dicen "finalizada" (lo marca el backend
 *  antes de revocar tokens y cerrar la sala), la desconexión que sigue es el fin de
 *  la clase, no una expulsión. Solo lectura: no cambia nada de la sala. */
function VigilarFinDeClase({ onFinalizada }: { onFinalizada: () => void }) {
  const room = useRoomContext();
  useEffect(() => {
    const revisar = () => {
      try {
        if (JSON.parse(room.metadata || "{}")?.finalizada === true) onFinalizada();
      } catch { /* metadatos ajenos: se ignoran */ }
    };
    revisar();
    room.on(RoomEvent.RoomMetadataChanged, revisar);
    return () => { room.off(RoomEvent.RoomMetadataChanged, revisar); };
  }, [room, onFinalizada]);
  return null;
}

function RegistrarClaseActiva({ sessionId, titulo, fin, modo }: {
  sessionId: string; titulo?: string; fin?: string | null; modo: ModoVista;
}) {
  const room = useRoomContext();
  const datos = useRef({ titulo, fin, modo });
  datos.current = { titulo, fin, modo };
  useEffect(() => {
    const guardar = () => {
      const user_id = room.localParticipant?.identity;
      if (!user_id) return;
      guardarClaseActiva({
        v: 1, session_id: sessionId, user_id,
        titulo: datos.current.titulo, fin: datos.current.fin ?? null,
        expira: vencimiento(datos.current.fin), modo: datos.current.modo,
      });
    };
    if (room.state === ConnectionState.Connected) guardar();
    room.on(RoomEvent.Connected, guardar);
    return () => { room.off(RoomEvent.Connected, guardar); };
  }, [room, sessionId]);
  // Si cambia el modo después de conectar, se actualiza (solo si ya existe y es esta clase)
  useEffect(() => {
    const c = leerClaseActiva();
    if (c && c.session_id === sessionId && c.modo !== modo) guardarClaseActiva({ ...c, modo });
  }, [modo, sessionId]);
  return null;
}
