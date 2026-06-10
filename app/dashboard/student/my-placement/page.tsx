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
  if (!data || !data.completed) {
    return (
      <>
        <PageHeader title="Mi resultado del test" />
        <Card>
          <CardBody className="text-center py-12">
            <div className="text-5xl mb-3">🎯</div>
            <p className="text-slate-600">Aún no completaste el test de nivel.</p>
          </CardBody>
        </Card>
      </>
    );
  }

  const theme = getLevelTheme(data.suggested_level_code);

  return (
    <>
      <PageHeader title="Mi resultado del test" subtitle={data.completed_at && `Completado el ${new Date(data.completed_at).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}`} />

      <Card className="mb-6 overflow-hidden">
        <div className={`${theme.bg} ${theme.heroText} p-8 text-center`}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1">Tu nivel</p>
          <h1 className="text-6xl font-extrabold tracking-tighter mb-1">{data.suggested_level_code}</h1>
          <p className="text-xl font-semibold">{data.suggested_level_name}</p>
        </div>
        <CardBody>
          <div className="grid grid-cols-2 gap-3 text-center mb-5">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Puntaje total</p>
              <p className="text-3xl font-bold text-brand-600">{Math.round(data.score_pct || 0)}%</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Correctas</p>
              <p className="text-3xl font-bold text-emerald-600">{data.correct_count}/{data.total_questions}</p>
            </div>
          </div>

          <h3 className="font-bold mb-3 text-sm uppercase tracking-wider text-slate-500">Destrezas evaluadas</h3>
          <div className="space-y-2 mb-6">
            {[
              { label: "Grammar", value: data.grammar_score },
              { label: "Reading Comprehension", value: data.reading_score },
            ].map(d => (
              <div key={d.label} className="flex items-center gap-3">
                <span className="text-sm w-40 font-semibold">{d.label}</span>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-600" style={{ width: `${d.value || 0}%` }} />
                </div>
                <span className="text-xs w-12 text-right font-bold">{d.value !== null && d.value !== undefined ? `${Math.round(d.value)}%` : "—"}</span>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900 leading-relaxed">
              📝 Las destrezas de <strong>Listening</strong>, <strong>Speaking</strong> y <strong>Writing</strong> se
              evaluarán en una entrevista con tu coordinador, quien confirmará tu nivel final.
            </p>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
