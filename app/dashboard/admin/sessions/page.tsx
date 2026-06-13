"use client";
import { useEffect, useState } from "react";
import { adminApi, adminEdit, adminHelpers, adminContent, adminClassSeries, adminPrivateClasses, safeArray, safeObj } from "@/lib/api";
import { Repeat, User as UserIcon, Plus, X } from "lucide-react";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Input, Textarea, Select, Modal, SuccessBox, ConfirmModal, showToast, MeetingUrlGuide, MeetingUrlInput } from "@/components/ui";

export default function AdminSessionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const [show, setShow] = useState(false);
  const [showMenu, setShowMenu] = useState(false);  // V1.7: menú 3 opciones
  const [showSeries, setShowSeries] = useState(false);  // V1.7
  const [showPrivate, setShowPrivate] = useState(false);  // V1.7
  const [seriesList, setSeriesList] = useState<any[]>([]);  // V1.7
  const [studentsList, setStudentsList] = useState<any[]>([]);  // V1.7 para privadas
  const [seriesForm, setSeriesForm] = useState<any>({
    name: "", course_id: "", level_id: "", teacher_id: "",
    days_of_week: [], start_time_hhmm: "19:00", duration_min: 90,
    start_date: "", end_date: "", num_classes: "", end_type: "num_classes",
    modality: "online", meeting_url: "", capacity: 15,
  });
  const [privateForm, setPrivateForm] = useState<any>({
    student_id: "", teacher_id: "", course_id: "", level_id: "",
    title: "", starts_at: "", duration_min: 60,
    modality: "online", meeting_url: "", counts_for_progress: false,
  });
  const [confirmDeleteSeries, setConfirmDeleteSeries] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", meeting_url: "", teacher_notes: "" });
  const [isEditPast, setIsEditPast] = useState(false);

  const openEdit = (s: any) => {
    setEditing(s);
    const sStart = new Date(s.starts_at_utc);
    setIsEditPast(sStart < new Date());
    setEditForm({
      title: s.title || "",
      description: s.description || "",
      meeting_url: s.meeting_url || "",
      teacher_notes: s.teacher_notes || "",
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await adminEdit.updateSession(editing.id, editForm);
      showToast("success", "Clase actualizada");
      setEditing(null);
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  // Form
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);

  const [form, setForm] = useState({
    teacher_id: "", course_id: "", level_id: "", module_id: "",
    title: "", description: "", modality: "online",
    starts_at: "", duration_min: 90,
    meeting_url: "", branch_id: "", classroom_id: "",
    capacity: 12,
    is_open_event: false,
  });
  const [modules, setModules] = useState<any[]>([]);

  const load = () => {
    setLoading(true);
    setErr("");
    // V1.7 fix: cargar sessions primero, series por separado (si falla series no rompe)
    adminApi.sessions(page)
      .then((d: any) => {
        setItems(safeArray(safeObj(d, {} as any).items));
        // Cargar series en segundo plano (puede fallar si backend no tiene V1.7 todavía)
        adminClassSeries.list()
          .then((s: any) => setSeriesList(safeArray(s)))
          .catch(() => setSeriesList([]));  // silencioso si endpoint no existe aún
        setLoading(false);
      })
      .catch((e: any) => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, [page]);

  // V1.7: Abrir modal de serie recurrente
  const openSeries = async () => {
    try {
      const [ts, cs] = await Promise.all([
        adminHelpers.teachers().catch(() => []),
        adminApi.courses().catch(() => []),
      ]);
      setTeachers(safeArray(ts));
      setCourses(safeArray(cs));
      setShowMenu(false);
      setShowSeries(true);
    } catch (e: any) { showToast("error", "Error al cargar: " + e.message); }
  };

  // V1.7: Abrir modal de clase privada
  const openPrivate = async () => {
    try {
      const [ts, cs, us] = await Promise.all([
        adminHelpers.teachers().catch(() => []),
        adminApi.courses().catch(() => []),
        adminApi.users({ page: 1, limit: 500, role: "student" }).catch(() => ({ items: [] })),
      ]);
      setTeachers(safeArray(ts));
      setCourses(safeArray(cs));
      setStudentsList(safeArray((us as any).items));
      setShowMenu(false);
      setShowPrivate(true);
    } catch (e: any) { showToast("error", "Error al cargar: " + e.message); }
  };

  // V1.7: Toggle día de la semana
  const toggleDay = (day: string) => {
    setSeriesForm((prev: any) => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter((d: string) => d !== day)
        : [...prev.days_of_week, day],
    }));
  };

  // V1.7: Crear serie
  const submitSeries = async () => {
    if (!seriesForm.name || !seriesForm.course_id || !seriesForm.level_id || !seriesForm.teacher_id || seriesForm.days_of_week.length === 0 || !seriesForm.start_date) {
      showToast("error", "Completá nombre, curso, nivel, profesor, días y fecha de inicio");
      return;
    }
    if (seriesForm.end_type === "end_date" && !seriesForm.end_date) {
      showToast("error", "Falta fecha de fin");
      return;
    }
    if (seriesForm.end_type === "num_classes" && !seriesForm.num_classes) {
      showToast("error", "Falta cantidad de clases");
      return;
    }
    try {
      const body: any = {
        name: seriesForm.name,
        course_id: parseInt(seriesForm.course_id),
        level_id: parseInt(seriesForm.level_id),
        teacher_id: seriesForm.teacher_id,
        days_of_week: seriesForm.days_of_week.join(","),
        start_time_hhmm: seriesForm.start_time_hhmm,
        duration_min: parseInt(seriesForm.duration_min),
        start_date: seriesForm.start_date,
        modality: seriesForm.modality,
        meeting_url: seriesForm.meeting_url || null,
        capacity: parseInt(seriesForm.capacity),
      };
      if (seriesForm.end_type === "end_date") body.end_date = seriesForm.end_date;
      else body.num_classes = parseInt(seriesForm.num_classes);

      const r: any = await adminClassSeries.create(body);
      showToast("success", `✅ Serie creada: ${r.classes_created} clases generadas`);
      setShowSeries(false);
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  // V1.7: Crear clase privada
  const submitPrivate = async () => {
    if (!privateForm.student_id || !privateForm.teacher_id || !privateForm.course_id || !privateForm.level_id || !privateForm.title || !privateForm.starts_at) {
      showToast("error", "Completá todos los campos requeridos");
      return;
    }
    try {
      const body = {
        student_id: privateForm.student_id,
        teacher_id: privateForm.teacher_id,
        course_id: parseInt(privateForm.course_id),
        level_id: parseInt(privateForm.level_id),
        title: privateForm.title,
        starts_at_utc: new Date(privateForm.starts_at).toISOString(),
        duration_min: parseInt(privateForm.duration_min),
        modality: privateForm.modality,
        meeting_url: privateForm.meeting_url || null,
        counts_for_progress: privateForm.counts_for_progress,
      };
      await adminPrivateClasses.create(body);
      showToast("success", "✅ Clase privada creada");
      setShowPrivate(false);
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  // V1.7: Eliminar serie
  const doDeleteSeries = async () => {
    if (!confirmDeleteSeries) return;
    try {
      const r: any = await adminClassSeries.delete(confirmDeleteSeries.id, true);
      showToast("success", `Serie eliminada. ${r.deleted_classes} clases futuras canceladas.`);
      setConfirmDeleteSeries(null);
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  // Cargar niveles al elegir curso (serie)
  const onSeriesCourseChange = async (course_id: string) => {
    setSeriesForm({ ...seriesForm, course_id, level_id: "" });
    if (course_id) {
      try {
        const lvls = await adminHelpers.levelsByCourse(parseInt(course_id));
        setLevels(safeArray(lvls));
      } catch {}
    }
  };
  const onPrivateCourseChange = async (course_id: string) => {
    setPrivateForm({ ...privateForm, course_id, level_id: "" });
    if (course_id) {
      try {
        const lvls = await adminHelpers.levelsByCourse(parseInt(course_id));
        setLevels(safeArray(lvls));
      } catch {}
    }
  };

  const openModal = async () => {
    try {
      // V1.7 fix: cada endpoint con catch separado para que si uno falla, abra igual
      const [ts, cs, bs] = await Promise.all([
        adminHelpers.teachers().catch(() => []),
        adminApi.courses().catch(() => []),
        adminApi.branches().catch(() => []),
      ]);
      setTeachers(safeArray(ts));
      setCourses(safeArray(cs));
      setBranches(safeArray(bs));
      setShow(true);
    } catch (e: any) {
      showToast("error", "Error al cargar datos: " + e.message);
    }
  };

  // Cargar niveles cuando cambia el curso
  const onCourseChange = async (course_id: string) => {
    setForm({ ...form, course_id, level_id: "", module_id: "" });
    setModules([]);
    if (course_id) {
      try {
        const lvls = await adminHelpers.levelsByCourse(parseInt(course_id));
        setLevels(safeArray(lvls));
      } catch {}
    } else {
      setLevels([]);
    }
  };

  // V1.5: Cargar módulos al elegir nivel
  const onLevelChange = async (level_id: string) => {
    setForm({ ...form, level_id, module_id: "" });
    if (level_id) {
      try {
        const mods = await adminContent.modules(parseInt(level_id));
        setModules(safeArray(mods));
      } catch {
        setModules([]);
      }
    } else {
      setModules([]);
    }
  };

  // Cargar aulas cuando cambia la sede
  const onBranchChange = async (branch_id: string) => {
    setForm({ ...form, branch_id, classroom_id: "" });
    if (branch_id) {
      try {
        const rooms = await adminApi.classrooms(parseInt(branch_id));
        setClassrooms(safeArray(rooms));
      } catch {}
    } else {
      setClassrooms([]);
    }
  };

  const create = async () => {
    setMsg("");
    try {
      const start = new Date(form.starts_at);
      const end = new Date(start.getTime() + form.duration_min * 60000);
      const body: any = {
        teacher_id: form.teacher_id,
        course_id: parseInt(form.course_id),
        level_id: parseInt(form.level_id),
        title: form.title,
        description: form.description || undefined,
        modality: form.modality,
        starts_at_utc: start.toISOString(),
        ends_at_utc: end.toISOString(),
        capacity: form.capacity,
        is_open_event: form.is_open_event,
      };
      // V1.5: vincular a módulo si fue seleccionado
      if (form.module_id) body.module_id = parseInt(form.module_id);
      if (form.modality === "online" || form.modality === "hibrida") {
        body.meeting_url = form.meeting_url;
      }
      if (form.modality === "presencial" || form.modality === "hibrida") {
        if (form.branch_id) body.branch_id = parseInt(form.branch_id);
        if (form.classroom_id) body.classroom_id = parseInt(form.classroom_id);
      }
      await adminApi.createSession(body);
      setMsg("✓ Clase programada con éxito");
      setShow(false);
      setForm({
        teacher_id: "", course_id: "", level_id: "", module_id: "",
        title: "", description: "", modality: "online",
        starts_at: "", duration_min: 90,
        meeting_url: "", branch_id: "", classroom_id: "", capacity: 12,
        is_open_event: false,
      });
      setModules([]);
      load();
    } catch (e: any) { setMsg("✗ " + e.message); }
  };

  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const doCancel = async (id: string) => {
    try {
      await adminApi.cancelSession(id);
      showToast("success", "Clase cancelada");
      load();
    } catch (e: any) {
      showToast("error", e.message);
    }
  };

  const formValid = form.teacher_id && form.course_id && form.level_id && form.title && form.starts_at &&
    (form.modality === "online" ? form.meeting_url :
     form.modality === "presencial" ? form.branch_id :
     (form.meeting_url && form.branch_id));

  return (
    <>
      <PageHeader
        title="Clases programadas"
        action={
          <Button onClick={() => setShowMenu(!showMenu)}>
            <Plus size={14} className="inline mr-1" /> Nueva clase
          </Button>
        }
      />

      {/* V1.7: Menú de creación como modal centrado (mobile-friendly) */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/50" onClick={() => setShowMenu(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="font-extrabold text-lg">¿Qué tipo de clase querés crear?</h3>
              <button onClick={() => setShowMenu(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => { setShowMenu(false); openModal(); }}
                className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-slate-100 flex items-start gap-3 transition"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0 text-xl">📅</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">Clase grupal única</p>
                  <p className="text-xs text-slate-500">1 sola clase para un grupo (lo común)</p>
                </div>
              </button>
              <button
                onClick={openSeries}
                className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-slate-100 flex items-start gap-3 transition"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-50 text-accent-600 flex items-center justify-center flex-shrink-0">
                  <Repeat size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">🔁 Programación recurrente</p>
                  <p className="text-xs text-slate-500">Lun/Mié/Vie × 8 semanas (genera múltiples)</p>
                </div>
              </button>
              <button
                onClick={openPrivate}
                className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-slate-100 flex items-start gap-3 transition"
              >
                <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
                  <UserIcon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">👤 Clase privada 1-a-1</p>
                  <p className="text-xs text-slate-500">Asignada a un estudiante específico</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      {msg.startsWith("✓") && <div className="mb-4"><SuccessBox message={msg} /></div>}
      {msg.startsWith("✗") && <div className="mb-4"><ErrorBox message={msg.slice(2)} /></div>}

      {/* V1.7: Series activas */}
      {seriesList.filter((s: any) => s.is_active).length > 0 && (
        <Card className="mb-4">
          <CardBody>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Repeat size={14} />
                Series recurrentes activas
              </p>
              <span className="text-xs text-slate-400">{seriesList.filter((s: any) => s.is_active).length} series</span>
            </div>
            <div className="space-y-2">
              {seriesList.filter((s: any) => s.is_active).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{s.name}</p>
                    <p className="text-xs text-slate-500">
                      {s.level_code} · {s.teacher_name} · {s.days_of_week.replace(/,/g, ', ')} {s.start_time_hhmm}
                    </p>
                    <p className="text-xs text-slate-500">
                      <strong>{s.total_classes}</strong> clases ({s.past_classes} pasadas, {s.future_classes} futuras)
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setConfirmDeleteSeries(s)} className="text-red-600 border-red-200 hover:bg-red-50">
                    <X size={12} className="inline mr-1" /> Cancelar serie
                  </Button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {loading ? <LoadingScreen /> : err ? <ErrorBox message={err} /> :
       items.length === 0 ? <EmptyState icon="📅" title="Sin clases" description="Hacé clic en '+ Nueva clase' para programar una." /> : (
        <Card>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {items.map((s: any) => (
                <div key={s.id} className={`p-4 flex flex-wrap items-center gap-3 ${s.status === "cancelled" ? "opacity-50" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant={s.modality === "online" ? "brand" : s.modality === "presencial" ? "accent" : "info"}>{s.modality}</Badge>
                      <Badge>{s.level_code}</Badge>
                      {s.is_open_event && <Badge variant="warning">🎫 Evento</Badge>}
                      {s.series_id && <Badge variant="info">🔁 Recurrente</Badge>}
                      {s.student_id && <Badge variant="info">👤 Privada</Badge>}
                      {s.status === "cancelled" && <Badge variant="danger">Cancelada</Badge>}
                    </div>
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-xs text-slate-500">
                      {s.starts_at_utc && new Date(s.starts_at_utc).toLocaleString("es", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {" · "}{s.teacher_name}{" · "}{s.course_name}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openEdit(s)}>Editar</Button>
                  {s.status !== "cancelled" && (
                    <Button variant="danger" size="sm" onClick={() => setConfirmCancelId(s.id)}>Cancelar</Button>
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
      <div className="flex justify-center gap-2 mt-6">
        <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>← Anterior</Button>
        <span className="px-4 py-1.5 text-sm font-semibold">Página {page}</span>
        <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={items.length < 50}>Siguiente →</Button>
      </div>

      {/* Modal Nueva clase */}
      <Modal open={show} onClose={() => setShow(false)} title="Programar nueva clase" size="lg">
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <Select label="Profesor *" value={form.teacher_id} onChange={(e: any) => setForm({ ...form, teacher_id: e.target.value })}>
              <option value="">Seleccionar...</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </Select>
            <Select label="Curso *" value={form.course_id} onChange={(e: any) => onCourseChange(e.target.value)}>
              <option value="">Seleccionar...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>

          <Select label="Nivel *" value={form.level_id} onChange={(e: any) => onLevelChange(e.target.value)} disabled={!levels.length}>
            <option value="">{levels.length ? "Seleccionar..." : "Seleccioná un curso primero"}</option>
            {levels.map(l => <option key={l.id} value={l.id}>{l.code} — {l.name}</option>)}
          </Select>

          {/* V1.5: Vincular clase a módulo */}
          <Select label="Módulo (opcional)" value={form.module_id} onChange={(e: any) => setForm({ ...form, module_id: e.target.value })} disabled={!modules.length}>
            <option value="">{modules.length ? "Sin módulo específico" : "Seleccioná un nivel primero"}</option>
            {modules.map((m: any) => <option key={m.id} value={m.id}>M{m.order_index || "?"}. {m.name}</option>)}
          </Select>
          {form.module_id && (
            <p className="text-xs text-emerald-700 -mt-1">
              ✓ Vinculá esta clase a un módulo para que el progreso del estudiante avance automáticamente al tomar asistencia.
            </p>
          )}

          <Input label="Título de la clase *" value={form.title} onChange={(e: any) => setForm({ ...form, title: e.target.value })} placeholder="ej: Present perfect" />
          <Textarea label="Descripción" value={form.description} onChange={(e: any) => setForm({ ...form, description: e.target.value })} placeholder="Qué se va a enseñar" />

          <Select label="Modalidad *" value={form.modality} onChange={(e: any) => setForm({ ...form, modality: e.target.value })}>
            <option value="online">🌐 Online</option>
            <option value="presencial">🏢 Presencial</option>
            <option value="hibrida">🔀 Híbrida (ambas)</option>
          </Select>

          <div className="grid md:grid-cols-2 gap-3">
            <Input label="Fecha y hora inicio *" type="datetime-local" value={form.starts_at} onChange={(e: any) => setForm({ ...form, starts_at: e.target.value })} />
            <Input label="Duración (min)" type="number" value={form.duration_min} onChange={(e: any) => setForm({ ...form, duration_min: Number(e.target.value) })} />
          </div>

          {(form.modality === "online" || form.modality === "hibrida") && (
            <div className="space-y-2">
              <MeetingUrlInput
                label={`URL de Zoom/Meet/Teams ${form.modality === "online" ? "*" : "(híbrida *)"}`}
                value={form.meeting_url}
                onChange={(v: string) => setForm({ ...form, meeting_url: v })}
                required={form.modality === "online"}
              />
              <MeetingUrlGuide />
            </div>
          )}

          {(form.modality === "presencial" || form.modality === "hibrida") && (
            <div className="grid md:grid-cols-2 gap-3">
              <Select label="Sede *" value={form.branch_id} onChange={(e: any) => onBranchChange(e.target.value)}>
                <option value="">Seleccionar sede...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
              <Select label="Aula" value={form.classroom_id} onChange={(e: any) => setForm({ ...form, classroom_id: e.target.value })} disabled={!classrooms.length}>
                <option value="">{classrooms.length ? "Seleccionar..." : "Sede primero"}</option>
                {classrooms.map(r => <option key={r.id} value={r.id}>{r.name} (cap. {r.capacity})</option>)}
              </Select>
            </div>
          )}

          <Input label="Capacidad" type="number" value={form.capacity} onChange={(e: any) => setForm({ ...form, capacity: Number(e.target.value) })} />

          <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-slate-200 hover:border-brand-300 cursor-pointer transition">
            <input
              type="checkbox"
              checked={form.is_open_event}
              onChange={(e) => setForm({ ...form, is_open_event: e.target.checked })}
              className="mt-0.5 w-5 h-5 accent-brand-600"
            />
            <div>
              <p className="font-bold text-sm">🎫 Evento abierto a cualquier estudiante</p>
              <p className="text-xs text-slate-500 mt-1">
                Si marcás esta opción, cualquier estudiante podrá registrarse al evento (no solo los inscritos al nivel). Ideal para talleres, clubs de conversación y refuerzos.
              </p>
            </div>
          </label>

          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-3">
            {form.is_open_event ?
              "🎫 Cualquier estudiante podrá registrarse a este evento desde 'Eventos disponibles'." :
              "Los estudiantes del nivel recibirán notificación automática."}
          </p>
            <Button onClick={create} disabled={!formValid} className="w-full" size="lg">
              Programar clase
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Editar: ${editing?.title || ""}`}>
        <div className="space-y-3">
          {isEditPast && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              ⚠️ Esta clase ya pasó. Solo podés editar el título, descripción y notas.
            </div>
          )}
          <Input label="Título" value={editForm.title} onChange={(e: any) => setEditForm({ ...editForm, title: e.target.value })} />
          <Textarea label="Descripción" value={editForm.description} onChange={(e: any) => setEditForm({ ...editForm, description: e.target.value })} />
          {!isEditPast && (
            <MeetingUrlInput label="URL meeting" value={editForm.meeting_url} onChange={(v: string) => setEditForm({ ...editForm, meeting_url: v })} />
          )}
          <Textarea label="Notas del profesor (post-clase)" value={editForm.teacher_notes} onChange={(e: any) => setEditForm({ ...editForm, teacher_notes: e.target.value })} placeholder="Repasen el verbo X. Próxima clase traer..." />
          <Button onClick={saveEdit} className="w-full" size="lg">Guardar cambios</Button>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirmCancelId}
        onClose={() => setConfirmCancelId(null)}
        onConfirm={() => confirmCancelId && doCancel(confirmCancelId)}
        title="¿Cancelar esta clase?"
        message="Los estudiantes ya no podrán verla en su calendario. Esta acción se puede revertir manualmente desde la base de datos."
        confirmLabel="Sí, cancelar"
      />

      {/* V1.7: Modal Serie recurrente */}
      <Modal open={showSeries} onClose={() => setShowSeries(false)} title="🔁 Programar serie recurrente" size="lg">
        <div className="space-y-3">
          <Input label="Nombre de la serie *" value={seriesForm.name} onChange={(e: any) => setSeriesForm({ ...seriesForm, name: e.target.value })} placeholder="Ej: B1 Nocturno" />

          <div className="grid grid-cols-2 gap-2">
            <Select label="Curso *" value={seriesForm.course_id} onChange={(e: any) => onSeriesCourseChange(e.target.value)}>
              <option value="">Seleccionar...</option>
              {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select label="Nivel *" value={seriesForm.level_id} onChange={(e: any) => setSeriesForm({ ...seriesForm, level_id: e.target.value })} disabled={!levels.length}>
              <option value="">{levels.length ? "Seleccionar..." : "Curso primero"}</option>
              {levels.map((l: any) => <option key={l.id} value={l.id}>{l.code} — {l.name}</option>)}
            </Select>
          </div>

          <Select label="Profesor *" value={seriesForm.teacher_id} onChange={(e: any) => setSeriesForm({ ...seriesForm, teacher_id: e.target.value })}>
            <option value="">Seleccionar...</option>
            {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </Select>

          {/* Días de la semana */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Días de la semana *</label>
            <div className="grid grid-cols-7 gap-1">
              {[
                { value: "mon", label: "Lun" },
                { value: "tue", label: "Mar" },
                { value: "wed", label: "Mié" },
                { value: "thu", label: "Jue" },
                { value: "fri", label: "Vie" },
                { value: "sat", label: "Sáb" },
                { value: "sun", label: "Dom" },
              ].map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  className={`p-2 rounded-lg text-xs font-bold border-2 transition ${
                    seriesForm.days_of_week.includes(d.value)
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input label="Hora inicio *" type="time" value={seriesForm.start_time_hhmm} onChange={(e: any) => setSeriesForm({ ...seriesForm, start_time_hhmm: e.target.value })} />
            <Input label="Duración (min)" type="number" value={seriesForm.duration_min} onChange={(e: any) => setSeriesForm({ ...seriesForm, duration_min: parseInt(e.target.value) || 90 })} />
          </div>

          <Input label="Fecha de inicio *" type="date" value={seriesForm.start_date} onChange={(e: any) => setSeriesForm({ ...seriesForm, start_date: e.target.value })} />

          {/* Tipo de fin */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">¿Cómo termina la serie?</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setSeriesForm({ ...seriesForm, end_type: "num_classes" })}
                className={`p-2 rounded-lg text-xs font-semibold border-2 ${seriesForm.end_type === "num_classes" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200"}`}
              >
                Por # de clases
              </button>
              <button
                type="button"
                onClick={() => setSeriesForm({ ...seriesForm, end_type: "end_date" })}
                className={`p-2 rounded-lg text-xs font-semibold border-2 ${seriesForm.end_type === "end_date" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200"}`}
              >
                Por fecha fin
              </button>
            </div>
            {seriesForm.end_type === "num_classes" ? (
              <Input label="Cantidad de clases *" type="number" value={seriesForm.num_classes} onChange={(e: any) => setSeriesForm({ ...seriesForm, num_classes: e.target.value })} placeholder="Ej: 24" />
            ) : (
              <Input label="Fecha de fin *" type="date" value={seriesForm.end_date} onChange={(e: any) => setSeriesForm({ ...seriesForm, end_date: e.target.value })} />
            )}
          </div>

          <Select label="Modalidad" value={seriesForm.modality} onChange={(e: any) => setSeriesForm({ ...seriesForm, modality: e.target.value })}>
            <option value="online">Online</option>
            <option value="presencial">Presencial</option>
            <option value="hibrida">Híbrida</option>
          </Select>

          {seriesForm.modality !== "presencial" && (
            <Input label="Link Zoom/Meet/Teams" value={seriesForm.meeting_url} onChange={(e: any) => setSeriesForm({ ...seriesForm, meeting_url: e.target.value })} placeholder="https://zoom.us/..." />
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
            💡 Se generarán todas las clases automáticamente con los datos especificados. Después podés editar o cancelar cualquier clase individualmente.
          </div>

          <Button onClick={submitSeries} className="w-full" size="lg">
            🔁 Crear serie y generar clases
          </Button>
        </div>
      </Modal>

      {/* V1.7: Modal Clase privada */}
      <Modal open={showPrivate} onClose={() => setShowPrivate(false)} title="👤 Crear clase privada 1-a-1" size="lg">
        <div className="space-y-3">
          <Select label="Estudiante *" value={privateForm.student_id} onChange={(e: any) => setPrivateForm({ ...privateForm, student_id: e.target.value })}>
            <option value="">Seleccionar estudiante...</option>
            {studentsList.map((s: any) => <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>)}
          </Select>

          <Select label="Profesor *" value={privateForm.teacher_id} onChange={(e: any) => setPrivateForm({ ...privateForm, teacher_id: e.target.value })}>
            <option value="">Seleccionar...</option>
            {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </Select>

          <div className="grid grid-cols-2 gap-2">
            <Select label="Curso *" value={privateForm.course_id} onChange={(e: any) => onPrivateCourseChange(e.target.value)}>
              <option value="">Seleccionar...</option>
              {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select label="Nivel *" value={privateForm.level_id} onChange={(e: any) => setPrivateForm({ ...privateForm, level_id: e.target.value })} disabled={!levels.length}>
              <option value="">{levels.length ? "Seleccionar..." : "Curso primero"}</option>
              {levels.map((l: any) => <option key={l.id} value={l.id}>{l.code} — {l.name}</option>)}
            </Select>
          </div>

          <Input label="Título *" value={privateForm.title} onChange={(e: any) => setPrivateForm({ ...privateForm, title: e.target.value })} placeholder="Ej: Refuerzo grammar particular" />

          <div className="grid grid-cols-2 gap-2">
            <Input label="Fecha y hora *" type="datetime-local" value={privateForm.starts_at} onChange={(e: any) => setPrivateForm({ ...privateForm, starts_at: e.target.value })} />
            <Input label="Duración (min)" type="number" value={privateForm.duration_min} onChange={(e: any) => setPrivateForm({ ...privateForm, duration_min: parseInt(e.target.value) || 60 })} />
          </div>

          <Select label="Modalidad" value={privateForm.modality} onChange={(e: any) => setPrivateForm({ ...privateForm, modality: e.target.value })}>
            <option value="online">Online</option>
            <option value="presencial">Presencial</option>
            <option value="hibrida">Híbrida</option>
          </Select>

          {privateForm.modality !== "presencial" && (
            <Input label="Link Zoom/Meet/Teams" value={privateForm.meeting_url} onChange={(e: any) => setPrivateForm({ ...privateForm, meeting_url: e.target.value })} placeholder="https://zoom.us/..." />
          )}

          <label className="flex items-start gap-2 cursor-pointer p-3 bg-slate-50 rounded-lg">
            <input
              type="checkbox"
              checked={privateForm.counts_for_progress}
              onChange={(e) => setPrivateForm({ ...privateForm, counts_for_progress: e.target.checked })}
              className="mt-0.5"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold">Cuenta para el progreso CEFR</p>
              <p className="text-xs text-slate-500">
                Si marcás esto, la asistencia avanza el módulo en la ruta del estudiante. Si NO marcás, es solo refuerzo.
              </p>
            </div>
          </label>

          <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 text-xs text-violet-900">
            💡 Solo este estudiante verá la clase. Para cobrar adicional, registralo en Pagos manualmente.
          </div>

          <Button onClick={submitPrivate} className="w-full" size="lg">
            👤 Crear clase privada
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirmDeleteSeries}
        onClose={() => setConfirmDeleteSeries(null)}
        onConfirm={doDeleteSeries}
        title={`¿Cancelar serie "${confirmDeleteSeries?.name}"?`}
        message={`Se cancelarán las ${confirmDeleteSeries?.future_classes || 0} clases futuras de esta serie. Las clases pasadas se mantienen para historial.`}
        confirmLabel="Sí, cancelar serie"
        confirmVariant="danger"
      />
    </>
  );
}
