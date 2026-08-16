"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { FileEdit, AlertTriangle, ArrowRight, MessageCircle } from "lucide-react";

/**
 * V3.9.49 P2 — Bloques de seguimiento para el panel.
 *
 * El profesor no tenía forma de enterarse de que le habían entregado sin
 * entrar tarea por tarea. Y nadie veía quién estaba quedándose atrás.
 */

/** Entregas esperando calificación */
export function EntregasPendientes() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api("/teacher/pending-grading", { auth: true })
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data || !data.count) return null;

  return (
    <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-4 mb-5">
      <div className="flex items-start gap-3 flex-wrap">
        <FileEdit className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-[180px]">
          <p className="font-bold text-sky-900 text-sm">
            {data.count === 1
              ? "1 entrega esperando calificación"
              : `${data.count} entregas esperando calificación`}
          </p>
          {data.oldest_days > 0 && (
            <p className="text-xs text-sky-800">
              La más antigua lleva {data.oldest_days} día{data.oldest_days === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <Link
          href="/dashboard/teacher/assignments"
          className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition"
        >
          Calificar ahora
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="mt-3 space-y-1.5">
        {(data.items || []).slice(0, 4).map((x: any) => (
          <div key={x.submission_id}
               className="bg-white rounded-lg px-3 py-2 flex items-center gap-2 flex-wrap text-sm">
            <span className="font-semibold text-slate-800">{x.student_name}</span>
            <span className="text-slate-500 flex-1 min-w-[100px] truncate">
              {x.assignment_title}
            </span>
            {x.days_waiting > 0 && (
              <span className="text-[11px] text-slate-400">
                hace {x.days_waiting}d
              </span>
            )}
          </div>
        ))}
        {data.count > 4 && (
          <p className="text-[11px] text-sky-700 px-1">y {data.count - 4} más...</p>
        )}
      </div>
    </div>
  );
}

/** Estudiantes que necesitan atención, con el motivo */
export function EstudiantesEnRiesgo({ paraAdmin = false }: { paraAdmin?: boolean }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api(paraAdmin ? "/admin/at-risk-overview" : "/teacher/at-risk", { auth: true })
      .then(setData)
      .catch(() => setData(null));
  }, [paraAdmin]);

  if (!data || !data.count) return null;

  const escribir = (s: any) => {
    const tel = (s.phone || "").replace(/\D/g, "");
    if (!tel) return;
    const numero = tel.length === 10 ? "1" + tel : tel;
    const nombre = (s.name || "").split(" ")[0];
    const msg =
      `Hola ${nombre}, te escribimos de Dorismon Language Institute. ` +
      `Queremos saber cómo vas y si necesitas apoyo con algo. ¡Estamos para ayudarte! 📚`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-5">
      <div className="flex items-start gap-3 mb-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="font-bold text-amber-900 text-sm">
            {data.count === 1
              ? "1 caso necesita atención"
              : `${data.count} casos necesitan atención`}
          </p>
          <p className="text-xs text-amber-800 leading-relaxed">
            Cada caso es una inscripción. Si alguien lleva dos cursos, puede
            aparecer en uno y no en el otro.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {(data.items || []).slice(0, 5).map((s: any) => (
          // V3.9.52 — La clave es la MATRÍCULA, no el estudiante.
          //
          // Un estudiante puede llevar dos cursos y aparecer dos veces (una
          // por cada matrícula, con distinto motivo). Con `student_id` como
          // key, React colapsaría las dos filas en una y se perdería un
          // caso de riesgo sin que nadie lo notara.
          <div key={s.enrollment_id || s.student_id}
               className="bg-white rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-semibold text-slate-800 flex-1 min-w-[110px]">
                {s.name}
              </span>
              {/* Qué curso, para no confundir dos filas con un duplicado */}
              {s.course_name && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {s.course_name}
                </span>
              )}
              {s.level_code && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                  {s.level_code}
                </span>
              )}
              {paraAdmin && s.phone && (
                <button
                  onClick={() => escribir(s)}
                  title="Escribirle por WhatsApp"
                  className="text-emerald-600 hover:text-emerald-700 p-1"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(s.señales || []).map((sig: any, i: number) => (
                <span key={i}
                      className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  {sig.texto}
                </span>
              ))}
            </div>
          </div>
        ))}
        {data.count > 5 && (
          <p className="text-[11px] text-amber-700 px-1">y {data.count - 5} más...</p>
        )}
      </div>

      {data.reglas && (
        <p className="text-[10px] text-amber-700 mt-3 leading-relaxed">
          Criterio: {data.reglas.ausencias_seguidas}+ ausencias seguidas ·
          {" "}{data.reglas.tareas_sin_entregar}+ tareas sin entregar ·
          {" "}promedio bajo {data.reglas.promedio_minimo} ·
          {" "}{data.reglas.dias_sin_actividad}+ días sin actividad
        </p>
      )}
    </div>
  );
}
