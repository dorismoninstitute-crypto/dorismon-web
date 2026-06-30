"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { adminStudentsByTeacher } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Badge, EmptyState } from "@/components/ui";
import { Users, GraduationCap } from "lucide-react";

export default function StudentsByTeacherPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    adminStudentsByTeacher.list()
      .then((d: any) => { setData(d); setLoading(false); })
      .catch((e: any) => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  const teachers = data?.teachers || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <PageHeader
        title="👨‍🏫 Estudiantes por profesor"
        subtitle="Quién tiene asignado a quién"
      />

      {teachers.length === 0 ? (
        <EmptyState message="No hay profesores con estudiantes todavía." />
      ) : (
        <div className="space-y-4">
          {teachers.map((t: any) => (
            <Card key={t.teacher_id}>
              <CardBody>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                      {t.teacher_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold">{t.teacher_name}</p>
                      <p className="text-xs text-slate-500">{t.teacher_email}</p>
                    </div>
                  </div>
                  <Badge variant={t.student_count > 0 ? "brand" : "default"}>
                    {t.student_count} {t.student_count === 1 ? "estudiante" : "estudiantes"}
                  </Badge>
                </div>

                {t.students.length === 0 ? (
                  <p className="text-sm text-slate-400 italic pl-13">Sin estudiantes asignados todavía</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-2 mt-2">
                    {t.students.map((s: any) => (
                      <Link
                        key={s.id}
                        href={`/dashboard/admin/students/${s.id}/profile`}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <GraduationCap size={15} className="text-slate-400 shrink-0" />
                          <span className="text-sm truncate">{s.full_name}</span>
                        </div>
                        {s.level_code && <Badge variant="default" className="shrink-0">{s.level_code}</Badge>}
                      </Link>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
