"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";
import Logo from "@/components/Logo";
import { ArrowRight, GraduationCap } from "lucide-react";

/**
 * V3.9.13 — Pantalla de bienvenida para usuarios YA logueados.
 * Los saluda con una portada linda y un botón "Ir a mi cuenta".
 * Se muestra solo la PRIMERA vez de la sesión (marca en sessionStorage);
 * después el login lleva directo al dashboard.
 */
export default function WelcomePage() {
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<string>("student");
  const [loading, setLoading] = useState(true);

  // Saludo según la hora del día
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  })();

  const dashboardPath =
    role === "super_admin" ? "/dashboard/admin"
    : role === "teacher" ? "/dashboard/teacher"
    : "/dashboard/student";

  useEffect(() => {
    // Si no hay sesión, mandar al login
    auth.me()
      .then((me: any) => {
        setName((me.full_name || "").split(" ")[0] || "");
        setRole(me.role || "student");
        setLoading(false);
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  const goToAccount = () => {
    router.push(dashboardPath);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-700 to-brand-900">
        <div className="animate-pulse text-white/70">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 text-white relative overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

      {/* Contenido */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 text-center">
        {/* Logo sobre fondo blanco para que se vea */}
        <div className="bg-white rounded-2xl p-4 mb-8 shadow-lg">
          <Logo size="lg" asLink={false} />
        </div>

        <p className="text-accent-300 font-medium tracking-wide uppercase text-sm mb-3">
          {greeting}
        </p>
        <h1 className="text-4xl md:text-5xl font-black mb-4">
          ¡Hola, {name}! 👋
        </h1>
        <p className="text-lg text-brand-100 max-w-md mb-10">
          Bienvenido de vuelta a Dorismon Language Institute.
          Tu aprendizaje de inglés continúa aquí.
        </p>

        <button
          onClick={goToAccount}
          className="group bg-white text-brand-700 font-bold text-lg px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-3"
        >
          <GraduationCap size={24} />
          Ir a mi cuenta
          <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Pie */}
      <div className="relative z-10 text-center pb-8 text-brand-200/70 text-sm px-6">
        Dorismon Language Institute · Santo Domingo, RD 🇩🇴
      </div>
    </div>
  );
}
