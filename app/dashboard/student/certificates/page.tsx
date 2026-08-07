"use client";
import { useEffect, useState } from "react";
import { studentApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader } from "@/components/ui";
import CertificadoImprimible from "@/components/CertificadoImprimible";  // V3.9.28

export default function MyCertificatesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [viendo, setViendo] = useState<any>(null);  // certificado abierto

  useEffect(() => {
    studentApi.certificates()
      .then(d => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      {viendo && <CertificadoImprimible cert={viendo} onClose={() => setViendo(null)} />}
      <PageHeader title="Mis certificados" subtitle={`${items.length} certificados obtenidos`} />
      {items.length === 0 ? <EmptyState icon="🎓" title="Aún no tienes certificados" description="Completa un curso para obtener tu primer certificado." /> : (
        <div className="space-y-4">
          {items.map((c: any) => (
            <div key={c.id} className="rounded-2xl overflow-hidden shadow-lg"
                 style={{ background: `linear-gradient(135deg, ${c.color || '#4361ee'} 0%, #7c3aed 100%)` }}>
              <div className="p-6 md:p-8 text-white flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Certificado oficial</p>
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">{c.course_name}</h3>
                  <p className="text-sm opacity-80 mb-3">Nivel {c.level_code} — {c.level_name}</p>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <span>📅 {new Date(c.issued_at).toLocaleDateString("es")}</span>
                    <span>⏱ {c.hours} horas</span>
                    {c.final_grade && <span>📊 Promedio: {c.final_grade}%</span>}
                  </div>
                  <p className="text-xs font-mono mt-3 opacity-70">{c.code}</p>
                </div>
                <button
                  onClick={() => setViendo(c)}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur px-5 py-2.5 rounded-lg text-sm font-bold transition whitespace-nowrap"
                >
                  Ver certificado →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
