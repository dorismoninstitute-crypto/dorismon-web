"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { teacherApi, safeArray } from "@/lib/api";

/**
 * V3.9.22 — Bloque "⏳ Clases sin asistencia" para el profe.
 * Muestra las clases YA TERMINADAS (últimos 7 días) que aún no tienen
 * asistencia registrada, con acceso directo para pasarla. Al pasar la
 * lista, la clase desaparece del bloque. Sin asistencia registrada, la
 * clase no cuenta para los ingresos del profe — por eso importa tanto.
 */
export default function PendingAttendance() {
  const [items, setItems] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    teacherApi.pendingAttendance()
      .then((r: any) => { setItems(safeArray(r.items)); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded || items.length === 0) return null;

  return (
    <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 md:p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">⏳</span>
        <h3 className="font-bold text-amber-900">
          {items.length === 1
            ? "Tienes 1 clase sin asistencia registrada"
            : `Tienes ${items.length} clases sin asistencia registrada`}
        </h3>
      </div>
      <p className="text-xs text-amber-800 mb-3">
        Pasa la lista para que queden registradas (y cuenten para tus ingresos).
      </p>
      <div className="space-y-2">
        {items.map((s: any) => {
          const d = s.starts_at_utc ? new Date(s.starts_at_utc) : null;
          const when = d
            ? d.toLocaleString("es", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true })
            : "";
          return (
            <div key={s.id} className="flex items-center gap-3 bg-white rounded-xl border border-amber-100 px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-800 truncate">
                  {s.title}
                  {s.is_trial && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">🎯 Prueba</span>}
                  {s.is_open_event && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">🎉 Evento</span>}
                  {s.is_private && !s.is_trial && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">👤 Privada</span>}
                </p>
                <p className="text-xs text-slate-500">{when}</p>
              </div>
              <Link
                href={`/dashboard/teacher/sessions/${s.id}`}
                className="flex-shrink-0 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-3 py-2 transition"
              >
                Pasar asistencia →
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
