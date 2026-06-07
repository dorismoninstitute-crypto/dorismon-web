"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { studentApi, safeArray, safeObj } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Button, Input, Textarea, SuccessBox } from "@/components/ui";

export default function TakeQuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = parseInt(params?.id as string);
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    studentApi.quiz(quizId)
      .then(d => { setQuiz(d); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, [quizId]);

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        answers: Object.keys(answers).map(qid => ({
          question_id: parseInt(qid), answer: answers[parseInt(qid)],
        })),
      };
      const r = await studentApi.submitQuiz(quizId, payload);
      setResult(r);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;
  if (!quiz) return <ErrorBox message="Quiz no encontrado" />;
  const questions = safeArray(quiz.questions);

  if (result) {
    return (
      <>
        <PageHeader title="Resultado del quiz" />
        <Card>
          <CardBody className="text-center py-12">
            <div className={`text-7xl mb-4`}>{result.passed ? "🎉" : "📚"}</div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">{Math.round(result.score)}%</h2>
            <p className={`text-base font-semibold ${result.passed ? "text-emerald-600" : "text-orange-600"} mb-2`}>
              {result.passed ? "¡Aprobaste!" : "No alcanzaste el mínimo"}
            </p>
            <p className="text-sm text-slate-500 mb-6">
              {result.earned_points} de {result.total_points} puntos
            </p>
            <Button onClick={() => router.push("/dashboard/student/quizzes")}>Volver a quizzes</Button>
          </CardBody>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title={quiz.title} subtitle={quiz.description} />
      <div className="space-y-4">
        {questions.map((q: any, i: number) => (
          <Card key={q.id}>
            <CardBody>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{q.statement}</p>
                  <p className="text-xs text-slate-500 mt-1">{q.points} puntos</p>
                </div>
              </div>

              <div className="ml-11">
                {q.type === "multiple_choice" && safeArray(q.options).map((opt: string, j: number) => (
                  <label key={j} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                      className="w-4 h-4 text-brand-600"
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
                {q.type === "true_false" && ["True", "False"].map(opt => (
                  <label key={opt} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
                {(q.type === "fill_blank" || q.type === "short_answer") && (
                  q.type === "short_answer" ? (
                    <Textarea
                      placeholder="Tu respuesta..."
                      value={answers[q.id] || ""}
                      onChange={(e: any) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    />
                  ) : (
                    <Input
                      placeholder="Tu respuesta..."
                      value={answers[q.id] || ""}
                      onChange={(e: any) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    />
                  )
                )}
              </div>
            </CardBody>
          </Card>
        ))}

        <Button onClick={submit} disabled={submitting || Object.keys(answers).length === 0} size="lg" className="w-full">
          {submitting ? "Enviando..." : "Enviar quiz"}
        </Button>
      </div>
    </>
  );
}
