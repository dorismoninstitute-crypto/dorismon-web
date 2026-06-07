"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { studentApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge } from "@/components/ui";

export default function MyCoursesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    studentApi.courses()
      .then(d => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader title="Mis cursos" subtitle={`${items.length} cursos activos`} />
      {items.length === 0 ? <EmptyState icon="📚" title="Sin cursos inscritos" description="Habla con un coordinador para inscribirte." /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((c: any) => (
            <Card key={c.enrollment_id} className="overflow-hidden hover:shadow-md transition">
              <div className="h-24" style={{ background: `linear-gradient(135deg, ${c.course_color} 0%, ${c.course_color}cc 100%)` }} />
              <CardBody>
                <Badge variant="brand" className="mb-2">{c.level_code}</Badge>
                <h3 className="font-bold text-lg tracking-tight mb-1">{c.course_name}</h3>
                <p className="text-sm text-slate-500 mb-3">{c.level_name}</p>
                {c.teacher_name && (
                  <p className="text-xs text-slate-500 mb-3">👨‍🏫 {c.teacher_name}</p>
                )}
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-slate-500">Progreso</span>
                  <span className="font-bold">{c.progress_pct}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-600" style={{ width: `${c.progress_pct}%` }} />
                </div>
                <p className="text-xs text-slate-500 mt-2">{c.completed_lessons} de {c.total_lessons} lecciones</p>
                <Link
                  href={`/dashboard/student/courses/${c.course_id}`}
                  className="block mt-4 text-center w-full py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold transition"
                >
                  Ver curso
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
