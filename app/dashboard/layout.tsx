"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth, safeObj, progress, getLevelTheme, ApiError } from "@/lib/api";
import { LoadingScreen } from "@/components/ui";
import { CallProvider } from "@/components/CallProvider";  // V3.9.28
import AvisoVersion from "@/components/AvisoVersion";  // GATE 5B
import Avatar from "@/components/Avatar";
import Logo from "@/components/Logo";
import { NotificationCenter } from "@/components/NotificationCenter";
import clsx from "clsx";
import {
  Home, BookOpen, Calendar, FileText, CheckCircle2, Ticket, Library,
  Target, BarChart3, GraduationCap, Bell, Settings, LogOut, Menu, Award,
  Users, Briefcase, MapPin, CreditCard, DollarSign, FileSearch, Wrench,
  ClipboardList, FolderKanban, FileEdit, BookMarked, Layers, Wallet,
  MessageCircle, HelpCircle, Inbox, TrendingUp, Sparkles, Clock,
  Image as ImageIcon, Quote, Repeat, ClipboardCheck,
  Video,  // GATE 6H-B
} from "lucide-react";

// V2.9.1: Items agrupados por área con encabezados de sección
// Estructura: { section: "Nombre", items: [...] }
const studentGroups = [
  { section: null, items: [
    { href: "/dashboard/student", label: "Inicio", Icon: Home },
  ]},
  { section: "Aprendizaje", items: [
    { href: "/dashboard/student/courses", label: "Mis cursos", Icon: BookOpen },
    { href: "/dashboard/student/calendar", label: "Calendario", Icon: Calendar },
    { href: "/dashboard/student/makeups", label: "Reponer clase", Icon: Repeat },  // V3.9.36
    { href: "/dashboard/student/library", label: "Biblioteca", Icon: Library },
    { href: "/dashboard/student/grabaciones", label: "Grabaciones", Icon: Video },  // GATE 6H-B
    { href: "/dashboard/student/assignments", label: "Tareas", Icon: FileText },
    { href: "/dashboard/student/quizzes", label: "Quizzes", Icon: CheckCircle2 },
    { href: "/dashboard/student/events", label: "Eventos", Icon: Ticket },
  ]},
  { section: "Mi progreso", items: [
    { href: "/dashboard/student/my-placement", label: "Mi nivel", Icon: Target },
    { href: "/dashboard/student/transcript", label: "Expediente", Icon: BarChart3 },
    { href: "/dashboard/student/certificates", label: "Certificados", Icon: GraduationCap },
  ]},
  { section: "Pagos", items: [
    { href: "/dashboard/student/payments", label: "Mis pagos", Icon: CreditCard },
    { href: "/dashboard/student/trial", label: "Clase de prueba 🎁", Icon: Sparkles },
  ]},
  { section: "Cuenta", items: [
    { href: "/dashboard/messages", label: "Mensajes", Icon: MessageCircle },
    { href: "/dashboard/student/notifications", label: "Notificaciones", Icon: Bell },
    { href: "/dashboard/student/profile", label: "Mi perfil completo", Icon: ClipboardList },
    { href: "/dashboard/account", label: "Mi cuenta", Icon: Settings },
    { href: "/dashboard/help", label: "Ayuda", Icon: HelpCircle },
  ]},
];

const teacherGroups = [
  { section: null, items: [
    { href: "/dashboard/teacher", label: "Inicio", Icon: Home },
  ]},
  { section: "Enseñanza", items: [
    { href: "/dashboard/teacher/sessions", label: "Mis clases", Icon: Calendar },
    { href: "/dashboard/teacher/grabaciones", label: "Grabaciones", Icon: Video },  // GATE 6H-B
    { href: "/dashboard/teacher/students", label: "Mis estudiantes", Icon: Users },
    { href: "/dashboard/teacher/assignments", label: "Tareas", Icon: FileText },
    { href: "/dashboard/teacher/quizzes", label: "Quizzes", Icon: CheckCircle2 },
    { href: "/dashboard/teacher/ai-content", label: "Generar con IA", Icon: Sparkles },  // V3.9.33
    { href: "/dashboard/teacher/materials", label: "Materiales", Icon: BookMarked },
  ]},
  { section: "Finanzas", items: [
    { href: "/dashboard/teacher/income", label: "Mis ingresos", Icon: Wallet },
  ]},
  { section: "Cuenta", items: [
    { href: "/dashboard/messages", label: "Mensajes", Icon: MessageCircle },
    { href: "/dashboard/account", label: "Mi cuenta", Icon: Settings },
  ]},
];

/**
 * V3.9.60 — Menú del Admin reorganizado por CÓMO SE TRABAJA, no por cuándo
 * se fue construyendo cada módulo.
 *
 * ⚠️ Todas las rutas se conservan tal cual: esto es solo reagrupación. Nada
 * de aquí cambia una llamada a la API ni un permiso.
 */
const adminGroups = [
  { section: null, items: [
    { href: "/dashboard/admin", label: "Inicio", Icon: BarChart3 },
  ]},
  { section: "Operación académica", items: [
    { href: "/dashboard/admin/sessions", label: "Clases", Icon: Calendar },
    { href: "/dashboard/admin/grabaciones", label: "Grabaciones", Icon: Video },  // GATE 6H-B
    { href: "/dashboard/admin/groups", label: "Grupos y horarios", Icon: Users },
    { href: "/dashboard/admin/teachers-schedule", label: "Agenda de profesores", Icon: Clock },
    { href: "/dashboard/admin/attendance", label: "Asistencia", Icon: ClipboardCheck },
    { href: "/dashboard/admin/makeups", label: "Reposiciones", Icon: Repeat },
    { href: "/dashboard/admin/events", label: "Eventos", Icon: Ticket },
    { href: "/dashboard/admin/branches", label: "Sedes y aulas", Icon: MapPin },
  ]},
  { section: "Personas", items: [
    { href: "/dashboard/admin/students-by-teacher", label: "Estudiantes", Icon: Users },
    { href: "/dashboard/admin/enrollments", label: "Inscripciones", Icon: ClipboardList },
    { href: "/dashboard/admin/placement-results", label: "Placement", Icon: Target },
    { href: "/dashboard/admin/trial-classes", label: "Clases de prueba", Icon: Sparkles },
    { href: "/dashboard/admin/users", label: "Usuarios", Icon: Users },
  ]},
  { section: "Académico", items: [
    { href: "/dashboard/admin/courses", label: "Cursos", Icon: BookOpen },
    { href: "/dashboard/admin/content", label: "Contenido", Icon: Layers },
    { href: "/dashboard/admin/ai-content", label: "Generar contenido IA", Icon: Sparkles },
    { href: "/dashboard/admin/academic-overview", label: "Seguimiento académico", Icon: TrendingUp },
    { href: "/dashboard/admin/completions", label: "Finalizaciones", Icon: GraduationCap },
    { href: "/dashboard/admin/certificates", label: "Certificados", Icon: Award },
    { href: "/dashboard/admin/certification-ready", label: "Listos para certificar", Icon: Award },
  ]},
  { section: "Finanzas", items: [
    { href: "/dashboard/admin/finance", label: "Resumen financiero", Icon: TrendingUp },
    { href: "/dashboard/admin/payments", label: "Pagos estudiantes", Icon: DollarSign },
    { href: "/dashboard/admin/payment-proofs", label: "Verificar pagos", Icon: CheckCircle2 },
    { href: "/dashboard/admin/plans", label: "Planes", Icon: CreditCard },
    { href: "/dashboard/admin/bank-accounts", label: "Cuentas bancarias", Icon: CreditCard },
    { href: "/dashboard/admin/teacher-payments", label: "Pagos a profesores", Icon: Wallet },
  ]},
  { section: "Crecimiento", items: [
    { href: "/dashboard/admin/reactivation", label: "Reactivación", Icon: TrendingUp },
    { href: "/dashboard/admin/testimonials", label: "Testimonios", Icon: Quote },
    { href: "/dashboard/admin/site-images", label: "Página pública", Icon: ImageIcon },
  ]},
  { section: "Sistema", items: [
    { href: "/dashboard/messages", label: "Mensajes", Icon: MessageCircle },
    { href: "/dashboard/admin/tickets", label: "Tickets de soporte", Icon: Inbox },
    { href: "/dashboard/admin/audit", label: "Auditoría", Icon: FileSearch },
    { href: "/dashboard/admin/settings", label: "Configuración", Icon: Wrench },
    { href: "/dashboard/admin/maintenance", label: "Mantenimiento", Icon: Wrench },
    { href: "/dashboard/account", label: "Mi cuenta", Icon: Settings },
  ]},
];


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [studentLevel, setStudentLevel] = useState<string>("B1");
  const [loaded, setLoaded] = useState(false);
  const [sinConexion, setSinConexion] = useState(false);  // v3.9.76: caída de red / servidor, NO sesión inválida
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!auth.isLoggedIn()) { router.push("/login"); return; }
    auth.me()
      .then((u) => {
        setUser(u);
        setLoaded(true);
        // Si es estudiante, obtener su nivel para colorear el sidebar
        if (u?.role === "student") {
          progress.myCourse().then((p: any) => {
            if (p?.level_code) setStudentLevel(p.level_code);
          }).catch(() => {});
        }
      })
      .catch((e) => {
        // v3.9.76: SOLO una respuesta de autenticación REAL (401 token inválido, 403 cuenta desactivada,
        // 404 usuario inexistente) cierra la sesión. Una caída de red, un 5xx, un 429 o el arranque en
        // frío del servidor NO deben borrar la sesión (tokens, borradores, cachés) ni mandar a /login.
        const estado = e instanceof ApiError ? e.status : -1;
        if (estado === 401 || estado === 403 || estado === 404) {
          auth.logout();
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return;
        }
        setSinConexion(true);
      });
  }, [router]);

  if (!loaded && sinConexion) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div role="alert" data-sin-conexion="" className="max-w-sm w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 text-center">
          <p className="font-black text-lg text-slate-900">No pudimos conectar con Dorismon</p>
          <p className="text-sm text-slate-600 mt-2">
            Tu sesión sigue abierta. Puede ser tu conexión a internet o que el servidor esté despertando.
            Inténtalo de nuevo en unos segundos.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }
  if (!loaded) return <LoadingScreen message="Cargando..." />;
  const u = safeObj(user, {}) as any;
  const role = u.role || "student";
  const groups = role === "super_admin" ? adminGroups : role === "teacher" ? teacherGroups : studentGroups;
  const isAdmin = role === "super_admin";  // V3.9.60 — barra inferior móvil
  const isTeacher = role === "teacher";    // GATE 2 — barra inferior móvil del profesor
  const isStudent = role === "student";    // GATE 3 — barra inferior móvil del estudiante

  // Tema del sidebar: para estudiante usa colores por nivel, para admin/profe usa brand
  const theme = role === "student" ? getLevelTheme(studentLevel) : null;
  const logoColorClass = theme ? theme.bg : "bg-brand-600";
  const activeBgClass = theme ? theme.bgSoft : "bg-brand-50";
  const activeTextClass = theme ? theme.text : "text-brand-700";
  const activeBorderClass = theme ? theme.border : "border-brand-600";

  return (
    // V3.9.28: la clase en vivo vive por encima de todo el panel, así se puede
    // navegar (tareas, quizzes, asistencia) sin cortar la conexión.
    <CallProvider>
    <div className="min-h-screen flex bg-slate-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={clsx(
        "fixed lg:sticky top-0 left-0 z-40 w-64 h-screen bg-white border-r border-slate-200 flex flex-col transition-transform",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center justify-center">
            {/* V2.6b: Logo real del instituto (shield + texto) */}
            <Logo size="md" asLink={true} />
          </div>
          <p className="text-xs text-slate-500 capitalize mt-3 pl-1">
            {role === "student" ? `Nivel ${studentLevel}` : role === "super_admin" ? "Administrador" : "Profesor"}
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {groups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-4" : ""}>
              {group.section && (
                <p className="px-5 mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {group.section}
                </p>
              )}
              {group.items.map(n => {
                const active = pathname === n.href || (
                  n.href !== "/dashboard/admin" &&
                  n.href !== "/dashboard/teacher" &&
                  n.href !== "/dashboard/student" &&
                  pathname.startsWith(n.href)
                );
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setSidebarOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 px-5 py-2.5 text-sm transition-all border-l-2",
                      active
                        ? clsx(activeBgClass, activeTextClass, activeBorderClass, "font-semibold")
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent"
                    )}
                  >
                    <n.Icon size={18} strokeWidth={2} className="flex-shrink-0" />
                    <span>{n.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3 px-2">
            <Avatar name={u.full_name} gender={u.gender} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{u.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{u.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              auth.logout();
              // V2.8: recarga forzada para garantizar limpieza total
              if (typeof window !== "undefined") {
                window.location.href = "/login";
              }
            }}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 py-2 rounded-lg transition"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {/* GATE 4 — UNA sola cabecera y UN solo centro de avisos. Antes había
            dos cabeceras (móvil y escritorio) con un NotificationCenter cada
            una; la oculta por CSS seguía consultando: avisos y mensajes se
            pedían el doble, también cada 45 s. Se ve igual que antes:
            móvil = menú + logo + campana; escritorio (lg) = solo la campana. */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 lg:px-8 flex items-center justify-between lg:justify-end sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-600 hover:text-slate-900 p-1">
            <Menu size={24} />
          </button>
          <div className="lg:hidden flex items-center gap-2">
            <div className="relative">
              <div className={clsx("w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-black text-sm shadow-md")}>D</div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-accent-500 rounded-full ring-2 ring-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-black tracking-tight">DORISMON</span>
              <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500 mt-0.5">Language Institute</span>
            </div>
          </div>
          <NotificationCenter />
        </header>

        {/* V2.4: Banner de verificación de email REMOVIDO.
           El registro ya valida el email con MX records, marcamos email_verified=true.
           Si en el futuro queremos verificación adicional, será opcional. */}

        <main className="p-3 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">{children}</main>

        {/* V3.9.60 — Barra inferior en móvil, solo para Admin.
            Los cuatro destinos que Dirección abre a diario; "Más" abre el
            menú completo, que sigue siendo la navegación de verdad. */}
        {isAdmin && (
          <nav
            aria-label="Navegación rápida"
            data-barra-inferior=""  // GATE 6D — la ventana de la clase no la tapa
            className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 flex"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {[
              { href: "/dashboard/admin", label: "Inicio", Icon: BarChart3 },
              { href: "/dashboard/admin/sessions", label: "Clases", Icon: Calendar },
              { href: "/dashboard/admin/students-by-teacher", label: "Estudiantes", Icon: Users },
              { href: "/dashboard/admin/finance", label: "Finanzas", Icon: TrendingUp },
            ].map((t) => {
              const activo = pathname === t.href;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={activo ? "page" : undefined}
                  className={clsx(
                    "flex-1 flex flex-col items-center gap-0.5 py-2.5 min-h-[56px] transition",
                    activo ? "text-brand-600" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <t.Icon className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">{t.label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir el menú completo"
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5 min-h-[56px] text-slate-500 hover:text-slate-700 transition"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-semibold">Más</span>
            </button>
          </nav>
        )}

        {/* GATE 2 — Barra inferior en móvil, solo para el PROFESOR. Mismo
            patrón que la de Dirección (que no se toca): tres destinos diarios
            y "Más" abre el menú completo. Estudiantes no la tienen. */}
        {isTeacher && (
          <nav
            aria-label="Navegación rápida del profesor"
            data-barra-inferior=""  // GATE 6D — la ventana de la clase no la tapa
            className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 flex"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {[
              { href: "/dashboard/teacher", label: "Inicio", Icon: Home },
              { href: "/dashboard/teacher/sessions", label: "Mis clases", Icon: Calendar },
              { href: "/dashboard/teacher/assignments", label: "Tareas", Icon: FileText },
            ].map((t) => {
              const activo = pathname === t.href;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={activo ? "page" : undefined}
                  className={clsx(
                    "flex-1 flex flex-col items-center gap-0.5 py-2.5 min-h-[56px] transition",
                    activo ? "text-brand-600" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <t.Icon className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">{t.label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir el menú completo"
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5 min-h-[56px] text-slate-500 hover:text-slate-700 transition"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-semibold">Más</span>
            </button>
          </nav>
        )}

        {/* GATE 3 — Barra inferior en móvil, solo para el ESTUDIANTE. Mismo
            patrón que las de Dirección y profesor (que no se tocan). */}
        {isStudent && (
          <nav
            aria-label="Navegación rápida del estudiante"
            data-barra-inferior=""  // GATE 6D — la ventana de la clase no la tapa
            className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 flex"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {[
              { href: "/dashboard/student", label: "Inicio", Icon: Home },
              { href: "/dashboard/student/calendar", label: "Calendario", Icon: Calendar },
              { href: "/dashboard/student/assignments", label: "Tareas", Icon: FileText },
            ].map((t) => {
              const activo = pathname === t.href;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={activo ? "page" : undefined}
                  className={clsx(
                    "flex-1 flex flex-col items-center gap-0.5 py-2.5 min-h-[56px] transition",
                    activo ? "text-brand-600" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <t.Icon className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">{t.label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir el menú completo"
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5 min-h-[56px] text-slate-500 hover:text-slate-700 transition"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-semibold">Más</span>
            </button>
          </nav>
        )}
      </div>
    </div>
    {/* GATE 5B — aviso de versión nueva; dentro de CallProvider para saber si hay clase */}
    <AvisoVersion />
    </CallProvider>
  );
}
