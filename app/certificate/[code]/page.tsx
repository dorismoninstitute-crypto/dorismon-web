"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { certificates } from "@/lib/api";

export default function VerifyCertificatePage() {
  const params = useParams();
  const code = params?.code as string;
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    certificates.verify(code)
      .then(c => { setCert(c); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  if (err || !cert) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8 text-center shadow-sm">
          <div className="text-5xl mb-3">❌</div>
          <h1 className="text-xl font-bold mb-2">Certificado no válido</h1>
          <p className="text-sm text-slate-500 mb-6">
            El código <code className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{code}</code> no existe o fue revocado.
          </p>
          <Link href="/" className="inline-block px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-lg transition">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            ✓ Certificado verificado
          </span>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-purple-700 text-white">
          <div className="p-10 md:p-16 text-center">
            <div className="mb-6">
              <div className="inline-flex w-16 h-16 rounded-full bg-white/20 backdrop-blur items-center justify-center text-3xl mb-4">🎓</div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">Dorismon Language Institute</p>
              <p className="text-xs opacity-70">Certificado oficial</p>
            </div>

            <p className="text-sm opacity-80 mb-2">Por la presente se certifica que</p>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">{cert.student_name}</h1>

            <p className="text-sm opacity-80 mb-2">ha completado satisfactoriamente</p>
            <h2 className="text-xl md:text-2xl font-bold mb-1">{cert.course_name}</h2>
            <p className="text-sm opacity-80 mb-6">Nivel {cert.level_code} — {cert.level_name}</p>

            <div className="flex flex-wrap justify-center gap-6 text-sm border-t border-white/20 pt-6">
              <div>
                <p className="text-xs opacity-70 uppercase tracking-wider">Fecha</p>
                <p className="font-bold">{new Date(cert.issued_at).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              <div>
                <p className="text-xs opacity-70 uppercase tracking-wider">Horas</p>
                <p className="font-bold">{cert.hours}h</p>
              </div>
              {cert.final_grade && (
                <div>
                  <p className="text-xs opacity-70 uppercase tracking-wider">Promedio</p>
                  <p className="font-bold">{cert.final_grade}%</p>
                </div>
              )}
            </div>

            <p className="text-xs font-mono opacity-60 mt-8">{cert.code}</p>
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-slate-500">
          Verificación pública · <Link href="/" className="text-brand-600 font-semibold hover:underline">Dorismon Institute</Link>
        </div>
      </div>
    </div>
  );
}
