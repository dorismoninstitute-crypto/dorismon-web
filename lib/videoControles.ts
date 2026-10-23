/**
 * HOTFIX v3.9.76 — Lógica pura (sin React ni LiveKit) de los controles de Video Dorismon, para que la
 * interfaz y las pruebas usen exactamente la misma regla.
 *
 * GATE 6G-C — permisos dinámicos. TrackSource de LiveKit (protocol, livekit_models.proto):
 * CAMERA = 1, MICROPHONE = 2, SCREEN_SHARE = 3, SCREEN_SHARE_AUDIO = 4.
 */
export const FUENTE = { camara: 1, microfono: 2, pantalla: 3 } as const;

export type PermisosPublicar = { canPublish: boolean; canPublishSources: number[] };

/** ¿Puede publicar esa fuente? Misma regla que LiveKit: sin canPublish, nada;
 *  con canPublish y lista vacía, todo. */
export function puedePublicar(p: { permissions?: PermisosPublicar | null }, fuente: number) {
  const pm = p.permissions;
  if (!pm || !pm.canPublish) return false;
  return pm.canPublishSources.length === 0 || pm.canPublishSources.includes(fuente);
}

export type EstadoCompartirPantalla = {
  /** El botón Dorismon se muestra (solo si LiveKit permite publicar SCREEN_SHARE). */
  mostrar: boolean;
  etiqueta: "Compartir pantalla" | "Dejar de compartir" | null;
  /** El permiso se retiró mientras compartía: se detiene la pista local (nunca se inicia sola). */
  detenerPorPermisoRetirado: boolean;
};

/** Control "Compartir pantalla" para quien NO modera (el moderador conserva la barra de LiveKit).
 *  - Sin permiso real de LiveKit para SCREEN_SHARE: no hay botón funcional.
 *  - Con permiso: "Compartir pantalla"; mientras comparte: "Dejar de compartir".
 *  - Nunca empieza a compartir por sí solo: solo cambia la etiqueta según el estado real. */
export function estadoCompartirPantalla(p: {
  permisos: PermisosPublicar | null | undefined;
  compartiendo: boolean;
  esModerador: boolean;
}): EstadoCompartirPantalla {
  if (p.esModerador) return { mostrar: false, etiqueta: null, detenerPorPermisoRetirado: false };
  const permitido = puedePublicar({ permissions: p.permisos }, FUENTE.pantalla);
  if (!permitido) {
    return { mostrar: false, etiqueta: null, detenerPorPermisoRetirado: p.compartiendo };
  }
  return { mostrar: true, etiqueta: p.compartiendo ? "Dejar de compartir" : "Compartir pantalla", detenerPorPermisoRetirado: false };
}

export type ModoVista = "full" | "split" | "mini";

/** Acciones de vista que deben verse SIEMPRE como botones directos (sin depender del menú "Más opciones").
 *  - split: el panel es estrecho; "Agrandar" (full) y "Minimizar" (mini) quedan a la vista.
 *  - mini y full: sin cambios (la ventanita ya tiene Dividir/Agrandar; full usa el menú). */
export function accionesDirectasVista(modo: ModoVista): ModoVista[] {
  return modo === "split" ? ["full", "mini"] : [];
}

/** Mensaje claro para los errores del navegador al compartir pantalla. */
export function mensajeErrorPantalla(e: unknown): string {
  const nombre = (e as { name?: string } | null)?.name || "";
  if (nombre === "NotAllowedError" || nombre === "AbortError") {
    return "No se compartió la pantalla: cancelaste la selección o el navegador no dio permiso.";
  }
  if (nombre === "NotSupportedError" || nombre === "TypeError") {
    return "Este navegador o dispositivo no permite compartir pantalla. Prueba desde una computadora con Chrome, Edge o Firefox.";
  }
  if (nombre === "NotReadableError") {
    return "No se pudo leer la pantalla seleccionada. Cierra otras apps que la estén usando e inténtalo de nuevo.";
  }
  return "No se pudo compartir la pantalla. Inténtalo de nuevo.";
}
