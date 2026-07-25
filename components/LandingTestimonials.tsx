"use client";
import { useEffect, useState } from "react";
import { publicApi } from "@/lib/api";

/**
 * V3.9.23 — Testimonios reales de estudiantes.
 *
 * IMPORTANTE: si no hay ninguno cargado, esta sección NO se muestra.
 * Así la página nunca enseña testimonios inventados y el diseño no se rompe
 * mientras Luis consigue los reales por WhatsApp.
 */
export default function LandingTestimonials() {
  const [items, setItems] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    publicApi.testimonials()
      .then((r: any) => { setItems(Array.isArray(r?.items) ? r.items : []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  // Sin testimonios → la sección no existe
  if (!loaded || items.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0F2557]">
            Lo que dicen nuestros estudiantes
          </h2>
          <div className="w-16 h-1 bg-[#F5C842] rounded-full mx-auto mt-3" />
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {items.slice(0, 6).map((t: any) => (
            <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
              <div className="text-4xl leading-none text-slate-200 font-serif mb-1" aria-hidden="true">&ldquo;</div>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">{t.text}</p>
              <div className="flex items-center gap-3">
                {t.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.photo_url} alt={t.name} className="w-11 h-11 rounded-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[#E6F1FB] text-[#2563EB] font-bold flex items-center justify-center text-sm">
                    {(t.name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#0F2557] truncate">{t.name}</p>
                  {t.role && <p className="text-xs text-slate-500 truncate">{t.role}</p>}
                  <div className="text-[#F5C842] text-xs leading-none mt-0.5" aria-label={`${t.rating} de 5 estrellas`}>
                    {"★".repeat(Math.max(1, Math.min(5, t.rating || 5)))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
