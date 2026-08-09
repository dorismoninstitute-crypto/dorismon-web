"use client";
import { useState } from "react";
import { X, ExternalLink, Download, FileText, Music, Image as ImageIcon, Video } from "lucide-react";

/**
 * V3.9.30 — Ver archivos y videos DENTRO de la plataforma.
 *
 * EL PROBLEMA QUE RESUELVE: abrir un video de YouTube o un PDF sacaba al
 * estudiante de Dorismon. Y quien se va a YouTube cae en los videos
 * sugeridos y no vuelve a la clase.
 *
 * Ahora: YouTube se ve incrustado, las imágenes y PDF en un visor interno,
 * el audio se reproduce ahí mismo. Solo Word y Excel se descargan, porque
 * no hay forma de mostrarlos sin salir.
 */

/** Saca el identificador de un enlace de YouTube (todas sus formas) */
export function youtubeId(url: string): string | null {
  if (!url) return null;
  const patrones = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const p of patrones) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

type Tipo = "youtube" | "image" | "pdf" | "audio" | "other";

export function tipoDeArchivo(url: string, nombre?: string): Tipo {
  if (youtubeId(url)) return "youtube";
  const s = (nombre || url).toLowerCase().split("?")[0];
  if (/\.(jpg|jpeg|png|gif|webp|heic)$/.test(s)) return "image";
  if (/\.pdf$/.test(s)) return "pdf";
  if (/\.(mp3|wav|m4a|ogg|aac|webm)$/.test(s)) return "audio";
  return "other";
}

const ICONOS: Record<Tipo, any> = {
  youtube: Video, image: ImageIcon, pdf: FileText, audio: Music, other: FileText,
};

const NOMBRES: Record<Tipo, string> = {
  youtube: "Video", image: "Imagen", pdf: "Documento PDF",
  audio: "Audio", other: "Archivo",
};

/** Reproduce o muestra el contenido sin salir de la plataforma */
export function VisorEnLinea({ url, nombre }: { url: string; nombre?: string }) {
  const tipo = tipoDeArchivo(url, nombre);

  if (tipo === "youtube") {
    const id = youtubeId(url);
    return (
      <div className="rounded-xl overflow-hidden bg-black aspect-video">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`}
          title={nombre || "Video de la clase"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>
    );
  }

  if (tipo === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={nombre || "Entrega"} className="w-full rounded-xl border border-slate-200" />;
  }

  if (tipo === "audio") {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Music className="w-4 h-4 text-violet-600" />
          <p className="text-sm font-semibold text-slate-700">{nombre || "Grabación"}</p>
        </div>
        <audio controls src={url} className="w-full">
          Tu navegador no puede reproducir este audio.
        </audio>
      </div>
    );
  }

  if (tipo === "pdf") {
    return (
      <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
        <iframe src={url} title={nombre || "Documento"} className="w-full h-[420px] border-0" />
      </div>
    );
  }

  // Word, Excel y demás: no hay forma de mostrarlos sin salir
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition"
    >
      <FileText className="w-6 h-6 text-slate-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-700 truncate">{nombre || "Archivo"}</p>
        <p className="text-xs text-slate-500">Se abre en otra pestaña</p>
      </div>
      <Download className="w-4 h-4 text-slate-400 flex-shrink-0" />
    </a>
  );
}

/** Tarjeta compacta que abre el contenido en una ventana dentro de la plataforma */
export default function ArchivoAdjunto({
  url, nombre, compacto = false,
}: { url: string; nombre?: string; compacto?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const tipo = tipoDeArchivo(url, nombre);
  const Icono = ICONOS[tipo];

  if (!url) return null;

  if (!compacto) return <VisorEnLinea url={url} nombre={nombre} />;

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition"
      >
        <Icono className="w-3.5 h-3.5" />
        {NOMBRES[tipo]}
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setAbierto(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
              <p className="font-semibold text-sm text-slate-800 truncate">
                {nombre || NOMBRES[tipo]}
              </p>
              <div className="flex items-center gap-1 flex-shrink-0">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Abrir aparte"
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setAbierto(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <VisorEnLinea url={url} nombre={nombre} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
