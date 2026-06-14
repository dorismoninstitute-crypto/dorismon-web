"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authEmailApi } from "@/lib/api";
import { Button, Card, CardBody, Input, showToast } from "@/components/ui";
import Logo from "@/components/Logo";
import { Lock, CheckCircle2 } from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [form, setForm] = useState({ new_password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      showToast("error", "Link inválido");
      setTimeout(() => router.push("/forgot-password"), 2000);
    }
  }, [token, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.new_password.length < 8) {
      showToast("error", "La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (form.new_password !== form.confirm) {
      showToast("error", "Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      await authEmailApi.resetPassword(token, form.new_password);
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-accent-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Logo size="lg" />
        </div>

        <Card>
          <CardBody>
            {!done ? (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-50 flex items-center justify-center">
                    <Lock className="text-brand-600" size={32} />
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Crear nueva contraseña</h1>
                  <p className="text-sm text-slate-600">Elige una contraseña segura.</p>
                </div>

                <form onSubmit={submit} className="space-y-4">
                  <Input
                    label="Nueva contraseña"
                    type="password"
                    required
                    value={form.new_password}
                    onChange={(e: any) => setForm({ ...form, new_password: e.target.value })}
                    placeholder="Mínimo 8 caracteres"
                  />
                  <Input
                    label="Confirmar contraseña"
                    type="password"
                    required
                    value={form.confirm}
                    onChange={(e: any) => setForm({ ...form, confirm: e.target.value })}
                  />
                  <Button type="submit" disabled={loading} className="w-full" size="lg">
                    {loading ? "Guardando..." : "Actualizar contraseña"}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="text-emerald-600" size={32} />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 mb-2">¡Contraseña actualizada!</h2>
                <p className="text-sm text-slate-600 mb-4">
                  Te llevamos al login...
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-4">
          <Link href="/login" className="hover:underline">← Volver al login</Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Cargando...</p></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
