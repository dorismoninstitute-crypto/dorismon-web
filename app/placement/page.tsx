"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { placement, auth, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, Button, Card, CardBody, PageHeader } from "@/components/ui";

export default function PlacementTestPage() {
  const router = useRouter();
  const [step, setStep] = useState<"intro" | "test" | "result">("intro");
  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!auth.isLoggedIn()) { router.push("/login"); return; }
    // Verificar si ya hizo el placement
    placement.status().then((s: any) => {
      if (s.completed) {
        // Ya lo hizo, ir al dashboard
        router.replace("/dashboard/student");
        return;
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [router]);

  const startTest = async () => {
    setLoading(true);
    try {
      const qs = await placement.questions();
      setQuestions(safeArray(qs));
      setStep("test");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (questionId: number, option: string) => {
    setAnswers({ ...answers, [questionId]: option });
  };

  const next = () => {
    if (current < questions.length - 1) setCurrent(current + 1);
  };
  const prev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const submitTest = async () => {
    setSubmitting(true);
    try {
      const body = {
        answers: Object.keys(answers).map(qid => ({
          question_id: parseInt(qid),
          selected_option: answers[parseInt(qid)],
        })),
      };
      const r = await placement.submit(body);
      setResult(r);
      setStep("result");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen message="Cargando test..." />;
  if (err) return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <div className="max-w-md w-full">
        <ErrorBox message={err} />
        <Button onClick={() => window.location.reload()} className="w-full mt-4">Reintentar</Button>
      </div>
    </div>
  );

  // INTRO
  if (step === "intro") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-50 to-accent-50">
        <Card className="max-w-2xl w-full">
          <CardBody className="text-center py-10 px-8">
            <div className="text-6xl mb-4">🎯</div>
            <h1 className="text-3xl font-bold tracking-tight mb-3">Test de nivel</h1>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Antes de comenzar tu experiencia en Dorismon, necesitamos conocer tu nivel actual de inglés.
              Este test tiene <strong>15 preguntas de opción múltiple</strong> y te tomará aproximadamente <strong>10-15 minutos</strong>.
            </p>
            <div className="bg-slate-50 rounded-lg p-5 mb-6 text-left">
              <h3 className="font-bold mb-3 text-sm uppercase text-slate-500 tracking-wider">Recomendaciones</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>✓ Respondé sin ayuda externa, queremos saber tu nivel real</li>
                <li>✓ Si no sabés una respuesta, hacé tu mejor intento</li>
                <li>✓ Las preguntas van de fáciles a difíciles</li>
                <li>✓ Al final, te asignaremos un nivel CEFR (A1 a C1)</li>
              </ul>
            </div>
            <Button onClick={startTest} size="lg" className="w-full">
              Comenzar test →
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // RESULTADO
  if (step === "result" && result) {
    const levelColors: any = {
      A1: "from-emerald-500 to-emerald-700",
      A2: "from-teal-500 to-teal-700",
      B1: "from-brand-500 to-brand-700",
      B2: "from-purple-500 to-purple-700",
      C1: "from-orange-500 to-orange-700",
    };
    const code = result.suggested_level_code;
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="max-w-2xl w-full overflow-hidden">
          <div className={`bg-gradient-to-br ${levelColors[code] || "from-brand-500 to-brand-700"} text-white p-10 text-center`}>
            <div className="text-6xl mb-2">🎉</div>
            <p className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">Tu nivel asignado</p>
            <h1 className="text-6xl font-bold tracking-tighter mb-2">{code}</h1>
            <p className="text-xl font-semibold opacity-90">{result.suggested_level_name}</p>
          </div>
          <CardBody className="py-8">
            <div className="grid grid-cols-2 gap-4 mb-6 text-center">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Puntaje</p>
                <p className="text-3xl font-bold text-brand-600">{Math.round(result.score_pct)}%</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Correctas</p>
                <p className="text-3xl font-bold text-emerald-600">{result.correct_count}/{result.total_questions}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold mb-3 text-sm uppercase text-slate-500 tracking-wider">Desempeño por nivel</h3>
              <div className="space-y-2">
                {Object.entries(result.level_breakdown || {}).map(([lvl, d]: any) => (
                  <div key={lvl} className="flex items-center gap-3">
                    <span className="w-10 font-bold text-sm">{lvl}</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-600"
                        style={{ width: `${(d.correct / (d.total || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-12 text-right">{d.correct}/{d.total}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Tu nivel sugerido es <strong>{code} — {result.suggested_level_name}</strong>.
              Un coordinador académico te asignará un profesor y comenzarás tu plan de estudio personalizado.
            </p>

            <Button onClick={() => router.push("/dashboard/student")} size="lg" className="w-full">
              Ir a mi dashboard →
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // TEST
  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;
  const allAnswered = Object.keys(answers).length === questions.length;
  const options = [
    { key: "a", text: q?.option_a },
    { key: "b", text: q?.option_b },
    { key: "c", text: q?.option_c },
    { key: "d", text: q?.option_d },
  ];

  return (
    <div className="min-h-screen p-4 bg-slate-50">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Progreso */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-semibold text-slate-700">Pregunta {current + 1} de {questions.length}</span>
            <span className="text-slate-500">{Object.keys(answers).length} respondidas</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Pregunta */}
        <Card>
          <CardBody className="p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-3">{q?.skill}</p>
            <h2 className="text-xl md:text-2xl font-bold mb-6 leading-relaxed">{q?.statement}</h2>

            <div className="space-y-2 mb-6">
              {options.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => selectAnswer(q.id, opt.key)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all font-medium ${
                    answers[q.id] === opt.key
                      ? "border-brand-600 bg-brand-50 text-brand-900"
                      : "border-slate-200 bg-white hover:border-brand-300"
                  }`}
                >
                  <span className="inline-flex w-8 h-8 rounded-full bg-slate-100 items-center justify-center font-bold text-sm mr-3">
                    {opt.key.toUpperCase()}
                  </span>
                  {opt.text}
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={prev} disabled={current === 0}>← Anterior</Button>
              {current < questions.length - 1 ? (
                <Button onClick={next} disabled={!answers[q?.id]} className="flex-1">
                  Siguiente →
                </Button>
              ) : (
                <Button
                  onClick={submitTest}
                  disabled={!allAnswered || submitting}
                  variant="accent"
                  className="flex-1"
                >
                  {submitting ? "Calculando..." : "Finalizar y ver resultado"}
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        {!allAnswered && current === questions.length - 1 && (
          <p className="text-center text-sm text-amber-600 mt-3">
            Te faltan {questions.length - Object.keys(answers).length} preguntas por responder
          </p>
        )}
      </div>
    </div>
  );
}
