"use client";
import { useEffect, useState } from "react";
import { teacherApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge } from "@/components/ui";

export default function TeacherQuizzesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    teacherApi.quizzes()
      .then(d => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader title="Quizzes" subtitle={`${items.length} quizzes`} />
      {items.length === 0 ? <EmptyState icon="✓" title="Sin quizzes todavía" /> : (
        <div className="space-y-2">
          {items.map((q: any) => (
            <Card key={q.id}>
              <CardBody>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="font-bold">{q.title}</h3>
                  <Badge variant={q.is_published ? "success" : "default"}>
                    {q.is_published ? "Publicado" : "Borrador"}
                  </Badge>
                </div>
                {q.description && <p className="text-sm text-slate-600 mb-2">{q.description}</p>}
                <p className="text-xs text-slate-500">
                  {q.question_count} preguntas · {q.attempts} intentos · Mínimo {q.passing_score}%
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
