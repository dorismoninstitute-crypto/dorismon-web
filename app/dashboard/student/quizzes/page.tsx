"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { studentApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, PlanLockedCard } from "@/components/ui";
import AvisoCruzado from "@/components/AvisoCruzado";  // V3.9.42

export default function StudentQuizzesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [blockedByPlan, setBlockedByPlan] = useState(false);

  useEffect(() => {
    studentApi.quizzes()
      .then((d: any) => {
        const list = Array.isArray(d) ? d : safeArray(d?.items);
        setItems(list);
        setBlockedByPlan(!!d?.blocked_by_plan);
        setLoading(false);
      })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  // V2.9: Si el plan no incluye quizzes
  if (blockedByPlan) {
    return (
      <>
        <PageHeader title="Quizzes" subtitle="Evaluá tu progreso" />
        <AvisoCruzado desde="quizzes" />
        <PlanLockedCard
          title="Los quizzes no están en tu plan"
          message="Los quizzes evaluativos están disponibles a partir del plan Professional. Mejora tu plan para acceder."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Quizzes" subtitle="Evaluá tu progreso con quizzes automáticos" />
      {/* V3.9.42: para que no se le pasen las tareas del otro menú */}
      <AvisoCruzado desde="quizzes" />
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
