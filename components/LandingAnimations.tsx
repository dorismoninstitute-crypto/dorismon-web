"use client";
import { useEffect, useRef, useState } from "react";

// V3.3 — Animaciones suaves para el landing.

// Número que cuenta de 0 hasta el valor cuando entra en pantalla
export function CountUp({ end, suffix = "", duration = 1400 }: { end: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Navegador viejo o sin observer → mostrar el número final directo
    if (typeof IntersectionObserver === "undefined") {
      setVal(end);
      return;
    }

    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true;
        let startTime: number | null = null;
        const step = (ts: number) => {
          if (startTime === null) startTime = ts;
          const p = Math.min((ts - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(eased * end));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    obs.observe(el);

    // Red de seguridad: si en 2.5s no contó, mostrar el valor final
    const fallback = setTimeout(() => {
      if (!started.current) { started.current = true; setVal(end); }
    }, 2500);

    return () => { obs.disconnect(); clearTimeout(fallback); };
  }, [end, duration]);

  return <span ref={ref}>{val}{suffix}</span>;
}

// Aparece con fade + sube suavemente cuando entra en pantalla
export function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respetar a quien prefiere menos animación: mostrar directo
    const prefersReduced = typeof window !== "undefined" &&
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }

    // Si IntersectionObserver no existe (navegador viejo), mostrar directo
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setTimeout(() => setVisible(true), delay);
        obs.disconnect();
      }
    }, { threshold: 0.15 });
    obs.observe(el);

    // Red de seguridad: si en 2.5s no se activó (sección ya visible sin scroll,
    // o el observer no disparó), mostrar igual. Nunca dejar contenido invisible.
    const fallback = setTimeout(() => setVisible(true), 2500);

    return () => { obs.disconnect(); clearTimeout(fallback); };
  }, [delay]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      {children}
    </div>
  );
}
