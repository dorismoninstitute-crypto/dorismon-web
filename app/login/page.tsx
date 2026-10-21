"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";
import { Button, Input, ErrorBox } from "@/components/ui";
import Logo from "@/components/Logo";
import { useRegistroCarga } from "@/components/Carga";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // GATE 5A — Antes de aceptar las credenciales NO se tapa la pantalla: los
  // errores (contraseña, cuenta desactivada, demasiados intentos) se ven al
  // instante. Si el servidor tarda, se avisa debajo del botón. Una vez
  // aceptadas, la experiencia de carga compartida toma el control.
  const [aceptado, setAceptado] = useState(false);
  const [lento, setLento] = useState<0 | 1 | 2>(0);
  useRegistroCarga(aceptado);

  useEffect(() => {
    if (!loading || aceptado) { setLento(0); return; }
    const t1 = setTimeout(() => setLento(1), 3000);
    const t2 = setTimeout(() => setLento(2), 10000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [loading, aceptado]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await auth.login(form);
      auth.saveToken(res.access_token);
      setAceptado(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("refresh_token", res.refresh_token);
      }
      const me = await auth.me();
      // V3.9.13: la primera vez de la sesión, mostrar la pantalla de bienvenida.
      // Las siguientes, ir directo al dashboard.
      const yaVioBienvenida = typeof window !== "undefined" && sessionStorage.getItem("welcome_shown");
      if (!yaVioBienvenida) {
        if (typeof window !== "undefined") sessionStorage.setItem("welcome_shown", "1");
        router.push("/welcome");
      } else if (me.role === "super_admin") router.push("/dashboard/admin");
      else if (me.role === "teacher") router.push("/dashboard/teacher");
      else router.push("/dashboard/student");
    } catch (e: any) {
      setAceptado(false);
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-50 via-white to-accent-50">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Bienvenido de vuelta</h1>
          <p className="text-sm text-slate-500 mb-6">Iniciá sesión para continuar tu aprendizaje.</p>

          {error && <div className="mb-4"><ErrorBox message={error} /></div>}

          <form onSubmit={submit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e: any) => setForm({ ...form, email: e.target.value })}
              placeholder="tucorreo@ejemplo.com"
            />
            <Input
              label="Contraseña"
              type="password"
              required
              value={form.password}
              onChange={(e: any) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
            <div className="text-right">
              <Link href="/forgot-password" className="text-xs font-bold text-brand-600 hover:text-brand-700">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </Button>
            {loading && !aceptado && lento > 0 && (
              <p className="text-xs text-slate-500 text-center" role="status" aria-live="polite">
                {lento === 1 ? "Conectando con Dorismon…" : "La conexión está tardando un poco más de lo habitual…"}
              </p>
            )}
          </form>

          <p className="text-sm text-slate-500 text-center mt-6">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="font-bold text-brand-600 hover:text-brand-700">
              Crea una gratis
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} Dorismon Language Institute. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
