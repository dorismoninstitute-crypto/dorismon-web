"use client";
// ══ GATE 5A — UNA SOLA EXPERIENCIA DE CARGA ══
//
// Antes cada pantalla (layout, /dashboard, panel del rol…) montaba su propio
// LoadingScreen con su propio reloj de 4 s: una carga lenta se veía
// "spinner → frase → spinner → frase → panel". Ahora hay UN controlador en la
// raíz. Cada LoadingScreen solo dice "estoy esperando" mientras está montado;
// el reloj pertenece a la SESIÓN de carga, no a cada pantalla.
//
//   0–600 ms   nada encima (el contenido/esqueleto de la página sigue a la vista)
//   600 ms–3 s indicador discreto (barra fina arriba + aviso en el sitio)
//   > 3 s      pantalla motivacional, con fundido
//   > 12 s     "Está tomando un poco más de tiempo de lo habitual…"
//   > 40 s     "La conexión está tardando más de lo normal." + Reintentar
//
// Nunca hay progreso inventado ni esperas añadidas a una carga rápida. Si la
// pantalla motivacional llegó a verse, se queda como mucho hasta cumplir
// 500 ms visible (para que no "parpadee") y sale con un fundido corto.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type FaseCarga = "inactiva" | "espera" | "discreta" | "motivacional";

const DISCRETA_MS = 600;
const MOTIVACIONAL_MS = 3000;
const LARGA_1_MS = 12000;
const LARGA_2_MS = 40000;
const GRACIA_MS = 150;          // salto layout → página sin reiniciar el reloj
const MIN_VISIBLE_MS = 500;     // estabilización máxima si la frase llegó a verse
const SALIDA_MS = 250;          // fundido de salida
const ROTAR_MS = 6000;          // cambio de frase

type Ctx = {
  registrar: () => number;
  liberar: (id: number) => void;
  fase: FaseCarga;
};
const CargaCtx = createContext<Ctx | null>(null);

/** Registra "estoy esperando" mientras `activo` sea true y el componente esté montado. */
export function useRegistroCarga(activo: boolean = true) {
  const ctx = useContext(CargaCtx);
  useEffect(() => {
    if (!activo || !ctx) return;
    const id = ctx.registrar();
    return () => ctx.liberar(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, ctx?.registrar, ctx?.liberar]);
  return ctx?.fase ?? "inactiva";
}

export const FRASES: { en: string; es: string }[] = [
  // Aprender inglés
  { en: "Every word you learn opens a new door.", es: "Cada palabra que aprendes abre una puerta nueva." },
  { en: "English is a skill, and skills grow with practice.", es: "El inglés es una habilidad, y las habilidades crecen con la práctica." },
  { en: "Learning a language is learning a new way to see the world.", es: "Aprender un idioma es aprender otra forma de ver el mundo." },
  { en: "Today is a great day to learn something new.", es: "Hoy es un gran día para aprender algo nuevo." },
  // Progreso
  { en: "Small steps every day lead to big results.", es: "Pequeños pasos cada día llevan a grandes resultados." },
  { en: "Progress, not perfection.", es: "Progreso, no perfección." },
  { en: "Look how far you've come.", es: "Mira todo lo que has avanzado." },
  { en: "Every class brings you closer to your goal.", es: "Cada clase te acerca más a tu meta." },
  // Constancia
  { en: "Consistency beats intensity.", es: "La constancia vale más que la intensidad." },
  { en: "A little every day is better than a lot once in a while.", es: "Un poco cada día es mejor que mucho de vez en cuando." },
  { en: "Keep going. You're building something that lasts.", es: "Sigue adelante. Estás construyendo algo que perdura." },
  { en: "Habits turn effort into results.", es: "Los hábitos convierten el esfuerzo en resultados." },
  // Confianza al hablar
  { en: "Your voice matters. Use it.", es: "Tu voz importa. Úsala." },
  { en: "Mistakes are proof that you are trying.", es: "Los errores son la prueba de que lo estás intentando." },
  { en: "Speak up. Every conversation makes you stronger.", es: "Habla. Cada conversación te hace más fuerte." },
  { en: "Confidence comes from practice, not from perfection.", es: "La confianza viene de practicar, no de ser perfecto." },
  // Práctica
  { en: "Practice makes progress.", es: "La práctica hace el progreso." },
  { en: "Read a little, listen a little, speak a little — every day.", es: "Lee un poco, escucha un poco, habla un poco — cada día." },
  { en: "The more you practice, the more natural it feels.", es: "Cuanto más practicas, más natural se siente." },
  { en: "Repetition is the mother of learning.", es: "La repetición es la madre del aprendizaje." },
  // Comunicación
  { en: "Language connects people.", es: "El idioma conecta a las personas." },
  { en: "Communication is more important than perfect grammar.", es: "Comunicarte importa más que una gramática perfecta." },
  { en: "Every new phrase is a new way to connect.", es: "Cada frase nueva es una nueva forma de conectar." },
  { en: "Listen to understand, speak to connect.", es: "Escucha para entender, habla para conectar." },
  // Metas
  { en: "Your goals are closer than you think.", es: "Tus metas están más cerca de lo que crees." },
  { en: "Dream big, study every day.", es: "Sueña en grande, estudia cada día." },
  { en: "Your English journey continues here.", es: "Tu camino en inglés continúa aquí." },
  { en: "The best time to learn is now.", es: "El mejor momento para aprender es ahora." },
  { en: "Invest in yourself. It always pays off.", es: "Invierte en ti. Siempre vale la pena." },
  { en: "One day, the words will just flow.", es: "Un día, las palabras simplemente fluirán." },
];

function otraFrase(actual: number | null): number {
  if (FRASES.length < 2) return 0;
  let i = Math.floor(Math.random() * FRASES.length);
  if (i === actual) i = (i + 1) % FRASES.length;  // nunca la misma dos veces seguidas
  return i;
}

export function CargaProvider({ children }: { children: React.ReactNode }) {
  const activos = useRef(new Set<number>());
  const siguienteId = useRef(1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sesion = useRef(false);
  const motivDesde = useRef<number | null>(null);
  const inicio = useRef(0);

  const [fase, setFase] = useState<FaseCarga>("inactiva");
  const [largo, setLargo] = useState<0 | 1 | 2>(0);
  const [saliendo, setSaliendo] = useState(false);
  const [cerrada, setCerrada] = useState(false);
  const [frase, setFrase] = useState<number | null>(null);

  const limpiarTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (finTimer.current) { clearTimeout(finTimer.current); finTimer.current = null; }
  };

  const reiniciar = useCallback(() => {
    limpiarTimers();
    sesion.current = false;
    motivDesde.current = null;
    setFase("inactiva"); setLargo(0); setSaliendo(false); setCerrada(false); setFrase(null);
  }, []);

  // Programa los cambios de fase que falten, siempre medidos desde el INICIO
  // de la sesión (nunca desde que montó cada pantalla).
  const programar = () => {
    timers.current.forEach(clearTimeout);
    const pasado = Date.now() - inicio.current;
    const en = (ms: number, fn: () => void) => {
      if (pasado < ms) timers.current.push(setTimeout(fn, ms - pasado));
    };
    timers.current = [];
    en(DISCRETA_MS, () => setFase((f) => (f === "espera" ? "discreta" : f)));
    en(MOTIVACIONAL_MS, () => {
      motivDesde.current = Date.now();
      setFrase((f) => otraFrase(f));
      setFase("motivacional");
    });
    en(LARGA_1_MS, () => setLargo((l) => (l < 1 ? 1 : l)));
    en(LARGA_2_MS, () => setLargo(2));
  };

  const empezarSesion = () => {
    sesion.current = true;
    inicio.current = Date.now();
    setFase("espera"); setLargo(0); setSaliendo(false); setCerrada(false);
    programar();
  };

  const terminar = () => {
    finTimer.current = null;
    if (activos.current.size > 0) return;
    if (motivDesde.current === null) { reiniciar(); return; }   // nunca se vio: sin espera
    const restante = Math.max(0, MIN_VISIBLE_MS - (Date.now() - motivDesde.current));
    timers.current.forEach(clearTimeout);
    timers.current = [];
    finTimer.current = setTimeout(() => {
      if (activos.current.size > 0) { finTimer.current = null; return; }
      setSaliendo(true);
      finTimer.current = setTimeout(() => {
        finTimer.current = null;
        if (activos.current.size === 0) reiniciar(); else setSaliendo(false);
      }, SALIDA_MS);
    }, restante);
  };

  const registrar = useCallback(() => {
    const id = siguienteId.current++;
    activos.current.add(id);
    if (finTimer.current) {
      // Llegó otra espera durante la gracia, la estabilización o la salida:
      // es la MISMA navegación → se sigue con el mismo reloj.
      clearTimeout(finTimer.current); finTimer.current = null; setSaliendo(false);
      if (sesion.current) programar();
    }
    if (!sesion.current) empezarSesion();
    return id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const liberar = useCallback((id: number) => {
    activos.current.delete(id);
    if (activos.current.size === 0 && !finTimer.current) {
      finTimer.current = setTimeout(terminar, GRACIA_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rotación de frases mientras la pantalla motivacional siga visible.
  useEffect(() => {
    if (fase !== "motivacional" || saliendo) return;
    const t = setInterval(() => setFrase((f) => otraFrase(f)), ROTAR_MS);
    return () => clearInterval(t);
  }, [fase, saliendo]);

  useEffect(() => () => limpiarTimers(), []);

  return (
    <CargaCtx.Provider value={{ registrar, liberar, fase: fase === "motivacional" && cerrada ? "discreta" : fase }}>
      {children}
      {fase === "discreta" && <BarraActividad />}
      {fase === "motivacional" && !cerrada && (
        <PantallaMotivacional
          frase={frase}
          largo={largo}
          saliendo={saliendo}
          onCerrar={() => setCerrada(true)}
        />
      )}
      {fase === "motivacional" && cerrada && <BarraActividad />}
      <style>{ESTILOS}</style>
    </CargaCtx.Provider>
  );
}

/** Barra fina e indeterminada arriba: "algo está cargando", sin porcentajes. */
function BarraActividad() {
  return (
    <div className="fixed top-0 inset-x-0 z-[95] h-0.5 overflow-hidden bg-brand-100/60 dm-aparecer" role="progressbar" aria-label="Cargando" aria-busy="true">
      <div className="dm-barra h-full w-1/3 bg-gradient-to-r from-brand-500 via-accent-400 to-brand-500" />
    </div>
  );
}

function PantallaMotivacional({ frase, largo, saliendo, onCerrar }: {
  frase: number | null; largo: 0 | 1 | 2; saliendo: boolean; onCerrar: () => void;
}) {
  // Aparece con fundido (la clase se aplica tras el primer pintado). Con
  // setTimeout y no requestAnimationFrame: si la app está en segundo plano
  // (PWA minimizada) rAF no corre y la pantalla quedaría invisible.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);
  const f = frase !== null ? FRASES[frase] : null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col text-white overflow-hidden transition-opacity duration-300 motion-reduce:transition-none ${
        visible && !saliendo ? "opacity-100" : "opacity-0"
      }`}
      style={{
        background: "linear-gradient(160deg, #0b1530 0%, #12245a 45%, #1e3a8a 100%)",
        paddingTop: "max(1.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1.5rem, env(safe-area-inset-left))",
        paddingRight: "max(1.5rem, env(safe-area-inset-right))",
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Brillo turquesa muy suave */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-24 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-[0.12]" style={{ background: "#14b8a6" }} />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-24 w-[26rem] h-[26rem] rounded-full blur-3xl opacity-[0.10]" style={{ background: "#3b82f6" }} />

      <div className="relative flex-1 flex flex-col items-center justify-center text-center max-w-xl w-full mx-auto">
        {/* Logo oficial SIN modificar: su fondo es opaco, así que va en una
            placa clara y discreta (logo-dorismon-v2 transparente: tarea aparte). */}
        <div className="rounded-2xl bg-white/95 px-4 py-3 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.45)] ring-1 ring-white/20 mb-10">
          <img src="/logo-dorismon.svg" alt="Dorismon Language Institute" className="h-10 md:h-12 w-auto" />
        </div>

        <div className="min-h-[9.5rem] md:min-h-[10.5rem] flex flex-col items-center justify-center">
          {f && (
            <div key={frase ?? -1} className="dm-frase">
              <p className="text-2xl md:text-4xl font-semibold leading-snug tracking-tight">
                “{f.en}”
              </p>
              <p className="mt-3 text-sm md:text-base text-blue-100/70">{f.es}</p>
            </div>
          )}
        </div>

        <div className="mt-10 w-40 h-1 rounded-full bg-white/10 overflow-hidden" aria-hidden="true">
          <div className="dm-barra h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-accent-300 to-transparent" />
        </div>
        <p className="mt-3 text-sm text-blue-100/80">Preparando tu espacio de aprendizaje…</p>

        {largo >= 1 && (
          <div className="mt-6 max-w-sm text-sm text-blue-50/90">
            {largo === 1 ? (
              <p>Está tomando un poco más de tiempo de lo habitual. Seguimos preparando tu espacio.</p>
            ) : (
              <>
                <p>La conexión está tardando más de lo normal.</p>
                <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-5 py-2.5 rounded-xl bg-white text-brand-800 font-bold text-sm shadow-lg hover:bg-blue-50 transition"
                  >
                    Reintentar
                  </button>
                  <button
                    onClick={onCerrar}
                    className="px-4 py-2.5 rounded-xl text-blue-100 hover:text-white text-sm underline-offset-4 hover:underline"
                  >
                    Seguir esperando en segundo plano
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <p className="relative text-center text-xs text-blue-200/50">
        Dorismon Language Institute · Santo Domingo, República Dominicana
      </p>
    </div>
  );
}

const ESTILOS = `
@keyframes dm-barra { 0% { transform: translateX(-120%); } 100% { transform: translateX(320%); } }
@keyframes dm-aparecer { from { opacity: 0; } to { opacity: 1; } }
@keyframes dm-frase { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.dm-barra { animation: dm-barra 1.4s ease-in-out infinite; }
.dm-frase { animation: dm-frase 600ms ease-out both; }
.dm-aparecer { animation: dm-aparecer 300ms ease-out both; }
@media (prefers-reduced-motion: reduce) {
  .dm-barra { animation: none; transform: none; width: 100%; opacity: .5; }
  .dm-frase, .dm-aparecer { animation: none; }
}
`;
