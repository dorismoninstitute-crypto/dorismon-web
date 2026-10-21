"use client";
// GATE 2 — Ayudas de PRESENTACIÓN para las clases del profesor (dashboard y
// "Mis clases"). No deciden quién entra: eso sigue siendo /video/.../join
// (Gate 0) y JoinClassButton. Aquí solo se muestra mejor lo que ya llega.
import { useEffect, useState } from "react";

/** Los campos *_utc vienen en UTC. Con zona (PostgreSQL: "+00:00") se usan tal
 *  cual; si llegaran sin zona se interpretan como UTC, nunca como hora local. */
export function aFecha(iso?: string | null): Date | null {
  if (!iso) return null;
  const conZona = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(iso);
  const d = new Date(conZona ? iso : `${iso}Z`);
  return isNaN(d.getTime()) ? null : d;
}

const MODALIDADES: Record<string, string> = {
  online: "🌐 Online",
  presencial: "🏢 Presencial",
  hibrida: "🔀 Híbrida",
};
export const modalidadLegible = (m?: string) => (m && MODALIDADES[m]) || m || "";

const hora = (d: Date) => d.toLocaleTimeString("es", { hour: "numeric", minute: "2-digit", hour12: true });

/** "6:00 p. m. – 7:00 p. m." (o solo el inicio si no hay fin). */
export function rangoHora(s: any): string {
  const ini = aFecha(s?.starts_at_utc);
  const fin = aFecha(s?.ends_at_utc);
  if (!ini) return "";
  return fin ? `${hora(ini)} – ${hora(fin)}` : hora(ini);
}

/** Solo una clase `scheduled` puede estar "en curso" o ser "próxima".
 *  completed / cancelled nunca. */
export function estadoClase(s: any, ahora: Date): "en_curso" | "proxima" | null {
  if (!s || s.status !== "scheduled") return null;
  const ini = aFecha(s.starts_at_utc);
  const fin = aFecha(s.ends_at_utc);
  if (!ini) return null;
  if (ini <= ahora && (!fin || ahora <= fin)) return "en_curso";
  if (ini > ahora) return "proxima";
  return null;
}

/** GATE 2/3 — ÚNICA copia en el frontend de la ventana en la que /join abre
 *  la sala (30 min antes → 15 min después del fin). Solo decide si se MUESTRA
 *  el botón de entrar; quien autoriza sigue siendo /video/.../join. */
export const VENTANA_MIN_ANTES = 30;
export const VENTANA_MIN_GRACIA = 15;
export function dentroDeVentanaEntrada(s: any, ahora: Date): boolean {
  if (!s || s.status !== "scheduled") return false;
  const ini = aFecha(s.starts_at_utc);
  const fin = aFecha(s.ends_at_utc);
  if (!ini || !fin) return false;
  return ahora.getTime() >= ini.getTime() - VENTANA_MIN_ANTES * 60000
    && ahora.getTime() <= fin.getTime() + VENTANA_MIN_GRACIA * 60000;
}

export function minutosHasta(iso: string | null | undefined, ahora: Date): number | null {
  const d = aFecha(iso);
  return d ? Math.max(0, Math.round((d.getTime() - ahora.getTime()) / 60000)) : null;
}

/** Reloj de pantalla: re-renderiza cada 30 s para que "En curso" aparezca
 *  sin recargar. No hace peticiones al servidor. */
export function useAhora(ms = 30000): Date {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return ahora;
}
