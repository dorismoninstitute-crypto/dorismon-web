"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import "@livekit/components-styles";
import {
  LiveKitRoom, VideoConference, RoomAudioRenderer, useRoomContext,
} from "@livekit/components-react";
import {
  useRaisedHands, BotonMano, PanelParticipantes,
  BotonVentanaFlotante, AvisoDePresencia,
} from "@/components/ClassRoomExtras";
import Logo from "@/components/Logo";
import { api } from "@/lib/api";
import { AlertTriangle, ArrowLeft, Loader2, Users, Hand } from "lucide-react";

/**
 * V3.9.26 — Sala de video de una clase, DENTRO de dorismon.com.
 *
 * El estudiante no descarga nada, no necesita cuenta de Google ni de Zoom, y
 * no sale de la plataforma: ve el logo de Dorismon arriba mientras da clase.
 *
 * SEGURIDAD: el permiso de entrada lo decide el servidor. Solo entran el
 * profesor de la clase, el admin, y los estudiantes que pertenecen a ella.
 * Tener el enlace no alcanza (a diferencia de un enlace de Meet).
 *
 * PLAN B: si algo falla, se muestra el enlace de respaldo de la clase para
 * que la clase pueda seguir. En un negocio en vivo eso no es opcional.
 */

/** Barra con lo que agregamos: mano, participantes y ventana flotante */
function BarraDorismon({
  sessionId, esModerador,
}: { sessionId: string; esModerador: boolean }) {
  const { manos, miMano, toggleMano, bajarMano } = useRaisedHands();
  const [panelAbierto, setPanelAbierto] = useState(false);
  const manosArriba = Object.keys(manos).length;

  return (
    <>
      <AvisoDePresencia sessionId={sessionId} />
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex gap-2 flex-wrap justify-center px-2">
        <BotonMano miMano={miMano} onToggle={toggleMano} />
        <button
          onClick={() => setPanelAbierto((v) => !v)}
          className="relative inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">Participantes</span>
          {manosArriba > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-amber-950 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {manosArriba}
            </span>
          )}
        </button>
        <BotonVentanaFlotante />
      </div>

      {/* Aviso al profesor cuando alguien levanta la mano */}
      {esModerador && manosArriba > 0 && !panelAbierto && (
        <button
          onClick={() => setPanelAbierto(true)}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-2 bg-amber-400 text-amber-950 text-xs font-bold px-4 py-2 rounded-full shadow-lg animate-pulse"
        >
          <Hand className="w-3.5 h-3.5" />
          {manosArriba === 1 ? "1 estudiante levantó la mano" : `${manosArriba} estudiantes levantaron la mano`}
        </button>
      )}

      {panelAbierto && (
        <PanelParticipantes
          sessionId={sessionId}
          esModerador={esModerador}
          manos={manos}
          bajarMano={bajarMano}
          onClose={() => setPanelAbierto(false)}
        />
      )}
    </>
  );
}

function SalidaDeLaSala({ onLeave }: { onLeave: () => void }) {
  const room = useRoomContext();
  useEffect(() => {
    const handler = () => onLeave();
    room.on("disconnected", handler);
    return () => { room.off("disconnected", handler); };
  }, [room, onLeave]);
  return null;
}

export default function ClaseVideoPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = String(params?.id || "");

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [salio, setSalio] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    api(`/video/sessions/${sessionId}/join`, { method: "POST", auth: true })
      .then(setData)
      .catch((e: any) => setError(e.message || "No se pudo entrar a la clase"));
  }, [sessionId]);

  // ---------- Error ----------
  if (error) {
    return (
      <div className="min-h-screen bg-[#0F1729] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-11 h-11 text-amber-500 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-slate-800 mb-2">No pudiste entrar a la clase</h1>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">{error}</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.back()}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition"
            >
              Volver
            </button>
            <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700 py-2">
              Ir a mi panel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Salió de la clase ----------
  if (salio) {
    return (
      <div className="min-h-screen bg-[#0F1729] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-3">👋</div>
          <h1 className="text-lg font-bold text-slate-800 mb-2">Saliste de la clase</h1>
          <p className="text-sm text-slate-600 mb-6">
            Puedes volver a entrar mientras la clase siga en curso.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { setSalio(false); location.reload(); }}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition"
            >
              Volver a entrar
            </button>
            <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700 py-2">
              Ir a mi panel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Cargando ----------
  if (!data) {
    return (
      <div className="min-h-screen bg-[#0F1729] flex flex-col items-center justify-center gap-4">
        <Logo size="lg" variant="white" asLink={false} />
        <div className="flex items-center gap-2 text-white/60 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Preparando tu clase...
        </div>
      </div>
    );
  }

  // ---------- La sala ----------
  return (
    <div className="min-h-screen bg-[#0F1729] flex flex-col" data-lk-theme="default">
      {/* Barra con la marca: el estudiante sabe que sigue en Dorismon */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Logo size="sm" variant="white" asLink={false} />
          <div className="hidden sm:block min-w-0">
            <p className="text-white text-sm font-semibold truncate">{data.title}</p>
            <p className="text-white/50 text-xs">
              {data.is_moderator ? "Eres el moderador" : "Clase en vivo"}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Salir
        </button>
      </header>

      <div className="flex-1 min-h-0">
        <LiveKitRoom
          token={data.token}
          serverUrl={data.url}
          connect
          video
          audio
          onError={(e) =>
            setError(
              `Hubo un problema con la conexión: ${e?.message || "error desconocido"}`
            )
          }
          style={{ height: "100%" }}
        >
          <div className="relative h-full">
            <VideoConference />
            <BarraDorismon sessionId={sessionId} esModerador={!!data.is_moderator} />
          </div>
          <RoomAudioRenderer />
          <SalidaDeLaSala onLeave={() => setSalio(true)} />
        </LiveKitRoom>
      </div>

      {/* Plan B siempre visible para el profesor */}
      {data.fallback_url && data.is_moderator && (
        <div className="px-4 py-2 bg-white/5 border-t border-white/10 flex-shrink-0">
          <p className="text-white/40 text-[11px] text-center">
            ¿Problemas de conexión?{" "}
            <a
              href={data.fallback_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white/70"
            >
              Usar el enlace de respaldo
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
