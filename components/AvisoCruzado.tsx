"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ArrowRight, FileQuestion, ClipboardList } from "lucide-react";

/**
 * V3.9.42 — Aviso cruzado entre Tareas y Quizzes.
 *
 * EL PROBLEMA: el estudiante tiene dos menús separados. Si solo entra a uno,
 * no se entera de lo que tiene pendiente en el otro. Con ocho tipos de tarea
 * distintos, el quiz es en realidad "uno más" y no debería vivir aparte.
 *
 * Esto es el arreglo rápido y sin riesgo: desde cada pantalla se ve si hay
 * algo pendiente en la otra. La unificación completa en "Mis actividades"
 * queda para cuando la plataforma esté probada y tranquila.
 */
export default function AvisoCruzado({ desde }: { desde: "tareas" | "quizzes" }) {
  const [pendientes, setPendientes] = useState(0);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const ruta = desde === "tareas" ? "/student/quizzes" : "/student/assignments";
    api(ruta, { auth: true })
      .then((r: any) => {
        const lista = Array.isArray(r) ? r : (r?.items || []);
        // Solo cuenta lo que todavía no ha hecho
        const sinHacer = lista.filter((x: any) => {
          if (desde === "tareas") {
            // Quizzes: pendiente si aún puede intentarlo
            return !x.passed && (x.attempts_left == null || x.attempts_left > 0);
          }
          // Tareas: pendiente si no la ha entregado
          return !x.submitted_at && !x.score;
        }).length;
        setPendientes(sinHacer);
      })
      .catch(() => setPendientes(0))
      .finally(() => setListo(true));
  }, [desde]);

  if (!listo || pendientes === 0) return null;

  const esTareas = desde === "tareas";
  const destino = esTareas ? "/dashboard/student/quizzes" : "/dashboard/student/assignments";
  const Icono = esTareas ? FileQuestion : ClipboardList;
  const texto = esTareas
    ? (pendientes === 1 ? "También tienes 1 quiz pendiente" : `También tienes ${pendientes} quizzes pendientes`)
    : (pendientes === 1 ? "También tienes 1 tarea pendiente" : `También tienes ${pendientes} tareas pendientes`);

  return (
    <Link
      href={destino}
      className="flex items-center gap-3 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 mb-5 hover:border-sky-300 transition"
    >
      <Icono className="w-5 h-5 text-sky-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-sky-900">{texto}</p>
        <p className="text-xs text-sky-700">Toca aquí para verlos</p>
      </div>
      <ArrowRight className="w-4 h-4 text-sky-600 flex-shrink-0" />
    </Link>
  );
}
