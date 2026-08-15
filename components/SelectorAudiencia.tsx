"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Users, User, Building2 } from "lucide-react";

/**
 * V3.9.46 P1 — "¿A quién va esto?"
 *
 * Se usa al crear una tarea, un quiz, una clase suelta o un material.
 *
 * IMPORTANTE: el usuario NUNCA ve `series_id`. Ve nombres de verdad:
 * "Grupo B1 Mañana · Lun, Mié 8:00 AM". El identificador es cosa del sistema.
 */

const DIAS: Record<string, string> = {
  mon: "Lun", tue: "Mar", wed: "Mié", thu: "Jue", fri: "Vie", sat: "Sáb", sun: "Dom",
};

function horario(g: any) {
  const dias = (g.days_of_week || "")
    .split(",").map((d: string) => DIAS[d.trim()] || d.trim()).filter(Boolean).join(", ");
  let hora = g.start_time_hhmm || "";
  try {
    const [h, m] = hora.split(":");
    hora = new Date(2000, 0, 1, Number(h), Number(m))
      .toLocaleTimeString("es", { hour: "numeric", minute: "2-digit", hour12: true });
  } catch { /* si viene raro, se muestra tal cual */ }
  return [dias, hora].filter(Boolean).join(" · ");
}

export default function SelectorAudiencia({
  levelId,
  value,
  onChange,
  permitirInstitucional = false,
  etiquetaTodos = "Todos mis estudiantes de este nivel",
}: {
  levelId?: number | string | null;
  value: { series_id?: string | null; audience_kind?: string };
  onChange: (v: { series_id?: string | null; audience_kind?: string }) => void;
  permitirInstitucional?: boolean;
  etiquetaTodos?: string;
}) {
  const [grupos, setGrupos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    // V3.9.48 — Se pide a /teacher/my-groups, que devuelve SOLO los grupos
    // del profesor autenticado.
    //
    // Antes se llamaba a /admin/groups, que exige rol de admin: el profesor
    // recibía 403, el error se tragaba, y le decía "No hay grupos creados"
    // aunque sí los tuviera. Un fallo silencioso de los peores.
    api("/teacher/my-groups", { auth: true })
      .then((r: any) => setGrupos(r?.items || []))
      .catch((e: any) => {
        setError(e?.message || "No se pudieron cargar tus grupos");
        setGrupos([]);
      })
      .finally(() => setCargando(false));
  }, []);

  // Solo los grupos del nivel elegido (si se indicó uno)
  const disponibles = levelId
    ? grupos.filter((g) => String(g.level_id) === String(levelId))
    : grupos;

  const elegido = value?.series_id || "";
  const esInstitucional = value?.audience_kind === "institutional";

  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        ¿A quién va?
      </label>

      <div className="space-y-2">
        {/* Todos los del profesor en ese nivel */}
        <button
          type="button"
          onClick={() => onChange({ series_id: null, audience_kind: "teacher" })}
          className={`w-full text-left p-3 rounded-xl border-2 transition ${
            !elegido && !esInstitucional
              ? "border-brand-500 bg-brand-50"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-800">{etiquetaTodos}</p>
              <p className="text-[11px] text-slate-500">
                Le llega a todos tus grupos de este nivel
              </p>
            </div>
          </div>
        </button>

        {/* Un grupo concreto */}
        {cargando ? (
          <p className="text-xs text-slate-400 px-1">Cargando grupos...</p>
        ) : error ? (
          <p className="text-xs text-rose-600 px-1">
            {error} — recarga la página e inténtalo de nuevo.
          </p>
        ) : disponibles.length === 0 ? (
          <p className="text-xs text-slate-400 px-1">
            {grupos.length === 0
              ? "Todavía no tienes grupos creados."
              : "No tienes grupos de este nivel."}
          </p>
        ) : (
          disponibles.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onChange({ series_id: g.id, audience_kind: "teacher" })}
              className={`w-full text-left p-3 rounded-xl border-2 transition ${
                elegido === g.id
                  ? "border-brand-500 bg-brand-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      Solo el grupo &ldquo;{g.name}&rdquo;
                    </p>
                    <p className="text-[11px] text-slate-500">{horario(g)}</p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 flex-shrink-0">
                  {g.students} estudiante{g.students === 1 ? "" : "s"}
                </span>
              </div>
            </button>
          ))
        )}

        {/* Institucional (solo admin) */}
        {permitirInstitucional && (
          <button
            type="button"
            onClick={() => onChange({ series_id: null, audience_kind: "institutional" })}
            className={`w-full text-left p-3 rounded-xl border-2 transition ${
              esInstitucional ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Material del instituto
                </p>
                <p className="text-[11px] text-slate-500">
                  Para todos los estudiantes del nivel, de cualquier profesor
                </p>
              </div>
            </div>
          </button>
        )}
      </div>

      {elegido && (
        <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 rounded-lg px-3 py-2">
          💡 Solo los estudiantes de ese grupo lo verán y recibirán el aviso.
        </p>
      )}
    </div>
  );
}
