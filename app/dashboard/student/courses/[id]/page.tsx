"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { catalog, studentApi, safeArray, safeObj } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge } from "@/components/ui";

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = parseInt(params?.id as string);
  const [course, setCourse] = useState<any>(null);
  const [activeLevel, setActiveLevel] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    Promise.all([catalog.course(courseId), studentApi.courses()])
      .then(([c, mine]) => {
        setCourse(c);
        const enrolls = safeArray(mine);
        setEnrollments(enrolls);
        const myEnroll: any = enrolls.find((e: any) => e.course_id === courseId);
        if (myEnroll) {
          const lvl = safeArray<any>(c.levels).find((l: any) => l.id === myEnroll.level_id);
          if (lvl) loadLevel(lvl);
        }
        setLoading(false);
      })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, [courseId]);

  const loadLevel = async (lvl: any) => {
    setActiveLevel(lvl);
    try {
      const mods = await catalog.levelModules(lvl.id);
      setModules(safeArray(mods));
    } catch {}
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;
  if (!course) return <ErrorBox message="Curso no encontrado" />;

  return (
    <>
      <PageHeader title={course.name} subtitle={course.description} />

      {/* Selector de niveles */}
      <div className="flex flex-wrap gap-2 mb-6">
        {safeArray(course.levels).map((l: any) => (
          <button
            key={l.id}
            onClick={() => loadLevel(l)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
              activeLevel?.id === l.id
                ? "bg-brand-600 text-white"
                : "bg-white border border-slate-200 hover:border-brand-300 text-slate-700"
            }`}
          >
            {l.code} · {l.name}
          </button>
        ))}
      </div>

      {!activeLevel ? <EmptyState icon="📚" title="Seleccioná un nivel" /> : (
        <div className="space-y-4">
          {modules.length === 0 ? (
            <EmptyState icon="📖" title="Sin módulos todavía" description="Tu profesor aún no ha publicado contenido para este nivel." />
          ) : modules.map((m: any) => (
            <Card key={m.id}>
              <CardBody>
                <h3 className="font-bold text-base mb-3">{m.name}</h3>
                {safeArray(m.lessons).length === 0 ? (
                  <p className="text-sm text-slate-500">Sin lecciones todavía</p>
                ) : (
                  <div className="space-y-2">
                    {safeArray(m.lessons).map((l: any, i: number) => (
                      <Link
                        key={l.id}
                        href={`#`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{l.title}</p>
                          {l.can_do && <p className="text-xs text-slate-500 italic truncate">"{l.can_do}"</p>}
                        </div>
                        <div className="flex gap-1">
                          {l.has_video && <Badge variant="info">📹</Badge>}
                          {l.has_pdf && <Badge variant="warning">📄</Badge>}
                          {l.has_audio && <Badge variant="success">🎧</Badge>}
                        </div>
                        <span className="text-xs text-slate-400">{l.duration_min}min</span>
                      </Link>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
