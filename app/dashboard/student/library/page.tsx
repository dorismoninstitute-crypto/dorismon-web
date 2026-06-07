"use client";
import { useEffect, useState } from "react";
import { studentApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Select } from "@/components/ui";

const TYPE_ICONS: any = { pdf: "📄", video: "📹", audio: "🎧", document: "📝", image: "🖼", link: "🔗" };

export default function LibraryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [filterType, setFilterType] = useState("");

  const load = () => {
    setLoading(true);
    studentApi.library({ type: filterType || undefined })
      .then(d => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, [filterType]);

  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader title="Biblioteca académica" subtitle="Materiales de estudio organizados por tipo" />

      <div className="mb-5 max-w-xs">
        <Select value={filterType} onChange={(e: any) => setFilterType(e.target.value)} label="Filtrar por tipo">
          <option value="">Todos los tipos</option>
          <option value="pdf">📄 PDF</option>
          <option value="video">📹 Video</option>
          <option value="audio">🎧 Audio</option>
          <option value="document">📝 Documento</option>
          <option value="link">🔗 Enlace</option>
        </Select>
      </div>

      {loading ? <LoadingScreen /> : items.length === 0 ? <EmptyState icon="📖" title="Sin materiales disponibles" /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((m: any) => (
            <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer" className="block group">
              <Card className="hover:shadow-md transition cursor-pointer group-hover:border-brand-300">
                <CardBody>
                  <div className="flex items-start gap-3 mb-2">
                    <div className="text-3xl">{TYPE_ICONS[m.type] || "📎"}</div>
                    <div className="flex-1 min-w-0">
                      <Badge variant="info" className="mb-1 uppercase">{m.type}</Badge>
                      <h3 className="font-bold text-sm truncate">{m.title}</h3>
                    </div>
                  </div>
                  {m.description && <p className="text-xs text-slate-500 line-clamp-2">{m.description}</p>}
                </CardBody>
              </Card>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
