"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { LoadingScreen, PageHeader, Card, CardBody, showToast } from "@/components/ui";
import { Sparkles, AlertTriangle, Copy, Check, RefreshCw, FileQuestion, BookOpen, ClipboardList, Save } from "lucide-react";
import { teacherApi, safeArray } from "@/lib/api";

/**
 * V3.9.31 — Fábrica de contenido con IA.
 *
 * Eliges tema y nivel, la IA propone el contenido completo, y TÚ lo revisas
 * antes de publicarlo. Nunca se publica solo: la IA se equivoca y un error
 * en el material de un curso se nota.
 */

const TIPOS = [
  { key: "quiz", label: "Quiz", Icon: FileQuestion, desc: "Preguntas de opción múltiple con su explicación" },
  { key: "lesson", label: "Lección", Icon: BookOpen, desc: "Explicación, ejemplos y errores comunes" },
  { key: "assignment", label: "Tarea", Icon: ClipboardList, desc: "Un ejercicio para que entreguen" },
];

const NIVELES = ["A1", "A2", "B1", "B2", "C1"];

const EJEMPLOS: Record<string, string[]> = {
  A1: ["Verbo to be", "Los números", "Saludos y presentaciones"],
  A2: ["Pasado simple", "Comparativos", "Rutina diaria"],
  B1: ["Presente perfecto", "Condicionales", "Hablar del futuro"],
  B2: ["Voz pasiva", "Estilo indirecto", "Phrasal verbs comunes"],
  C1: ["Inversión gramatical", "Lenguaje formal", "Modismos avanzados"],
};

export default function GenerarContenidoPage() {
  const [listo, setListo] = useState<boolean | null>(null);
  const [tipo, setTipo] = useState("quiz");
  const [tema, setTema] = useState("");
  const [nivel, setNivel] = useState("B1");
  const [cantidad, setCantidad] = useState(10);
  const [generando, setGenerando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [copiado, setCopiado] = useState(false);
  // V3.9.33 — Guardar el quiz de verdad, no solo copiarlo
  const [niveles, setNiveles] = useState<any[]>([]);
  const [nivelDestino, setNivelDestino] = useState<string>("");
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState<any>(null);

  useEffect(() => {
    api("/ai/status", { auth: true })
      .then((r: any) => setListo(!!r?.ready))
      .catch(() => setListo(false));
    // Los niveles donde el profesor puede publicar
    api("/teacher/my-levels", { auth: true })
      .then((r: any) => {
        const l = safeArray(r?.items || r);
        setNiveles(l);
        if (l.length === 1) setNivelDestino(String(l[0].id));
      })
      .catch(() => {});
  }, []);

  const crearQuiz = async () => {
    if (!nivelDestino) {
      showToast("error", "Elige a qué nivel pertenece el quiz");
      return;
    }
    setGuardando(true);
    try {
      const r: any = await api("/ai/quiz/create", {
        method: "POST", auth: true,
        body: { quiz: resultado, level_id: Number(nivelDestino) },
      });
      setGuardado(r);
      showToast("success", `✅ Quiz creado con ${r.questions} preguntas. Revísalo y publícalo.`);
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setGuardando(false);
    }
  };

  const generar = async () => {
    if (!tema.trim()) {
      showToast("error", "Escribe sobre qué tema quieres el contenido");
      return;
    }
    setGenerando(true);
    setResultado(null);
    setGuardado(null);
    try {
      const body: any = { topic: tema.trim(), level: nivel };
      if (tipo === "quiz") body.count = cantidad;
      const r = await api(`/ai/${tipo}`, { method: "POST", auth: true, body });
      setResultado(r);
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setGenerando(false);
    }
  };

  const copiar = () => {
    let texto = "";
    if (tipo === "quiz") {
      texto = `${resultado.title}\n${resultado.description}\n\n`;
      resultado.questions.forEach((q: any, i: number) => {
        texto += `${i + 1}. ${q.text}\n`;
        q.options.forEach((o: string, j: number) => {
          texto += `   ${String.fromCharCode(97 + j)}) ${o}${j === q.correct_index ? "  ✓" : ""}\n`;
        });
        if (q.explanation) texto += `   → ${q.explanation}\n`;
        texto += "\n";
      });
    } else if (tipo === "lesson") {
      texto = `${resultado.title}\n\n${resultado.summary}\n\n${resultado.explanation}\n\n`;
      texto += "EJEMPLOS:\n";
      (resultado.examples || []).forEach((e: any) => { texto += `• ${e.en} — ${e.es}\n`; });
      texto += "\nERRORES COMUNES:\n";
      (resultado.common_mistakes || []).forEach((m: any) => {
        texto += `✗ ${m.wrong}\n✓ ${m.right}\n  ${m.why}\n\n`;
      });
      texto += "PRÁCTICA:\n";
      (resultado.practice || []).forEach((p: string, i: number) => { texto += `${i + 1}. ${p}\n`; });
    } else {
      texto = `${resultado.title}\n\n${resultado.instructions}\n\nPuntaje: ${resultado.max_score}`;
    }
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
    showToast("success", "Copiado. Pégalo donde lo necesites.");
  };

  if (listo === null) return <LoadingScreen />;

  return (
    <div>
      <PageHeader
        title="Generar contenido"
        subtitle="La IA propone, tú revisas y publicas. Nunca se publica solo."
      />

      {!listo && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-6 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-amber-900 mb-1">Falta conectar la IA</p>
            <p className="text-amber-800 leading-relaxed">
              Agrega la variable <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">GEMINI_API_KEY</code>{" "}
              en Render (dorismon-api → Environment) y espera 2-3 minutos a que reinicie.
              La clave se saca gratis en Google AI Studio, sin tarjeta.
            </p>
          </div>
        </div>
      )}

      <Card className="mb-6">
        <CardBody>
          <label className="block text-sm font-semibold text-slate-700 mb-2">¿Qué quieres crear?</label>
          <div className="grid sm:grid-cols-3 gap-2 mb-5">
            {TIPOS.map((t) => (
              <button
                key={t.key}
                onClick={() => { setTipo(t.key); setResultado(null); }}
                className={`text-left p-3 rounded-xl border-2 transition ${
                  tipo === t.key ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <t.Icon className={`w-5 h-5 mb-1.5 ${tipo === t.key ? "text-brand-600" : "text-slate-400"}`} />
                <p className="font-bold text-sm text-slate-800">{t.label}</p>
                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nivel</label>
              <div className="flex gap-1.5 flex-wrap">
                {NIVELES.map((n) => (
                  <button
                    key={n}
                    onClick={() => setNivel(n)}
                    className={`text-sm font-bold px-3.5 py-2 rounded-lg border-2 transition ${
                      nivel === n ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            {tipo === "quiz" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Cantidad de preguntas
                </label>
                <input
                  type="number" min={3} max={20} value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value))}
                  className="w-28 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>

          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tema</label>
          <input
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !generando) generar(); }}
            placeholder="Ej: Presente perfecto, Phrasal verbs, Pedir comida en un restaurante..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm mb-2"
          />
          <div className="flex gap-1.5 flex-wrap mb-5">
            <span className="text-xs text-slate-400 self-center">Ideas:</span>
            {(EJEMPLOS[nivel] || []).map((e) => (
              <button
                key={e}
                onClick={() => setTema(e)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full transition"
              >
                {e}
              </button>
            ))}
          </div>

          <button
            onClick={generar}
            disabled={generando || !listo}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm px-6 py-3 rounded-xl transition"
          >
            {generando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generando ? "Generando..." : "Generar"}
          </button>
          {generando && (
            <p className="text-xs text-slate-500 mt-2">Puede tardar unos segundos.</p>
          )}
        </CardBody>
      </Card>

      {resultado && (
        <Card>
          <CardBody>
            <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
              <div className="min-w-0">
                <h3 className="font-bold text-lg text-slate-800">{resultado.title}</h3>
                {resultado.summary && <p className="text-sm text-slate-600 mt-1">{resultado.summary}</p>}
                {resultado.description && <p className="text-sm text-slate-600 mt-1">{resultado.description}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={copiar}
                  className="inline-flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg transition"
                >
                  {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiado ? "Copiado" : "Copiar todo"}
                </button>
                <button
                  onClick={generar}
                  className="inline-flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Otra versión
                </button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4 text-xs text-amber-800">
              ⚠️ Revisa antes de publicar. La IA se equivoca, y un error en el material de un curso se nota.
            </div>

            {/* V3.9.33 — Crear el quiz de verdad, sin copiar y pegar */}
            {tipo === "quiz" && !guardado && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
                <p className="font-bold text-sm text-emerald-900 mb-1">
                  ¿Te gusta? Créalo con un toque
                </p>
                <p className="text-xs text-emerald-800 mb-3 leading-relaxed">
                  Se guarda <strong>sin publicar</strong>: nadie lo ve hasta que tú lo apruebes.
                </p>
                <div className="flex gap-2 flex-wrap items-end">
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                      Nivel del quiz
                    </label>
                    <select
                      value={nivelDestino}
                      onChange={(e) => setNivelDestino(e.target.value)}
                      className="border border-emerald-200 rounded-lg px-3 py-2 text-sm bg-white"
                    >
                      <option value="">— Elige el nivel —</option>
                      {niveles.map((l: any) => (
                        <option key={l.id} value={l.id}>
                          {l.code} — {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={crearQuiz}
                    disabled={guardando || !nivelDestino}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition"
                  >
                    <Save className="w-4 h-4" />
                    {guardando ? "Creando..." : "Crear este quiz"}
                  </button>
                </div>
              </div>
            )}

            {guardado && (
              <div className="bg-emerald-600 text-white rounded-xl p-4 mb-5">
                <p className="font-bold text-sm mb-1">✅ Quiz creado</p>
                <p className="text-xs text-emerald-50 leading-relaxed">
                  &ldquo;{guardado.title}&rdquo; con {guardado.questions} preguntas.
                  Está <strong>sin publicar</strong>: ve a Quizzes para revisarlo y publicarlo.
                </p>
              </div>
            )}

            {/* QUIZ */}
            {tipo === "quiz" && (
              <div className="space-y-4">
                {(resultado.questions || []).map((q: any, i: number) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4">
                    <p className="font-semibold text-sm text-slate-800 mb-3">{i + 1}. {q.text}</p>
                    <div className="space-y-1.5 mb-2">
                      {q.options.map((o: string, j: number) => (
                        <div
                          key={j}
                          className={`text-sm px-3 py-2 rounded-lg ${
                            j === q.correct_index
                              ? "bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200"
                              : "bg-slate-50 text-slate-600"
                          }`}
                        >
                          {String.fromCharCode(97 + j)}) {o}
                          {j === q.correct_index && " ✓"}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <p className="text-xs text-slate-500 italic">{q.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* LECCIÓN */}
            {tipo === "lesson" && (
              <div className="space-y-5">
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {resultado.explanation}
                </div>
                {(resultado.examples || []).length > 0 && (
                  <div>
                    <p className="font-bold text-sm text-slate-800 mb-2">Ejemplos</p>
                    <div className="space-y-1.5">
                      {resultado.examples.map((e: any, i: number) => (
                        <div key={i} className="bg-sky-50 rounded-lg px-3 py-2">
                          <p className="text-sm text-sky-900 font-medium">{e.en}</p>
                          <p className="text-xs text-sky-700">{e.es}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(resultado.common_mistakes || []).length > 0 && (
                  <div>
                    <p className="font-bold text-sm text-slate-800 mb-2">Errores comunes</p>
                    <div className="space-y-2">
                      {resultado.common_mistakes.map((m: any, i: number) => (
                        <div key={i} className="border border-slate-200 rounded-lg px-3 py-2">
                          <p className="text-sm text-rose-600">✗ {m.wrong}</p>
                          <p className="text-sm text-emerald-700">✓ {m.right}</p>
                          {m.why && <p className="text-xs text-slate-500 mt-1">{m.why}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(resultado.practice || []).length > 0 && (
                  <div>
                    <p className="font-bold text-sm text-slate-800 mb-2">Práctica</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700">
                      {resultado.practice.map((p: string, i: number) => <li key={i}>{p}</li>)}
                    </ol>
                  </div>
                )}
              </div>
            )}

            {/* TAREA */}
            {tipo === "assignment" && (
              <div>
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-3">
                  {resultado.instructions}
                </div>
                <p className="text-xs text-slate-500">Puntaje sugerido: {resultado.max_score}</p>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
