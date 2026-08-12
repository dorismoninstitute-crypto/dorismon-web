"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, showToast } from "@/components/ui";
import { Users, Clock, UserPlus, X, AlertTriangle } from "lucide-react";

/**
 * V3.9.33 — Grupos y horarios.
 *
 * EL PROBLEMA QUE RESUELVE: antes el estudiante veía TODAS las clases de su
 * nivel. Con dos grupos de B1 (mañana y noche), a todos les aparecían los dos
 * horarios y no había forma de decir "María va al de la mañana".
 *
 * Ahora la serie de clases ES el grupo: se asigna al estudiante y solo ve las
 * clases de su grupo.
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
    const d = new Date(2000, 0, 1, Number(h), Number(m));
    hora = d.toLocaleTimeString("es", { hour: "numeric", minute: "2-digit", hour12: true });
  } catch { /* si viene raro, se muestra tal cual */ }
  return `${dias} · ${hora}`;
}

export default function GruposPage() {
  const [grupos, setGrupos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [miembros, setMiembros] = useState<Record<string, any[]>>({});
  const [sinGrupo, setSinGrupo] = useState<any[]>([]);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const cargar = async () => {
    try {
      const [g, e] = await Promise.all([
        api("/admin/groups", { auth: true }),
        api("/admin/enrollments", { auth: true }),
      ]);
      setGrupos(g?.items || []);
      const insc = e?.items || e || [];
      setSinGrupo(insc.filter((x: any) => x.is_active && !x.series_id));
      setErr("");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const verMiembros = async (id: string) => {
    if (abierto === id) { setAbierto(null); return; }
    setAbierto(id);
    if (miembros[id]) return;
    try {
      const r = await api(`/admin/groups/${id}/students`, { auth: true });
      setMiembros((p) => ({ ...p, [id]: r?.items || [] }));
    } catch { /* si falla, queda vacío */ }
  };

  const asignar = async (enrollmentId: string, seriesId: string, confirmar = false) => {
    setOcupado(enrollmentId);
    try {
      const r: any = await api(`/admin/enrollments/${enrollmentId}/assign-group`, {
        method: "POST", auth: true,
        body: { series_id: seriesId, ...(confirmar ? { confirm_full: true } : {}) },
      });
      showToast("success", seriesId ? `Asignado a ${r.group}` : "Sacado del grupo");
      setMiembros({});
      await cargar();
    } catch (e: any) {
      const d = e?.detail;
      if (e?.status === 409 && d?.necesita_confirmacion) {
        if (confirm(`${d.mensaje}`)) {
          await asignar(enrollmentId, seriesId, true);
          return;
        }
      } else {
        showToast("error", e.message);
      }
    } finally {
      setOcupado(null);
    }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <div>
      <PageHeader
        title="Grupos y horarios"
        subtitle="Cada estudiante ve solo las clases de su grupo, no todas las de su nivel."
      />

      {sinGrupo.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 text-sm">
                {sinGrupo.length === 1
                  ? "1 estudiante sin grupo asignado"
                  : `${sinGrupo.length} estudiantes sin grupo asignado`}
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                Están viendo <strong>todas</strong> las clases de su nivel. Asígnalos a su
                horario para que solo vean el suyo.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {sinGrupo.slice(0, 10).map((e: any) => {
              const compatibles = grupos.filter((g) => g.level_id === e.level_id);
              return (
                <div key={e.id} className="bg-white rounded-xl px-3 py-2.5 flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-[140px]">
                    <p className="text-sm font-semibold text-slate-800">{e.student_name}</p>
                    <p className="text-xs text-slate-500">Nivel {e.level_code}</p>
                  </div>
                  {compatibles.length === 0 ? (
                    <span className="text-xs text-slate-400">Sin grupos de su nivel</span>
                  ) : (
                    <select
                      disabled={ocupado === e.id}
                      onChange={(ev) => ev.target.value && asignar(e.id, ev.target.value)}
                      defaultValue=""
                      className="border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white"
                    >
                      <option value="">— Asignar a un grupo —</option>
                      {compatibles.map((g) => (
                        <option key={g.id} value={g.id} disabled={g.is_full}>
                          {g.name} · {horario(g)} {g.is_full ? "(lleno)" : `(${g.spots_left} libres)`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {grupos.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500 text-center py-10">
              Aún no hay grupos. Crea una serie de clases y se convierte en un grupo.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {grupos.map((g) => (
            <Card key={g.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800">{g.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {horario(g)}
                    </p>
                    {g.teacher_name && (
                      <p className="text-xs text-slate-500 mt-0.5">👨‍🏫 {g.teacher_name}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {g.level_code && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                        {g.level_code}
                      </span>
                    )}
                    <p className={`text-lg font-bold mt-1 ${g.is_full ? "text-rose-600" : "text-slate-700"}`}>
                      {g.students}/{g.capacity}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {g.is_full ? "Lleno" : `${g.spots_left} libres`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => verMiembros(g.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  <Users className="w-3.5 h-3.5" />
                  {abierto === g.id ? "Ocultar" : "Ver estudiantes"}
                </button>

                {abierto === g.id && (
                  <div className="mt-3 border-t border-slate-100 pt-3 space-y-1.5">
                    {(miembros[g.id] || []).length === 0 ? (
                      <p className="text-xs text-slate-400 py-2">Nadie asignado todavía</p>
                    ) : (
                      (miembros[g.id] || []).map((m: any) => (
                        <div key={m.enrollment_id} className="flex items-center gap-2 text-sm">
                          <span className="flex-1 text-slate-700 truncate">{m.name}</span>
                          <button
                            onClick={() => asignar(m.enrollment_id, "")}
                            disabled={ocupado === m.enrollment_id}
                            title="Sacar del grupo"
                            className="text-slate-300 hover:text-rose-500 p-1 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
