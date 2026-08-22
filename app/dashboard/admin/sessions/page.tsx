"use client";
import { useEffect, useState } from "react";
import { adminApi, adminEdit, adminHelpers, adminContent, adminClassSeries, adminPrivateClasses, safeArray, safeObj, api } from "@/lib/api";
import { Repeat, User as UserIcon, Plus, X } from "lucide-react";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Input, Textarea, Select, Modal, SuccessBox, ConfirmModal, showToast, MeetingUrlGuide, MeetingUrlInput } from "@/components/ui";
import SelectorVideo from "@/components/SelectorVideo";  // V3.9.32

const TIPOS = [
  { key: "all", label: "Todas", icon: "📅" },
  { key: "series", label: "Series", icon: "🔁" },
  { key: "single", label: "Sueltas", icon: "📌" },
  { key: "private", label: "Privadas", icon: "👤" },
  { key: "trial", label: "Pruebas", icon: "🎯" },
  { key: "event", label: "Eventos", icon: "🎫" },
];

export default function AdminSessionsPage() {
  const [tipo, setTipo] = useState("all");  // V3.9.30
  // V3.9.39 — Sustituir profesor en UNA clase
  const [sustituir, setSustituir] = useState<any>(null);
  const [profesLibres, setProfesLibres] = useState<any[]>([]);
  const [subBusy, setSubBusy] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const [show, setShow] = useState(false);
  const [showMenu, setShowMenu] = useState(false);  // V1.7: menú 3 opciones
  const [showSeries, setShowSeries] = useState(false);  // V1.7
  const [showPrivate, setShowPrivate] = useState(false);  // V1.7
  // V3.9.15: Evento abierto (webinar, club, taller — puede ser híbrido)
  const [showEvent, setShowEvent] = useState(false);
  const [eventForm, setEventForm] = useState<any>({
    title: "", description: "", date: "", time: "", duration_min: 90,
    modality: "hibrida", teacher_id: "", meeting_url: "", branch_id: "", capacity: 30, video_provider: "meet",
  });
  const [eventSaving, setEventSaving] = useState(false);
  const [seriesList, setSeriesList] = useState<any[]>([]);  // V1.7

  // ══ V3.9.65 — ¿PARA QUIÉN ES ESTA CLASE SUELTA? ══
  //
  // Antes una clase suelta se creaba "para el nivel" y se anunciaba a todo
  // A2. No había forma de decir "esta es para María y Pedro". Ahora se elige
  // grupo o estudiantes concretos, y esa elección se guarda en
  // SessionAudience, que ya es la fuente de verdad del sistema.
  const [audienceMode, setAudienceMode] = useState<"level" | "series" | "students">("level");
  const [pickedStudents, setPickedStudents] = useState<any[]>([]);
  const [studentQuery, setStudentQuery] = useState("");
  const [studentHits, setStudentHits] = useState<any[]>([]);
  const [searchingStudents, setSearchingStudents] = useState(false);

  // Buscador con pausa: no se dispara una consulta por cada tecla.
  useEffect(() => {
    if (audienceMode !== "students") return;
    const q = studentQuery.trim();
    if (q.length < 2) { setStudentHits([]); return; }
    let cancelado = false;
    setSearchingStudents(true);
    const t = setTimeout(async () => {
      try {
        const r: any = await adminApi.users({ role: "student", q, limit: 15 });
        if (!cancelado) setStudentHits(safeArray(r?.items ?? r));
      } catch {
        if (!cancelado) setStudentHits([]);
      } finally {
        if (!cancelado) setSearchingStudents(false);
      }
    }, 350);
    return () => { cancelado = true; clearTimeout(t); };
  }, [studentQuery, audienceMode]);

  const toggleStudent = (st: any) => {
    setPickedStudents((prev) =>
      prev.some((x) => x.id === st.id)
        ? prev.filter((x) => x.id !== st.id)
        : [...prev, st]
    );
  };
  // V3.9.62: Editar serie completa (horario, profesor, modalidad y video)
  const [reschedSeries, setReschedSeries] = useState<any>(null);
  const [reschedForm, setReschedForm] = useState<any>({
    days_of_week: [], start_time_hhmm: "", duration_min: 90,
    teacher_id: "", modality: "", video_provider: "meet", meeting_url: "",
    // V3.9.69 — El backend ya aceptaba sede/aula, pero el modal no las
    // enviaba: una serie presencial se quedaba en "Ubicación por confirmar".
    branch_id: "", classroom_id: "",
  });
  const [reschedClassrooms, setReschedClassrooms] = useState<any[]>([]);
  const [reschedSaving, setReschedSaving] = useState(false);
  const [studentsList, setStudentsList] = useState<any[]>([]);  // V1.7 para privadas
  const [seriesForm, setSeriesForm] = useState<any>({
    name: "", course_id: "", level_id: "", teacher_id: "",
    days_of_week: [], start_time_hhmm: "19:00", duration_min: 90,
    start_date: "", end_date: "", num_classes: "", end_type: "num_classes",
    modality: "online", meeting_url: "", capacity: 15, video_provider: "meet",
    branch_id: "", classroom_id: "",
  });
  const [seriesClassrooms, setSeriesClassrooms] = useState<any[]>([]);
  const [privateForm, setPrivateForm] = useState<any>({
    student_id: "", teacher_id: "", course_id: "", level_id: "",
    title: "", starts_at: "", duration_min: 60,
    modality: "online", meeting_url: "", counts_for_progress: false, video_provider: "meet",
  });
  const [confirmDeleteSeries, setConfirmDeleteSeries] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    title: "", description: "", meeting_url: "", teacher_notes: "",
    starts_at: "", duration_min: 60, teacher_id: "", modality: "",
    // V3.9.68 — Faltaban en el editor de UNA sesión, así que una excepción
    // virtual dentro de una serie presencial no podía elegir Video Dorismon,
    // y una excepción presencial dentro de una serie virtual se quedaba en
    // "Ubicación por confirmar" porque no había dónde poner sede/aula.
    video_provider: "meet", branch_id: "", classroom_id: "",
  });
  const [editClassrooms, setEditClassrooms] = useState<any[]>([]);
  // V3.9.65 — Hasta dónde llega el cambio al editar una clase de una serie.
  // "this" | "this_and_following" | "all"
  const [editScope, setEditScope] = useState<"this" | "this_and_following" | "all">("this");
  const [isEditPast, setIsEditPast] = useState(false);

  // Convierte una fecha ISO (UTC) al formato datetime-local en hora local (YYYY-MM-DDTHH:mm)
  const toLocalInput = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    // Ajustar a hora local restando el offset, para que el input muestre la hora local correcta
    const off = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - off).toISOString().slice(0, 16);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    const sStart = new Date(s.starts_at_utc);
    setIsEditPast(sStart < new Date());
    // Calcular duración en minutos a partir de inicio y fin
    let dur = 60;
    if (s.starts_at_utc && s.ends_at_utc) {
      dur = Math.round((new Date(s.ends_at_utc).getTime() - new Date(s.starts_at_utc).getTime()) / 60000);
    }
    setEditForm({
      title: s.title || "",
      description: s.description || "",
      meeting_url: s.meeting_url || "",
      teacher_notes: s.teacher_notes || "",
      starts_at: toLocalInput(s.starts_at_utc),
      duration_min: dur,
      teacher_id: s.teacher_id || "",
      modality: s.modality || "online",
      video_provider: s.video_provider || "meet",
      branch_id: s.branch_id ? String(s.branch_id) : "",
      classroom_id: s.classroom_id ? String(s.classroom_id) : "",
    });
    // Cargar las aulas de la sede que ya tiene, si tiene
    if (s.branch_id) {
      adminApi.classrooms(Number(s.branch_id))
        .then((r: any) => setEditClassrooms(safeArray(r)))
        .catch(() => setEditClassrooms([]));
    } else {
      setEditClassrooms([]);
    }
    // Siempre se abre en "solo esta clase": el cambio más conservador. Que
    // afecte a varias fechas tiene que ser una decisión consciente.
    setEditScope("this");
  };

  // V3.9.8: Reprogramar serie a futuro (hora, días, profesor)
  const DOW = [
    { key: "mon", label: "Lun" }, { key: "tue", label: "Mar" }, { key: "wed", label: "Mié" },
    { key: "thu", label: "Jue" }, { key: "fri", label: "Vie" }, { key: "sat", label: "Sáb" }, { key: "sun", label: "Dom" },
  ];
  // V3.9.15: crear evento abierto (con soporte híbrido)
  const createEvent = async () => {
    if (!eventForm.title || !eventForm.date || !eventForm.time || !eventForm.teacher_id) {
      showToast("error", "Completa título, fecha, hora y anfitrión"); return;
    }
    const needsLink = eventForm.modality === "online" || eventForm.modality === "hibrida";
    const needsBranch = eventForm.modality === "presencial" || eventForm.modality === "hibrida";
    if (needsLink && !eventForm.meeting_url) { showToast("error", "Un evento online o híbrido necesita el link"); return; }
    if (needsBranch && !eventForm.branch_id) { showToast("error", "Un evento presencial o híbrido necesita la sede"); return; }
    if (eventSaving) return;
    setEventSaving(true);
    try {
      const startIso = `${eventForm.date}T${eventForm.time}:00-04:00`;  // RD timezone
      const start = new Date(startIso);
      const end = new Date(start.getTime() + (eventForm.duration_min || 90) * 60000);
      await adminApi.createEvent({
        title: eventForm.title,
        description: eventForm.description || undefined,
        starts_at_utc: start.toISOString(),
        ends_at_utc: end.toISOString(),
        modality: eventForm.modality,
        teacher_id: eventForm.teacher_id,
        meeting_url: needsLink ? eventForm.meeting_url : undefined,
        video_provider: eventForm.video_provider,  // V3.9.32
        branch_id: needsBranch ? parseInt(eventForm.branch_id) : undefined,
        capacity: eventForm.capacity || 30,
      });
      showToast("success", "🎉 Evento creado — visible para todos los estudiantes");
      setShowEvent(false);
      setEventForm({ title: "", description: "", date: "", time: "", duration_min: 90, modality: "hibrida", teacher_id: "", meeting_url: "", branch_id: "", capacity: 30 });
      load();
    } catch (e: any) { showToast("error", e.message); }
    finally { setEventSaving(false); }
  };

  // V3.9.62 — Abrir "Editar serie" con el estado REAL del grupo cargado.
  //
  // Antes el modal abría con el video vacío. Si guardabas para cambiar la
  // hora, el enlace de la serie se perdía porque el formulario nunca lo tuvo.
  const openReschedule = (s: any) => {
    setReschedSeries(s);
    setReschedForm({
      days_of_week: (s.days_of_week || "").split(",").filter(Boolean),
      start_time_hhmm: s.start_time_hhmm || "",
      duration_min: s.duration_min || 90,
      teacher_id: "",  // vacío = no cambiar
      modality: "",    // vacío = no cambiar
      video_provider: s.video_provider || "meet",
      meeting_url: s.meeting_url || "",
      branch_id: s.branch_id ? String(s.branch_id) : "",
      classroom_id: s.classroom_id ? String(s.classroom_id) : "",
    });
    if (s.branch_id) {
      adminApi.classrooms(Number(s.branch_id))
        .then((r: any) => setReschedClassrooms(safeArray(r)))
        .catch(() => setReschedClassrooms([]));
    } else {
      setReschedClassrooms([]);
    }
  };
  const toggleReschedDay = (day: string) => {
    setReschedForm((f: any) => ({
      ...f,
      days_of_week: f.days_of_week.includes(day) ? f.days_of_week.filter((d: string) => d !== day) : [...f.days_of_week, day],
    }));
  };

  // ¿Cambian los DÍAS? Es la única edición que obliga a regenerar fechas.
  // Se calcula aquí para poder avisarlo ANTES de guardar.
  const reschedCambiaDias = (() => {
    if (!reschedSeries) return false;
    const antes = (reschedSeries.days_of_week || "").split(",").filter(Boolean).sort().join(",");
    const ahora = [...reschedForm.days_of_week].sort().join(",");
    return antes !== ahora;
  })();

  const doReschedule = async () => {
    if (!reschedSeries) return;
    if (reschedForm.days_of_week.length === 0) { showToast("error", "Selecciona al menos un día"); return; }
    if (!reschedForm.start_time_hhmm) { showToast("error", "Indica la hora"); return; }
    // V3.9.69 — La modalidad manda. Una serie PRESENCIAL no necesita video,
    // y antes este formulario lo exigía igualmente: no se podía ni cambiarle
    // el aula sin inventarse un enlace.
    const modFinal = reschedForm.modality || reschedSeries.modality || "online";
    if (modFinal !== "presencial" && reschedForm.meeting_url.trim() &&
        !esHttps(reschedForm.meeting_url)) {
      showToast("error", "El enlace de la reunión debe empezar con https://");
      return;
    }
    if (modFinal !== "presencial" && reschedForm.video_provider === "meet") {
      if (!reschedForm.meeting_url.trim()) {
        showToast("error", "Un enlace externo necesita el link de la reunión");
        return;
      }
      if (!esHttps(reschedForm.meeting_url)) {
        showToast("error", "El enlace de la reunión debe empezar con https://");
        return;
      }
    }
    if (modFinal !== "online" && !reschedForm.branch_id) {
      showToast("error", "Una clase presencial necesita sede");
      return;
    }
    setReschedSaving(true);
    try {
      // Solo se manda lo que cambió de verdad: así el backend sabe que puede
      // editar en sitio en vez de regenerar las clases futuras.
      const body: any = {};
      if (reschedCambiaDias) body.days_of_week = reschedForm.days_of_week.join(",");
      if (reschedForm.start_time_hhmm !== reschedSeries.start_time_hhmm) {
        body.start_time_hhmm = reschedForm.start_time_hhmm;
      }
      if (Number(reschedForm.duration_min) !== Number(reschedSeries.duration_min)) {
        body.duration_min = Number(reschedForm.duration_min);
      }
      if (reschedForm.teacher_id) body.teacher_id = reschedForm.teacher_id;
      if (reschedForm.modality) body.modality = reschedForm.modality;
      if (reschedForm.video_provider !== (reschedSeries.video_provider || "meet")) {
        body.video_provider = reschedForm.video_provider;
      }
      if (reschedForm.meeting_url.trim() !== (reschedSeries.meeting_url || "")) {
        body.meeting_url = reschedForm.meeting_url.trim();
      }
      const _rb = reschedForm.branch_id ? Number(reschedForm.branch_id) : null;
      const _rc = reschedForm.classroom_id ? Number(reschedForm.classroom_id) : null;
      if (_rb !== (reschedSeries.branch_id ?? null)) body.branch_id = _rb;
      if (_rc !== (reschedSeries.classroom_id ?? null)) body.classroom_id = _rc;

      if (Object.keys(body).length === 0) {
        showToast("error", "No cambiaste nada todavía");
        setReschedSaving(false);
        return;
      }

      const r: any = await adminClassSeries.reschedule(reschedSeries.id, body);

      const partes: string[] = [];
      if (r.modo === "regenerada") {
        partes.push(`${r.regenerated_classes} clases futuras reprogramadas`);
      } else if (r.updated_classes > 0) {
        partes.push(`${r.updated_classes} clases futuras actualizadas`);
      }
      partes.push(`${r.kept_past_classes} pasadas intactas`);
      if (r.not_moved_classes > 0) {
        partes.push(`${r.not_moved_classes} se quedaron en su hora (la nueva ya pasó)`);
      }
      showToast("success", `✅ ${partes.join(" · ")}`);
      setReschedSeries(null);
      load();
    } catch (e: any) {
      showToast("error", e.message || "No se pudo guardar el cambio");
    } finally {
      setReschedSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      // Para clases pasadas, solo enviamos los campos permitidos (título/desc/notas)
      let body: any;
      if (isEditPast) {
        body = {
          title: editForm.title,
          description: editForm.description,
          teacher_notes: editForm.teacher_notes,
        };
      } else {
        // ══ V3.9.67 — SOLO SE MANDA LO QUE DE VERDAD CAMBIÓ ══
        //
        // ANTES este formulario enviaba SIEMPRE modality y meeting_url, aunque
        // el admin no los hubiera tocado — venían precargados del estado de la
        // sesión. Con "esta y las siguientes" eso era destructivo:
        //
        //   miércoles presencial (excepción) · viernes virtual · lunes virtual
        //   editas el TÍTULO del miércoles con "esta y las siguientes"
        //   -> se reenviaba "presencial"
        //   -> viernes y lunes quedaban presenciales
        //
        // Es decir: borraba excepciones futuras sin que nadie lo pidiera.
        // Ahora cada campo se compara con el valor original de la sesión y
        // solo viaja si difiere.
        body = {};
        const cambio = (campo: string, valor: any, original: any) => {
          if (valor !== original) body[campo] = valor;
        };

        cambio("title", editForm.title, editing.title || "");
        cambio("description", editForm.description, editing.description || "");
        cambio("teacher_notes", editForm.teacher_notes, editing.teacher_notes || "");
        cambio("meeting_url", editForm.meeting_url, editing.meeting_url || "");
        if (editForm.teacher_id && editForm.teacher_id !== editing.teacher_id) {
          body.teacher_id = editForm.teacher_id;
        }
        if (editForm.modality && editForm.modality !== editing.modality) {
          body.modality = editForm.modality;
        }
        // V3.9.68 — También por delta: si el admin no los tocó, no viajan, y
        // así una excepción conserva la configuración heredada de la serie.
        if (editForm.video_provider !== (editing.video_provider || "meet")) {
          body.video_provider = editForm.video_provider;
        }
        const _b = editForm.branch_id ? Number(editForm.branch_id) : null;
        const _c = editForm.classroom_id ? Number(editForm.classroom_id) : null;
        if (_b !== (editing.branch_id ?? null)) body.branch_id = _b;
        if (_c !== (editing.classroom_id ?? null)) body.classroom_id = _c;

        // La fecha/hora solo viaja si el admin la movió de verdad.
        if (editForm.starts_at) {
          const start = new Date(editForm.starts_at);
          const end = new Date(start.getTime() + (editForm.duration_min || 60) * 60000);
          const originalStart = editing.starts_at_utc
            ? new Date(editing.starts_at_utc).getTime()
            : null;
          const originalDur = editing.starts_at_utc && editing.ends_at_utc
            ? Math.round((new Date(editing.ends_at_utc).getTime() -
                          new Date(editing.starts_at_utc).getTime()) / 60000)
            : null;
          if (start.getTime() !== originalStart ||
              (editForm.duration_min || 60) !== originalDur) {
            body.starts_at_utc = start.toISOString();
            body.ends_at_utc = end.toISOString();
          }
        }

        if (Object.keys(body).length === 0) {
          showToast("error", "No cambiaste nada todavía");
          return;
        }

        // ══ V3.9.68 — NO PROMETER LO QUE NO SE VA A HACER ══
        //
        // El backend solo propaga logística: modalidad, video, enlace, sede,
        // aula y cupo. La hora, la duración, el profesor y el título se
        // aplican SOLO a esta sesión, y con razón: una hora concreta no
        // significa nada en otra fecha, y el cambio permanente de profesor
        // tiene su propio flujo con detección de choques e histórico.
        //
        // El problema era que la interfaz decía "desde esta fecha en
        // adelante" y luego cambiaba la hora de una sola clase. El admin se
        // quedaba creyendo que había reprogramado el grupo entero.
        if (editScope === "this_and_following") {
          const noPropagables = Object.keys(body).filter((k) =>
            ["starts_at_utc", "ends_at_utc", "teacher_id", "title", "description",
             "teacher_notes"].includes(k)
          );
          if (noPropagables.length > 0) {
            const horario = noPropagables.some((k) => k.startsWith("starts_") || k.startsWith("ends_"));
            const profe = noPropagables.includes("teacher_id");
            showToast(
              "error",
              horario
                ? "El horario de varias fechas se cambia en “Editar serie”. Aquí puedes cambiarlo solo para esta clase."
                : profe
                ? "El cambio permanente de profesor se hace en “Editar serie”, que revisa choques de horario. Aquí solo para esta clase."
                : "El título y las notas se aplican solo a esta clase. Cambia el alcance a “Solo esta clase”."
            );
            return;
          }
        }
      }

      // ══ V3.9.65 — UNA SOLA PANTALLA, TRES RUTAS DISTINTAS ══
      //
      // Para Dirección esto es un único formulario. Por debajo, cada alcance
      // va al endpoint que ya existe y que ya está probado:
      //
      //   Solo esta clase        -> PATCH /admin/sessions/{id}
      //   Esta y las siguientes  -> el mismo, con apply_to
      //   Toda la serie          -> PATCH /admin/class-series/{id}/reschedule
      //
      // La tercera NO se reimplementa aquí: ese endpoint ya conserva el
      // historial, los IDs de sesión y la rotación de módulos. Duplicarlo
      // sería crear una segunda verdad.
      if (editScope === "all" && editing.series_id) {
        // ══ V3.9.67 — "TODA LA SERIE" NO REUTILIZA ESTE FORMULARIO ══
        //
        // ANTES esta rama mandaba al endpoint de serie la modalidad cargada en
        // la pantalla. Peligroso: si abrías un miércoles que era una EXCEPCIÓN
        // presencial dentro de una serie virtual y solo querías cambiar el
        // enlace, se enviaba también "presencial" y toda la serie se volvía
        // presencial. Los valores de una excepción no representan a la serie.
        //
        // Ahora se abre el editor de serie de verdad —el que ya está probado—
        // precargado con el estado REAL del grupo, no con el de esta sesión.
        const serie = seriesList.find((g: any) => g.id === editing.series_id);
        if (!serie) {
          showToast("error", "No se encontró la serie de esta clase");
          return;
        }
        setEditing(null);
        openReschedule(serie);
        showToast("success", "Edita aquí la programación habitual del grupo");
        return;
      }

      {
        if (editScope === "this_and_following" && editing.series_id) {
          body.apply_to = "this_and_following";
        }
        const r: any = await adminEdit.updateSession(editing.id, body);
        const extra = r?.following_updated
          ? ` y ${r.following_updated} clases siguientes`
          : "";
        showToast("success", `Clase actualizada${extra}`);
      }
      setEditing(null);
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  // Form
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [videoReady, setVideoReady] = useState(false);  // V3.9.26: ¿LiveKit configurado?
  const [classrooms, setClassrooms] = useState<any[]>([]);

  const [form, setForm] = useState({
    teacher_id: "", course_id: "", level_id: "", module_id: "",
    title: "", description: "", modality: "online",
    starts_at: "", duration_min: 90,
    meeting_url: "", branch_id: "", classroom_id: "", video_provider: "meet",
    capacity: 12,
    is_open_event: false,
    series_id: "",   // V3.9.65: si la clase suelta pertenece a un grupo
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
  // V3.9.26: saber si se puede ofrecer el video propio
  useEffect(() => {
    api("/video/status", { auth: true })
      .then((r: any) => setVideoReady(!!r?.ready))
      .catch(() => setVideoReady(false));
  }, []);

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

  const esHttps = (value: string) => /^https:\/\//i.test((value || "").trim());

  // V1.7: Crear serie
  const submitSeries = async () => {
    if (!seriesForm.name || !seriesForm.course_id || !seriesForm.level_id || !seriesForm.teacher_id || seriesForm.days_of_week.length === 0 || !seriesForm.start_date) {
      showToast("error", "Completa nombre, curso, nivel, profesor, días y fecha de inicio");
      return;
    }
    if (seriesForm.end_type === "end_date" && !seriesForm.end_date) {
      showToast("error", "Falta fecha de fin");
      return;
    }
    if (seriesForm.modality !== "online" && !seriesForm.branch_id) {
      showToast("error", "Una serie presencial necesita sede");
      return;
    }
    if (seriesForm.modality !== "presencial" && seriesForm.meeting_url.trim() &&
        !esHttps(seriesForm.meeting_url)) {
      showToast("error", "El enlace de la reunión debe empezar con https://");
      return;
    }
    if (seriesForm.modality !== "presencial" && seriesForm.video_provider !== "dorismon") {
      if (!seriesForm.meeting_url.trim()) {
        showToast("error", "Con enlace externo hace falta el link de la reunión");
        return;
      }
      if (!esHttps(seriesForm.meeting_url)) {
        showToast("error", "El enlace de la reunión debe empezar con https://");
        return;
      }
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
        video_provider: seriesForm.video_provider,  // V3.9.32
        capacity: parseInt(seriesForm.capacity),
        // V3.9.69 — Sede y aula desde el principio. Antes una serie
        // presencial nacía sin ubicación y no había forma de dársela.
        branch_id: seriesForm.branch_id ? parseInt(seriesForm.branch_id) : null,
        classroom_id: seriesForm.classroom_id ? parseInt(seriesForm.classroom_id) : null,
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
      showToast("error", "Completa todos los campos requeridos");
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
        video_provider: privateForm.video_provider,  // V3.9.32
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
    if ((form.modality === "online" || form.modality === "hibrida") &&
        form.meeting_url.trim() && !esHttps(form.meeting_url)) {
      setMsg("✗ El enlace debe empezar con https://"); return;
    }
    if ((form.modality === "online" || form.modality === "hibrida") &&
        form.video_provider !== "dorismon") {
      if (!form.meeting_url.trim()) { setMsg("✗ Falta el enlace de la reunión"); return; }
      if (!esHttps(form.meeting_url)) { setMsg("✗ El enlace debe empezar con https://"); return; }
    }
    if ((form.modality === "presencial" || form.modality === "hibrida") && !form.branch_id) {
      setMsg("✗ Selecciona la sede"); return;
    }
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
        body.video_provider = form.video_provider;  // V3.9.26
      }
      if (form.modality === "presencial" || form.modality === "hibrida") {
        if (form.branch_id) body.branch_id = parseInt(form.branch_id);
        if (form.classroom_id) body.classroom_id = parseInt(form.classroom_id);
      }
      // V3.9.65 — La audiencia va con la clase. El backend valida cada ID y
      // la guarda en SessionAudience; nunca se confía en lo que llegue aquí.
      if (audienceMode === "students") {
        if (pickedStudents.length === 0) {
          setMsg("✗ Selecciona al menos un estudiante");
          return;
        }
        body.student_ids = pickedStudents.map((x) => x.id);
      } else if (audienceMode === "series") {
        if (!form.series_id) { setMsg("✗ Selecciona un grupo"); return; }
        body.series_id = form.series_id;
      }

      const r: any = await adminApi.createSession(body);
      setMsg(
        audienceMode === "students"
          ? `✓ Clase programada para ${pickedStudents.length} estudiante(s)`
          : "✓ Clase programada con éxito"
      );
      setShow(false);
      setForm({
        teacher_id: "", course_id: "", level_id: "", module_id: "",
        title: "", description: "", modality: "online",
        starts_at: "", duration_min: 90,
        meeting_url: "", branch_id: "", classroom_id: "", capacity: 12, video_provider: "meet",
        is_open_event: false,
        series_id: "",
      });
      setAudienceMode("level");
      setPickedStudents([]);
      setStudentQuery("");
      setStudentHits([]);
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

  // V3.9.69 — Híbrida con Video Dorismon NO necesita enlace de respaldo.
  // Antes esta condición lo exigía, así que "Híbrida + Video Dorismon + sede"
  // dejaba el botón deshabilitado sin explicar por qué.
  const _urlOk = !form.meeting_url.trim() || esHttps(form.meeting_url);
  const _videoOk = _urlOk && (form.video_provider === "dorismon" || esHttps(form.meeting_url));
  const formValid = form.teacher_id && form.course_id && form.level_id && form.title && form.starts_at &&
    (form.modality === "online" ? _videoOk :
     form.modality === "presencial" ? !!form.branch_id :
     (_videoOk && !!form.branch_id));

  // V3.9.30: lo que se muestra según la pestaña elegida
  // V3.9.39 — Al abrir, se consulta quién está libre a esa hora
  const abrirSustituto = async (s: any) => {
    setSustituir(s);
    setProfesLibres([]);
    try {
      const r: any = await api(`/admin/sessions/${s.id}/available-teachers`, { auth: true });
      setProfesLibres(r?.items || []);
    } catch { /* si falla, se puede elegir igual */ }
  };

  const ponerSustituto = async (teacherId: string, confirmar = false) => {
    setSubBusy(true);
    try {
      const r: any = await api(`/admin/sessions/${sustituir.id}/substitute-teacher`, {
        method: "POST", auth: true,
        body: { teacher_id: teacherId, ...(confirmar ? { confirm_overlap: true } : {}) },
      });
      showToast("success", `✅ ${r.teacher_name} dará esa clase. Cobra su propia tarifa.`);
      setSustituir(null);
      load();
    } catch (e: any) {
      const d = e?.detail;
      if (e?.status === 409 && d?.necesita_confirmacion) {
        if (confirm(d.mensaje)) { await ponerSustituto(teacherId, true); return; }
      } else {
        showToast("error", e.message);
      }
    } finally {
      setSubBusy(false);
    }
  };

  const visibles = tipo === "all"
    ? items
    : items.filter((s: any) => (s.kind || "single") === tipo);

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
              <h3 className="font-extrabold text-lg">¿Qué tipo de clase quieres crear?</h3>
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
              {/* V3.9.15: Evento abierto (webinar, club, taller) */}
              <button
                onClick={() => { setShowMenu(false); setShowEvent(true); }}
                className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-slate-100 flex items-start gap-3 transition"
              >
                <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0 text-xl">🎉</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">Evento abierto</p>
                  <p className="text-xs text-slate-500">Webinar, club de conversación o taller — lo ven TODOS los estudiantes. Puede ser híbrido</p>
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
                      {" · "}
                      {s.video_provider === "dorismon" ? "🎥 Video Dorismon" : "🔗 Enlace externo"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {/* V3.9.62: Editar la serie completa (horario, profesor, modalidad y video) */}
                    <Button size="sm" variant="outline" onClick={() => openReschedule(s)} className="text-brand-600 border-brand-200 hover:bg-brand-50">
                      <Repeat size={12} className="inline mr-1" /> Editar serie
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirmDeleteSeries(s)} className="text-red-600 border-red-200 hover:bg-red-50">
                      <X size={12} className="inline mr-1" /> Cancelar serie
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* V3.9.30 — Agrupadas por tipo: antes estaban todas mezcladas */}
      {!loading && !err && items.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 ds-noscrollbar">
          {TIPOS.map((t) => {
            const n = t.key === "all"
              ? items.length
              : items.filter((s: any) => (s.kind || "single") === t.key).length;
            if (n === 0 && t.key !== "all") return null;
            return (
              <button
                key={t.key}
                onClick={() => setTipo(t.key)}
                className={`flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-xl border-2 transition ${
                  tipo === t.key
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {t.icon} {t.label}
                <span className="ml-1.5 text-xs opacity-70">{n}</span>
              </button>
            );
          })}
        </div>
      )}

      {loading ? <LoadingScreen /> : err ? <ErrorBox message={err} /> :
       visibles.length === 0 ? <EmptyState icon="📅" title="Sin clases de este tipo" description="Cambia de pestaña o crea una nueva clase." /> : (
        <Card>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {visibles.map((s: any) => (
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
                      {s.starts_at_utc && new Date(s.starts_at_utc).toLocaleString("es", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true })}
                      {" · "}{s.teacher_name}{" · "}{s.course_name}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openEdit(s)}>Editar</Button>
                  {/* V3.9.39 — Sustituto en UNA clase, sin tocar la serie */}
                  {s.status !== "cancelled" && new Date(s.starts_at_utc) > new Date() && (
                    <Button variant="outline" size="sm" onClick={() => abrirSustituto(s)}>
                      👨‍🏫 Sustituto
                    </Button>
                  )}
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
            <option value="">{levels.length ? "Seleccionar..." : "Selecciona un curso primero"}</option>
            {levels.map(l => <option key={l.id} value={l.id}>{l.code} — {l.name}</option>)}
          </Select>

          {/* V1.5: Vincular clase a módulo */}
          <Select label="Módulo (opcional)" value={form.module_id} onChange={(e: any) => setForm({ ...form, module_id: e.target.value })} disabled={!modules.length}>
            <option value="">{modules.length ? "Sin módulo específico" : "Selecciona un nivel primero"}</option>
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
            <div className="space-y-3">
              {/* V3.9.26 — ¿Dónde ocurre el video de esta clase? */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">¿Dónde será el video?</label>
                <div className="grid sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, video_provider: "dorismon" })}
                    disabled={!videoReady}
                    className={`text-left p-3 rounded-xl border-2 transition disabled:opacity-50 ${
                      form.video_provider === "dorismon"
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <p className="font-bold text-sm text-slate-800">🎥 Video de Dorismon</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {videoReady
                        ? "Dentro de la plataforma, con tu marca. No instalan nada."
                        : "Falta configurar LiveKit en Render"}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, video_provider: "meet" })}
                    className={`text-left p-3 rounded-xl border-2 transition ${
                      form.video_provider !== "dorismon"
                        ? "border-brand-500 bg-brand-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <p className="font-bold text-sm text-slate-800">🔗 Enlace externo</p>
                    <p className="text-xs text-slate-500 mt-0.5">Google Meet, Zoom o Teams.</p>
                  </button>
                </div>
              </div>

              <MeetingUrlInput
                label={
                  form.video_provider === "dorismon"
                    ? "Enlace de respaldo (recomendado, por si falla la conexión)"
                    : `URL de Zoom/Meet/Teams ${form.modality === "online" ? "*" : "(híbrida *)"}`
                }
                value={form.meeting_url}
                onChange={(v: string) => setForm({ ...form, meeting_url: v })}
                required={form.modality === "online" && form.video_provider !== "dorismon"}
              />
              {form.video_provider === "dorismon" ? (
                <p className="text-xs text-slate-500 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                  💡 Deja también un enlace de Meet como respaldo: si el video falla en vivo,
                  cambias en segundos y la clase sigue.
                </p>
              ) : (
                <MeetingUrlGuide />
              )}
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

          {/* ══ V3.9.65 — DESTINATARIOS ══
              Antes toda clase suelta se anunciaba al nivel entero. Ahora se
              dice a quién va, y solo esa gente la ve y la recibe. */}
          {!form.is_open_event && (
            <div className="border-t border-slate-200 pt-3">
              <label className="block text-sm font-medium mb-1.5">Destinatarios</label>
              <div className="flex gap-1.5 mb-2 flex-wrap">
                {[
                  { k: "level", t: "Alumnos de este profesor en el nivel" },
                  { k: "series", t: "Un grupo" },
                  { k: "students", t: "Estudiantes específicos" },
                ].map((o) => (
                  <button
                    key={o.k}
                    type="button"
                    onClick={() => setAudienceMode(o.k as any)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                      audienceMode === o.k
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {o.t}
                  </button>
                ))}
              </div>

              {audienceMode === "series" && (
                <Select value={form.series_id} onChange={(e: any) => setForm({ ...form, series_id: e.target.value })}>
                  <option value="">— Elige un grupo —</option>
                  {seriesList.map((g: any) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </Select>
              )}

              {audienceMode === "students" && (
                <div>
                  <Input
                    placeholder="Busca por nombre o correo..."
                    value={studentQuery}
                    onChange={(e: any) => setStudentQuery(e.target.value)}
                  />

                  {pickedStudents.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {pickedStudents.map((st: any) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => toggleStudent(st)}
                          className="inline-flex items-center gap-1.5 bg-brand-100 text-brand-800 text-xs font-semibold px-2.5 py-1 rounded-full hover:bg-brand-200 transition"
                        >
                          {st.full_name}
                          <span className="text-brand-500">×</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchingStudents && (
                    <p className="text-xs text-slate-400 mt-2">Buscando...</p>
                  )}

                  {studentHits.length > 0 && (
                    <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                      {studentHits.map((st: any) => {
                        const elegido = pickedStudents.some((x) => x.id === st.id);
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => toggleStudent(st)}
                            className={`w-full text-left px-3 py-2 text-sm border-b border-slate-100 last:border-0 transition ${
                              elegido ? "bg-brand-50 text-brand-800" : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <span className="font-medium">{st.full_name}</span>
                            <span className="text-xs text-slate-400 ml-2">{st.email}</span>
                            {elegido && <span className="float-right text-brand-600">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {studentQuery.trim().length >= 2 && !searchingStudents && studentHits.length === 0 && (
                    <p className="text-xs text-slate-400 mt-2">Nadie coincide con esa búsqueda.</p>
                  )}

                  <p className="text-xs text-slate-500 mt-2">
                    Solo estos estudiantes verán la clase y recibirán el aviso.
                    No hace falta que pertenezcan a un grupo.
                  </p>
                </div>
              )}
            </div>
          )}

          <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-slate-200 hover:border-brand-300 cursor-pointer transition">
            <input
              type="checkbox"
              checked={form.is_open_event}
              onChange={(e) => {
                // V3.9.67 — Marcar "evento abierto" LIMPIA la audiencia. Antes
                // la interfaz solo ocultaba el selector: audienceMode seguía en
                // "students" y create() podía enviar student_ids igualmente,
                // dejando datos contradictorios en SessionAudience.
                const abierto = e.target.checked;
                setForm({ ...form, is_open_event: abierto, series_id: abierto ? "" : form.series_id });
                if (abierto) {
                  setAudienceMode("level");
                  setPickedStudents([]);
                  setStudentQuery("");
                  setStudentHits([]);
                }
              }}
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
            {form.is_open_event
              ? "🎫 Cualquier estudiante podrá registrarse a este evento desde 'Eventos disponibles'."
              : audienceMode === "students"
              ? `Solo ${pickedStudents.length || "los"} estudiante(s) seleccionado(s) verán esta clase y recibirán el aviso.`
              : audienceMode === "series"
              ? "Solo el grupo seleccionado verá esta clase y recibirá el aviso."
              : "Recibirán aviso los alumnos de este profesor en este nivel (no todo el nivel)."}
          </p>
            <Button onClick={create} disabled={!formValid} className="w-full" size="lg">
              Programar clase
            </Button>
          </div>
        </div>
      </Modal>

      {/* V3.9.39 — Elegir sustituto para una clase */}
      <Modal open={!!sustituir} onClose={() => setSustituir(null)} title="¿Quién dará esta clase?">
        <div className="space-y-3">
          <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-600">
            <strong>{sustituir?.title}</strong>
            {sustituir?.starts_at_utc && (
              <> · {new Date(sustituir.starts_at_utc).toLocaleString("es", {
                weekday: "short", day: "numeric", month: "short",
                hour: "2-digit", minute: "2-digit", hour12: true })}</>
            )}
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            <p className="text-xs text-emerald-800 leading-relaxed">
              💰 <strong>Cobra quien da la clase</strong>, con su propia tarifa.
              Solo cambia esta clase: la serie y el profesor de siempre no se tocan.
            </p>
          </div>

          {profesLibres.length === 0 ? (
            <p className="text-sm text-slate-500 py-3">Buscando profesores...</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {profesLibres.map((p: any) => (
                <button
                  key={p.teacher_id}
                  onClick={() => ponerSustituto(p.teacher_id)}
                  disabled={subBusy}
                  className={`w-full text-left p-3 rounded-xl border-2 transition disabled:opacity-50 ${
                    p.available
                      ? "border-emerald-200 bg-emerald-50 hover:border-emerald-400"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-800">{p.name}</span>
                    <span className="text-[11px] text-slate-500">
                      Grupal RD${p.rate_group?.toFixed(0)} · Privada RD${p.rate_private?.toFixed(0)}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-0.5 ${p.available ? "text-emerald-700" : "text-amber-700"}`}>
                    {p.available ? "✓ Libre a esa hora" : `⚠️ Ocupado: ${p.conflict}`}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Editar: ${editing?.title || ""}`}>
        <div className="space-y-3">
          {isEditPast && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              ⚠️ Esta clase ya pasó. Solo puedes editar el título, descripción y notas.
            </div>
          )}
          <Input label="Título" value={editForm.title} onChange={(e: any) => setEditForm({ ...editForm, title: e.target.value })} />
          <Textarea label="Descripción" value={editForm.description} onChange={(e: any) => setEditForm({ ...editForm, description: e.target.value })} />
          {!isEditPast && (
            <>
              {/* V3.9.7: Editar fecha/hora, profesor y modalidad de una clase futura */}
              <div className="grid grid-cols-2 gap-2">
                <Input label="Fecha y hora *" type="datetime-local" value={editForm.starts_at} onChange={(e: any) => setEditForm({ ...editForm, starts_at: e.target.value })} />
                <Input label="Duración (min) *" type="number" value={editForm.duration_min} onChange={(e: any) => setEditForm({ ...editForm, duration_min: parseInt(e.target.value) || 60 })} />
              </div>
              <Select label="Profesor" value={editForm.teacher_id} onChange={(e: any) => setEditForm({ ...editForm, teacher_id: e.target.value })}>
                <option value="">— Sin cambiar —</option>
                {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </Select>
              <Select label="Modalidad" value={editForm.modality} onChange={(e: any) => setEditForm({ ...editForm, modality: e.target.value })}>
                <option value="online">Online</option>
                <option value="presencial">Presencial</option>
                <option value="hibrida">Híbrida</option>
              </Select>

              {/* V3.9.68 — Los controles siguen a la modalidad elegida.
                  Antes solo había "URL meeting": una excepción virtual dentro
                  de una serie presencial no podía usar Video Dorismon, y una
                  excepción presencial se quedaba sin sede ni aula. */}
              {editForm.modality !== "presencial" && (
                <>
                  <SelectorVideo
                    value={editForm.video_provider}
                    onChange={(v: string) => setEditForm({ ...editForm, video_provider: v })}
                  />
                  <MeetingUrlInput
                    label={editForm.video_provider === "dorismon" ? "Enlace de respaldo (opcional)" : "Enlace de la clase"}
                    value={editForm.meeting_url}
                    onChange={(v: string) => setEditForm({ ...editForm, meeting_url: v })}
                    required={editForm.video_provider !== "dorismon"}
                  />
                </>
              )}

              {editForm.modality !== "online" && (
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    label="Sede"
                    value={editForm.branch_id}
                    onChange={async (e: any) => {
                      const b = e.target.value;
                      setEditForm({ ...editForm, branch_id: b, classroom_id: "" });
                      if (b) {
                        try {
                          setEditClassrooms(safeArray(await adminApi.classrooms(Number(b))));
                        } catch { setEditClassrooms([]); }
                      } else {
                        setEditClassrooms([]);
                      }
                    }}
                  >
                    <option value="">— Sin sede —</option>
                    {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </Select>
                  <Select
                    label="Aula"
                    value={editForm.classroom_id}
                    onChange={(e: any) => setEditForm({ ...editForm, classroom_id: e.target.value })}
                    disabled={!editForm.branch_id}
                  >
                    <option value="">— Sin aula —</option>
                    {editClassrooms.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </Select>
                </div>
              )}

              {editForm.modality === "presencial" && (
                <p className="text-xs text-slate-500 -mt-1">
                  Esta clase será solo presencial: no se mostrará “Entrar a la clase”.
                  Si tenía enlace de videollamada, se conserva por dentro por si vuelve a ser virtual.
                </p>
              )}

              {/* V3.9.65 — El selector que faltaba. Sin él, la única forma de
                  cambiar la modalidad de una clase de una serie era el editor
                  de la SERIE, que por diseño aplica a todas las futuras: se
                  quería un miércoles presencial y quedaban todos. */}
              {editing?.series_id && (
                <div className="border-t border-slate-200 pt-3">
                  <label className="block text-sm font-medium mb-1.5">
                    ¿A qué clases aplica este cambio?
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { k: "this", t: "Solo esta clase",
                        d: "Una excepción puntual. Las demás siguen igual." },
                      { k: "this_and_following", t: "Esta clase y las siguientes",
                        d: "Modalidad, video, sede, aula y cupo, desde esta fecha en adelante. El horario y el profesor se cambian en “Editar serie”." },
                      { k: "all", t: "Toda la serie",
                        d: "Cambia la programación habitual del grupo. Las clases ya dadas nunca se modifican." },
                    ].map((o) => (
                      <button
                        key={o.k}
                        type="button"
                        onClick={() => setEditScope(o.k as any)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl border transition ${
                          editScope === o.k
                            ? "border-brand-500 bg-brand-50"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <p className={`text-sm font-semibold ${editScope === o.k ? "text-brand-800" : "text-slate-700"}`}>
                          {o.t}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{o.d}</p>
                      </button>
                    ))}
                  </div>
                  {editScope === "all" && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                      Al guardar se abrirá <strong>“Editar serie”</strong> con la programación
                      habitual del grupo. Los valores de esta clase no se copian:
                      podría ser una excepción y no representar al grupo.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
          <Textarea label="Notas del profesor (post-clase)" value={editForm.teacher_notes} onChange={(e: any) => setEditForm({ ...editForm, teacher_notes: e.target.value })} placeholder="Repasen el verbo X. Próxima clase traer..." />
          <Button onClick={saveEdit} className="w-full" size="lg">
            {editScope === "all" && editing?.series_id
              ? "Continuar en “Editar serie”"
              : "Guardar cambios"}
          </Button>
        </div>
      </Modal>

      {/* V3.9.62: Modal editar serie completa (horario, profesor, modalidad, video) */}
      <Modal open={!!reschedSeries} onClose={() => setReschedSeries(null)} title={`Editar serie: ${reschedSeries?.name || ""}`}>
        <div className="space-y-3">
          {/* El aviso cambia según lo que realmente vaya a pasar. Regenerar
              fechas y ajustar un enlace no son la misma operación. */}
          {reschedCambiaDias ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
              ⚠️ Cambiaste los <strong>días</strong>, así que hay que reprogramar las fechas de las clases futuras.
              Se conservan el módulo, el profesor, el video y el cupo de cada una. Las clases que ya pasaron no se tocan.
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-900">
              ✅ Se actualizan las clases <strong>futuras</strong> sin borrar ninguna: se conservan la asistencia,
              las entregas y las grabaciones. Las clases que ya pasaron quedan intactas.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Días de la semana</label>
            <div className="flex flex-wrap gap-1.5">
              {DOW.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => toggleReschedDay(d.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${reschedForm.days_of_week.includes(d.key) ? "bg-brand-600 text-white border-brand-600" : "bg-white text-slate-600 border-slate-200"}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input label="Hora de inicio" type="time" value={reschedForm.start_time_hhmm} onChange={(e: any) => setReschedForm({ ...reschedForm, start_time_hhmm: e.target.value })} />
            <Input label="Duración (min)" type="number" value={reschedForm.duration_min} onChange={(e: any) => setReschedForm({ ...reschedForm, duration_min: parseInt(e.target.value) || 90 })} />
          </div>

          {/* V3.9.62 — El video de la serie. Este es el caso que motivó todo:
              un Google Meet viejo que dejó de funcionar y no había forma de
              cambiar sin destruir el grupo. */}
          <Select label="Modalidad" value={reschedForm.modality || reschedSeries?.modality || "online"} onChange={(e: any) => setReschedForm({ ...reschedForm, modality: e.target.value })}>
            <option value="online">Online</option>
            <option value="presencial">Presencial</option>
            <option value="hibrida">Híbrida</option>
          </Select>

          {/* V3.9.69 — Los controles siguen a la modalidad, igual que en el
              editor de una sesión. Una serie presencial pedía enlace de
              videollamada y no ofrecía dónde poner la sede. */}
          {(reschedForm.modality || reschedSeries?.modality) !== "presencial" && (
            <div className="border-t border-slate-200 pt-3">
              <SelectorVideo
                value={reschedForm.video_provider}
                onChange={(v: string) => setReschedForm({ ...reschedForm, video_provider: v })}
              />
              <MeetingUrlInput
                label={reschedForm.video_provider === "dorismon" ? "Enlace de respaldo (opcional)" : "Enlace de la clase"}
                value={reschedForm.meeting_url}
                onChange={(v: string) => setReschedForm({ ...reschedForm, meeting_url: v })}
                required={reschedForm.video_provider !== "dorismon"}
              />
              <p className="text-xs text-slate-500 mt-1">
                Sirve Google Meet, Zoom, Teams o cualquier enlace https://. Se aplica solo a las clases futuras.
              </p>
            </div>
          )}

          {(reschedForm.modality || reschedSeries?.modality) !== "online" && (
            <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-3">
              <Select
                label="Sede"
                value={reschedForm.branch_id}
                onChange={async (e: any) => {
                  const b = e.target.value;
                  setReschedForm({ ...reschedForm, branch_id: b, classroom_id: "" });
                  if (b) {
                    try { setReschedClassrooms(safeArray(await adminApi.classrooms(Number(b)))); }
                    catch { setReschedClassrooms([]); }
                  } else { setReschedClassrooms([]); }
                }}
              >
                <option value="">— Sin sede —</option>
                {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
              <Select
                label="Aula"
                value={reschedForm.classroom_id}
                onChange={(e: any) => setReschedForm({ ...reschedForm, classroom_id: e.target.value })}
                disabled={!reschedForm.branch_id}
              >
                <option value="">— Sin aula —</option>
                {reschedClassrooms.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
            </div>
          )}

          <Select label="Cambiar profesor (opcional)" value={reschedForm.teacher_id} onChange={(e: any) => setReschedForm({ ...reschedForm, teacher_id: e.target.value })}>
            <option value="">— Mantener el actual —</option>
            {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </Select>

          <Button onClick={doReschedule} className="w-full" size="lg" disabled={reschedSaving}>
            {reschedSaving ? "Guardando..." : reschedCambiaDias ? "Reprogramar clases futuras" : "Guardar cambios"}
          </Button>
        </div>
      </Modal>

      {/* V3.9.15: Modal crear evento abierto (soporta híbrido) */}
      <Modal open={showEvent} onClose={() => setShowEvent(false)} title="🎉 Crear evento abierto">
        <div className="space-y-3">
          <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 text-sm text-violet-800">
            Un evento abierto lo ven <strong>todos los estudiantes</strong> sin importar su nivel (webinar, club de conversación, taller). Pueden apuntarse hasta llenar los cupos.
          </div>

          <Input label="Título del evento *" value={eventForm.title} onChange={(e: any) => setEventForm({ ...eventForm, title: e.target.value })} placeholder="Ej: Club de Conversación — Viajes" />
          <Textarea label="Descripción (opcional)" value={eventForm.description} onChange={(e: any) => setEventForm({ ...eventForm, description: e.target.value })} placeholder="De qué trata el evento..." />

          <div className="grid grid-cols-2 gap-2">
            <Input label="Fecha *" type="date" value={eventForm.date} onChange={(e: any) => setEventForm({ ...eventForm, date: e.target.value })} />
            <Input label="Hora *" type="time" value={eventForm.time} onChange={(e: any) => setEventForm({ ...eventForm, time: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Duración (min)" type="number" value={eventForm.duration_min} onChange={(e: any) => setEventForm({ ...eventForm, duration_min: parseInt(e.target.value) || 90 })} />
            <Input label="Cupos" type="number" value={eventForm.capacity} onChange={(e: any) => setEventForm({ ...eventForm, capacity: parseInt(e.target.value) || 30 })} />
          </div>

          <Select label="Anfitrión (profesor) *" value={eventForm.teacher_id} onChange={(e: any) => setEventForm({ ...eventForm, teacher_id: e.target.value })}>
            <option value="">— Selecciona —</option>
            {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </Select>

          <Select label="Modalidad *" value={eventForm.modality} onChange={(e: any) => setEventForm({ ...eventForm, modality: e.target.value })}>
            <option value="hibrida">🌐🏫 Híbrida (online + presencial)</option>
            <option value="online">🌐 Online</option>
            <option value="presencial">🏫 Presencial</option>
          </Select>

          {(eventForm.modality === "online" || eventForm.modality === "hibrida") && (
            <>
            <SelectorVideo
              value={eventForm.video_provider}
              onChange={(v) => setEventForm({ ...eventForm, video_provider: v })}
            />
            <MeetingUrlInput
              label={eventForm.video_provider === "dorismon" ? "Enlace de respaldo (recomendado)" : "Link del evento (para los online) *"}
              value={eventForm.meeting_url}
              onChange={(v: string) => setEventForm({ ...eventForm, meeting_url: v })} />
            </>
          )}

          {(eventForm.modality === "presencial" || eventForm.modality === "hibrida") && (
            <Select label="Sede (para los presenciales) *" value={eventForm.branch_id} onChange={(e: any) => setEventForm({ ...eventForm, branch_id: e.target.value })}>
              <option value="">— Selecciona la sede —</option>
              {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          )}

          <Button onClick={createEvent} className="w-full" size="lg" disabled={eventSaving}>
            {eventSaving ? "Creando..." : "🎉 Crear evento"}
          </Button>
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
            <>
            <SelectorVideo
              value={seriesForm.video_provider}
              onChange={(v) => setSeriesForm({ ...seriesForm, video_provider: v })}
            />
            <MeetingUrlInput
              label={seriesForm.video_provider === "dorismon" ? "Enlace de respaldo (opcional)" : "Link Zoom/Meet/Teams *"}
              value={seriesForm.meeting_url}
              onChange={(v: string) => setSeriesForm({ ...seriesForm, meeting_url: v })}
              required={seriesForm.video_provider !== "dorismon"}
            />
            </>
          )}

          {/* V3.9.69 — Sede y aula al crear. Antes una serie presencial nacía
              con todas sus clases en "Ubicación por confirmar". */}
          {seriesForm.modality !== "online" && (
            <div className="grid grid-cols-2 gap-2">
              <Select
                label="Sede"
                value={seriesForm.branch_id}
                onChange={async (e: any) => {
                  const b = e.target.value;
                  setSeriesForm({ ...seriesForm, branch_id: b, classroom_id: "" });
                  if (b) {
                    try { setSeriesClassrooms(safeArray(await adminApi.classrooms(Number(b)))); }
                    catch { setSeriesClassrooms([]); }
                  } else { setSeriesClassrooms([]); }
                }}
              >
                <option value="">— Elige sede —</option>
                {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
              <Select
                label="Aula"
                value={seriesForm.classroom_id}
                onChange={(e: any) => setSeriesForm({ ...seriesForm, classroom_id: e.target.value })}
                disabled={!seriesForm.branch_id}
              >
                <option value="">— Sin aula —</option>
                {seriesClassrooms.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
            💡 Se generarán todas las clases automáticamente con los datos especificados. Después puedes editar o cancelar cualquier clase individualmente.
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
            <>
            <SelectorVideo
              value={privateForm.video_provider}
              onChange={(v) => setPrivateForm({ ...privateForm, video_provider: v })}
            />
            <Input
              label={privateForm.video_provider === "dorismon" ? "Enlace de respaldo (recomendado)" : "Link Zoom/Meet/Teams"}
              value={privateForm.meeting_url}
              onChange={(e: any) => setPrivateForm({ ...privateForm, meeting_url: e.target.value })}
              placeholder="https://zoom.us/..." />
            </>
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
