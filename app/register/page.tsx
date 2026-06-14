"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";
import { Button, Input, ErrorBox } from "@/components/ui";
import Logo from "@/components/Logo";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", full_name: "", phone: "", gender: "" });
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-50 via-white to-accent-50">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8">
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

            {/* V1.6.4: Selector género opcional */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                Género (opcional)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "female", label: "Femenino", gradient: "from-pink-400 to-fuchsia-500" },
                  { value: "male", label: "Masculino", gradient: "from-blue-500 to-teal-500" },
                  { value: "", label: "No decir", gradient: "from-slate-400 to-slate-600" },
                ].map((g) => (
                  <button
                    key={g.value || "none"}
                    type="button"
                    onClick={() => setForm({ ...form, gender: g.value })}
                    className={`p-2 rounded-lg border-2 transition ${
                      form.gender === g.value
                        ? "border-brand-500 bg-brand-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${g.gradient} mx-auto mb-1`} />
                    <p className="text-[10px] font-semibold text-slate-700">{g.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <Input label="Contraseña" type="password" required minLength={8} value={form.password}
              onChange={(e: any) => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 8 caracteres" />
            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>

          <p className="text-sm text-slate-500 text-center mt-6">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-bold text-brand-600 hover:text-brand-700">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
