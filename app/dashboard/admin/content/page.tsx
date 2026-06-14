"use client";
import { useEffect, useState } from "react";
import { adminApi, adminContent, adminHelpers, adminModuleTemplates, adminLessons, safeArray, getLevelTheme } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Button, Input, Modal, ConfirmModal, showToast } from "@/components/ui";
import { Plus, Edit, Trash2, Layers, Sparkles, FileText, Video } from "lucide-react";

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

  // Modales
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [moduleForm, setModuleForm] = useState({ name: "", description: "", order_index: 0 });
  const [deletingModule, setDeletingModule] = useState<any>(null);

  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [lessonForm, setLessonForm] = useState({
    title: "", description: "", objectives: "", can_do: "",
    video_url: "", pdf_url: "", audio_url: "",
    duration_min: 15, order_index: 0,
  });
  const [deletingLesson, setDeletingLesson] = useState<any>(null);

  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [showTemplateConfirm, setShowTemplateConfirm] = useState(false);

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

  // V1.6.4: Cargar plantilla
  const loadTemplate = async () => {
    setLoadingTemplate(true);
    try {
      const r: any = await adminModuleTemplates.load();
      showToast("success", `🎉 ${r.modules_created} módulos creados, ${r.lessons_created} lecciones. ${r.skipped_levels?.length || 0} niveles ya tenían contenido.`);
      setShowTemplateConfirm(false);
      // Recargar módulos si hay nivel seleccionado
      if (selectedLevel) loadModules(selectedLevel);
    } catch (e: any) { showToast("error", e.message); }
    finally { setLoadingTemplate(false); }
  };

  // Modal módulo (crear o editar)
  const openModuleCreate = () => {
    setEditingModule(null);
    setModuleForm({ name: "", description: "", order_index: (modules.length || 0) + 1 });
    setShowModuleModal(true);
  };
  const openModuleEdit = (m: any) => {
    setEditingModule(m);
    setModuleForm({ name: m.name, description: m.description || "", order_index: m.order_index || 0 });
    setShowModuleModal(true);
  };
  const saveModule = async () => {
    if (!moduleForm.name) { showToast("error", "El nombre es obligatorio"); return; }
    try {
      if (editingModule) {
        await adminContent.updateModule(editingModule.id, moduleForm);
        showToast("success", "Módulo actualizado");
      } else {
        if (!selectedLevel) return;
        await adminContent.createModule({ level_id: selectedLevel.id, ...moduleForm });
        showToast("success", "Módulo creado");
      }
      setShowModuleModal(false);
      loadModules(selectedLevel);
    } catch (e: any) { showToast("error", e.message); }
  };
  const doDeleteModule = async () => {
    if (!deletingModule) return;
    try {
      await adminContent.deleteModule(deletingModule.id);
      showToast("success", "Módulo eliminado");
      setDeletingModule(null);
      loadModules(selectedLevel);
    } catch (e: any) { showToast("error", e.message); setDeletingModule(null); }
  };

  // Modal lección (crear o editar)
  const openLessonCreate = () => {
    setEditingLesson(null);
    setLessonForm({
      title: "", description: "", objectives: "", can_do: "",
      video_url: "", pdf_url: "", audio_url: "",
      duration_min: 15, order_index: (lessons.length || 0) + 1,
    });
    setShowLessonModal(true);
  };
  const openLessonEdit = (l: any) => {
    setEditingLesson(l);
    setLessonForm({
      title: l.title, description: l.description || "", objectives: l.objectives || "",
      can_do: l.can_do || "", video_url: l.video_url || "", pdf_url: l.pdf_url || "",
      audio_url: l.audio_url || "", duration_min: l.duration_min || 15, order_index: l.order_index || 0,
    });
    setShowLessonModal(true);
  };
  const saveLesson = async () => {
    if (!lessonForm.title) { showToast("error", "El título es obligatorio"); return; }
    try {
      if (editingLesson) {
        await adminLessons.update(editingLesson.id, lessonForm);
        showToast("success", "Lección actualizada");
      } else {
        if (!selectedModule) return;
        await adminContent.createLesson({ module_id: selectedModule.id, ...lessonForm });
        showToast("success", "Lección creada");
      }
      setShowLessonModal(false);
      loadLessons(selectedModule);
    } catch (e: any) { showToast("error", e.message); }
  };
  const doDeleteLesson = async () => {
    if (!deletingLesson) return;
    try {
      await adminLessons.delete(deletingLesson.id);
      showToast("success", "Lección eliminada");
      setDeletingLesson(null);
      loadLessons(selectedModule);
    } catch (e: any) { showToast("error", e.message); setDeletingLesson(null); }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  // Check si hay algún nivel vacío para sugerir plantilla
  const hasEmptyLevels = levels.length > 0 && modules.length === 0 && selectedLevel;

  return (
    <>
      <PageHeader
        title="Contenido académico"
        subtitle="Gestioná módulos y lecciones por curso y nivel"
        action={
          <Button onClick={() => setShowTemplateConfirm(true)} variant="outline">
            <Sparkles size={14} className="inline mr-1.5" />
            Cargar plantilla
          </Button>
        }
      />

      {/* Banner informativo si hay nivel vacío */}
      {hasEmptyLevels && (
        <Card className="mb-4 bg-amber-50 border-amber-200">
          <CardBody>
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div className="flex-1">
                <p className="font-bold text-amber-900 text-sm">Este nivel no tiene módulos aún</p>
                <p className="text-xs text-amber-800 mt-1">
                  Puedes cargar la <strong>plantilla pre-hecha</strong> con módulos típicos del nivel, o crear los tuyos desde cero.
                </p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => setShowTemplateConfirm(true)}>
                    <Sparkles size={12} className="inline mr-1" />
                    Cargar plantilla
                  </Button>
                  <Button size="sm" variant="outline" onClick={openModuleCreate}>
                    <Plus size={12} className="inline mr-1" />
                    Crear módulo manual
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

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
              <p className="text-xs text-slate-400">Elige un curso</p>
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
                      <span className={`inline-flex w-7 h-7 rounded ${t.bg} text-white font-bold items-center justify-center text-xs`}>{l.code}</span>
                      <span className="text-xs truncate">{l.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Módulos con editar/eliminar */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">3. Módulos</p>
              {selectedLevel && (
                <button onClick={openModuleCreate} className="text-xs font-bold text-brand-600 hover:text-brand-700">
                  <Plus size={12} className="inline" /> Nuevo
                </button>
              )}
            </div>
            {!selectedLevel ? (
              <p className="text-xs text-slate-400">Elige un nivel</p>
            ) : modules.length === 0 ? (
              <p className="text-xs text-slate-400">Sin módulos. Crea uno o cargá plantilla.</p>
            ) : (
              <div className="space-y-1">
                {modules.map((m: any) => (
                  <div
                    key={m.id}
                    className={`group p-2 rounded-lg transition ${
                      selectedModule?.id === m.id ? "bg-brand-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-1">
                      <button onClick={() => loadLessons(m)} className="flex-1 text-left min-w-0">
                        <p className={`text-xs ${selectedModule?.id === m.id ? "font-bold text-brand-700" : "text-slate-700"}`}>
                          M{m.order_index || "?"}. {m.name}
                        </p>
                        <p className="text-[10px] text-slate-400">{m.lessons_count || 0} lecciones</p>
                      </button>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => openModuleEdit(m)} className="p-1 hover:bg-white rounded" title="Editar">
                          <Edit size={12} className="text-slate-500" />
                        </button>
                        <button onClick={() => setDeletingModule(m)} className="p-1 hover:bg-red-50 rounded" title="Eliminar">
                          <Trash2 size={12} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Lecciones con editar/eliminar */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">4. Lecciones</p>
              {selectedModule && (
                <button onClick={openLessonCreate} className="text-xs font-bold text-brand-600 hover:text-brand-700">
                  <Plus size={12} className="inline" /> Nueva
                </button>
              )}
            </div>
            {!selectedModule ? (
              <p className="text-xs text-slate-400">Elige un módulo</p>
            ) : lessons.length === 0 ? (
              <p className="text-xs text-slate-400">Sin lecciones. Crea una.</p>
            ) : (
              <div className="space-y-1">
                {lessons.map((l: any) => (
                  <div key={l.id} className="group p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                    <div className="flex items-start gap-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{l.title}</p>
                        <p className="text-[10px] text-slate-500">
                          {l.duration_min} min
                          {l.video_url && <Video size={10} className="inline ml-1" />}
                          {l.pdf_url && <FileText size={10} className="inline ml-1" />}
                          {!l.is_published && " · 🔒"}
                        </p>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => openLessonEdit(l)} className="p-1 hover:bg-white rounded" title="Editar">
                          <Edit size={12} className="text-slate-500" />
                        </button>
                        <button onClick={() => setDeletingLesson(l)} className="p-1 hover:bg-red-50 rounded" title="Eliminar">
                          <Trash2 size={12} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Modal módulo */}
      <Modal open={showModuleModal} onClose={() => setShowModuleModal(false)} title={editingModule ? "Editar módulo" : "Nuevo módulo"}>
        <div className="space-y-3">
          <Input label="Nombre *" value={moduleForm.name} onChange={(e: any) => setModuleForm({ ...moduleForm, name: e.target.value })} placeholder="Ej: Present Perfect" />
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Descripción</label>
            <textarea
              value={moduleForm.description}
              onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
              rows={3}
              placeholder="Qué cubre este módulo..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
            />
          </div>
          <Input type="number" label="Orden" value={moduleForm.order_index} onChange={(e: any) => setModuleForm({ ...moduleForm, order_index: parseInt(e.target.value) || 0 })} />
          <Button onClick={saveModule} className="w-full">
            {editingModule ? "Guardar cambios" : "Crear módulo"}
          </Button>
        </div>
      </Modal>

      {/* Modal lección */}
      <Modal open={showLessonModal} onClose={() => setShowLessonModal(false)} title={editingLesson ? "Editar lección" : "Nueva lección"} size="lg">
        <div className="space-y-3">
          <Input label="Título *" value={lessonForm.title} onChange={(e: any) => setLessonForm({ ...lessonForm, title: e.target.value })} />
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Descripción</label>
            <textarea
              value={lessonForm.description}
              onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
            />
          </div>
          <Input label="Video URL" value={lessonForm.video_url} onChange={(e: any) => setLessonForm({ ...lessonForm, video_url: e.target.value })} placeholder="https://youtube.com/..." />
          <Input label="PDF URL" value={lessonForm.pdf_url} onChange={(e: any) => setLessonForm({ ...lessonForm, pdf_url: e.target.value })} placeholder="https://drive.google.com/..." />
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" label="Duración (min)" value={lessonForm.duration_min} onChange={(e: any) => setLessonForm({ ...lessonForm, duration_min: parseInt(e.target.value) || 15 })} />
            <Input type="number" label="Orden" value={lessonForm.order_index} onChange={(e: any) => setLessonForm({ ...lessonForm, order_index: parseInt(e.target.value) || 0 })} />
          </div>
          <Button onClick={saveLesson} className="w-full">
            {editingLesson ? "Guardar cambios" : "Crear lección"}
          </Button>
        </div>
      </Modal>

      {/* Confirmaciones */}
      <ConfirmModal
        open={!!deletingModule}
        onClose={() => setDeletingModule(null)}
        onConfirm={doDeleteModule}
        title="¿Eliminar módulo?"
        message={`Vas a eliminar "${deletingModule?.name}". Si tiene lecciones, deberás eliminarlas primero.`}
        confirmLabel="Eliminar"
        confirmVariant="danger"
      />
      <ConfirmModal
        open={!!deletingLesson}
        onClose={() => setDeletingLesson(null)}
        onConfirm={doDeleteLesson}
        title="¿Eliminar lección?"
        message={`Vas a eliminar "${deletingLesson?.title}". Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        confirmVariant="danger"
      />
      <ConfirmModal
        open={showTemplateConfirm}
        onClose={() => setShowTemplateConfirm(false)}
        onConfirm={loadTemplate}
        title="¿Cargar plantilla de módulos?"
        message="Se van a crear 5 módulos pre-hechos por cada nivel VACÍO (con descripción y objetivos CEFR), más 2 lecciones de ejemplo en cada módulo. Los niveles que ya tengan contenido NO se tocan. Vos los editás después como quieras."
        confirmLabel={loadingTemplate ? "Cargando..." : "Sí, cargar plantilla"}
        confirmVariant="primary"
      />
    </>
  );
}
