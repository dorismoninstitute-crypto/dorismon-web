"use client";
import { useEffect, useState } from "react";
import { adminApi, adminContent, adminHelpers, safeArray, getLevelTheme } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Input, Textarea, Select, Modal, showToast } from "@/components/ui";

export default function AdminContentPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [levels, setLevels] = useState<any[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [moduleForm, setModuleForm] = useState({ name: "", description: "", order_index: 0 });
  const [lessonForm, setLessonForm] = useState({
    title: "", description: "", objectives: "", can_do: "",
    video_url: "", pdf_url: "", audio_url: "",
    duration_min: 15, order_index: 0,
  });

  useEffect(() => {
    adminApi.courses()
      .then((d: any) => { setCourses(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  const loadLevels = async (course: any) => {
    setSelectedCourse(course);
    setSelectedLevel(null); setModules([]); setSelectedModule(null); setLessons([]);
    try {
      const lvls = await adminHelpers.levelsByCourse(course.id);
      setLevels(safeArray(lvls));
    } catch (e: any) { showToast("error", e.message); }
  };

  const loadModules = async (level: any) => {
    setSelectedLevel(level);
    setSelectedModule(null); setLessons([]);
    try {
      const mods = await adminContent.modules(level.id);
      setModules(safeArray(mods));
    } catch (e: any) { showToast("error", e.message); }
  };

  const loadLessons = async (mod: any) => {
    setSelectedModule(mod);
    try {
      const ls = await adminContent.lessons(mod.id);
      setLessons(safeArray(ls));
    } catch (e: any) { showToast("error", e.message); }
  };

  const createModule = async () => {
    if (!selectedLevel || !moduleForm.name) return;
    try {
      await adminContent.createModule({ level_id: selectedLevel.id, ...moduleForm });
      showToast("success", "Módulo creado");
      setShowModuleModal(false);
      setModuleForm({ name: "", description: "", order_index: 0 });
      loadModules(selectedLevel);
    } catch (e: any) { showToast("error", e.message); }
  };

  const createLesson = async () => {
    if (!selectedModule || !lessonForm.title) return;
    try {
      await adminContent.createLesson({ module_id: selectedModule.id, ...lessonForm });
      showToast("success", "Lección creada");
      setShowLessonModal(false);
      setLessonForm({
        title: "", description: "", objectives: "", can_do: "",
        video_url: "", pdf_url: "", audio_url: "",
        duration_min: 15, order_index: 0,
      });
      loadLessons(selectedModule);
    } catch (e: any) { showToast("error", e.message); }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader title="Contenido académico" subtitle="Gestioná módulos y lecciones por curso y nivel" />

      <div className="grid lg:grid-cols-4 gap-4">
        {/* Cursos */}
        <Card>
          <CardBody>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">1. Curso</p>
            <div className="space-y-1">
              {courses.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => loadLevels(c)}
                  className={`w-full text-left p-2 rounded-lg text-sm transition ${
                    selectedCourse?.id === c.id ? "bg-brand-50 text-brand-700 font-bold" : "hover:bg-slate-50"
                  }`}
                >
                  {c.icon || "📚"} {c.name}
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Niveles */}
        <Card>
          <CardBody>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">2. Nivel</p>
            {!selectedCourse ? (
              <p className="text-xs text-slate-400">Elegí un curso</p>
            ) : levels.length === 0 ? (
              <p className="text-xs text-slate-400">Sin niveles</p>
            ) : (
              <div className="space-y-1">
                {levels.map((l: any) => {
                  const t = getLevelTheme(l.code);
                  return (
                    <button
                      key={l.id}
                      onClick={() => loadModules(l)}
                      className={`w-full text-left p-2 rounded-lg text-sm transition flex items-center gap-2 ${
                        selectedLevel?.id === l.id ? `${t.bgSoft} ${t.text} font-bold` : "hover:bg-slate-50"
                      }`}
                    >
                      <span className={`inline-flex w-7 h-7 rounded ${t.bg} ${t.heroText} font-bold items-center justify-center text-xs`}>{l.code}</span>
                      <span className="text-xs truncate">{l.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Módulos */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">3. Módulos</p>
              {selectedLevel && (
                <button onClick={() => setShowModuleModal(true)} className="text-xs font-bold text-brand-600 hover:text-brand-700">+ Nuevo</button>
              )}
            </div>
            {!selectedLevel ? (
              <p className="text-xs text-slate-400">Elegí un nivel</p>
            ) : modules.length === 0 ? (
              <p className="text-xs text-slate-400">Sin módulos. Creá el primero.</p>
            ) : (
              <div className="space-y-1">
                {modules.map((m: any) => (
                  <button
                    key={m.id}
                    onClick={() => loadLessons(m)}
                    className={`w-full text-left p-2 rounded-lg text-sm transition ${
                      selectedModule?.id === m.id ? "bg-brand-50 text-brand-700 font-bold" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-xs">M{m.order_index || "?"}. {m.name}</span>
                    <span className="block text-xs text-slate-400">{m.lessons_count || 0} lecciones</span>
                  </button>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Lecciones */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">4. Lecciones</p>
              {selectedModule && (
                <button onClick={() => setShowLessonModal(true)} className="text-xs font-bold text-brand-600 hover:text-brand-700">+ Nueva</button>
              )}
            </div>
            {!selectedModule ? (
              <p className="text-xs text-slate-400">Elegí un módulo</p>
            ) : lessons.length === 0 ? (
              <p className="text-xs text-slate-400">Sin lecciones. Creá la primera.</p>
            ) : (
              <div className="space-y-1">
                {lessons.map((l: any) => (
                  <div key={l.id} className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-sm font-semibold">{l.title}</p>
                    <p className="text-xs text-slate-500">
                      {l.duration_min} min
                      {l.video_url && " · 🎥"}
                      {l.pdf_url && " · 📄"}
                      {l.audio_url && " · 🎵"}
                      {!l.is_published && " · 🔒 Borrador"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Modal Nuevo Módulo */}
      <Modal open={showModuleModal} onClose={() => setShowModuleModal(false)} title={`Nuevo módulo en ${selectedLevel?.code || ""}`}>
        <div className="space-y-3">
          <Input label="Nombre *" value={moduleForm.name} onChange={(e: any) => setModuleForm({ ...moduleForm, name: e.target.value })} placeholder="ej: Grammar Fundamentals" />
          <Textarea label="Descripción" value={moduleForm.description} onChange={(e: any) => setModuleForm({ ...moduleForm, description: e.target.value })} />
          <Input label="Orden" type="number" value={moduleForm.order_index} onChange={(e: any) => setModuleForm({ ...moduleForm, order_index: Number(e.target.value) })} />
          <Button onClick={createModule} className="w-full" size="lg" disabled={!moduleForm.name}>Crear módulo</Button>
        </div>
      </Modal>

      {/* Modal Nueva Lección */}
      <Modal open={showLessonModal} onClose={() => setShowLessonModal(false)} title={`Nueva lección en: ${selectedModule?.name || ""}`} size="lg">
        <div className="space-y-3">
          <Input label="Título *" value={lessonForm.title} onChange={(e: any) => setLessonForm({ ...lessonForm, title: e.target.value })} />
          <Textarea label="Descripción" value={lessonForm.description} onChange={(e: any) => setLessonForm({ ...lessonForm, description: e.target.value })} />
          <Textarea label="Objetivos" value={lessonForm.objectives} onChange={(e: any) => setLessonForm({ ...lessonForm, objectives: e.target.value })} placeholder="Al finalizar el estudiante podrá..." />
          <Input label='"Can do" (declaración CEFR)' value={lessonForm.can_do} onChange={(e: any) => setLessonForm({ ...lessonForm, can_do: e.target.value })} placeholder="I can describe my daily routine" />
          <div className="grid md:grid-cols-2 gap-3">
            <Input label="URL Video (YouTube/Vimeo)" value={lessonForm.video_url} onChange={(e: any) => setLessonForm({ ...lessonForm, video_url: e.target.value })} />
            <Input label="URL PDF" value={lessonForm.pdf_url} onChange={(e: any) => setLessonForm({ ...lessonForm, pdf_url: e.target.value })} />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <Input label="URL Audio" value={lessonForm.audio_url} onChange={(e: any) => setLessonForm({ ...lessonForm, audio_url: e.target.value })} />
            <Input label="Duración (min)" type="number" value={lessonForm.duration_min} onChange={(e: any) => setLessonForm({ ...lessonForm, duration_min: Number(e.target.value) })} />
          </div>
          <Input label="Orden" type="number" value={lessonForm.order_index} onChange={(e: any) => setLessonForm({ ...lessonForm, order_index: Number(e.target.value) })} />
          <Button onClick={createLesson} className="w-full" size="lg" disabled={!lessonForm.title}>Crear lección</Button>
        </div>
      </Modal>
    </>
  );
}
