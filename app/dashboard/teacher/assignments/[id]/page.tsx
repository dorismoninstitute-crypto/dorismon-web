"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { teacherApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Input, Textarea, Modal, SuccessBox } from "@/components/ui";
import ArchivoAdjunto from "@/components/ArchivoAdjunto";  // V3.9.30

export default function GradeSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = parseInt(params?.id as string);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [grading, setGrading] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    teacherApi.submissions(assignmentId)
      .then(d => { setSubmissions(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, [assignmentId]);

  const openGrade = (sub: any) => {
    setGrading(sub);
    setScore(sub.score || 0);
    setFeedback(sub.feedback || "");
    setMsg("");
  };

  const saveGrade = async () => {
    if (!grading) return;
    setMsg("");
    try {
      await teacherApi.gradeSubmission(grading.id, { score, feedback });
      setMsg("✓ Calificación guardada");
      setGrading(null);
      load();
    } catch (e: any) { setMsg("✗ " + e.message); }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader title="Calificar entregas" subtitle={`${submissions.length} entregas`} action={
        <Button variant="outline" onClick={() => router.push("/dashboard/teacher/assignments")}>← Volver</Button>
      } />
      {msg.startsWith("✓") && <div className="mb-4"><SuccessBox message={msg} /></div>}
      {msg.startsWith("✗") && <div className="mb-4"><ErrorBox message={msg.slice(2)} /></div>}

      {submissions.length === 0 ? <EmptyState icon="📥" title="Sin entregas todavía" /> : (
        <div className="space-y-3">
          {submissions.map((s: any) => (
            <Card key={s.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                  <div>
                    <h3 className="font-bold">{s.student_name}</h3>
                    <p className="text-xs text-slate-500">
                      {s.submitted_at ? `Entregada: ${new Date(s.submitted_at).toLocaleString("es")}` : "No entregada"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.graded_at ? (
                      <Badge variant="success">Calificada: {s.score}</Badge>
                    ) : s.submitted_at ? (
                      <Badge variant="warning">Pendiente de calificar</Badge>
                    ) : (
                      <Badge>Sin entregar</Badge>
                    )}
                    {s.submitted_at && (
                      <Button size="sm" onClick={() => openGrade(s)}>
                        {s.graded_at ? "Editar nota" : "Calificar"}
                      </Button>
                    )}
                  </div>
                </div>

                {s.content && (
                  <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 whitespace-pre-wrap">
                    {s.content}
                  </div>
                )}
                {s.file_url && (
                  /* V3.9.30: se ve DENTRO de la plataforma (foto, PDF o audio) */
                  <div className="mt-3">
                    <ArchivoAdjunto url={s.file_url} nombre={s.file_name} />
                  </div>
                )}

                {s.feedback && (
                  <div className="mt-3 bg-brand-50 border-l-4 border-brand-500 rounded p-3">
                    <p className="text-xs font-bold text-brand-700 mb-1">Tu feedback:</p>
                    <p className="text-sm text-slate-700">{s.feedback}</p>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!grading} onClose={() => setGrading(null)} title={`Calificar a ${grading?.student_name}`}>
        <div className="space-y-3">
          <div className="bg-slate-50 rounded-lg p-3 max-h-40 overflow-y-auto">
            <p className="text-xs font-bold text-slate-500 mb-1">Respuesta del estudiante:</p>
            <p className="text-sm whitespace-pre-wrap">{grading?.content || "—"}</p>
          </div>
          <Input label="Puntaje *" type="number" min="0" max="100" value={score} onChange={(e: any) => setScore(Number(e.target.value))} />
          <Textarea label="Feedback" value={feedback} onChange={(e: any) => setFeedback(e.target.value)} placeholder="Buen trabajo en X. Mejorar Y..." />
          <Button onClick={saveGrade} className="w-full" size="lg">Guardar calificación</Button>
        </div>
      </Modal>
    </>
  );
}
