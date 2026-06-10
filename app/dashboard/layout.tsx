"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth, safeObj, progress, getLevelTheme } from "@/lib/api";
import { LoadingScreen } from "@/components/ui";
import clsx from "clsx";

const studentItems = [
  { href: "/dashboard/student", label: "Inicio", icon: "🏠" },
  { href: "/dashboard/student/courses", label: "Mis cursos", icon: "📚" },
  { href: "/dashboard/student/calendar", label: "Calendario", icon: "📅" },
  { href: "/dashboard/student/assignments", label: "Tareas", icon: "📝" },
  { href: "/dashboard/student/quizzes", label: "Quizzes", icon: "✓" },
  { href: "/dashboard/student/events", label: "Eventos", icon: "🎫" },
  { href: "/dashboard/student/library", label: "Biblioteca", icon: "📖" },
  { href: "/dashboard/student/my-placement", label: "Mi nivel", icon: "🎯" },
  { href: "/dashboard/student/transcript", label: "Expediente", icon: "📊" },
  { href: "/dashboard/student/certificates", label: "Certificados", icon: "🎓" },
  { href: "/dashboard/student/notifications", label: "Notificaciones", icon: "🔔" },
  { href: "/dashboard/account", label: "Mi cuenta", icon: "⚙️" },
];
const teacherItems = [
  { href: "/dashboard/teacher", label: "Inicio", icon: "🏠" },
  { href: "/dashboard/teacher/students", label: "Mis estudiantes", icon: "👥" },
  { href: "/dashboard/teacher/sessions", label: "Mis clases", icon: "🗓" },
  { href: "/dashboard/teacher/assignments", label: "Tareas", icon: "📝" },
  { href: "/dashboard/teacher/quizzes", label: "Quizzes", icon: "✓" },
  { href: "/dashboard/teacher/materials", label: "Materiales", icon: "📖" },
  { href: "/dashboard/account", label: "Mi cuenta", icon: "⚙️" },
];
const adminItems = [
  { href: "/dashboard/admin", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/admin/users", label: "Usuarios", icon: "👥" },
  { href: "/dashboard/admin/placement-results", label: "Placement", icon: "🎯" },
  { href: "/dashboard/admin/courses", label: "Cursos", icon: "📚" },
  { href: "/dashboard/admin/content", label: "Contenido", icon: "📖" },
  { href: "/dashboard/admin/sessions", label: "Clases", icon: "🗓" },
  { href: "/dashboard/admin/events", label: "Eventos", icon: "🎫" },
  { href: "/dashboard/admin/enrollments", label: "Inscripciones", icon: "📋" },
  { href: "/dashboard/admin/branches", label: "Sedes y aulas", icon: "🏢" },
  { href: "/dashboard/admin/plans", label: "Planes", icon: "💳" },
  { href: "/dashboard/admin/payments", label: "Pagos", icon: "💰" },
  { href: "/dashboard/admin/certificates", label: "Certificados", icon: "🎓" },
  { href: "/dashboard/admin/audit", label: "Auditoría", icon: "📜" },
  { href: "/dashboard/admin/settings", label: "Configuración", icon: "🛠" },
  { href: "/dashboard/account", label: "Mi cuenta", icon: "⚙️" },
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
        <div className="px-5 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-lg", logoColorClass)}>D</div>
          <div>
            <p className="font-bold tracking-tight text-slate-900">Dorismon</p>
            <p className="text-xs text-slate-500 capitalize">
              {role === "student" ? `Nivel ${studentLevel}` : role.replace("_", " ")}
            </p>
          </div>
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
                <span className="text-base">{n.icon}</span>
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className={clsx("w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm", logoColorClass)}>
              {(u.full_name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{u.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{u.email}</p>
            </div>
          </div>
          <button
            onClick={() => { auth.logout(); router.push("/"); }}
            className="w-full text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 py-2 rounded-lg transition"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600 hover:text-slate-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className={clsx("w-7 h-7 rounded bg-brand-600 flex items-center justify-center text-white font-black text-sm")}>D</div>
            <span className="font-bold">Dorismon</span>
          </div>
          <div />
        </header>

        <main className="p-3 md:p-8 max-w-7xl mx-auto pb-20 md:pb-8">{children}</main>
      </div>
    </div>
  );
}
