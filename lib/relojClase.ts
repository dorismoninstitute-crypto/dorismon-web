/**
 * GATE 6F-A.1 — Reloj de la clase (para el temporizador).
 *
 * El temporizador guarda su inicio con la hora del SERVIDOR. Usar el reloj del
 * teléfono para compararlo falla si ese reloj está adelantado o atrasado (+2 min
 * → "¡Tiempo!" enseguida; −2 min → congelado en la duración completa).
 *
 * Aquí se estima la hora del servidor sin depender del reloj del dispositivo:
 *   1. se pide la hora al servidor unas pocas veces (GET /video/hora);
 *   2. de cada respuesta se mide la ida y vuelta con un reloj MONOTÓNICO
 *      (performance.now: no salta si alguien cambia la hora del teléfono);
 *   3. se usa la muestra más rápida (la más precisa): hora del servidor +
 *      la mitad de su ida y vuelta, anclada al instante monotónico de llegada;
 *   4. desde ahí, la hora del servidor avanza con el reloj monotónico.
 * Nunca se usa una hora de servidor que venga en los metadatos de la sala
 * (puede ser vieja: tras una reconexión llegaba una y descuadraba todo).
 *
 * Funciones puras: el reloj se pasa como parámetro (se prueban con relojes falsos).
 */

export type Muestra = {
  envio: number;     // reloj monotónico al pedir
  llegada: number;   // reloj monotónico al recibir
  servidor: number;  // hora del servidor (ms) que vino en la respuesta
};

export type Referencia = {
  servidor: number;  // hora estimada del servidor…
  mono: number;      // …en este instante del reloj monotónico
  idaVuelta: number; // de la muestra elegida (ms): el error máximo es la mitad
};

/** Elige la muestra con menor ida y vuelta. null si no hay ninguna válida. */
export function referenciaDe(muestras: Muestra[]): Referencia | null {
  let mejor: Muestra | null = null;
  for (const m of muestras) {
    if (![m.envio, m.llegada, m.servidor].every((n) => typeof n === "number" && isFinite(n))) continue;
    if (m.llegada < m.envio) continue;
    if (!mejor || m.llegada - m.envio < mejor.llegada - mejor.envio) mejor = m;
  }
  if (!mejor) return null;
  const idaVuelta = mejor.llegada - mejor.envio;
  return { servidor: mejor.servidor + idaVuelta / 2, mono: mejor.llegada, idaVuelta };
}

/** Hora del servidor ahora, según la referencia y el reloj monotónico. */
export function horaServidor(ref: Referencia, monoAhora: number): number {
  return ref.servidor + (monoAhora - ref.mono);
}

/** Si una nueva sincronización falla (null), se conserva la última referencia
 *  válida: sigue avanzando con el reloj monotónico y NUNCA se vuelve al reloj
 *  del dispositivo. */
export function conservarReferencia(previa: Referencia | null, nueva: Referencia | null): Referencia | null {
  return nueva ?? previa;
}

/** Si la PRIMERA sincronización falla: estos reintentos y nada más (sin sondeo
 *  continuo). Después solo se reintenta con los eventos existentes (reconectar,
 *  volver a la pestaña, un temporizador nuevo). */
export const REINTENTOS_RELOJ_MS = [2000, 5000, 10000] as const;

/** Pide la hora al servidor `veces` veces (en serie) y devuelve la referencia. */
export async function sincronizar(
  pedirHora: () => Promise<number>,
  mono: () => number,
  veces = 3,
): Promise<Referencia | null> {
  const muestras: Muestra[] = [];
  for (let i = 0; i < veces; i++) {
    try {
      const envio = mono();
      const servidor = await pedirHora();
      muestras.push({ envio, llegada: mono(), servidor });
    } catch { /* una muestra perdida no impide usar las demás */ }
  }
  return referenciaDe(muestras);
}
