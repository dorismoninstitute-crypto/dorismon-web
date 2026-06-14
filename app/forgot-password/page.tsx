"use client";
import { useState } from "react";
import Link from "next/link";
import { authEmailApi } from "@/lib/api";
import { Button, Card, CardBody, Input, showToast } from "@/components/ui";
import Logo from "@/components/Logo";
import { Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await authEmailApi.forgotPassword(email);
      setSent(true);
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
            {!sent ? (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-50 flex items-center justify-center">
                    <Mail className="text-brand-600" size={32} />
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-900 mb-2">¿Olvidaste tu contraseña?</h1>
                  <p className="text-sm text-slate-600">
                    Ingresa tu email y te enviamos un link para crear una nueva.
                  </p>
                </div>

                <form onSubmit={submit} className="space-y-4">
                  <Input
                    label="Email"
                    type="email"
                    required
                    value={email}
                    onChange={(e: any) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                  />
                  <Button type="submit" disabled={loading} className="w-full" size="lg">
                    {loading ? "Enviando..." : "Enviar link de recuperación"}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="text-emerald-600" size={32} />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 mb-2">Revisa tu email</h2>
                <p className="text-sm text-slate-600 mb-4">
                  Si <strong>{email}</strong> está registrado, te enviamos un link para resetear tu contraseña.
                </p>
                <p className="text-xs text-slate-500">
                  💡 El link vence en 2 horas. Si no lo encontrás, revisa la carpeta de SPAM.
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
