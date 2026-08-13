"use client";
import { useEffect, useState } from "react";
import { api, studentApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, showToast } from "@/components/ui";
import { RotateCcw, Calendar, Clock, Check, X, AlertCircle } from "lucide-react";

/**
 * V3.9.36 — "Reponer una clase" (lado del estudiante).
 *
 * Si perdió una clase (o el profesor no llegó), pide reponerla en otra
 * fecha. El instituto revisa y agenda. Su horario normal no se toca.
 */

const ESTADOS: Record<string, { cls: string; Icono: any }> = {
  pending: { cls: "bg-amber-50 border-amber-200 text-amber-900", Icono: Clock },
  scheduled: { cls: "bg-emerald-50 border-emerald-200 text-emerald-900", Icono: Check },
  rejected: { cls: "bg-slate-50 border-slate-200 text-slate-600", Icono: X },
};

function fecha(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es", {
    weekday: "long", day: "numeric", month: "long",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export default function ReponerClasePage() {
  const [pedidas, setPedidas] = useState<any[]>([]);
  const [pasadas, setPasadas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [pidiendo, setPidiendo] = useState<any>(null);
  const [motivo, setMotivo] = useState("");
  const [quienFalto, setQuienFalto] = useState("student");
  const [preferencia, setPreferencia] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const cargar = async () => {
    try {
      const [mis, asis] = await Promise.all([
        api("/student/makeup-requests", { auth: true }),
        studentApi.attendance().catch(() => null),
      ]);
      setPedidas(mis?.items || []);
      // Las clases a las que faltó, que son las que puede reponer
      const lista = safeArray((asis as any)?.items || asis);
      setPasadas(lista.filter((a: any) => a.state === "absent").slice(0, 12));
      setErr("");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const pedir = async () => {
    if (!motivo.trim()) {
      showToast("error", "Cuéntanos brevemente qué pasó");
      return;
    }
    setOcupado(true);
    try {
      await api(`/student/sessions/${pidiendo.session_id}/request-makeup`, {
        method: "POST", auth: true,
        body: {
          reason: motivo.trim(),
          missed_by: quienFalto,
          preferred_date: preferencia.trim() || undefined,
        },
      });
      showToast("success", "✅ Solicitud enviada. Te avisaremos con la fecha.");
      setPidiendo(null);
      setMotivo("");
      setPreferencia("");
      await cargar();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setOcupado(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  const yaPedidas = new Set(pedidas.map((p) => p.original_title));

  return (
    <div>
      <PageHeader
        title="Reponer una clase"
        subtitle="¿Perdiste una clase? Pide reponerla en otra fecha."
      />

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6 text-xs text-blue-800 leading-relaxed">
        💡 Tu horario normal <strong>no cambia</strong>. La reposición se agrega como una
        clase extra en la fecha que acordemos.
      </div>

      {/* Lo que ya pidió */}
      {pedidas.length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold text-slate-800 mb-3">Tus solicitudes</h2>
          <div className="space-y-2">
            {pedidas.map((p) => {
              const e = ESTADOS[p.status] || ESTADOS.pending;
              return (
                <div key={p.id} className={`border rounded-xl p-4 ${e.cls}`}>
                  <div className="flex items-start gap-2 mb-1">
                    <e.Icono className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold">{p.status_label}</p>
                      <p className="text-xs opacity-80">
                        Clase perdida: {p.original_title}
                      </p>
                    </div>
                  </div>
                  {p.makeup_date && (
                    <p className="text-xs mt-2 bg-white/60 rounded-lg px-3 py-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Tu reposición es el <strong>{fecha(p.makeup_date)}</strong>
                    </p>
                  )}
                  {p.admin_note && p.status === "rejected" && (
                    <p className="text-xs mt-2 italic opacity-80">{p.admin_note}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Clases que puede reponer */}
      <h2 className="font-bold text-slate-800 mb-3">Clases a las que faltaste</h2>
      {pasadas.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500 text-center py-8">
              No tienes faltas registradas. ¡Sigue así! 🎉
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-2">
          {pasadas.map((a: any) => {
            const ya = yaPedidas.has(a.title);
            return (
              <Card key={a.session_id}>
                <CardBody className="py-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex-1 min-w-[150px]">
                      <p className="text-sm font-semibold text-slate-800">
                        {a.title}
                      </p>
                      <p className="text-xs text-slate-500">{fecha(a.starts_at_utc)}</p>
                    </div>
                    {ya ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        Ya la pediste
                      </span>
                    ) : (
                      <button
                        onClick={() => { setPidiendo({ ...a, session_id: a.session_id }); setMotivo(""); }}
                        className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Pedir reposición
                      </button>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Formulario */}
      {pidiendo && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPidiendo(null)}>
          <div className="bg-white rounded-2xl p-5 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-slate-800 mb-1">Pedir reposición</h3>
            <p className="text-xs text-slate-500 mb-4">{pidiendo.session_title}</p>

            <label className="block text-xs font-semibold text-slate-600 mb-2">
              ¿Qué pasó?
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => setQuienFalto("student")}
                className={`text-xs font-semibold p-2.5 rounded-lg border-2 transition ${
                  quienFalto === "student"
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                No pude asistir
              </button>
              <button
                onClick={() => setQuienFalto("teacher")}
                className={`text-xs font-semibold p-2.5 rounded-lg border-2 transition ${
                  quienFalto === "teacher"
                    ? "border-rose-400 bg-rose-50 text-rose-700"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                El profesor no llegó
              </button>
            </div>

            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              placeholder="Cuéntanos brevemente..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-3"
            />

            <label className="block text-xs font-semibold text-slate-600 mb-1">
              ¿Cuándo te vendría bien? (opcional)
            </label>
            <input
              value={preferencia}
              onChange={(e) => setPreferencia(e.target.value)}
              placeholder="Ej: sábado por la mañana"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-4"
            />

            <div className="bg-slate-50 rounded-lg px-3 py-2 mb-4 flex gap-2">
              <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Revisamos tu solicitud y te avisamos con la fecha. Puede tardar un poco.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={pedir}
                disabled={ocupado || !motivo.trim()}
                className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition"
              >
                {ocupado ? "Enviando..." : "Enviar solicitud"}
              </button>
              <button
                onClick={() => setPidiendo(null)}
                className="border border-slate-200 text-slate-600 text-sm px-4 py-2.5 rounded-lg hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
