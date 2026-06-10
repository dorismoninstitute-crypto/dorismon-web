"use client";
import { useEffect, useState } from "react";
import { placement, getLevelTheme } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Badge } from "@/components/ui";

export default function MyPlacementPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    placement.myResult()
      .then((d: any) => { setData(d); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  // Sin nivel asignado y sin test
  if (!data || !data.completed) {
    return (
      <>
        <PageHeader title="Mi nivel" />
        <Card>
          <CardBody className="text-center py-12">
            <div className="text-5xl mb-3">🎯</div>
            <p className="text-slate-600 mb-2">Aún no tenés un nivel asignado.</p>
            <p className="text-sm text-slate-500">Hacé el test de nivel para conocer tu CEFR estimado.</p>
          </CardBody>
        </Card>
      </>
    );
  }

  const theme = getLevelTheme(data.suggested_level_code);
  // V1.4.1: distinguir caso "asignado por admin" vs "hizo test"
  const assignedByAdmin = data.assigned_by_admin === true || !data.has_test;

  return (
    <>
      <PageHeader
        title="Mi nivel"
        subtitle={
          data.completed_at
            ? `Test completado el ${new Date(data.completed_at).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}`
            : assignedByAdmin ? "Nivel asignado por el coordinador" : undefined
        }
      />

      <Card className="mb-6 overflow-hidden">
        <div className={`${theme.bg} p-6 md:p-8 text-center relative`} style={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1 text-white">Tu nivel</p>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-1 text-white">{data.suggested_level_code}</h1>
          <p className="text-lg md:text-xl font-semibold text-white">{data.suggested_level_name}</p>
        </div>
        <CardBody>
          {assignedByAdmin ? (
            // Caso: nivel asignado por admin sin test propio
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
              <p className="font-bold mb-2">📋 Nivel asignado por el coordinador</p>
              <p>
                Tu nivel actual fue asignado directamente por un coordinador, basado en tu entrevista o experiencia previa.
                Si querés tener un detalle de scores por destrezas, podés solicitar hacer el test de nivel hablando con tu coordinador.
              </p>
            </div>
          ) : (
            // Caso: hizo el test
            <>
              <h3 className="font-bold mb-3 text-sm uppercase tracking-wider text-slate-500">Destrezas evaluadas</h3>
              <div className="space-y-2 mb-6">
                {[
                  { label: "Grammar", value: data.grammar_score },
                  { label: "Reading Comprehension", value: data.reading_score },
                ].map(d => (
                  <div key={d.label} className="flex items-center gap-3">
                    <span className="text-xs md:text-sm w-32 md:w-40 font-semibold">{d.label}</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${theme.bg}`} style={{ width: `${d.value || 0}%` }} />
                    </div>
                    <span className="text-xs w-12 text-right font-bold">
                      {d.value !== null && d.value !== undefined ? `${Math.round(d.value)}%` : "—"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900 leading-relaxed">
                  📝 Las destrezas de <strong>Listening</strong>, <strong>Speaking</strong> y <strong>Writing</strong> se evalúan
                  en una entrevista con tu coordinador, quien confirmará tu nivel final.
                </p>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </>
  );
}
