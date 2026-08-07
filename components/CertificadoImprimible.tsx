"use client";
import { X, Printer } from "lucide-react";

/**
 * V3.9.28 — Certificado profesional, diseño clásico institucional.
 *
 * Antes era una tarjeta de colores en pantalla. Ahora es un documento de
 * verdad: marco doble azul y dorado, escudo, tipografía con serifa, sello,
 * firma y código de verificación.
 *
 * Se imprime o se guarda como PDF con el botón (el navegador ofrece
 * "Guardar como PDF" en el diálogo de impresión). No hace falta instalar
 * nada ni pagar un servicio.
 */

const NAVY = "#12295E";
const GOLD = "#C9A227";

export default function CertificadoImprimible({
  cert, onClose,
}: { cert: any; onClose: () => void }) {
  const fecha = cert.issued_at
    ? new Date(cert.issued_at + "T12:00:00").toLocaleDateString("es-DO", {
        day: "numeric", month: "long", year: "numeric",
      })
    : "";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 overflow-y-auto p-3 md:p-6 print:p-0 print:bg-white print:static">
      <div className="max-w-4xl mx-auto">

        {/* Barra de acciones: no se imprime */}
        <div className="flex items-center justify-between gap-3 mb-4 print:hidden">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
          >
            <X className="w-4 h-4" />
            Cerrar
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-white text-slate-800 text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-slate-100 transition"
          >
            <Printer className="w-4 h-4" />
            Imprimir o guardar en PDF
          </button>
        </div>

        <p className="text-white/60 text-xs text-center mb-4 print:hidden">
          En el diálogo de impresión elige &ldquo;Guardar como PDF&rdquo;. Recomendado: horizontal.
        </p>

        {/* EL CERTIFICADO */}
        <div
          id="ds-certificado"
          className="bg-[#FFFDF8] p-2 md:p-2.5 rounded-sm shadow-2xl print:shadow-none"
          style={{ border: `3px solid ${NAVY}` }}
        >
          <div
            className="px-5 py-7 md:px-12 md:py-10 text-center"
            style={{ border: `1px solid ${GOLD}` }}
          >
            {/* Escudo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-192.png"
              alt=""
              className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-2 object-contain"
            />
            <p
              className="text-sm md:text-base tracking-[0.14em] mb-0.5"
              style={{ color: NAVY, fontFamily: "Georgia, serif" }}
            >
              {(cert.institute_name || "DORISMON LANGUAGE INSTITUTE").toUpperCase()}
            </p>

            <div className="w-14 h-px mx-auto my-4" style={{ backgroundColor: GOLD }} />

            <h1
              className="text-xl md:text-3xl mb-1"
              style={{ color: NAVY, fontFamily: "Georgia, serif", letterSpacing: "0.03em" }}
            >
              Certificado de aprovechamiento
            </h1>
            <p className="text-[10px] md:text-xs tracking-[0.16em] mb-6" style={{ color: "#8A7B4E" }}>
              CERTIFICATE OF ACHIEVEMENT
            </p>

            <p className="text-xs md:text-sm mb-2" style={{ color: "#6B6555" }}>
              Se otorga el presente certificado a
            </p>
            <p
              className="text-2xl md:text-4xl mb-2 px-2"
              style={{ color: "#0F2547", fontFamily: "Georgia, serif" }}
            >
              {cert.student_name || "—"}
            </p>
            <div className="w-48 md:w-64 h-px mx-auto mb-5" style={{ backgroundColor: "#DCD3BE" }} />

            <p
              className="text-xs md:text-sm leading-7 max-w-xl mx-auto mb-7"
              style={{ color: "#6B6555" }}
            >
              por haber completado satisfactoriamente el nivel{" "}
              <span style={{ color: NAVY }}>
                {cert.level_code} — {cert.level_name}
              </span>{" "}
              del programa de {cert.course_name}, con una duración de {cert.hours} horas académicas.
            </p>

            {/* Datos */}
            <div className="flex justify-center gap-6 md:gap-10 flex-wrap mb-8">
              {[
                { l: "NIVEL", v: cert.level_code },
                { l: "HORAS", v: cert.hours },
                ...(cert.final_grade != null
                  ? [{ l: "CALIFICACIÓN", v: `${cert.final_grade} / 100` }]
                  : []),
                { l: "FECHA", v: fecha },
              ].map((d) => (
                <div key={d.l}>
                  <p className="text-[9px] tracking-[0.1em]" style={{ color: "#A3956B" }}>{d.l}</p>
                  <p className="text-xs md:text-sm" style={{ color: NAVY }}>{d.v}</p>
                </div>
              ))}
            </div>

            {/* Firma, sello y verificación */}
            <div className="flex items-end justify-between gap-4 flex-wrap mt-6">
              <div className="text-center flex-1 min-w-[130px]">
                <div className="w-32 h-px mx-auto mb-1.5" style={{ backgroundColor: NAVY }} />
                <p className="text-[10px] md:text-xs" style={{ color: NAVY }}>Dirección académica</p>
                <p className="text-[9px]" style={{ color: "#A3956B" }}>
                  {cert.institute_name || "Dorismon Language Institute"}
                </p>
              </div>

              <div
                className="w-14 h-14 md:w-16 md:h-16 rounded-full flex flex-col items-center justify-center flex-shrink-0"
                style={{ border: `2px solid ${GOLD}` }}
              >
                <span className="text-lg md:text-xl" style={{ color: GOLD }}>★</span>
                <span className="text-[7px] tracking-wider" style={{ color: "#A3956B" }}>OFICIAL</span>
              </div>

              <div className="text-center flex-1 min-w-[130px]">
                <p className="text-[9px] tracking-[0.08em] mb-0.5" style={{ color: "#A3956B" }}>
                  CÓDIGO DE VERIFICACIÓN
                </p>
                <p className="text-[11px] md:text-xs font-mono" style={{ color: NAVY }}>
                  {cert.code}
                </p>
                <p className="text-[8px] md:text-[9px]" style={{ color: "#A3956B" }}>
                  dorismon.com/verificar
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #ds-certificado, #ds-certificado * { visibility: visible; }
          #ds-certificado {
            position: absolute;
            left: 0; top: 0;
            width: 100%;
            box-shadow: none;
          }
          @page { size: landscape; margin: 10mm; }
        }
      `}</style>
    </div>
  );
}
