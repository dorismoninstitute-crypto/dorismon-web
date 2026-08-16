"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { teacherApi, safeArray, api } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Input, Textarea, Select, Modal, SuccessBox, showToast } from "@/components/ui";
import SelectorAudiencia from "@/components/SelectorAudiencia";  // V3.9.46
import SeguimientoQuiz from "@/components/SeguimientoQuiz";  // V3.9.49

type QuestionDraft = {
  type: "multiple_choice" | "true_false" | "fill_blank" | "short_answer";
  statement: string;
  options: string[];
  correct_answer: string;
  points: number;
};

export default function TeacherQuizzesPage() {
  const [viendoQuiz, setViendoQuiz] = useState<any>(null);  // V3.9.49
  // V3.9.41 — Publicar / despublicar un quiz
  const [publicando, setPublicando] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");

  const [quiz, setQuiz] = useState({
    title: "", description: "",
    course_id: "", level_id: "",
    series_id: null as string | null,  // V3.9.46: a qué grupo va
    passing_score: 70, max_attempts: 3,
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    { type: "multiple_choice", statement: "", options: ["", "", "", ""], correct_answer: "", points: 10 },
  ]);

  const load = () => {
    setLoading(true);
    teacherApi.quizzes()
      .then(d => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const openModal = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://dorismon-api.onrender.com"}/courses`);
      setCourses(await res.json());
      setShow(true);
    } catch {}
  };

  const onCourseChange = async (course_id: string) => {
    setQuiz({ ...quiz, course_id, level_id: "" });
    if (course_id) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://dorismon-api.onrender.com"}/courses/${course_id}`);
        const d = await res.json();
        setLevels(safeArray(d.levels));
      } catch {}
    } else { setLevels([]); }
  };

  const addQuestion = () => {
    setQuestions([...questions, { type: "multiple_choice", statement: "", options: ["", "", "", ""], correct_answer: "", points: 10 }]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    const newQs = [...questions];
    if (field === "type") {
      if (value === "true_false") {
        newQs[idx] = { ...newQs[idx], type: value, options: ["True", "False"], correct_answer: "" };
      } else if (value === "multiple_choice") {
        newQs[idx] = { ...newQs[idx], type: value, options: ["", "", "", ""], correct_answer: "" };
      } else {
        newQs[idx] = { ...newQs[idx], type: value, options: [], correct_answer: "" };
      }
    } else {
      (newQs[idx] as any)[field] = value;
    }
    setQuestions(newQs);
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    const newQs = [...questions];
    newQs[qIdx].options[optIdx] = value;
    setQuestions(newQs);
  };

  const create = async () => {
    setMsg("");
    try {
      // Validar
      if (!quiz.title || !quiz.level_id || questions.length === 0) {
        setMsg("✗ Completa título, nivel y al menos una pregunta");
        return;
      }
      for (const q of questions) {
        if (!q.statement || !q.correct_answer) {
          setMsg("✗ Cada pregunta debe tener enunciado y respuesta correcta");
          return;
        }
      }
      const body = {
        title: quiz.title,
        description: quiz.description || undefined,
        level_id: parseInt(quiz.level_id),
        series_id: quiz.series_id || null,  // V3.9.46
        passing_score: quiz.passing_score,
        max_attempts: quiz.max_attempts,
        questions: questions.map(q => ({
          type: q.type,
          statement: q.statement,
          options: q.options.filter(o => o).length > 0 ? q.options.filter(o => o) : null,
          correct_answer: q.correct_answer,
          points: q.points,
        })),
      };
      await teacherApi.createQuiz(body);
      setMsg("✓ Quiz creado");
      setShow(false);
      setQuiz({ title: "", description: "", course_id: "", level_id: "", series_id: null, passing_score: 70, max_attempts: 3 });
      setQuestions([{ type: "multiple_choice", statement: "", options: ["", "", "", ""], correct_answer: "", points: 10 }]);
      load();
    } catch (e: any) { setMsg("✗ " + e.message); }
  };

  const cambiarPublicacion = async (q: any, publicar: boolean, reavisar = false) => {
    if (publicar && !reavisar) {
      if (!confirm(`¿Publicar "${q.title}"? Se les avisará a los estudiantes del nivel por correo y notificación.`)) return;
    }
    if (reavisar && !confirm("¿Volver a avisarles a los estudiantes sobre este quiz?")) return;
    setPublicando(q.id);
    try {
      const r: any = await api(`/teacher/quizzes/${q.id}/${publicar ? "publish" : "unpublish"}`, {
        method: "POST", auth: true,
      });
      showToast("success", publicar
        ? `✅ Publicado. Se avisó a ${r.notified ?? 0} estudiante(s).`
        : "Quiz despublicado. Ya no lo ven los estudiantes.");
      load();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setPublicando(null);
    }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      {viendoQuiz && (
        <SeguimientoQuiz
          quizId={viendoQuiz.id}
          puedeConceder
          onClose={() => { setViendoQuiz(null); load(); }}
        />
      )}
      <PageHeader
        title="Quizzes"
        subtitle={`${items.length} quizzes`}
        action={<Button onClick={openModal}>+ Nuevo quiz</Button>}
      />
      {/* V3.9.42 — Acceso cruzado con los demás tipos de actividad */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-3 flex-wrap">
        <p className="text-xs text-slate-600 flex-1 min-w-[180px]">
          ¿Buscas poner una <strong>tarea</strong> (escrita, audio, escuchar, completar espacios)?
        </p>
        <Link
          href="/dashboard/teacher/assignments"
          className="text-xs font-bold text-brand-600 hover:text-brand-700"
        >
          Ir a Tareas →
        </Link>
      </div>
      {msg.startsWith("✓") && <div className="mb-4"><SuccessBox message={msg} /></div>}
      {msg.startsWith("✗") && <div className="mb-4"><ErrorBox message={msg.slice(2)} /></div>}

      {items.length === 0 ? <EmptyState icon="✓" title="Sin quizzes todavía" description="Haz clic en '+ Nuevo quiz' para crear uno." /> : (
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
                <p className="text-xs text-slate-500 mb-3">
                  {q.question_count} preguntas · {q.attempts} intentos · Mínimo {q.passing_score}%
                </p>

                {/* V3.9.41 — FALTABA EL BOTÓN: el quiz se creaba pero no había
                    forma de publicarlo desde aquí. Al publicar se avisa a los
                    estudiantes del nivel por correo, campana y teléfono. */}
                <div className="flex gap-2 flex-wrap items-center">
                  {/* V3.9.49 P2 — quién lo hizo y cómo le fue */}
                  <button
                    onClick={() => setViendoQuiz(q)}
                    className="text-xs font-semibold border border-slate-200 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 transition"
                  >
                    👥 Quién lo hizo
                  </button>
                  {q.is_published ? (
                    <>
                      <button
                        onClick={() => cambiarPublicacion(q, false)}
                        disabled={publicando === q.id}
                        className="text-xs font-semibold border border-slate-200 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                      >
                        Despublicar
                      </button>
                      <button
                        onClick={() => cambiarPublicacion(q, true, true)}
                        disabled={publicando === q.id}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
                      >
                        🔔 Volver a avisar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => cambiarPublicacion(q, true)}
                      disabled={publicando === q.id || !q.question_count}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {publicando === q.id ? "Publicando..." : "Publicar y avisar"}
                    </button>
                  )}
                  {!q.question_count && (
                    <span className="text-[11px] text-amber-600">
                      Sin preguntas: agrégale al menos una para publicarlo
                    </span>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={show} onClose={() => setShow(false)} title="Crear nuevo quiz" size="xl">
        <div className="space-y-4">
          {/* Datos del quiz */}
          <Card>
            <CardBody className="space-y-3">
              <h4 className="font-bold text-sm uppercase tracking-wider text-slate-500">Configuración del quiz</h4>
              <Input label="Título *" value={quiz.title} onChange={(e: any) => setQuiz({ ...quiz, title: e.target.value })} placeholder="ej: Quiz B1 - Present Perfect" />
              <Textarea label="Descripción" value={quiz.description} onChange={(e: any) => setQuiz({ ...quiz, description: e.target.value })} />

              <div className="grid md:grid-cols-2 gap-3">
                <Select label="Curso" value={quiz.course_id} onChange={(e: any) => onCourseChange(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                <Select label="Nivel *" value={quiz.level_id} onChange={(e: any) => setQuiz({ ...quiz, level_id: e.target.value })} disabled={!levels.length}>
                  <option value="">{levels.length ? "Seleccionar..." : "Curso primero"}</option>
                  {levels.map(l => <option key={l.id} value={l.id}>{l.code}</option>)}
                </Select>
              </div>

              {/* V3.9.46 P1 — A quién va el quiz */}
              {quiz.level_id && (
                <SelectorAudiencia
                  levelId={quiz.level_id}
                  value={{ series_id: quiz.series_id }}
                  onChange={(v) => setQuiz({ ...quiz, series_id: v.series_id || null })}
                  etiquetaTodos="Todos mis estudiantes de este nivel"
                />
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input label="Mínimo aprobación (%)" type="number" value={quiz.passing_score} onChange={(e: any) => setQuiz({ ...quiz, passing_score: Number(e.target.value) })} />
                <Input label="Intentos máximos" type="number" value={quiz.max_attempts} onChange={(e: any) => setQuiz({ ...quiz, max_attempts: Number(e.target.value) })} />
              </div>
            </CardBody>
          </Card>

          {/* Preguntas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm uppercase tracking-wider text-slate-500">Preguntas ({questions.length})</h4>
              <Button size="sm" onClick={addQuestion}>+ Pregunta</Button>
            </div>

            <div className="space-y-3">
              {questions.map((q, idx) => (
                <Card key={idx}>
                  <CardBody className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-brand-600">Pregunta {idx + 1}</span>
                      {questions.length > 1 && (
                        <Button size="sm" variant="ghost" onClick={() => removeQuestion(idx)}>🗑</Button>
                      )}
                    </div>

                    <Select label="Tipo" value={q.type} onChange={(e: any) => updateQuestion(idx, "type", e.target.value)}>
                      <option value="multiple_choice">Opción múltiple</option>
                      <option value="true_false">Verdadero/Falso</option>
                      <option value="fill_blank">Completar el espacio</option>
                      <option value="short_answer">Respuesta corta</option>
                    </Select>

                    <Textarea label="Enunciado *" value={q.statement} onChange={(e: any) => updateQuestion(idx, "statement", e.target.value)} placeholder="Escribí la pregunta..." />

                    {q.type === "multiple_choice" && (
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">Opciones (mínimo 2)</label>
                        {q.options.map((opt, i) => (
                          <div key={i} className="flex gap-2">
                            <input
                              type="radio"
                              name={`correct-${idx}`}
                              checked={q.correct_answer === opt && !!opt}
                              onChange={() => updateQuestion(idx, "correct_answer", opt)}
                              className="w-4 h-4 mt-3"
                            />
                            <Input
                              value={opt}
                              onChange={(e: any) => updateOption(idx, i, e.target.value)}
                              placeholder={`Opción ${i + 1}`}
                              className="flex-1"
                            />
                          </div>
                        ))}
                        <p className="text-xs text-slate-500">Marcá el radio button al lado de la respuesta correcta</p>
                      </div>
                    )}

                    {q.type === "true_false" && (
                      <Select label="Respuesta correcta *" value={q.correct_answer} onChange={(e: any) => updateQuestion(idx, "correct_answer", e.target.value)}>
                        <option value="">Seleccionar...</option>
                        <option value="True">True (Verdadero)</option>
                        <option value="False">False (Falso)</option>
                      </Select>
                    )}

                    {(q.type === "fill_blank" || q.type === "short_answer") && (
                      <Input label="Respuesta correcta *" value={q.correct_answer} onChange={(e: any) => updateQuestion(idx, "correct_answer", e.target.value)} placeholder="ej: have lived" />
                    )}

                    <Input label="Puntos" type="number" value={q.points} onChange={(e: any) => updateQuestion(idx, "points", Number(e.target.value))} />
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>

          <Button onClick={create} size="lg" className="w-full">Crear quiz</Button>
        </div>
      </Modal>
    </>
  );
}
