"use client";
// ══ GATE 6C — Antes de entrar a Video Dorismon ══
//
// Nadie entra compartiendo cámara o micrófono sin haber visto y decidido qué
// comparte:
//   · cámara y micrófono empiezan APAGADOS (cada entrada igual; no se recuerda
//     la vez anterior);
//   · no se pide ningún permiso hasta que la persona enciende algo;
//   · la vista previa es local: no se publica nada porque aún no hay sala;
//   · el propio micrófono NUNCA se reproduce por los altavoces (solo un medidor);
//   · el altavoz solo se ofrece si el navegador de verdad permite elegirlo.
//
// Se construye con funciones oficiales de livekit-client (no con <PreJoin>,
// que pide nombre, está en inglés y guarda las elecciones en localStorage).
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createLocalVideoTrack, createLocalAudioTrack, createAudioAnalyser,
  supportsAudioOutputSelection, MediaDeviceFailure,
  type LocalVideoTrack, type LocalAudioTrack,
} from "livekit-client";
import { Video, VideoOff, Mic, MicOff, Volume2, LogIn, X, Loader2, AlertTriangle } from "lucide-react";
// Misma hora que muestra la tarjeta de la clase (los *_utc sin zona = UTC).
import { rangoHora } from "@/components/ClaseProfesor";

export type Eleccion = {
  camara: boolean;
  microfono: boolean;
  camaraId?: string;
  microfonoId?: string;
  salidaId?: string;
};

export type InfoClase = {
  profesor?: string | null;
  inicio?: string | null;
  fin?: string | null;
};

type Lista = { videoinput: MediaDeviceInfo[]; audioinput: MediaDeviceInfo[]; audiooutput: MediaDeviceInfo[] };

function mensajeCamara(e: unknown): string {
  const f = MediaDeviceFailure.getFailure(e);
  if (f === MediaDeviceFailure.NotFound) return "No encontramos una cámara en este dispositivo. Puedes entrar sin video.";
  if (f === MediaDeviceFailure.DeviceInUse) return "Tu cámara está siendo usada por otra aplicación. Ciérrala o entra sin video.";
  return "No pudimos acceder a tu cámara. Puedes entrar sin video.";
}

function mensajeMicrofono(e: unknown): string {
  const f = MediaDeviceFailure.getFailure(e);
  if (f === MediaDeviceFailure.NotFound) return "No encontramos un micrófono. Podrás escuchar la clase, pero no hablar.";
  if (f === MediaDeviceFailure.DeviceInUse) return "Tu micrófono está siendo usado por otra aplicación. Ciérrala si quieres hablar.";
  return "No pudimos acceder a tu micrófono. Revisa el permiso antes de entrar si quieres hablar.";
}


/** Tono corto (440 Hz) para probar el altavoz elegido. No usa el micrófono. */
function tonoDePrueba(): string {
  const sr = 22050, seg = 0.6, n = Math.floor(sr * seg);
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const txt = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  txt(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); txt(8, "WAVE"); txt(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  txt(36, "data"); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const env = Math.min(1, i / 800, (n - i) / 800);
    v.setInt16(44 + i * 2, Math.sin((2 * Math.PI * 440 * i) / sr) * 0.25 * env * 32767, true);
  }
  let bin = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return "data:audio/wav;base64," + btoa(bin);
}

export default function PreEntrada({
  titulo, info, onEntrar, onCancelar,
}: {
  titulo?: string;
  info?: InfoClase;
  onEntrar: (e: Eleccion) => void;
  onCancelar: () => void;
}) {
  const [lista, setLista] = useState<Lista>({ videoinput: [], audioinput: [], audiooutput: [] });
  const [listaLista, setListaLista] = useState(false);
  const [cam, setCam] = useState<LocalVideoTrack | null>(null);
  const [mic, setMic] = useState<LocalAudioTrack | null>(null);
  const [camId, setCamId] = useState("");
  const [micId, setMicId] = useState("");
  const [salidaId, setSalidaId] = useState("");
  const [abriendo, setAbriendo] = useState<"" | "camara" | "microfono">("");
  const [errCam, setErrCam] = useState("");
  const [errMic, setErrMic] = useState("");
  const [nivel, setNivel] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pistas = useRef<{ cam: LocalVideoTrack | null; mic: LocalAudioTrack | null }>({ cam: null, mic: null });
  pistas.current = { cam, mic };
  const salidaSoportada = typeof window !== "undefined" && supportsAudioOutputSelection();

  // Lista de dispositivos SIN pedir permiso (antes del permiso no hay nombres).
  const leerDispositivos = useCallback(async () => {
    try {
      const d = await navigator.mediaDevices.enumerateDevices();
      setLista({
        videoinput: d.filter((x) => x.kind === "videoinput"),
        audioinput: d.filter((x) => x.kind === "audioinput"),
        audiooutput: d.filter((x) => x.kind === "audiooutput"),
      });
    } catch { /* sin acceso a la lista: se intentará al encender */ }
    setListaLista(true);
  }, []);

  useEffect(() => {
    leerDispositivos();
    const md = navigator.mediaDevices;
    md?.addEventListener?.("devicechange", leerDispositivos);
    return () => md?.removeEventListener?.("devicechange", leerDispositivos);
  }, [leerDispositivos]);

  // Al salir de esta pantalla (entrar, cancelar o cerrar) se liberan las pistas.
  useEffect(() => () => {
    pistas.current.cam?.stop();
    pistas.current.mic?.stop();
  }, []);

  // Vista previa de la cámara
  useEffect(() => {
    const el = videoRef.current;
    if (!cam || !el) return;
    cam.attach(el);
    return () => { cam.detach(el); };
  }, [cam]);

  // Medidor del micrófono (solo se MIDE; nunca se reproduce)
  useEffect(() => {
    if (!mic) { setNivel(0); return; }
    const { calculateVolume, cleanup } = createAudioAnalyser(mic, { cloneTrack: true });
    const t = setInterval(() => setNivel(Math.min(1, calculateVolume() * 4)), 100);
    return () => { clearInterval(t); cleanup(); };
  }, [mic]);

  const encenderCamara = async () => {
    setErrCam(""); setAbriendo("camara");
    try {
      const t = await createLocalVideoTrack(camId ? { deviceId: camId } : undefined);
      setCam(t);
      const id = await t.getDeviceId();
      if (id) setCamId(id);
      leerDispositivos();
    } catch (e) {
      setErrCam(mensajeCamara(e));
    } finally { setAbriendo(""); }
  };
  const apagarCamara = () => { cam?.stop(); setCam(null); };

  const encenderMicrofono = async () => {
    setErrMic(""); setAbriendo("microfono");
    try {
      const t = await createLocalAudioTrack(micId ? { deviceId: micId } : undefined);
      setMic(t);
      const id = await t.getDeviceId();
      if (id) setMicId(id);
      leerDispositivos();
    } catch (e) {
      setErrMic(mensajeMicrofono(e));
    } finally { setAbriendo(""); }
  };
  const apagarMicrofono = () => { mic?.stop(); setMic(null); };

  const cambiarCamara = async (id: string) => {
    setCamId(id);
    if (cam) { try { await cam.setDeviceId(id); } catch (e) { setErrCam(mensajeCamara(e)); } }
  };
  const cambiarMicrofono = async (id: string) => {
    setMicId(id);
    if (mic) { try { await mic.setDeviceId(id); } catch (e) { setErrMic(mensajeMicrofono(e)); } }
  };

  const probarSonido = async () => {
    try {
      const a = new Audio(tonoDePrueba());
      if (salidaId && (a as any).setSinkId) await (a as any).setSinkId(salidaId);
      await a.play();
    } catch { /* el navegador no permitió reproducir: no se finge */ }
  };

  const entrar = () => {
    const eleccion: Eleccion = {
      camara: !!cam, microfono: !!mic,
      camaraId: cam ? camId || undefined : undefined,
      microfonoId: mic ? micId || undefined : undefined,
      salidaId: salidaSoportada && salidaId ? salidaId : undefined,
    };
    // Las pistas de la vista previa se liberan ANTES de montar la sala: LiveKit
    // abre las suyas con la misma elección (nunca dos cámaras ni dos micrófonos).
    cam?.stop(); mic?.stop();
    pistas.current = { cam: null, mic: null };
    onEntrar(eleccion);
  };
  const cancelar = () => {
    cam?.stop(); mic?.stop();
    pistas.current = { cam: null, mic: null };
    onCancelar();
  };

  const sinCamara = listaLista && lista.videoinput.length === 0;
  const sinMicrofono = listaLista && lista.audioinput.length === 0;
  const horario = rangoHora({ starts_at_utc: info?.inicio, ends_at_utc: info?.fin });
  const nombre = (d: MediaDeviceInfo, i: number, base: string) => d.label || `${base} ${i + 1}`;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F1729]" data-prejoin="">
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 [@media(max-height:500px)]:py-2">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-5 [@media(max-height:500px)]:mb-2">
            <p className="text-white/50 text-xs uppercase tracking-wide mb-1 [@media(max-height:500px)]:hidden">Antes de entrar</p>
            <h2 className="text-white text-xl sm:text-2xl font-bold break-words">{titulo || "Clase"}</h2>
            {(info?.profesor || horario) && (
              <p className="text-white/60 text-sm mt-1" data-info-clase="">
                {info?.profesor ? `Profesor: ${info.profesor}` : ""}
                {info?.profesor && horario ? " · " : ""}
                {horario}
              </p>
            )}
          </div>

          {/* GATE 6D — teléfono acostado (pantalla baja y ancha): vista y controles
              lado a lado, para no tener que desplazarse hasta "Entrar a la clase" */}
          <div className="grid md:grid-cols-[1.4fr_1fr] [@media(max-height:500px)_and_(min-width:560px)]:grid-cols-2 gap-4">
            {/* Vista previa */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black/60 border border-white/10">
              {cam ? (
                <video ref={videoRef} muted playsInline autoPlay className="w-full h-full object-cover -scale-x-100" data-vista-previa="" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/50">
                  <VideoOff className="w-9 h-9" />
                  <p className="text-sm">Tu cámara está apagada</p>
                </div>
              )}
              <div className="absolute left-3 bottom-3 flex gap-2">
                <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${cam ? "bg-emerald-500 text-white" : "bg-white/15 text-white/80"}`} data-estado-camara={cam ? "on" : "off"}>
                  Cámara {cam ? "encendida" : "apagada"}
                </span>
                <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${mic ? "bg-emerald-500 text-white" : "bg-white/15 text-white/80"}`} data-estado-microfono={mic ? "on" : "off"}>
                  Micrófono {mic ? "encendido" : "apagado"}
                </span>
              </div>
            </div>

            {/* Controles */}
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={cam ? apagarCamara : encenderCamara}
                  disabled={abriendo !== "" || (!cam && sinCamara)}
                  aria-pressed={!!cam}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition disabled:opacity-50 ${
                    cam ? "bg-brand-600 hover:bg-brand-700 text-white" : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                  data-boton-camara=""
                >
                  {abriendo === "camara" ? <Loader2 className="w-4 h-4 animate-spin" /> : cam ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  {cam ? "Apagar cámara" : "Encender cámara"}
                </button>
                <button
                  onClick={mic ? apagarMicrofono : encenderMicrofono}
                  disabled={abriendo !== "" || (!mic && sinMicrofono)}
                  aria-pressed={!!mic}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition disabled:opacity-50 ${
                    mic ? "bg-brand-600 hover:bg-brand-700 text-white" : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                  data-boton-microfono=""
                >
                  {abriendo === "microfono" ? <Loader2 className="w-4 h-4 animate-spin" /> : mic ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  {mic ? "Apagar micrófono" : "Encender micrófono"}
                </button>
              </div>

              {/* Medidor del micrófono */}
              {mic && (
                <div className="flex items-center gap-2" aria-label="Nivel del micrófono">
                  <Mic className="w-3.5 h-3.5 text-white/60 flex-shrink-0" />
                  <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-emerald-400 transition-[width] duration-100" style={{ width: `${Math.round(nivel * 100)}%` }} data-nivel-microfono={nivel.toFixed(2)} />
                  </div>
                </div>
              )}

              {/* Avisos (no bloquean: se puede entrar igual) */}
              {(errCam || sinCamara) && (
                <p className="flex items-start gap-2 text-xs text-amber-100 bg-amber-400/15 rounded-lg px-3 py-2" role="alert" data-aviso-prejoin="camara">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-300" />
                  {errCam || "Este dispositivo no tiene cámara. Puedes entrar sin video."}
                </p>
              )}
              {(errMic || sinMicrofono) && (
                <p className="flex items-start gap-2 text-xs text-amber-100 bg-amber-400/15 rounded-lg px-3 py-2" role="alert" data-aviso-prejoin="microfono">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-300" />
                  {errMic || "No encontramos un micrófono. Podrás escuchar la clase, pero no hablar."}
                </p>
              )}

              {/* Elegir dispositivos (los nombres aparecen tras dar permiso) */}
              {lista.videoinput.length > 1 && (
                <label className="block text-xs text-white/60">
                  Cámara
                  <select value={camId} onChange={(e) => cambiarCamara(e.target.value)} className="mt-1 w-full min-h-[44px] rounded-lg bg-white/10 text-white text-base px-2 py-2 border border-white/10" data-selector="camara">
                    {!camId && <option value="">Predeterminada</option>}
                    {lista.videoinput.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId} className="text-slate-900">{nombre(d, i, "Cámara")}</option>
                    ))}
                  </select>
                </label>
              )}
              {lista.audioinput.length > 1 && (
                <label className="block text-xs text-white/60">
                  Micrófono
                  <select value={micId} onChange={(e) => cambiarMicrofono(e.target.value)} className="mt-1 w-full min-h-[44px] rounded-lg bg-white/10 text-white text-base px-2 py-2 border border-white/10" data-selector="microfono">
                    {!micId && <option value="">Predeterminado</option>}
                    {lista.audioinput.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId} className="text-slate-900">{nombre(d, i, "Micrófono")}</option>
                    ))}
                  </select>
                </label>
              )}
              {salidaSoportada && lista.audiooutput.length > 0 && (
                <div className="flex flex-wrap items-end gap-2">
                  <label className="block text-xs text-white/60 flex-1 min-w-[180px]">
                    Altavoz
                    <select value={salidaId} onChange={(e) => setSalidaId(e.target.value)} className="mt-1 w-full min-h-[44px] rounded-lg bg-white/10 text-white text-base px-2 py-2 border border-white/10" data-selector="altavoz">
                      <option value="" className="text-slate-900">Predeterminado</option>
                      {lista.audiooutput.filter((d) => d.deviceId && d.deviceId !== "default").map((d, i) => (
                        <option key={d.deviceId} value={d.deviceId} className="text-slate-900">{nombre(d, i, "Altavoz")}</option>
                      ))}
                    </select>
                  </label>
                  <button onClick={probarSonido} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-3 min-h-[44px]" data-probar-sonido="">
                    <Volume2 className="w-3.5 h-3.5" /> Probar sonido
                  </button>
                </div>
              )}

              <div className="flex gap-2 mt-2 [@media(max-height:500px)]:mt-0">
                <button
                  onClick={cancelar}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-3"
                >
                  <X className="w-4 h-4" /> Cancelar
                </button>
                <button
                  onClick={entrar}
                  disabled={abriendo !== ""}
                  className="flex-[2] inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-bold px-4 py-3"
                  data-entrar-clase=""
                >
                  <LogIn className="w-4 h-4" /> Entrar a la clase
                </button>
              </div>
              <p className="text-[11px] text-white/40 text-center [@media(max-height:500px)]:hidden">
                Entrarás con la cámara {cam ? "encendida" : "apagada"} y el micrófono {mic ? "encendido" : "apagado"}. Podrás cambiarlo dentro de la clase.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
