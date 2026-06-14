"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth, safeObj, progress, getLevelTheme } from "@/lib/api";
import { LoadingScreen } from "@/components/ui";
import Avatar from "@/components/Avatar";
import clsx from "clsx";
import {
  Home, BookOpen, Calendar, FileText, CheckCircle2, Ticket, Library,
  Target, BarChart3, GraduationCap, Bell, Settings, LogOut, Menu, Award,
  Users, Briefcase, MapPin, CreditCard, DollarSign, FileSearch, Wrench,
  ClipboardList, FolderKanban, FileEdit, BookMarked, Layers, Wallet,
  MessageCircle, HelpCircle, Inbox,
} from "lucide-react";

// Iconos como componentes Lucide
const studentItems = [
  { href: "/dashboard/student", label: "Inicio", Icon: Home },
  { href: "/dashboard/student/courses", label: "Mis cursos", Icon: BookOpen },
  { href: "/dashboard/student/calendar", label: "Calendario", Icon: Calendar },
  { href: "/dashboard/student/assignments", label: "Tareas", Icon: FileText },
  { href: "/dashboard/student/quizzes", label: "Quizzes", Icon: CheckCircle2 },
  { href: "/dashboard/student/events", label: "Eventos", Icon: Ticket },
  { href: "/dashboard/student/library", label: "Biblioteca", Icon: Library },
  { href: "/dashboard/student/my-placement", label: "Mi nivel", Icon: Target },
  { href: "/dashboard/student/transcript", label: "Expediente", Icon: BarChart3 },
  { href: "/dashboard/student/certificates", label: "Certificados", Icon: GraduationCap },
  { href: "/dashboard/messages", label: "Mensajes", Icon: MessageCircle },
  { href: "/dashboard/help", label: "Ayuda", Icon: HelpCircle },
  { href: "/dashboard/student/notifications", label: "Notificaciones", Icon: Bell },
  { href: "/dashboard/account", label: "Mi cuenta", Icon: Settings },
];
const teacherItems = [
  { href: "/dashboard/teacher", label: "Inicio", Icon: Home },
  { href: "/dashboard/teacher/students", label: "Mis estudiantes", Icon: Users },
  { href: "/dashboard/teacher/sessions", label: "Mis clases", Icon: Calendar },
  { href: "/dashboard/teacher/assignments", label: "Tareas", Icon: FileText },
  { href: "/dashboard/teacher/quizzes", label: "Quizzes", Icon: CheckCircle2 },
  { href: "/dashboard/teacher/materials", label: "Materiales", Icon: BookMarked },
  { href: "/dashboard/teacher/income", label: "Mis ingresos", Icon: Wallet },
  { href: "/dashboard/messages", label: "Mensajes", Icon: MessageCircle },
  { href: "/dashboard/account", label: "Mi cuenta", Icon: Settings },
];
const adminItems = [
  { href: "/dashboard/admin", label: "Dashboard", Icon: BarChart3 },
  { href: "/dashboard/admin/users", label: "Usuarios", Icon: Users },
  { href: "/dashboard/admin/placement-results", label: "Placement", Icon: Target },
  { href: "/dashboard/admin/courses", label: "Cursos", Icon: BookOpen },
  { href: "/dashboard/admin/content", label: "Contenido", Icon: Layers },
  { href: "/dashboard/admin/sessions", label: "Clases", Icon: Calendar },
  { href: "/dashboard/admin/events", label: "Eventos", Icon: Ticket },
  { href: "/dashboard/admin/enrollments", label: "Inscripciones", Icon: ClipboardList },
  { href: "/dashboard/admin/branches", label: "Sedes y aulas", Icon: MapPin },
  { href: "/dashboard/admin/plans", label: "Planes", Icon: CreditCard },
  { href: "/dashboard/admin/payments", label: "Pagos estudiantes", Icon: DollarSign },
  { href: "/dashboard/admin/teacher-payments", label: "Pagos a profesores", Icon: Wallet },
  { href: "/dashboard/messages", label: "Mensajes", Icon: MessageCircle },
  { href: "/dashboard/admin/tickets", label: "Tickets soporte", Icon: Inbox },
  { href: "/dashboard/admin/certificates", label: "Certificados", Icon: GraduationCap },
  { href: "/dashboard/admin/certification-ready", label: "Listos certificar", Icon: Award },
  { href: "/dashboard/admin/audit", label: "Auditoría", Icon: FileSearch },
  { href: "/dashboard/admin/settings", label: "Configuración", Icon: Wrench },
  { href: "/dashboard/account", label: "Mi cuenta", Icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [studentLevel, setStudentLevel] = useState<string>("B1");
  const [loaded, setLoaded] = useState(false);
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
      .catch(() => { auth.logout(); router.push("/login"); });
  }, [router]);

  if (!loaded) return <LoadingScreen message="Cargando..." />;
  const u = safeObj(user, {}) as any;
  const role = u.role || "student";
  const items = role === "super_admin" ? adminItems : role === "teacher" ? teacherItems : studentItems;
  const sectionLabel = role === "super_admin" ? "Administración" : role === "teacher" ? "Profesor" : "Estudiante";

  // Tema del sidebar: para estudiante usa colores por nivel, para admin/profe usa brand
  const theme = role === "student" ? getLevelTheme(studentLevel) : null;
  const logoColorClass = theme ? theme.bg : "bg-brand-600";
  const activeBgClass = theme ? theme.bgSoft : "bg-brand-50";
  const activeTextClass = theme ? theme.text : "text-brand-700";
  const activeBorderClass = theme ? theme.border : "border-brand-600";

  return (
    <div className="min-h-screen flex bg-slate-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={clsx(
        "fixed lg:sticky top-0 left-0 z-40 w-64 h-screen bg-white border-r border-slate-200 flex flex-col transition-transform",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="relative flex-shrink-0">
              <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-base shadow-md", logoColorClass)}>D</div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-accent-500 rounded-full ring-2 ring-white" />
            </div>
            <div className="flex flex-col leading-none min-w-0">
              <span className="text-base font-black tracking-tight text-slate-900">DORISMON</span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500 mt-0.5">
                Language Institute
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 capitalize mt-3 pl-1">
            {role === "student" ? `Nivel ${studentLevel}` : role === "super_admin" ? "Administrador" : "Profesor"}
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          <p className="px-5 mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">{sectionLabel}</p>
          {items.map(n => {
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
            onClick={() => { auth.logout(); router.push("/"); }}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 py-2 rounded-lg transition"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600 hover:text-slate-900 p-1">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className={clsx("w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-black text-sm shadow-md")}>D</div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-accent-500 rounded-full ring-2 ring-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-black tracking-tight">DORISMON</span>
              <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500 mt-0.5">Language Institute</span>
            </div>
          </div>
          <div />
        </header>

        {/* V2.1: banner si email no verificado */}
        {u && !u.email_verified && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm">
            <span className="text-amber-900">
              📧 <strong>Verificá tu email</strong> para aprovechar todas las funciones.
            </span>{" "}
            <Link href="/verify-email" className="font-bold text-amber-700 hover:text-amber-800 underline">
              Verificar ahora →
            </Link>
          </div>
        )}

        <main className="p-3 md:p-8 max-w-7xl mx-auto pb-20 md:pb-8">{children}</main>
      </div>
    </div>
  );
}
