"use client";
import React, {
  createContext, useContext, useState, useCallback, useEffect, useRef,
} from "react";
import "@livekit/components-styles";
import {
  LiveKitRoom, VideoConference, RoomAudioRenderer, useRoomContext,
} from "@livekit/components-react";
import { api } from "@/lib/api";
import {
  useRaisedHands, BotonMano, PanelParticipantes, AvisoDePresencia,
} from "@/components/ClassRoomExtras";
import {
  Minimize2, Maximize2, PhoneOff, Users, Hand, AlertTriangle, Loader2, GripVertical,
  ZoomIn, ZoomOut, Columns2,
} from "lucide-react";

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
};

type CtxLlamada = {
  enLlamada: boolean;
  sessionId: string | null;
  modo: ModoVista;
  entrar: (sessionId: string) => void;
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

  const entrar = useCallback(async (sessionId: string) => {
    if (llamada?.sessionId === sessionId) {
      setLlamada((l) => (l ? { ...l, modo: "full" } : l));
      return;
    }
    setCargando(true);
    setError("");
    try {
      const datos = await api(`/video/sessions/${sessionId}/join`, { method: "POST", auth: true });
      setLlamada({ sessionId, datos, modo: "full" });
    } catch (e: any) {
      setError(e?.message || "No se pudo entrar a la clase");
    } finally {
      setCargando(false);
    }
  }, [llamada]);

  const salir = useCallback(() => setLlamada(null), []);
  const cambiarModo = useCallback(
    (m: ModoVista) => setLlamada((l) => (l ? { ...l, modo: m } : l)), []);
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
      <div
        style={llamada?.modo === "split"
          ? { marginRight: "min(42vw, 560px)", transition: "margin 0.2s" }
          : undefined}
        className={llamada?.modo === "split" ? "hidden md:block" : ""}
      >
        {children}
      </div>
      {llamada?.modo === "split" && <div className="md:hidden">{children}</div>}

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

      {llamada && (
        <CapaDeLlamada
          key={llamada.sessionId}
          estado={llamada}
          onSalir={salir}
          onModo={cambiarModo}
        />
      )}
    </Ctx.Provider>
  );
}

/* -------------------------------------------------------------- La capa */

function CapaDeLlamada({
  estado, onSalir, onModo,
}: {
  estado: EstadoLlamada;
  onSalir: () => void;
  onModo: (m: ModoVista) => void;
}) {
  const { datos, sessionId, modo } = estado;
  const minimizada = modo === "mini";
  const [pos, setPos] = useState({ x: 20, y: 20 });
  const arrastrando = useRef<{ dx: number; dy: number } | null>(null);

  // Arrastrar la ventanita
  useEffect(() => {
    if (!minimizada) return;
    const mover = (e: MouseEvent) => {
      if (!arrastrando.current) return;
      const x = Math.max(8, Math.min(window.innerWidth - 340, e.clientX - arrastrando.current.dx));
      const y = Math.max(8, Math.min(window.innerHeight - 240, e.clientY - arrastrando.current.dy));
      setPos({ x: window.innerWidth - x - 320, y: window.innerHeight - y - 220 });
    };
    const soltar = () => { arrastrando.current = null; };
    window.addEventListener("mousemove", mover);
    window.addEventListener("mouseup", soltar);
    return () => {
      window.removeEventListener("mousemove", mover);
      window.removeEventListener("mouseup", soltar);
    };
  }, [minimizada]);

  return (
    <div
      className={
        modo === "mini"
          ? "fixed z-[90] w-[300px] sm:w-[320px] rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-[#0F1729]"
          : modo === "split"
          // V3.9.33 — Pantalla dividida: el video ocupa la derecha y la
          // plataforma queda usable a la izquierda. En celular no cabe, así
          // que ahí se comporta como pantalla completa.
          ? "fixed top-0 right-0 bottom-0 z-[90] w-full md:w-[min(42vw,560px)] bg-[#0F1729] flex flex-col border-l border-white/10"
          : "fixed inset-0 z-[90] bg-[#0F1729] flex flex-col"
      }
      style={modo === "mini" ? { right: pos.x, bottom: pos.y } : undefined}
      data-lk-theme="default"
    >
      <LiveKitRoom
        token={datos.token}
        serverUrl={datos.url}
        connect
        video
        audio
        onDisconnected={onSalir}
        style={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        <ContenidoLlamada
          sessionId={sessionId}
          datos={datos}
          modo={modo}
          onSalir={onSalir}
          onModo={onModo}
          onEmpezarArrastre={(e) => {
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
            arrastrando.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
          }}
        />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

function ContenidoLlamada({
  sessionId, datos, modo, onSalir, onModo, onEmpezarArrastre,
}: any) {
  const minimizada = modo === "mini";
  const room = useRoomContext();
  const { manos, miMano, toggleMano, bajarMano } = useRaisedHands();
  const [panel, setPanel] = useState(false);
  // V3.9.28: acercar la pantalla compartida (útil en celular, donde una
  // pantalla de computadora completa se ve diminuta)
  const [acercar, setAcercar] = useState(false);
  const manosArriba = Object.keys(manos).length;

  const colgar = () => {
    try { room.disconnect(); } catch { /* ya desconectado */ }
    onSalir();
  };

  // -------------------- Ventanita minimizada --------------------
  if (minimizada) {
    return (
      <>
        <AvisoDePresencia sessionId={sessionId} />
        <div
          onMouseDown={onEmpezarArrastre}
          className="flex items-center gap-2 px-3 py-2 bg-white/5 cursor-move select-none"
        >
          <GripVertical className="w-3.5 h-3.5 text-white/30" />
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

        <div className="h-[150px] relative bg-black ds-mini ds-lk-stage">
          <VideoConference />
        </div>

        <div className="flex items-center gap-1.5 px-2 py-2 bg-white/5">
          <button
            onClick={() => onModo("split")}
            title="Ver el video al lado de la plataforma"
            className="hidden md:inline-flex flex-1 items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2 rounded-lg transition"
          >
            <Columns2 className="w-3.5 h-3.5" />
            Dividir
          </button>
          <button
            onClick={() => onModo("full")}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2 rounded-lg transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Agrandar
          </button>
          <button
            onClick={colgar}
            className="inline-flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-2 rounded-lg transition"
            aria-label="Salir de la clase"
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </>
    );
  }

  // -------------------- Pantalla completa --------------------
  return (
    <>
      <AvisoDePresencia sessionId={sessionId} />

      <header className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-white/10 flex-shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          <p className="text-white text-sm font-semibold truncate">{datos.title}</p>
          {datos.is_moderator && (
            <span className="hidden sm:inline text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded-full flex-shrink-0">
              Moderador
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <BotonMano miMano={miMano} onToggle={toggleMano} />
          <button
            onClick={() => setPanel((v) => !v)}
            className="relative inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-3 py-2 rounded-xl transition"
          >
            <Users className="w-4 h-4" />
            <span className="hidden md:inline">Participantes</span>
            {manosArriba > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-amber-950 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {manosArriba}
              </span>
            )}
          </button>
          <button
            onClick={() => setAcercar((v) => !v)}
            title={acercar ? "Ver la pantalla completa" : "Acercar la pantalla compartida"}
            className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition ${
              acercar ? "bg-sky-500/30 text-sky-100" : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            {acercar ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            <span className="hidden lg:inline">{acercar ? "Alejar" : "Acercar"}</span>
          </button>
          {/* V3.9.33 — Los tres modos de ver la clase */}
          <button
            onClick={() => onModo(modo === "split" ? "full" : "split")}
            title="Video al lado de la plataforma"
            className={`hidden md:inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition ${
              modo === "split"
                ? "bg-sky-500/30 text-sky-100"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <Columns2 className="w-4 h-4" />
            <span className="hidden lg:inline">Dividir</span>
          </button>
          <button
            onClick={() => onModo("mini")}
            title="Seguir en clase mientras navegas la plataforma"
            className="inline-flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-sm font-semibold px-3 py-2 rounded-xl transition"
          >
            <Minimize2 className="w-4 h-4" />
            <span className="hidden md:inline">Minimizar</span>
          </button>
          <button
            onClick={colgar}
            className="inline-flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-sm font-semibold px-3 py-2 rounded-xl transition"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden md:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Aviso de manos levantadas para el profesor */}
      {datos.is_moderator && manosArriba > 0 && !panel && (
        <button
          onClick={() => setPanel(true)}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-2 bg-amber-400 text-amber-950 text-xs font-bold px-4 py-2 rounded-full shadow-lg animate-pulse"
        >
          <Hand className="w-3.5 h-3.5" />
          {manosArriba === 1 ? "1 estudiante levantó la mano" : `${manosArriba} levantaron la mano`}
        </button>
      )}

      <div className={`flex-1 min-h-0 relative ds-lk-stage ${acercar ? "ds-zoom-share" : ""}`}>
        <VideoConference />
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
