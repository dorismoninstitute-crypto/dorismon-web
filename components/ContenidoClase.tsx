"use client";
/**
 * GATE 6F-B — Contenido de la clase: vocabulario, frases, notas y enlaces.
 *
 * Fuente de verdad: el backend (/video/sessions/{id}/contenido). Se lee al montar (quien
 * entra tarde o vuelve con la recuperación 6E), al reconectar (6B), cada minuto y cuando
 * llega el aviso "hay contenido nuevo" por el canal de datos de LiveKit. Si ese aviso se
 * pierde, nada desaparece: la siguiente lectura lo trae.
 * Todo se pinta como TEXTO (nunca HTML); los enlaces solo si son http(s) y se abren en otra
 * pestaña sin acceso a esta. Lo que escribió el profesor se muestra tal cual (sin traducir).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { api } from "@/lib/api";
import { BookOpen, X, Plus, Pencil, EyeOff, Eye, ExternalLink } from "lucide-react";

export const TEMA_CONTENIDO = "dorismon-contenido";
export type Tipo = "vocabulario" | "frase" | "nota" | "enlace";
export type ItemContenido = {
  id: string; tipo: Tipo; texto: string | null; traduccion: string | null; ejemplo: string | null;
  url: string | null; posicion: number; editado: boolean; oculto?: boolean;
};
const ETIQUETA: Record<Tipo, string> = { vocabulario: "Vocabulario", frase: "Frase", nota: "Nota", enlace: "Enlace" };
const LIMITE: Record<Tipo, { texto: number; traduccion?: number; ejemplo?: number }> = {
  vocabulario: { texto: 120, traduccion: 200, ejemplo: 300 },
  frase: { texto: 300, traduccion: 300 },
  nota: { texto: 500 },
  enlace: { texto: 120 },
};
const URL_SEGURA = /^https?:\/\//i;

function hostDe(url: string) {
  try { return new URL(url).hostname; } catch { return ""; }
}

/** Estado del contenido dentro de la sala (un solo uso por llamada). */
export function useContenidoClase(sessionId: string) {
  const room = useRoomContext();
  const [items, setItems] = useState<ItemContenido[]>([]);
  const [puedePublicar, setPuedePublicar] = useState(false);
  const [puedeEditar, setPuedeEditar] = useState(false);
  const [nuevos, setNuevos] = useState(0);
  const conocidos = useRef<Set<string> | null>(null);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cargar = useCallback(async () => {
    try {
      const r: any = await api(`/video/sessions/${sessionId}/contenido`, { auth: true });
      const lista: ItemContenido[] = Array.isArray(r?.items) ? r.items : [];
      const visibles = lista.filter((i) => !i.oculto);
      if (conocidos.current) {
        const n = visibles.filter((i) => !conocidos.current!.has(i.id)).length;
        if (n) setNuevos((x) => x + n);
      }
      conocidos.current = new Set(visibles.map((i) => i.id));
      setItems(lista);
      setPuedePublicar(!!r?.puede_publicar);
      setPuedeEditar(!!r?.puede_editar);
    } catch { /* sin contenido: se reintenta en la próxima lectura */ }
  }, [sessionId]);

  // Varias señales seguidas → una sola lectura
  const pronto = useCallback(() => {
    if (espera.current) return;
    espera.current = setTimeout(() => { espera.current = null; void cargar(); }, 800);
  }, [cargar]);

  useEffect(() => {
    void cargar();
    const alRecibir = (_p: Uint8Array, _part?: unknown, _k?: unknown, tema?: string) => {
      if (tema === TEMA_CONTENIDO) pronto();
    };
    const alReconectar = () => { void cargar(); };
    room.on(RoomEvent.DataReceived, alRecibir).on(RoomEvent.Reconnected, alReconectar).on(RoomEvent.Connected, alReconectar);
    const t = setInterval(() => { void cargar(); }, 60_000);
    return () => {
      room.off(RoomEvent.DataReceived, alRecibir).off(RoomEvent.Reconnected, alReconectar).off(RoomEvent.Connected, alReconectar);
      clearInterval(t);
      if (espera.current) clearTimeout(espera.current);
    };
  }, [room, cargar, pronto]);

  /** Tras publicar o editar: avisar a la sala (solo un aviso; el contenido va por la base). */
  const avisar = useCallback(() => {
    try {
      room.localParticipant.publishData(new TextEncoder().encode("1"), { reliable: true, topic: TEMA_CONTENIDO })
        .catch(() => { /* sin aviso: los demás lo leen en el próximo minuto */ });
    } catch { /* si no sale, los demás lo leen en el próximo minuto */ }
  }, [room]);

  const visibles = items.filter((i) => !i.oculto).length;
  return { sessionId, items, visibles, puedePublicar, puedeEditar, cargar, avisar, nuevos, verNuevos: () => setNuevos(0) };
}
export type ContenidoClase = ReturnType<typeof useContenidoClase>;

/** Botón de la cabecera (completa / dividida). */
export function BotonContenido({ cc, onClick }: { cc: ContenidoClase; onClick: () => void }) {
  return (
    <button onClick={onClick} title="Contenido de la clase" data-boton-contenido=""
      className="relative inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-3 py-2 rounded-xl transition">
      <BookOpen className="w-4 h-4" />
      <span className="hidden lg:inline">Contenido</span>
      {cc.nuevos > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-sky-400 text-sky-950 text-[10px] font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
          {cc.nuevos}
        </span>
      )}
    </button>
  );
}

/** En la ventanita (mini): solo un indicador, sin el panel. */
export function IndicadorContenido({ cc }: { cc: ContenidoClase }) {
  if (!cc.visibles) return null;
  return (
    <div className="flex items-center justify-center gap-1.5 px-2 py-0.5 text-[11px] text-sky-100 bg-sky-500/15 pointer-events-none" data-indicador-contenido="">
      <BookOpen className="w-3 h-3" aria-hidden="true" />
      {cc.visibles === 1 ? "1 recurso de clase" : `${cc.visibles} recursos de clase`}
    </div>
  );
}

/** Un elemento, como contenido educativo (no como aviso del sistema). */
function Elemento({ i, oscuro }: { i: ItemContenido; oscuro: boolean }) {
  const suave = oscuro ? "text-white/60" : "text-slate-500";
  const fuerte = oscuro ? "text-white" : "text-slate-900";
  if (i.tipo === "vocabulario") {
    return (
      <div>
        <p className={`font-bold text-[15px] ${fuerte} break-words`} lang="">{i.texto}</p>
        {i.traduccion && <p className={`text-sm ${oscuro ? "text-sky-200" : "text-sky-700"} break-words`}>{i.traduccion}</p>}
        {i.ejemplo && <p className={`text-sm italic ${suave} break-words`}>“{i.ejemplo}”</p>}
      </div>
    );
  }
  if (i.tipo === "frase") {
    return (
      <div>
        <p className={`text-base font-semibold ${fuerte} break-words border-l-4 ${oscuro ? "border-sky-400" : "border-sky-500"} pl-2`}>{i.texto}</p>
        {i.traduccion && <p className={`text-sm ${suave} break-words mt-0.5`}>{i.traduccion}</p>}
      </div>
    );
  }
  if (i.tipo === "nota") {
    return <p className={`text-sm ${fuerte} whitespace-pre-wrap break-words`}>{i.texto}</p>;
  }
  // enlace: solo http(s); se abre en otra pestaña sin acceso a esta
  if (!i.url || !URL_SEGURA.test(i.url)) return <p className={`text-sm ${suave}`}>Enlace no disponible</p>;
  return (
    <a href={i.url} target="_blank" rel="noopener noreferrer nofollow"
      className={`inline-flex items-start gap-1.5 text-sm font-semibold underline break-all ${oscuro ? "text-sky-200" : "text-sky-700"}`}>
      <span>{i.texto || hostDe(i.url)} <span className={`font-normal no-underline ${suave}`}>({hostDe(i.url)})</span></span>
      <ExternalLink className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
    </a>
  );
}

/** Lista en orden cronológico (misma presentación en la sala y después de la clase). */
export function ListaContenido({ items, oscuro = true, onEditar, onOcultar }: {
  items: ItemContenido[]; oscuro?: boolean;
  onEditar?: (i: ItemContenido) => void; onOcultar?: (i: ItemContenido) => void;
}) {
  const borde = oscuro ? "border-white/10 bg-white/5" : "border-slate-200 bg-white";
  return (
    <ol className="flex flex-col gap-2" data-lista-contenido="">
      {items.map((i) => (
        <li key={i.id} className={`rounded-xl border ${borde} p-3 ${i.oculto ? "opacity-50" : ""}`} data-contenido={i.tipo}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] uppercase tracking-wide font-bold ${oscuro ? "text-white/50" : "text-slate-400"}`}>{ETIQUETA[i.tipo]}</span>
            {i.oculto && <span className="text-[10px] font-bold text-amber-300">Oculto para los estudiantes</span>}
            {(onEditar || onOcultar) && (
              <span className="ml-auto flex gap-1">
                {onEditar && (
                  <button onClick={() => onEditar(i)} aria-label="Editar" title="Editar" data-editar-contenido=""
                    className={`p-1.5 rounded-md ${oscuro ? "hover:bg-white/10 text-white/70" : "hover:bg-slate-100 text-slate-500"}`}>
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                {onOcultar && (
                  <button onClick={() => onOcultar(i)} aria-label={i.oculto ? "Mostrar" : "Ocultar"} title={i.oculto ? "Mostrar" : "Ocultar"}
                    data-ocultar-contenido="" className={`p-1.5 rounded-md ${oscuro ? "hover:bg-white/10 text-white/70" : "hover:bg-slate-100 text-slate-500"}`}>
                    {i.oculto ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                )}
              </span>
            )}
          </div>
          <Elemento i={i} oscuro={oscuro} />
        </li>
      ))}
    </ol>
  );
}

/** Formulario rápido del profesor (nuevo o edición). */
function Formulario({ sessionId, editando, onHecho, oscuro = true }: {
  sessionId: string; editando: ItemContenido | null; onHecho: () => void; oscuro?: boolean;
}) {
  const [tipo, setTipo] = useState<Tipo>(editando?.tipo || "vocabulario");
  const [texto, setTexto] = useState(editando?.texto || "");
  const [traduccion, setTraduccion] = useState(editando?.traduccion || "");
  const [ejemplo, setEjemplo] = useState(editando?.ejemplo || "");
  const [url, setUrl] = useState(editando?.url || "");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const lim = LIMITE[tipo];
  const campo = `w-full rounded-lg px-2.5 py-2 text-sm ${oscuro ? "bg-white/10 text-white placeholder-white/40" : "bg-white border border-slate-300 text-slate-900"}`;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ocupado) return;
    setError("");
    if (tipo === "enlace" && !URL_SEGURA.test(url.trim())) { setError("El enlace debe empezar por http:// o https://"); return; }
    const cuerpo: Record<string, string | null> = { texto: texto.trim() || null };
    if (lim.traduccion) cuerpo.traduccion = traduccion.trim() || null;
    if (lim.ejemplo) cuerpo.ejemplo = ejemplo.trim() || null;
    if (tipo === "enlace") cuerpo.url = url.trim();
    setOcupado(true);
    try {
      if (editando) await api(`/video/sessions/${sessionId}/contenido/${editando.id}`, { method: "PATCH", auth: true, body: cuerpo });
      else await api(`/video/sessions/${sessionId}/contenido`, { method: "POST", auth: true, body: { tipo, ...cuerpo } });
      setTexto(""); setTraduccion(""); setEjemplo(""); setUrl("");
      onHecho();
    } catch (err: any) {
      setError(err?.status === 429 ? "Vas muy rápido. Espera un momento." : (err?.message || "No se pudo guardar."));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <form onSubmit={enviar} className={`rounded-xl p-3 flex flex-col gap-2 ${oscuro ? "bg-white/5" : "bg-slate-50"}`} data-form-contenido="">
      {!editando && (
        <div className="grid grid-cols-4 gap-1" role="tablist" aria-label="Tipo de contenido">
          {(Object.keys(ETIQUETA) as Tipo[]).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tipo === t} onClick={() => setTipo(t)}
              className={`text-[11px] font-semibold min-h-[34px] rounded-lg ${tipo === t ? "bg-sky-500 text-white" : oscuro ? "bg-white/10 text-white/80" : "bg-white text-slate-700 border border-slate-200"}`}>
              {ETIQUETA[t]}
            </button>
          ))}
        </div>
      )}
      {tipo === "enlace" && (
        <input className={campo} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" inputMode="url" maxLength={1000} aria-label="Enlace" />
      )}
      {tipo === "nota" ? (
        <textarea className={`${campo} min-h-[70px]`} value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={lim.texto}
          placeholder="Remember: use “did” + base verb." aria-label="Nota" />
      ) : (
        <input className={campo} value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={lim.texto}
          placeholder={tipo === "vocabulario" ? "Palabra o expresión (achievement)" : tipo === "frase" ? "How long have you lived here?" : "Título (opcional)"}
          aria-label={tipo === "enlace" ? "Título" : "Texto"} autoFocus={!editando} />
      )}
      {lim.traduccion && (
        <input className={campo} value={traduccion} onChange={(e) => setTraduccion(e.target.value)} maxLength={lim.traduccion}
          placeholder={tipo === "vocabulario" ? "Significado / traducción (opcional)" : "Significado (opcional)"} aria-label="Significado" />
      )}
      {lim.ejemplo && (
        <input className={campo} value={ejemplo} onChange={(e) => setEjemplo(e.target.value)} maxLength={lim.ejemplo}
          placeholder="Ejemplo (opcional)" aria-label="Ejemplo" />
      )}
      {error && <p className="text-xs text-red-300" role="alert">{error}</p>}
      <div className="flex gap-1.5">
        {editando && (
          <button type="button" onClick={onHecho} className={`flex-1 min-h-[38px] rounded-lg text-sm ${oscuro ? "bg-white/10 text-white" : "bg-white border border-slate-300 text-slate-700"}`}>Cancelar</button>
        )}
        <button type="submit" disabled={ocupado} className="flex-1 min-h-[38px] rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold disabled:opacity-60">
          {editando ? "Guardar cambios" : "Compartir"}
        </button>
      </div>
    </form>
  );
}

/** Panel lateral dentro de la llamada (completa / dividida). */
export function PanelContenido({ cc, onClose }: { cc: ContenidoClase; onClose: () => void }) {
  const [formulario, setFormulario] = useState(false);
  const [editando, setEditando] = useState<ItemContenido | null>(null);
  const { verNuevos } = cc;
  useEffect(() => { verNuevos(); }, [verNuevos, cc.items.length]);
  const hecho = async () => { setEditando(null); await cc.cargar(); cc.avisar(); };
  const ocultar = async (i: ItemContenido) => {
    try {
      await api(`/video/sessions/${cc.sessionId}/contenido/${i.id}`, { method: "PATCH", auth: true, body: { oculto: !i.oculto } });
      await cc.cargar();
      cc.avisar();
    } catch { /* se verá en la próxima lectura */ }
  };
  return (
    <aside className="absolute right-0 top-0 bottom-0 w-full sm:w-80 bg-[#111C33] border-l border-white/10 z-30 flex flex-col" data-panel-contenido="">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <BookOpen className="w-4 h-4 text-sky-300" />
        <p className="text-white font-semibold text-sm flex-1">Contenido de la clase</p>
        {cc.puedePublicar && !editando && (
          <button onClick={() => setFormulario((v) => !v)} className="inline-flex items-center gap-1 text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white px-2.5 py-1.5 rounded-lg" data-nuevo-contenido="">
            <Plus className="w-3.5 h-3.5" /> Contenido
          </button>
        )}
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70" aria-label="Cerrar"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {editando ? (
          <Formulario key={editando.id} sessionId={cc.sessionId} editando={editando} onHecho={hecho} />
        ) : formulario && cc.puedePublicar ? (
          <Formulario key="nuevo" sessionId={cc.sessionId} editando={null} onHecho={hecho} />
        ) : null}
        {cc.items.length === 0 ? (
          <p className="text-white/50 text-sm text-center py-8">
            {cc.puedePublicar ? "Comparte vocabulario, frases, notas o enlaces con la clase." : "Aquí aparecerá lo que comparta tu profesor."}
          </p>
        ) : (
          <ListaContenido items={cc.items} onEditar={cc.puedeEditar ? setEditando : undefined}
            onOcultar={cc.puedeEditar ? ocultar : undefined} />
        )}
      </div>
    </aside>
  );
}

/** Después de la clase (biblioteca): ver — y, si es su clase, corregir — el contenido. */
export function VisorContenidoClase({ sessionId, titulo, onCerrar }: { sessionId: string; titulo: string; onCerrar: () => void }) {
  const [items, setItems] = useState<ItemContenido[] | null>(null);
  const [puedeEditar, setPuedeEditar] = useState(false);
  const [editando, setEditando] = useState<ItemContenido | null>(null);
  const [error, setError] = useState("");
  const cargar = useCallback(async () => {
    try {
      const r: any = await api(`/video/sessions/${sessionId}/contenido`, { auth: true });
      setItems(Array.isArray(r?.items) ? r.items : []);
      setPuedeEditar(!!r?.puede_editar);
    } catch (e: any) {
      setError(e?.status === 403 ? "No tienes acceso al contenido de esta clase." : "No se pudo cargar el contenido.");
    }
  }, [sessionId]);
  useEffect(() => { void cargar(); }, [cargar]);
  const ocultar = async (i: ItemContenido) => {
    try { await api(`/video/sessions/${sessionId}/contenido/${i.id}`, { method: "PATCH", auth: true, body: { oculto: !i.oculto } }); } catch { /* */ }
    void cargar();
  };
  return (
    <div className="fixed inset-0 z-[120] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Contenido de la clase">
      <div className="bg-slate-50 w-full sm:max-w-lg max-h-[90vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-white">
          <BookOpen className="w-4 h-4 text-sky-600" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500">Contenido de la clase</p>
            <p className="text-sm font-bold text-slate-900 truncate">{titulo}</p>
          </div>
          <button onClick={onCerrar} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" aria-label="Cerrar"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto p-3 flex flex-col gap-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {editando && <Formulario key={editando.id} sessionId={sessionId} editando={editando} oscuro={false}
            onHecho={() => { setEditando(null); void cargar(); }} />}
          {items && items.length === 0 && !error && <p className="text-sm text-slate-500 text-center py-6">Esta clase no tiene contenido.</p>}
          {items && items.length > 0 && (
            <ListaContenido items={items} oscuro={false} onEditar={puedeEditar ? setEditando : undefined}
              onOcultar={puedeEditar ? ocultar : undefined} />
          )}
        </div>
      </div>
    </div>
  );
}
