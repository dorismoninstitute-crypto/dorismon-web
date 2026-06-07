"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";
import { Button, Input, ErrorBox } from "@/components/ui";

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
      // Redirigir según rol
      if (me.role === "super_admin") router.push("/dashboard/admin");
      else if (me.role === "teacher") router.push("/dashboard/teacher");
      else router.push("/dashboard/student");
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-50 to-accent-50">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center text-white font-black text-xl">D</div>
          <span className="font-bold text-xl tracking-tight">Dorismon</span>
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Bienvenido</h1>
          <p className="text-sm text-slate-500 mb-6">Iniciá sesión para continuar tus clases.</p>

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
      </div>
    </div>
  );
}
