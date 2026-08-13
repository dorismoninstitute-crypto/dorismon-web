"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AlertTriangle, ArrowRight } from "lucide-react";

/**
 * V3.9.36 — Aviso de estudiantes que NO están viendo ninguna clase.
 *
 * POR QUÉ EXISTE: con la regla estricta, quien no tiene grupo ni clases
 * propias no ve nada. Eso es correcto (mejor nada que una clase ajena), pero
 * hay que enterarse: si no, alguien queda olvidado sin horario y nadie nota.
 */
export default function SinHorarioAviso() {
  const [items, setItems] = useState<any[]>([]);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    api("/admin/students-without-schedule", { auth: true })
      .then((r: any) => { setItems(r?.items || []); setListo(true); })
      .catch(() => setListo(true));
  }, []);

  if (!listo || items.length === 0) return null;

  return (
    <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 mb-6">
      <div className="flex items-start gap-3 mb-3">
        <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="font-bold text-rose-900 text-sm">
            {items.length === 1
              ? "1 estudiante no está viendo ninguna clase"
              : `${items.length} estudiantes no están viendo ninguna clase`}
          </p>
          <p className="text-xs text-rose-800 leading-relaxed">
            Al entrar a la plataforma no ven nada. Asígnalos a un grupo o
            agéndales una clase.
          </p>
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        {items.slice(0, 6).map((s: any) => (
          <div key={s.student_id} className="bg-white rounded-lg px-3 py-2 flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-800 flex-1 min-w-[120px]">
              {s.name}
            </span>
            {s.level_code && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                {s.level_code}
              </span>
            )}
            <span className="text-[11px] text-slate-500">{s.motivo}</span>
          </div>
        ))}
        {items.length > 6 && (
          <p className="text-[11px] text-rose-700 px-1">
            y {items.length - 6} más...
          </p>
        )}
      </div>

      <Link
        href="/dashboard/admin/groups"
        className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition"
      >
        Asignar horarios
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
