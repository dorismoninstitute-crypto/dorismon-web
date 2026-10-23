// HOTFIX v3.9.76 — pruebas de los controles de Video Dorismon (node:test, sin dependencias nuevas).
// Ejecutar: npm run test:video   (node --experimental-strip-types --test tests/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  FUENTE, puedePublicar, estadoCompartirPantalla, accionesDirectasVista, mensajeErrorPantalla,
} from "../lib/videoControles.ts";

const leer = (rel) => readFileSync(fileURLToPath(new URL(`../${rel}`, import.meta.url)), "utf8").replace(/\r\n/g, "\n");
const cp = leer("components/CallProvider.tsx");
const cre = leer("components/ClassRoomExtras.tsx");

const SIN_PANTALLA = { canPublish: true, canPublishSources: [FUENTE.camara, FUENTE.microfono] };
const CON_PANTALLA = { canPublish: true, canPublishSources: [FUENTE.camara, FUENTE.microfono, FUENTE.pantalla] };
const estudiante = (permisos, compartiendo = false) => estadoCompartirPantalla({ permisos, compartiendo, esModerador: false });

// ----------------------------------------------------------------------------- 1-2. modo dividido
test("1. split mantiene SIEMPRE visible la acción para volver a pantalla completa", () => {
  assert.ok(accionesDirectasVista("split").includes("full"));
});

test("2. split mantiene SIEMPRE visible la acción para minimizar", () => {
  assert.ok(accionesDirectasVista("split").includes("mini"));
});

test("1-2. la cabecera de split pinta esas acciones como botones directos y se ajusta al ancho del panel", () => {
  assert.match(cp, /accionesDirectasVista\(modo\)\.map\(\(destino\) =>/);
  assert.match(cp, /onClick=\{\(\) => onModo\(destino\)\}/);
  assert.match(cp, /destino === "full" \? "Agrandar" : "Minimizar"/);
  // en split la fila se ajusta (flex-wrap) en vez de quedar en una sola línea que se sale del panel
  assert.match(cp, /dividida\s*\n?\s*\? "flex flex-wrap items-center justify-end gap-1\.5 w-full"/);
  assert.match(cp, /\? "ds-cabecera-llamada flex flex-wrap items-center justify-between/);
  // full conserva EXACTAMENTE la cabecera anterior (título en su propia línea en el móvil, GATE 6D)
  assert.match(cp, /: "ds-cabecera-llamada flex flex-wrap sm:flex-nowrap items-center justify-between px-3 sm:px-4 py-2 border-b border-white\/10 flex-shrink-0 gap-x-2 gap-y-1\.5"/);
  assert.match(cp, /: "flex items-center gap-2 min-w-0 w-full sm:w-auto sm:flex-1"/);
  // en split se ocultan las etiquetas largas que dependían del ancho de la VENTANA (lg)
  assert.match(cp, /<span className=\{dividida \? "hidden" : "hidden lg:inline"\}>Participantes<\/span>/);
  assert.match(cp, /<span className=\{dividida \? "hidden" : "hidden lg:inline"\}>Salir<\/span>/);
});

// ----------------------------------------------------------------------------- 3-6. compartir pantalla
test("3. sin permiso real de SCREEN_SHARE el estudiante NO ve un control funcional", () => {
  assert.deepEqual(estudiante(SIN_PANTALLA), { mostrar: false, etiqueta: null, detenerPorPermisoRetirado: false });
  assert.equal(estudiante(null).mostrar, false);
  assert.equal(estudiante({ canPublish: false, canPublishSources: [] }).mostrar, false);
});

test("4. cuando el profesor concede la pantalla, el control aparece (sin compartir todavía)", () => {
  const e = estudiante(CON_PANTALLA);
  assert.equal(e.mostrar, true);
  assert.equal(e.etiqueta, "Compartir pantalla");
  // con canPublish y lista vacía, LiveKit permite todas las fuentes
  assert.equal(estudiante({ canPublish: true, canPublishSources: [] }).mostrar, true);
});

test("5. si el profesor retira el permiso, el control desaparece (y si compartía, se detiene)", () => {
  assert.equal(estudiante(CON_PANTALLA).mostrar, true);
  const retirado = estudiante(SIN_PANTALLA);
  assert.equal(retirado.mostrar, false);
  assert.equal(retirado.detenerPorPermisoRetirado, false);
  assert.equal(estudiante(SIN_PANTALLA, true).detenerPorPermisoRetirado, true);
});

test("6. al compartir, el control pasa a «Dejar de compartir»", () => {
  assert.equal(estudiante(CON_PANTALLA, true).etiqueta, "Dejar de compartir");
});

test("el permiso se lee de LiveKit (reactivo) y la acción usa la pista REAL; nunca empieza sola", () => {
  assert.match(cre, /const permisos = useLocalParticipantPermissions\(\);/);
  assert.match(cre, /const \{ localParticipant, isScreenShareEnabled \} = useLocalParticipant\(\);/);
  assert.match(cre, /await localParticipant\.setScreenShareEnabled\(!isScreenShareEnabled\);/);
  assert.doesNotMatch(cre, /setScreenShareEnabled\(true\)/);
  assert.match(cre, /setError\(mensajeErrorPantalla\(e\)\)/);
  // una sola regla de permisos (la de GATE 6G-C), reutilizada
  assert.match(cre, /export \{ FUENTE, puedePublicar \};/);
  assert.doesNotMatch(cre, /export function puedePublicar/);
  assert.match(cp, /<BotonCompartirPantalla esModerador=\{!!datos\.is_moderator\} \/>/);
});

test("la regla de permisos es la misma que antes (GATE 6G-C)", () => {
  assert.equal(puedePublicar({ permissions: undefined }, FUENTE.pantalla), false);
  assert.equal(puedePublicar({ permissions: { canPublish: false, canPublishSources: [3] } }, FUENTE.pantalla), false);
  assert.equal(puedePublicar({ permissions: { canPublish: true, canPublishSources: [] } }, FUENTE.pantalla), true);
  assert.equal(puedePublicar({ permissions: { canPublish: true, canPublishSources: [1, 2] } }, FUENTE.pantalla), false);
  assert.equal(puedePublicar({ permissions: { canPublish: true, canPublishSources: [3] } }, FUENTE.pantalla), true);
});

test("errores del navegador al compartir pantalla con mensaje claro", () => {
  assert.match(mensajeErrorPantalla({ name: "NotAllowedError" }), /cancelaste|permiso/);
  assert.match(mensajeErrorPantalla({ name: "NotSupportedError" }), /no permite compartir pantalla/);
  assert.match(mensajeErrorPantalla(new Error("x")), /No se pudo compartir la pantalla/);
  assert.match(mensajeErrorPantalla(null), /No se pudo compartir la pantalla/);
});

// ----------------------------------------------------------------------------- 8. móvil (auditoría)
test("8. móvil con permiso de pantalla: la fila de full puede envolver y el botón no desaparece", () => {
  // full: en el móvil la fila envuelve (nada se sale a 320–375 px); desde sm sigue en una línea
  assert.match(cp, /: "flex flex-wrap sm:flex-nowrap items-center justify-end gap-1\.5 flex-shrink-0 ml-auto max-w-full"/);
  assert.doesNotMatch(cp, /"flex items-center gap-1\.5 flex-shrink-0 ml-auto"/);
  // el botón de pantalla en el móvil es solo icono (con nombre accesible); la etiqueta completa desde sm
  assert.match(cre, /aria-label=\{estado\.etiqueta \|\| undefined\}/);
  assert.match(cre, /<span className="hidden sm:inline" data-etiqueta-pantalla="">\{estado\.etiqueta\}<\/span>/);
  // y no está escondido: el propio botón no lleva hidden
  assert.match(cre, /data-compartir-pantalla=\{isScreenShareEnabled \? "activo" : "disponible"\}\s*\n\s*className=\{`inline-flex items-center/);
  // la acción sigue siendo la real de LiveKit
  assert.match(cre, /await localParticipant\.setScreenShareEnabled\(!isScreenShareEnabled\);/);
});

// ----------------------------------------------------------------------------- 7. sin regresiones
test("7. moderadores conservan su comportamiento (sin botón Dorismon nuevo)", () => {
  for (const c of [false, true]) {
    assert.equal(estadoCompartirPantalla({ permisos: CON_PANTALLA, compartiendo: c, esModerador: true }).mostrar, false);
  }
});

test("7. full y mini no ganan acciones directas nuevas", () => {
  assert.deepEqual(accionesDirectasVista("full"), []);
  assert.deepEqual(accionesDirectasVista("mini"), []);
});

test("7. la ventanita (mini) y el menú de full siguen igual", () => {
  // mini: Dividir (solo md+) y Agrandar
  assert.match(cp, /onClick=\{\(\) => onModo\("split"\)\}\s*\n\s*title="Ver el video al lado de la plataforma"/);
  assert.match(cp, /onClick=\{\(\) => onModo\("full"\)\}[\s\S]{0,260}Agrandar/);
  // menú de opciones: dividir/pantalla completa (solo md+) y minimizar
  assert.match(cp, /modo === "split" \? "Ver pantalla completa" : "Ver al lado de la plataforma"/);
  assert.match(cp, /Minimizar y seguir navegando/);
  assert.match(cp, /aria-label="Más opciones"/);
});

test("7. split sigue sin existir en móvil (<768 px) y conserva su ancho", () => {
  assert.match(cp, /if \(m === "split" && typeof window !== "undefined" && window\.innerWidth < 768\) return "full";/);
  assert.match(cp, /md:w-\[min\(42vw,560px\)\]/);
});
