"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { studentApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button } from "@/components/ui";

export default function StudentQuizzesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    studentApi.quizzes()
      .then(d => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader title="Quizzes" subtitle="Evaluá tu progreso con quizzes automáticos" />
      {items.length === 0 ? <EmptyState icon="✓" title="Sin quizzes disponibles" /> : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((q: any) => (
            <Card key={q.id}>
              <CardBody>
                <div className="flex items-center gap-2 mb-2">
                  {q.passed === true ? <Badge variant="success">Aprobado</Badge> :
                   q.passed === false ? <Badge variant="danger">Reprobado</Badge> :
                   <Badge variant="default">No intentado</Badge>}
                  <Badge>Mínimo: {q.passing_score}%</Badge>
                </div>
                <h3 className="font-bold text-base mb-1">{q.title}</h3>
                {q.description && <p className="text-sm text-slate-600 mb-3">{q.description}</p>}
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                  <span>📝 {q.question_count} preguntas</span>
                  <span>🔄 {q.attempts_used}/{q.max_attempts} intentos</span>
                  {q.last_score !== null && <span>Última: {q.last_score}%</span>}
                </div>
                <Link href={`/dashboard/student/quizzes/${q.id}`}>
                  <Button className="w-full">
                    {q.attempts_used === 0 ? "Comenzar quiz" : "Intentar nuevamente"}
                  </Button>
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
