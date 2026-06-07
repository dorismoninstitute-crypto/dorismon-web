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
function setToken(t: string) {
  if (typeof window !== "undefined") localStorage.setItem("access_token", t);
}
function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }
}

export async function api(path: string, opts: ApiOptions = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.auth) {
    const t = getToken();
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method || "GET", headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
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
  logout: () => clearToken(),
  saveToken: setToken,
  getToken,
  isLoggedIn: () => !!getToken(),
};

export const catalog = {
  courses: () => api("/courses"),
  course: (id: number) => api(`/courses/${id}`),
  levelModules: (id: number) => api(`/levels/${id}/modules`),
  lesson: (id: number) => api(`/lessons/${id}`, { auth: true }),
};

export const studentApi = {
  dashboard: () => api("/student/dashboard", { auth: true }),
  courses: () => api("/student/courses", { auth: true }),
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
  sessions: () => api("/teacher/sessions", { auth: true }),
  attendance: (sessionId: string) =>
    api(`/teacher/sessions/${sessionId}/attendance`, { auth: true }),
  saveAttendance: (sessionId: string, body: any) =>
    api(`/teacher/sessions/${sessionId}/attendance`, { method: "POST", body, auth: true }),
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
};

export function safeArray<T>(v: any): T[] { return Array.isArray(v) ? v : []; }
export function safeObj<T>(v: any, fb: T): T {
  return v && typeof v === "object" && !Array.isArray(v) ? v : fb;
}
