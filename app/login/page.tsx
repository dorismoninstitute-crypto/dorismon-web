"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";
import { Button, Input, ErrorBox } from "@/components/ui";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await auth.login(form);
      auth.saveToken(res.access_token);
      if (typeof window !== "undefined") {
        localStorage.setItem("refresh_token", res.refresh_token);
      }
      const me = await auth.me();
      if (me.role === "super_admin") router.push("/dashboard/admin");
      else if (me.role === "teacher") router.push("/dashboard/teacher");
      else router.push("/dashboard/student");
    } catch (e: any) {
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
          </form>

          <p className="text-sm text-slate-500 text-center mt-6">
            ¿No tenés cuenta?{" "}
            <Link href="/register" className="font-bold text-brand-600 hover:text-brand-700">
              Creá una gratis
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
