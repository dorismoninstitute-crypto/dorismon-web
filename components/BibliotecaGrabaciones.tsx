"use client";
/**
 * GATE 6H-B — Biblioteca de grabaciones (estudiante, profesor y Dirección).
 *
 * El backend decide QUÉ ve cada uno (rol en la base + foto histórica de audiencia):
 * el estudiante solo recibe grabaciones listas; profesor y Dirección ven también las que
 * siguen en curso o fallaron (con un error genérico). Reproducir pide al backend una URL
 * temporal (10 min) que vive solo en memoria; si vence, se pide otra (con límite).
 * Sin botón Descargar, pero sin prometer que no se pueda capturar: quien puede verla en
 * su navegador técnicamente puede guardarla.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button } from "@/components/ui";
import { VisorContenidoClase } from "@/components/ContenidoClase";  // GATE 6F-B

type Item = {
  id: string; session_id: string; titulo: string; profesor: string | null;
  clase_inicio: string | null; grabacion_inicio: string | null; duracion_segundos: number | null;
  estado: string; estado_texto: string; parte: number; partes: number; reproducible: boolean;
  disponible_hasta: string | null; error?: string;
};
type Respuesta = {
  rol: "estudiante" | "profesor" | "direccion"; items: Item[]; total: number; pagina: number;
  paginas: number; por_pagina: number; profesores?: { id: string; nombre: string }[];
};

const EN_CURSO = ["starting", "recording", "stopping", "processing"];
const COLOR: Record<string, string> = {
  ready: "success", processing: "warning", stopping: "warning", starting: "info", recording: "danger", failed: "danger",
};
const TEXTO_ESTADO: Record<string, string> = {
  starting: "Iniciando…", recording: "Grabando", stopping: "Deteniendo…",
  processing: "Procesando grabación…", ready: "Lista", failed: "Fallida",
};
const MAX_RENOVACIONES = 3;              // renovaciones de URL permitidas…
const VENTANA_RENOVACIONES_MS = 120_000; // …dentro de esta ventana (evita bucles)

function fecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-DO", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
function hora(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("es-DO", { hour: "numeric", minute: "2-digit" });
}
function duracion(s: number | null) {
  if (!s) return null;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return h ? `${h} h ${m} min` : m ? `${m} min${x ? ` ${x} s` : ""}` : `${x} s`;
}

/** GATE 6F-B — misma página, dos pestañas: grabaciones y contenido de clases. */
export default function BibliotecaGrabaciones() {
  const [vista, setVista] = useState<"grabaciones" | "contenido">("grabaciones");
  const pestanas = (
    <div className="inline-flex rounded-xl bg-slate-100 p-1 mb-4" role="tablist" aria-label="Biblioteca de clases" data-pestanas-biblioteca="">
      {([["grabaciones", "Grabaciones"], ["contenido", "Contenido de clases"]] as const).map(([v, txt]) => (
        <button key={v} role="tab" aria-selected={vista === v} onClick={() => setVista(v)}
          className={`px-3 min-h-[36px] rounded-lg text-sm font-semibold transition ${vista === v ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}>
          {txt}
        </button>
      ))}
    </div>
  );
  return vista === "grabaciones" ? <Grabaciones pestanas={pestanas} /> : <ClasesConContenido pestanas={pestanas} />;
}

function Grabaciones({ pestanas }: { pestanas: React.ReactNode }) {
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [error, setError] = useState("");
  const [pagina, setPagina] = useState(1);
  const [filtros, setFiltros] = useState({ estado: "", profesor: "", desde: "", hasta: "", q: "" });
  const [viendo, setViendo] = useState<Item | null>(null);

  const cargar = useCallback(async () => {
    const p = new URLSearchParams({ pagina: String(pagina) });
    Object.entries(filtros).forEach(([k, v]) => { if (v) p.set(k, v); });
    try {
      setDatos(await api(`/video/grabaciones?${p.toString()}`, { auth: true }) as Respuesta);
      setError("");
    } catch (e: any) {
      setError(e?.status === 429 ? "Demasiadas solicitudes. Espera un momento y actualiza." : (e?.message || "No se pudo cargar la biblioteca."));
    }
  }, [pagina, filtros]);
  useEffect(() => { void cargar(); }, [cargar]);

  // Sin peticiones por segundo: solo mientras haya algo en curso (profesor / Dirección), cada 20 s.
  const enCurso = !!datos && datos.rol !== "estudiante" && datos.items.some((i) => EN_CURSO.includes(i.estado));
  useEffect(() => {
    if (!enCurso) return;
    const t = setInterval(() => { void cargar(); }, 20_000);
    return () => clearInterval(t);
  }, [enCurso, cargar]);

  if (!datos && !error) return <LoadingScreen message="Cargando grabaciones…" />;
  const rol = datos?.rol || "estudiante";
  const titulo = rol === "estudiante" ? "Mis grabaciones" : rol === "profesor" ? "Grabaciones de mis clases" : "Grabaciones";
  const subtitulo = rol === "estudiante"
    ? "Las clases grabadas a las que tenías acceso cuando se grabaron."
    : rol === "profesor" ? "Seguimiento y reproducción de las grabaciones de tus clases." : "Todas las grabaciones del instituto.";
  const cambiarFiltro = (k: keyof typeof filtros, v: string) => { setPagina(1); setFiltros((f) => ({ ...f, [k]: v })); };

  return (
    <>
      <PageHeader title={titulo} subtitle={subtitulo}
        action={rol !== "estudiante" ? <Button variant="outline" size="sm" onClick={() => void cargar()}>Actualizar</Button> : undefined} />
      {pestanas}
      {error && <div className="mb-4"><ErrorBox message={error} /></div>}

      {rol === "direccion" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4" data-filtros-grabaciones="">
          <input className="col-span-2 sm:col-span-1 border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Buscar por clase"
            value={filtros.q} onChange={(e) => cambiarFiltro("q", e.target.value)} aria-label="Buscar por clase" />
          <select className="border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white" value={filtros.estado}
            onChange={(e) => cambiarFiltro("estado", e.target.value)} aria-label="Estado">
            <option value="">Todos los estados</option>
            {["ready", "processing", "failed", "recording", "starting", "stopping"].map((e) => <option key={e} value={e}>{TEXTO_ESTADO[e]}</option>)}
          </select>
          <select className="border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white" value={filtros.profesor}
            onChange={(e) => cambiarFiltro("profesor", e.target.value)} aria-label="Profesor">
            <option value="">Todos los profesores</option>
            {(datos?.profesores || []).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <input type="date" className="border border-slate-300 rounded-lg px-2 py-2 text-sm" value={filtros.desde}
            onChange={(e) => cambiarFiltro("desde", e.target.value)} aria-label="Desde" />
          <input type="date" className="border border-slate-300 rounded-lg px-2 py-2 text-sm" value={filtros.hasta}
            onChange={(e) => cambiarFiltro("hasta", e.target.value)} aria-label="Hasta" />
        </div>
      )}

      {datos && datos.items.length === 0 ? (
        <Card><EmptyState icon="🎬"
          title={rol === "estudiante" ? "Aún no tienes grabaciones disponibles." : rol === "profesor" ? "Aún no hay grabaciones de tus clases." : "No hay grabaciones con estos filtros."}
          description={rol === "estudiante" ? "Cuando tu profesor grabe una clase a la que perteneces, aparecerá aquí al terminar de procesarse." : undefined} /></Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2" data-lista-grabaciones="">
          {(datos?.items || []).map((i) => (
            <li key={i.id}>
              <Card className="h-full" data-grabacion={i.id} data-estado={i.estado}>
                <CardBody className="p-4 flex flex-col gap-2 h-full">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm leading-snug break-words">{i.titulo}</h3>
                      {i.partes > 1 && <p className="text-xs text-slate-500">Grabación {i.parte} de {i.partes}{i.grabacion_inicio ? ` · empezó ${hora(i.grabacion_inicio)}` : ""}</p>}
                    </div>
                    <Badge variant={COLOR[i.estado] || "default"} className="flex-shrink-0">{TEXTO_ESTADO[i.estado] || i.estado_texto}</Badge>
                  </div>
                  <dl className="text-xs text-slate-600 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
                    {i.profesor && <><dt className="text-slate-400">Profesor</dt><dd className="truncate">{i.profesor}</dd></>}
                    <dt className="text-slate-400">Fecha</dt><dd>{fecha(i.clase_inicio)}{i.clase_inicio ? ` · ${hora(i.clase_inicio)}` : ""}</dd>
                    {duracion(i.duracion_segundos) && <><dt className="text-slate-400">Duración</dt><dd>{duracion(i.duracion_segundos)}</dd></>}
                    {i.disponible_hasta && <><dt className="text-slate-400">Disponible hasta</dt><dd>{fecha(i.disponible_hasta)}</dd></>}
                  </dl>
                  {i.estado === "failed" && i.error && <p className="text-xs text-red-700 bg-red-50 rounded-md px-2 py-1.5">{i.error}</p>}
                  {i.estado === "processing" && <p className="text-xs text-amber-700">Procesando grabación… aparecerá lista en unos minutos.</p>}
                  <div className="mt-auto pt-1">
                    {i.reproducible && (
                      <Button size="sm" className="w-full sm:w-auto min-h-[40px]" onClick={() => setViendo(i)} data-ver-grabacion="">▶ Ver grabación</Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {datos && datos.paginas > 1 && (
        <nav className="flex items-center justify-between gap-2 mt-4 text-sm" aria-label="Páginas">
          <Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>Anterior</Button>
          <span className="text-slate-500">Página {datos.pagina} de {datos.paginas}</span>
          <Button variant="outline" size="sm" disabled={pagina >= datos.paginas} onClick={() => setPagina((p) => p + 1)}>Siguiente</Button>
        </nav>
      )}

      {viendo && <Reproductor item={viendo} onCerrar={() => setViendo(null)} />}
    </>
  );
}

/** Reproductor nativo del navegador (controles, volumen, línea de tiempo, pantalla completa). */
function Reproductor({ item, onCerrar }: { item: Item; onCerrar: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  // n cambia en CADA URL nueva: aunque dos renovaciones devuelvan la misma URL (mismo segundo),
  // el <video> se vuelve a montar y vuelve a pedir (si no, quedaría roto en silencio).
  const [fuente, setFuente] = useState<{ url: string; n: number } | null>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "renovando" | "error">("cargando");
  const [mensaje, setMensaje] = useState("");
  const [velocidad, setVelocidad] = useState(1);
  const vence = useRef(0);                  // hora (ms) a partir de la cual se renueva antes de reanudar
  const renovaciones = useRef<number[]>([]);
  const posicion = useRef(0);
  const seguir = useRef(false);
  const reproduciendo = useRef(false);    // solo se actualiza mientras el vídeo tiene datos

  const pedir = useCallback(async (renovar: boolean) => {
    if (renovar) {
      const ahora = Date.now();
      renovaciones.current = renovaciones.current.filter((t) => ahora - t < VENTANA_RENOVACIONES_MS);
      if (renovaciones.current.length >= MAX_RENOVACIONES) {
        setEstado("error");
        setMensaje("No se pudo continuar la reproducción. Inténtalo de nuevo en unos minutos.");
        return;
      }
      renovaciones.current.push(ahora);
      setEstado("renovando");
    }
    try {
      const r: any = await api(`/video/sessions/${item.session_id}/grabaciones/${item.id}/reproducir`, { method: "POST", auth: true });
      vence.current = Date.now() + Math.max(30, (r.expira_en_segundos || 600) - 30) * 1000;
      setFuente((f) => ({ url: r.url, n: (f?.n || 0) + 1 }));
      setEstado("listo");
    } catch (e: any) {
      setEstado("error");
      setMensaje(e?.status === 429 ? "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo."
        : e?.status === 409 ? "La grabación aún no está lista."
        : e?.status === 404 ? "Esta grabación no está disponible."
        : e?.status === 403 ? "Tu cuenta no puede ver grabaciones en este momento."
        : "No se pudo abrir la grabación. Inténtalo de nuevo.");
    }
  }, [item]);

  useEffect(() => { void pedir(false); }, [pedir]);
  useEffect(() => {
    const cerrar = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar(); };
    window.addEventListener("keydown", cerrar);
    return () => window.removeEventListener("keydown", cerrar);
  }, [onCerrar]);

  const renovar = () => {
    const v = video.current;
    if (v && v.readyState >= 1) posicion.current = v.currentTime || posicion.current;
    seguir.current = seguir.current || reproduciendo.current;
    void pedir(true);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/85 flex items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true"
      aria-label={`Grabación: ${item.titulo}`} data-reproductor-grabacion="">
      <div className="bg-slate-900 w-full h-full sm:h-auto sm:max-w-3xl sm:rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 px-3 py-2 text-white">
          <p className="text-sm font-semibold truncate flex-1">{item.titulo}{item.partes > 1 ? ` · Grabación ${item.parte} de ${item.partes}` : ""}</p>
          <label className="text-xs text-white/70 flex items-center gap-1">Velocidad
            <select className="bg-slate-800 text-white rounded px-1 py-1 text-xs" value={velocidad} aria-label="Velocidad"
              onChange={(e) => { const x = Number(e.target.value); setVelocidad(x); if (video.current) video.current.playbackRate = x; }}>
              {[0.75, 1, 1.25, 1.5, 2].map((x) => <option key={x} value={x}>{x}×</option>)}
            </select>
          </label>
          <button onClick={onCerrar} className="min-h-[40px] px-3 rounded-lg bg-white/10 hover:bg-white/20 text-sm" aria-label="Cerrar">✕</button>
        </div>
        <div className="relative flex-1 sm:flex-none bg-black flex items-center justify-center">
          {fuente && (
            <video ref={video} key={fuente.n} src={fuente.url} controls playsInline preload="metadata" controlsList="nodownload"
              className="w-full max-h-[80vh] bg-black" data-video-grabacion=""
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                v.playbackRate = velocidad;
                if (posicion.current > 0) v.currentTime = posicion.current;
                if (seguir.current) { seguir.current = false; void v.play().catch(() => {}); }
              }}
              onPlay={(e) => {
                // Reanudar con la URL ya vencida: se pide otra antes (sin error de R2/S3 a la vista)
                if (Date.now() > vence.current) { e.currentTarget.pause(); seguir.current = true; renovar(); }
              }}
              onTimeUpdate={(e) => { if (e.currentTarget.readyState >= 1) posicion.current = e.currentTarget.currentTime; }}
              onPlaying={() => { reproduciendo.current = true; }}
              onPause={(e) => { if (e.currentTarget.readyState >= 1) reproduciendo.current = false; }}
              onError={() => renovar()} />
          )}
          {estado !== "listo" && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center bg-black/70 text-white text-sm" role="status" data-estado-reproductor={estado}>
              {estado === "cargando" && "Preparando la grabación…"}
              {estado === "renovando" && "La sesión de reproducción venció. Estamos renovando el acceso."}
              {estado === "error" && (
                <div className="flex flex-col items-center gap-3">
                  <p>{mensaje}</p>
                  <Button size="sm" variant="outline" onClick={() => { renovaciones.current = []; setEstado("cargando"); void pedir(false); }}>Reintentar</Button>
                </div>
              )}
            </div>
          )}
        </div>
        <p className="px-3 py-2 text-[11px] text-white/50">Grabación privada de la clase, solo para tu estudio. No la compartas.</p>
      </div>
    </div>
  );
}

/** GATE 6F-B — Clases con contenido (vocabulario, frases, notas, enlaces) que puedo consultar. */
type ClaseConContenido = { session_id: string; titulo: string; profesor: string | null; clase_inicio: string | null; contenidos: number };
function ClasesConContenido({ pestanas }: { pestanas: React.ReactNode }) {
  const [datos, setDatos] = useState<{ items: ClaseConContenido[]; pagina: number; paginas: number } | null>(null);
  const [error, setError] = useState("");
  const [pagina, setPagina] = useState(1);
  const [viendo, setViendo] = useState<ClaseConContenido | null>(null);
  useEffect(() => {
    api(`/video/contenido-clases?pagina=${pagina}`, { auth: true })
      .then((r: any) => { setDatos(r); setError(""); })
      .catch((e: any) => setError(e?.message || "No se pudo cargar el contenido."));
  }, [pagina]);
  if (!datos && !error) return <LoadingScreen message="Cargando contenido…" />;
  return (
    <>
      <PageHeader title="Contenido de clases" subtitle="Vocabulario, frases, notas y enlaces compartidos en tus clases de Video Dorismon." />
      {pestanas}
      {error && <div className="mb-4"><ErrorBox message={error} /></div>}
      {datos && datos.items.length === 0 ? (
        <Card><EmptyState icon="📚" title="Aún no hay contenido de tus clases."
          description="Cuando se comparta vocabulario, frases, notas o enlaces en una clase tuya, aparecerá aquí." /></Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2" data-lista-clases-contenido="">
          {(datos?.items || []).map((c) => (
            <li key={c.session_id}>
              <Card className="h-full">
                <CardBody className="p-4 flex flex-col gap-2 h-full">
                  <h3 className="font-bold text-slate-900 text-sm leading-snug break-words">{c.titulo}</h3>
                  <p className="text-xs text-slate-600">{c.profesor ? `${c.profesor} · ` : ""}{fecha(c.clase_inicio)}{c.clase_inicio ? ` · ${hora(c.clase_inicio)}` : ""}</p>
                  <p className="text-xs text-slate-500">{c.contenidos === 1 ? "1 recurso" : `${c.contenidos} recursos`}</p>
                  <div className="mt-auto pt-1">
                    <Button size="sm" variant="outline" className="w-full sm:w-auto min-h-[40px]" onClick={() => setViendo(c)} data-ver-contenido="">Ver contenido</Button>
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
      {datos && datos.paginas > 1 && (
        <nav className="flex items-center justify-between gap-2 mt-4 text-sm" aria-label="Páginas">
          <Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>Anterior</Button>
          <span className="text-slate-500">Página {datos.pagina} de {datos.paginas}</span>
          <Button variant="outline" size="sm" disabled={pagina >= datos.paginas} onClick={() => setPagina((p) => p + 1)}>Siguiente</Button>
        </nav>
      )}
      {viendo && <VisorContenidoClase sessionId={viendo.session_id} titulo={viendo.titulo} onCerrar={() => setViendo(null)} />}
    </>
  );
}
