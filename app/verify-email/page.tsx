"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authEmailApi, auth } from "@/lib/api";
import { Button, Card, CardBody, showToast } from "@/components/ui";
import Logo from "@/components/Logo";
import { Mail, CheckCircle2 } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    auth.me()
      .then((u: any) => {
        if (u.email_verified) {
          router.push("/dashboard");
        } else {
          setUser(u);
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      showToast("error", "El código debe tener 6 dígitos");
      return;
    }
    setLoading(true);
    try {
      await authEmailApi.verifyEmail(code);
      showToast("success", "✅ Email verificado");
      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await authEmailApi.resendVerification();
      showToast("success", "Te enviamos un nuevo código");
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setResending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-accent-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Logo size="lg" />
        </div>

        <Card>
          <CardBody className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-50 flex items-center justify-center">
              <Mail className="text-brand-600" size={32} />
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Verificá tu email</h1>
            <p className="text-sm text-slate-600 mb-6">
              Te enviamos un código de 6 dígitos a<br/>
              <strong className="text-slate-900">{user.email}</strong>
            </p>

            <form onSubmit={submit} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-3xl font-black tracking-[0.5em] py-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
                autoFocus
              />

              <Button type="submit" disabled={loading || code.length !== 6} className="w-full" size="lg">
                {loading ? "Verificando..." : "Verificar email"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-2">¿No recibiste el código?</p>
              <button
                onClick={resend}
                disabled={resending}
                className="text-sm font-bold text-brand-600 hover:text-brand-700 disabled:opacity-50"
              >
                {resending ? "Enviando..." : "Reenviar código"}
              </button>
            </div>

            <div className="mt-4 text-xs text-slate-500">
              <p>💡 Si no encontrás el email, revisá la carpeta de SPAM.</p>
              <p className="mt-2">El código vence en 30 minutos.</p>
            </div>
          </CardBody>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-4">
          <Link href="/login" className="hover:underline">← Volver al login</Link>
        </p>
      </div>
    </div>
  );
}
