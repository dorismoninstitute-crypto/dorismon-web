"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";
import { Button, Input, ErrorBox } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", full_name: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setLoading(true);
    try {
      const res = await auth.register(form);
      auth.saveToken(res.access_token);
      if (typeof window !== "undefined") localStorage.setItem("refresh_token", res.refresh_token);
      router.push("/placement");
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
          <h1 className="text-2xl font-bold tracking-tight mb-2">Crear cuenta</h1>
          <p className="text-sm text-slate-500 mb-6">Comenzá a aprender inglés hoy.</p>

          {error && <div className="mb-4"><ErrorBox message={error} /></div>}

          <form onSubmit={submit} className="space-y-4">
            <Input label="Nombre completo" required value={form.full_name}
              onChange={(e: any) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Tu nombre y apellido" />
            <Input label="Email" type="email" required value={form.email}
              onChange={(e: any) => setForm({ ...form, email: e.target.value })}
              placeholder="tucorreo@ejemplo.com" />
            <Input label="Teléfono (opcional)" value={form.phone}
              onChange={(e: any) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 809..." />
            <Input label="Contraseña" type="password" required minLength={8} value={form.password}
              onChange={(e: any) => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 8 caracteres" />
            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>

          <p className="text-sm text-slate-500 text-center mt-6">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="font-bold text-brand-600 hover:text-brand-700">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
