/**
 * Cliente API V1.0 — Dorismon
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://dorismon-api.onrender.com";

type ApiOptions = { method?: string; body?: any; auth?: boolean };

export class ApiError extends Error {
  status: number;
  constructor(msg: string, status: number) { super(msg); this.status = status; }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}
function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}
function setToken(t: string) {
  if (typeof window !== "undefined") localStorage.setItem("access_token", t);
}
function setRefreshToken(t: string) {
  if (typeof window !== "undefined") localStorage.setItem("refresh_token", t);
}
function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }
}

// V3.7: Renovación automática del token.
// Si el token de acceso (15 min) expira mientras el usuario trabaja (ej: haciendo
// el test de nivel, escribiendo una tarea larga), se renueva solo con el refresh
// token (7 días) y se reintenta la petición. El usuario NUNCA pierde su trabajo.
// Se usa una sola promesa compartida para no renovar varias veces en paralelo.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const rt = getRefreshToken();
  if (!rt) return null;
  // Si ya hay una renovación en curso, esperar esa misma (evita renovar en paralelo)
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data?.access_token) {
        setToken(data.access_token);
        if (data.refresh_token) setRefreshToken(data.refresh_token);
        return data.access_token;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function api(path: string, opts: ApiOptions = {}) {
  const doFetch = async (token: string | null) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (opts.auth && token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(`${API_URL}${path}`, {
      method: opts.method || "GET",
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  };

  let res = await doFetch(opts.auth ? getToken() : null);

  // V3.7: Si falla por token expirado (401) y es una petición autenticada,
  // renovar el token automáticamente y reintentar UNA vez.
  if (res.status === 401 && opts.auth && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch(newToken);
    }
  }

  const text = await res.text();
  let data: any = null;
  if (text) { try { data = JSON.parse(text); } catch { data = text; } }
  if (!res.ok) {
    const msg = (data && typeof data === "object" && data.detail) || `Error ${res.status}`;
    throw new ApiError(typeof msg === "string" ? msg : JSON.stringify(msg), res.status);
  }
  return data;
}

export const auth = {
  register: (body: any) => api("/auth/register", { method: "POST", body }),
  login: (body: { email: string; password: string }) =>
    api("/auth/login", { method: "POST", body }),
  me: () => api("/auth/me", { auth: true }),
  // V2.9: feature gates
  myFeatures: () => api("/auth/me/features", { auth: true }) as Promise<{
    role: string;
    has_all: boolean;
    features: string[];
  }>,
  logout: () => {
    // V2.8: limpieza TOTAL al cerrar sesión (seguridad)
    clearToken();
    if (typeof window !== "undefined") {
      // Limpiar localStorage (excepto preferencias PWA)
      const pwaInstall = localStorage.getItem("pwa-install-dismissed");
      const pwaAccepted = localStorage.getItem("pwa-install-accepted");
      localStorage.clear();
      if (pwaInstall) localStorage.setItem("pwa-install-dismissed", pwaInstall);
      if (pwaAccepted) localStorage.setItem("pwa-install-accepted", pwaAccepted);
      // Limpiar TODO sessionStorage (incluye institute_logo, name, etc.)
      sessionStorage.clear();
      // Limpiar caches del Service Worker
      if ("caches" in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
      // Notificar al SW para que limpie su cache también
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CACHE" });
      }
    }
  },
  saveToken: setToken,
  getToken,
  isLoggedIn: () => !!getToken(),
};

export const catalog = {
  courses: () => api("/courses"),
  course: (id: number) => api(`/courses/${id}`),
  levelModules: (id: number) => api(`/levels/${id}/modules`),
  lesson: (id: number) => api(`/lessons/${id}`, { auth: true }),
  // V2.9.1: planes públicos para checkout
  plans: () => api("/plans"),
};

export const studentApi = {
  dashboard: () => api("/student/dashboard", { auth: true }),
  courses: () => api("/student/courses", { auth: true }),
  // V3.0: avisar ausencia
  notifyAbsence: (sessionId: string, reason: string) =>
    api(`/student/sessions/${sessionId}/notify-absence`, { method: "POST", body: { reason }, auth: true }),
  cancelAbsence: (sessionId: string) =>
    api(`/student/sessions/${sessionId}/notify-absence`, { method: "DELETE", auth: true }),
  // V3.0.2: reagendar clase de prueba
  rescheduleTrial: () =>
    api("/student/trial-class/reschedule", { method: "POST", auth: true }),
  assignments: () => api("/student/assignments", { auth: true }),
  submitAssignment: (id: number, body: any) =>
    api(`/student/assignments/${id}/submit`, { method: "POST", body, auth: true }),
  quizzes: () => api("/student/quizzes", { auth: true }),
  quiz: (id: number) => api(`/student/quizzes/${id}`, { auth: true }),
  submitQuiz: (id: number, body: any) =>
    api(`/student/quizzes/${id}/submit`, { method: "POST", body, auth: true }),
  calendar: () => api("/student/calendar", { auth: true }),
  attendance: () => api("/student/attendance", { auth: true }),
  certificates: () => api("/student/certificates", { auth: true }),
  notifications: (unreadOnly = false) =>
    api(`/student/notifications${unreadOnly ? '?unread_only=true' : ''}`, { auth: true }),
  markRead: (id: string) => api(`/student/notifications/${id}/read`, { method: "POST", auth: true }),
  library: (filters: any = {}) => {
    const qs = new URLSearchParams();
    Object.keys(filters).forEach(k => filters[k] && qs.set(k, String(filters[k])));
    return api(`/student/library${qs.toString() ? `?${qs}` : ""}`, { auth: true });
  },
  transcript: () => api("/student/transcript", { auth: true }),
};

export const teacherApi = {
  dashboard: () => api("/teacher/dashboard", { auth: true }),
  sessions: (period?: string) =>
    api(`/teacher/sessions${period ? `?filter_period=${period}` : ""}`, { auth: true }),
  attendance: (sessionId: string) =>
    api(`/teacher/sessions/${sessionId}/attendance`, { auth: true }),
  saveAttendance: (sessionId: string, body: any) =>
    api(`/teacher/sessions/${sessionId}/attendance`, { method: "POST", body, auth: true }),
  // V2.9: Profe cancela su propia clase
  cancelSession: (sessionId: string, reason: string) =>
    api(`/teacher/sessions/${sessionId}/cancel`, {
      method: "POST",
      body: { reason },
      auth: true,
    }),
  assignments: () => api("/teacher/assignments", { auth: true }),
  createAssignment: (body: any) =>
    api("/teacher/assignments", { method: "POST", body, auth: true }),
  submissions: (id: number) =>
    api(`/teacher/assignments/${id}/submissions`, { auth: true }),
  gradeSubmission: (subId: string, body: any) =>
    api(`/teacher/submissions/${subId}/grade`, { method: "POST", body, auth: true }),
  quizzes: () => api("/teacher/quizzes", { auth: true }),
  createQuiz: (body: any) => api("/teacher/quizzes", { method: "POST", body, auth: true }),
  materials: () => api("/teacher/materials", { auth: true }),
  uploadMaterial: (body: any) =>
    api("/teacher/materials", { method: "POST", body, auth: true }),
  observations: (studentId: string) =>
    api(`/teacher/observations/${studentId}`, { auth: true }),
  addObservation: (studentId: string, body: any) =>
    api(`/teacher/observations/${studentId}`, { method: "POST", body, auth: true }),
};

export const adminApi = {
  dashboard: () => api("/admin/dashboard", { auth: true }),
  users: (params: any = {}) => {
    const qs = new URLSearchParams();
    Object.keys(params).forEach(k => params[k] && qs.set(k, String(params[k])));
    return api(`/admin/users${qs.toString() ? `?${qs}` : ""}`, { auth: true });
  },
  createUser: (body: any) => api("/admin/users", { method: "POST", body, auth: true }),
  updateUser: (id: string, body: any) =>
    api(`/admin/users/${id}`, { method: "PATCH", body, auth: true }),
  courses: () => api("/admin/courses", { auth: true }),
  createCourse: (body: any) =>
    api("/admin/courses", { method: "POST", body, auth: true }),
  updateCourse: (id: number, body: any) =>
    api(`/admin/courses/${id}`, { method: "PATCH", body, auth: true }),
  createLevel: (body: any) => api("/admin/levels", { method: "POST", body, auth: true }),
  createModule: (body: any) => api("/admin/modules", { method: "POST", body, auth: true }),
  createLesson: (body: any) => api("/admin/lessons", { method: "POST", body, auth: true }),
  updateLesson: (id: number, body: any) =>
    api(`/admin/lessons/${id}`, { method: "PATCH", body, auth: true }),
  branches: () => api("/admin/branches", { auth: true }),
  createBranch: (body: any) => api("/admin/branches", { method: "POST", body, auth: true }),
  classrooms: (branchId?: number) =>
    api(`/admin/classrooms${branchId ? `?branch_id=${branchId}` : ""}`, { auth: true }),
  createClassroom: (body: any) =>
    api("/admin/classrooms", { method: "POST", body, auth: true }),
  sessions: (page = 1) => api(`/admin/sessions?page=${page}`, { auth: true }),
  createSession: (body: any) =>
    api("/admin/sessions", { method: "POST", body, auth: true }),
  cancelSession: (id: string) =>
    api(`/admin/sessions/${id}`, { method: "DELETE", auth: true }),
  enrollments: (studentId?: string) =>
    api(`/admin/enrollments${studentId ? `?student_id=${studentId}` : ""}`, { auth: true }),
  createEnrollment: (body: any) =>
    api("/admin/enrollments", { method: "POST", body, auth: true }),
  plans: () => api("/admin/plans", { auth: true }),
  createPlan: (body: any) => api("/admin/plans", { method: "POST", body, auth: true }),
  payments: () => api("/admin/payments", { auth: true }),
  financeSummary: () => api("/admin/finance/summary", { auth: true }),
  certificates: () => api("/admin/certificates", { auth: true }),
  issueCertificate: (body: any) =>
    api("/admin/certificates", { method: "POST", body, auth: true }),
  settings: () => api("/admin/settings", { auth: true }),
  updateSettings: (body: any) =>
    api("/admin/settings", { method: "PATCH", body, auth: true }),
  auditLogs: (page = 1) => api(`/admin/audit-logs?page=${page}`, { auth: true }),
};

export const certificates = {
  verify: (code: string) => api(`/certificate/verify/${code}`),
};


export const placement = {
  status: () => api("/placement/status", { auth: true }),
  questions: () => api("/placement/questions", { auth: true }),
  submit: (body: any) => api("/placement/submit", { method: "POST", body, auth: true }),
  myResult: () => api("/placement/my-result", { auth: true }),
};

// Cambiar contraseña
export const account = {
  changePassword: (body: { current_password: string; new_password: string }) =>
    api("/auth/change-password", { method: "POST", body, auth: true }),
};

// Helpers para selects
export const adminHelpers = {
  teachers: () => api("/admin/teachers", { auth: true }),
  studentsSimple: () => api("/admin/students-simple", { auth: true }),
  levelsByCourse: (courseId: number) =>
    api(`/admin/levels-by-course/${courseId}`, { auth: true }),
  // V2.9.2: mantenimiento + reactivar usuario
  cleanDataDryRun: () =>
    api("/admin/maintenance/clean-operational-data", { method: "POST", body: { dry_run: true }, auth: true }),
  cleanDataExecute: () =>
    api("/admin/maintenance/clean-operational-data", { method: "POST", body: { dry_run: false, confirm: "BORRAR DATOS DE PRUEBA" }, auth: true }),
  reactivateUser: (userId: string) =>
    api(`/admin/users/${userId}/reactivate`, { method: "POST", auth: true }),
  // V3.0.1: agenda de profesores
  teachersSchedule: () => api("/admin/teachers-schedule", { auth: true }),
};


// Eventos abiertos
export const events = {
  list: () => api("/events/", { auth: true }),
  register: (sessionId: string) =>
    api(`/events/${sessionId}/register`, { method: "POST", auth: true }),
  cancel: (sessionId: string) =>
    api(`/events/${sessionId}/cancel`, { method: "POST", auth: true }),
  mine: () => api("/events/my-events", { auth: true }),
};

// Admin: at-risk students
export const adminInsights = {
  atRiskStudents: () => api("/admin/at-risk-students", { auth: true }),
};


// V1.3 — Progreso del estudiante
export const progress = {
  myCourse: () => api("/progress/my-course", { auth: true }),
  recompute: () => api("/progress/recompute", { method: "POST", auth: true }),
};

// V1.3 — Edición universal (admin)
export const adminEdit = {
  updateLevel: (id: number, body: any) => api(`/admin/levels/${id}`, { method: "PATCH", body, auth: true }),
  updateModule: (id: number, body: any) => api(`/admin/modules/${id}`, { method: "PATCH", body, auth: true }),
  deleteModule: (id: number) => api(`/admin/modules/${id}`, { method: "DELETE", auth: true }),
  updateLesson: (id: number, body: any) => api(`/admin/lessons/${id}`, { method: "PATCH", body, auth: true }),
  updateSession: (id: string, body: any) => api(`/admin/sessions/${id}`, { method: "PATCH", body, auth: true }),
  updateEnrollment: (id: string, body: any) => api(`/admin/enrollments/${id}`, { method: "PATCH", body, auth: true }),
  deleteEnrollment: (id: string) => api(`/admin/enrollments/${id}`, { method: "DELETE", auth: true }),
  updateBranch: (id: number, body: any) => api(`/admin/branches/${id}`, { method: "PATCH", body, auth: true }),
  updateClassroom: (id: number, body: any) => api(`/admin/classrooms/${id}`, { method: "PATCH", body, auth: true }),
  updateCourse: (id: number, body: any) => api(`/admin/courses/${id}`, { method: "PATCH", body, auth: true }),
  deactivateCourse: (id: number) => api(`/admin/courses/${id}`, { method: "DELETE", auth: true }),
  updateUser: (id: string, body: any) => api(`/admin/users/${id}`, { method: "PATCH", body, auth: true }),
};

// V1.3 — Planes con features
export const adminPlans = {
  list: () => api("/admin/plans", { auth: true }),
  create: (body: any) => api("/admin/plans", { method: "POST", body, auth: true }),
  update: (id: number, body: any) => api(`/admin/plans/${id}`, { method: "PATCH", body, auth: true }),
  remove: (id: number) => api(`/admin/plans/${id}`, { method: "DELETE", auth: true }),
  features: (planId: number) => api(`/admin/plans/${planId}/features`, { auth: true }),
  addFeature: (planId: number, body: any) => api(`/admin/plans/${planId}/features`, { method: "POST", body, auth: true }),
  updateFeature: (id: number, body: any) => api(`/admin/plan-features/${id}`, { method: "PATCH", body, auth: true }),
  removeFeature: (id: number) => api(`/admin/plan-features/${id}`, { method: "DELETE", auth: true }),
};

// V1.3 — Pausa de estudiantes
export const adminPause = {
  pause: (studentId: string, reason: string) => api(`/admin/students/${studentId}/pause`, { method: "POST", body: { reason }, auth: true }),
  resume: (studentId: string) => api(`/admin/students/${studentId}/resume`, { method: "POST", auth: true }),
  paused: () => api("/admin/paused-students", { auth: true }),
};

// V1.3 — Notas del profe
export const teacherNotes = {
  save: (sessionId: string, notes: string) => api(`/teacher/sessions/${sessionId}/notes`, { method: "POST", body: { notes }, auth: true }),
};

// V1.3 — Helper colores por nivel CEFR (V1.4.1: fondos más saturados + drop-shadow para legibilidad)
export const levelColors: Record<string, { bg: string; border: string; text: string; bgSoft: string; accent: string; heroText: string; heroSubtext: string }> = {
  A1: { bg: "bg-pink-600", border: "border-pink-600", text: "text-pink-700", bgSoft: "bg-pink-50", accent: "bg-pink-100", heroText: "text-white", heroSubtext: "text-white" },
  A2: { bg: "bg-amber-600", border: "border-amber-600", text: "text-amber-700", bgSoft: "bg-amber-50", accent: "bg-amber-100", heroText: "text-white", heroSubtext: "text-white" },
  B1: { bg: "bg-violet-600", border: "border-violet-600", text: "text-violet-700", bgSoft: "bg-violet-50", accent: "bg-violet-100", heroText: "text-white", heroSubtext: "text-white" },
  B2: { bg: "bg-teal-600", border: "border-teal-600", text: "text-teal-700", bgSoft: "bg-teal-50", accent: "bg-teal-100", heroText: "text-white", heroSubtext: "text-white" },
  C1: { bg: "bg-blue-700", border: "border-blue-700", text: "text-blue-700", bgSoft: "bg-blue-50", accent: "bg-blue-100", heroText: "text-white", heroSubtext: "text-white" },
  C2: { bg: "bg-stone-800", border: "border-stone-800", text: "text-stone-700", bgSoft: "bg-stone-50", accent: "bg-stone-100", heroText: "text-white", heroSubtext: "text-white" },
};

export function getLevelTheme(code: string | null | undefined) {
  return levelColors[code || ""] || levelColors["B1"];
}



// V1.4 — Placement results admin
export const adminPlacement = {
  list: (status?: string) => api(`/admin/placement-results${status ? "?status=" + status : ""}`, { auth: true }),
  detail: (testId: string) => api(`/admin/placement-results/${testId}`, { auth: true }),
};

// V1.4 — Módulos y lecciones (admin)
export const adminContent = {
  modules: (levelId: number) => api(`/admin/levels/${levelId}/modules`, { auth: true }),
  createModule: (body: any) => api(`/admin/modules`, { method: "POST", body, auth: true }),
  updateModule: (id: number, body: any) => api(`/admin/modules/${id}`, { method: "PATCH", body, auth: true }),
  deleteModule: (id: number) => api(`/admin/modules/${id}`, { method: "DELETE", auth: true }),
  lessons: (moduleId: number) => api(`/admin/modules/${moduleId}/lessons`, { auth: true }),
  createLesson: (body: any) => api(`/admin/lessons`, { method: "POST", body, auth: true }),
};

// V1.4 — Pagos manuales
export const adminPayments = {
  list: () => api("/admin/payments", { auth: true }),
  create: (body: any) => api("/admin/payments", { method: "POST", body, auth: true }),
};



// V1.5.1 — Niveles del profe + auto-asignación
export const adminTeacherLevels = {
  get: (teacherId: string) => api(`/admin/teachers/${teacherId}/levels`, { auth: true }),
  set: (teacherId: string, levels: string[]) => api(`/admin/teachers/${teacherId}/levels`, { method: "PATCH", body: { levels }, auth: true }),
  byLevel: (levelCode: string) => api(`/admin/teachers-by-level/${levelCode}`, { auth: true }),
};
export const adminAssign = {
  unassignedStudents: () => api("/admin/unassigned-students", { auth: true }),
  autoAssign: () => api("/admin/auto-assign-teachers", { method: "POST", auth: true }),
};

// V1.5 — Mis estudiantes (profe)
export const teacherStudents = {
  mine: () => api("/teacher/my-students", { auth: true }),
  byLevel: () => api("/teacher/my-students-by-level", { auth: true }),
};

// V1.4 — Validador de URL meeting
export const meetingValidator = {
  validate: (url: string) => api("/admin/validate-meeting-url", { method: "POST", body: { url }, auth: true }),
};

// V1.4 — Calendar
export const calendarApi = {
  googleLink: (sessionId: string) => api(`/calendar/session/${sessionId}/google-link`, { auth: true }),
  icsUrl: (sessionId: string) => {
    const base = (typeof window !== "undefined" ? (window as any).__API_BASE__ : "") || process.env.NEXT_PUBLIC_API_URL || "";
    return `${base}/calendar/session/${sessionId}.ics`;
  },
};



// V1.6.3 — Perfil y avatar
export const profileApi = {
  update: (body: { full_name?: string; phone?: string; gender?: string; bio?: string }) =>
    api("/auth/me", { method: "PATCH", body, auth: true }),
  changePassword: (current_password: string, new_password: string) =>
    api("/auth/change-password", { method: "POST", body: { current_password, new_password }, auth: true }),
};

// V1.6.3 — Candidatos a certificación
export const adminCertCandidates = {
  list: () => api("/admin/certification-candidates", { auth: true }),
  issue: (enrollmentId: string, body?: { final_grade?: number; hours_completed?: number }) =>
    api(`/admin/certification-candidates/${enrollmentId}/issue`, { method: "POST", body: body || {}, auth: true }),
};



// V1.6.4 — Plantilla de módulos
export const adminModuleTemplates = {
  load: () => api("/admin/load-module-templates", { method: "POST", auth: true }),
};

// V1.6.4 — Lesson DELETE
export const adminLessons = {
  delete: (lessonId: number) => api(`/admin/lessons/${lessonId}`, { method: "DELETE", auth: true }),
  update: (lessonId: number, body: any) => api(`/admin/lessons/${lessonId}`, { method: "PATCH", body, auth: true }),
};



// V1.7 — Series recurrentes y clases privadas
export const adminClassSeries = {
  list: () => api("/admin/class-series", { auth: true }),
  create: (body: any) => api("/admin/class-series", { method: "POST", body, auth: true }),
  delete: (seriesId: string, futureOnly = true) =>
    api(`/admin/class-series/${seriesId}?future_only=${futureOnly}`, { method: "DELETE", auth: true }),
  reschedule: (seriesId: string, body: any) =>
    api(`/admin/class-series/${seriesId}/reschedule`, { method: "PATCH", body, auth: true }),
};
export const adminPrivateClasses = {
  create: (body: any) => api("/admin/private-classes", { method: "POST", body, auth: true }),
};



// V1.9 — Pagos a profesores
export const adminTeacherPayments = {
  list: (year?: number, month?: number) => {
    const q = [];
    if (year) q.push(`year=${year}`);
    if (month) q.push(`month=${month}`);
    return api(`/admin/teacher-payments${q.length ? "?" + q.join("&") : ""}`, { auth: true });
  },
  detail: (teacherId: string, year: number, month: number) =>
    api(`/admin/teacher-payments/${teacherId}/${year}/${month}`, { auth: true }),
  markPaid: (body: any) =>
    api("/admin/teacher-payments/mark-paid", { method: "POST", body, auth: true }),
  delete: (paymentId: string) =>
    api(`/admin/teacher-payments/${paymentId}`, { method: "DELETE", auth: true }),
  updateRates: (teacherId: string, body: any) =>
    api(`/admin/teachers/${teacherId}/rates`, { method: "PATCH", body, auth: true }),
  history: (teacherId: string) =>
    api(`/admin/teacher-payments-history/${teacherId}`, { auth: true }),
};
export const teacherIncomeApi = {
  current: (year?: number, month?: number) => {
    const q = [];
    if (year) q.push(`year=${year}`);
    if (month) q.push(`month=${month}`);
    return api(`/teacher/income${q.length ? "?" + q.join("&") : ""}`, { auth: true });
  },
  history: () => api("/teacher/income-history", { auth: true }),
};



// V2.0 — Mensajes y tickets
export const messagesApi = {
  send: (body: any) => api("/messages", { method: "POST", body, auth: true }),
  inbox: () => api("/messages/inbox", { auth: true }),
  sent: () => api("/messages/sent", { auth: true }),
  contacts: () => api("/messages/contacts", { auth: true }),
  markRead: (id: string) => api(`/messages/${id}/read`, { method: "POST", auth: true }),
  unreadCount: () => api("/messages/unread-count", { auth: true }),
};
export const adminTicketsApi = {
  list: (status?: string) => api(`/messages/admin/tickets${status ? `?status=${status}` : ""}`, { auth: true }),
  updateStatus: (id: string, status: string) =>
    api(`/messages/admin/tickets/${id}`, { method: "PATCH", body: { status }, auth: true }),
};



// V2.1 — Verificación de email + recuperar contraseña
export const authEmailApi = {
  verifyEmail: (code: string) => api("/auth/verify-email", { method: "POST", body: { code }, auth: true }),
  resendVerification: () => api("/auth/resend-verification", { method: "POST", auth: true }),
  forgotPassword: (email: string) => api("/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (token: string, new_password: string) =>
    api("/auth/reset-password", { method: "POST", body: { token, new_password } }),
};



// V2.2 — Perfil completo estudiante
export const studentProfileApi = {
  get: () => api("/student/profile", { auth: true }),
  update: (body: any) => api("/student/profile", { method: "PATCH", body, auth: true }),
};
export const adminStudentProfileApi = {
  get: (studentId: string) => api(`/admin/students/${studentId}/profile`, { auth: true }),
  update: (studentId: string, body: any) =>
    api(`/admin/students/${studentId}/profile`, { method: "PATCH", body, auth: true }),
  // V3.9.9: cambiar el nivel del estudiante (ej: empezar de cero)
  changeLevel: (studentId: string, levelId: number, reason?: string) =>
    api(`/admin/students/${studentId}/level`, { method: "PATCH", body: { level_id: levelId, reason }, auth: true }),
};

// V3.9.9: estudiantes agrupados por profesor
export const adminStudentsByTeacher = {
  list: () => api("/admin/students-by-teacher", { auth: true }),
};



// V2.5 — Logo, settings públicos, finance
export const publicApi = {
  instituteSettings: () => api("/institute-settings"),
};
export const adminFinance = {
  summary: (year?: number, month?: number) => {
    const q = new URLSearchParams();
    if (year) q.set("year", String(year));
    if (month) q.set("month", String(month));
    const qs = q.toString();
    return api(`/admin/finance/summary${qs ? "?" + qs : ""}`, { auth: true });
  },
  transactions: (year?: number, month?: number) => {
    const q = new URLSearchParams();
    if (year) q.set("year", String(year));
    if (month) q.set("month", String(month));
    const qs = q.toString();
    return api(`/admin/finance/transactions${qs ? "?" + qs : ""}`, { auth: true });
  },
};



// V2.6 — Pagos por transferencia + clase de prueba
export const adminBankAccounts = {
  list: () => api("/admin/bank-accounts", { auth: true }),
  create: (body: any) => api("/admin/bank-accounts", { method: "POST", body, auth: true }),
  update: (id: number, body: any) => api(`/admin/bank-accounts/${id}`, { method: "PATCH", body, auth: true }),
  delete: (id: number) => api(`/admin/bank-accounts/${id}`, { method: "DELETE", auth: true }),
};

export const adminPaymentProofs = {
  list: (status?: string) => api(`/admin/payment-proofs${status ? "?status=" + status : ""}`, { auth: true }),
  approve: (id: string, adminNotes?: string) =>
    api(`/admin/payment-proofs/${id}/approve`, { method: "POST", body: { admin_notes: adminNotes || "" }, auth: true }),
  reject: (id: string, reason: string) =>
    api(`/admin/payment-proofs/${id}/reject`, { method: "POST", body: { reason }, auth: true }),
};

export const adminTrialClasses = {
  list: (status?: string) => api(`/admin/trial-classes${status ? "?status=" + status : ""}`, { auth: true }),
  listAll: () => api("/admin/trial-classes?status=all", { auth: true }),
  schedule: (id: string, body: { teacher_id: string; scheduled_at: string; meeting_url?: string }) =>
    api(`/admin/trial-classes/${id}/schedule`, { method: "POST", body, auth: true }),
  // V3.9.10: cerrar la prueba marcando el resultado (asistió/no asistió)
  setResult: (id: string, attended: boolean, notes?: string) =>
    api(`/admin/trial-classes/${id}/result`, { method: "POST", body: { attended, notes }, auth: true }),
};

export const studentPayments = {
  bankAccounts: () => api("/payments/bank-accounts", { auth: true }),
  submitProof: (body: any) => api("/payments/submit-proof", { method: "POST", body, auth: true }),
  myProofs: () => api("/payments/my-proofs", { auth: true }),
  trialStatus: () => api("/payments/trial-class/status", { auth: true }),
  requestTrial: (body: any) => api("/payments/trial-class/request", { method: "POST", body, auth: true }),
};


export function safeArray<T = any>(v: any): T[] { return Array.isArray(v) ? v : []; }
export function safeObj<T>(v: any, fb: T): T {
  return v && typeof v === "object" && !Array.isArray(v) ? v : fb;
}
