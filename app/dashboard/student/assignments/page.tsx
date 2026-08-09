"use client";
import { useEffect, useState, useRef } from "react";
import { studentApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Textarea, SuccessBox, PlanLockedCard, showToast } from "@/components/ui";
import ArchivoAdjunto from "@/components/ArchivoAdjunto";  // V3.9.30

export default function StudentAssignmentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [blockedByPlan, setBlockedByPlan] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [content, setContent] = useState("");
  // V3.9.30 — entrega con archivo
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const [subiendo, setSubiendo] = useState<any>(null);
  const subirArchivo = async (id: any, file?: File | null) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      showToast("error", "El archivo es muy pesado. El máximo son 20 MB.");
      return;
    }
    setSubiendo(id);
    try {
      await studentApi.uploadAssignmentFile(id, file);
      showToast("success", "✅ Archivo entregado");
      load();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setSubiendo(null);
      if (fileInputs.current[id]) fileInputs.current[id]!.value = "";
    }
  };
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    studentApi.assignments()
      .then((d: any) => {
        // V2.9: el endpoint devuelve {items, blocked_by_plan}
        const list = Array.isArray(d) ? d : safeArray(d?.items);
        setItems(list);
        setBlockedByPlan(!!d?.blocked_by_plan);
        setLoading(false);
      })
      .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const submit = async (id: number) => {
    setMsg("");
    try {
      await studentApi.submitAssignment(id, { content });
      setMsg("✓ Tarea entregada");
      setContent(""); setOpen(null);
      load();
    } catch (e: any) { setMsg("✗ " + e.message); }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  // V2.9: Si el plan no incluye tareas → mostrar candado
  if (blockedByPlan) {
    return (
      <>
        <PageHeader title="Mis tareas" subtitle="Tareas y ejercicios" />
        <PlanLockedCard
          title="Las tareas no están en tu plan"
          message="Las tareas con feedback del profesor están disponibles a partir del plan Professional. Mejora tu plan para acceder."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Mis tareas" subtitle={`${items.length} tareas asignadas`} />
      {msg.startsWith("✓") && <div className="mb-4"><SuccessBox message={msg} /></div>}
      {msg.startsWith("✗") && <div className="mb-4"><ErrorBox message={msg.slice(2)} /></div>}

      {items.length === 0 ? <EmptyState icon="📝" title="Sin tareas pendientes" /> : (
        <div className="space-y-3">
          {items.map((a: any) => (
            <Card key={a.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {a.graded ? (
                        <Badge variant="success">Calificada: {a.score}/{a.max_score}</Badge>
                      ) : a.submitted ? (
                        <Badge variant="warning">Entregada</Badge>
                      ) : (
                        <Badge variant="default">Pendiente</Badge>
                      )}
                      {a.due_at && (
                        <Badge variant="info">
                          Vence: {new Date(a.due_at).toLocaleDateString("es")}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-bold text-base">{a.title}</h3>
                    {a.description && <p className="text-sm text-slate-600 mt-1">{a.description}</p>}
                  </div>
                  {!a.submitted && (
                    <Button onClick={() => setOpen(open === a.id ? null : a.id)}>
                      {open === a.id ? "Cerrar" : "Entregar"}
                    </Button>
                  )}
                </div>

                {a.instructions && (
                  <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 whitespace-pre-line mb-3">
                    {a.instructions}
                  </div>
                )}

                {/* V3.9.30: si ya entregó un archivo, lo ve aquí mismo */}
                {a.file_url && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-500 mb-2">Tu entrega:</p>
                    <ArchivoAdjunto url={a.file_url} nombre={a.file_name} />
                  </div>
                )}

                {open === a.id && (
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <Textarea
                      label="Tu respuesta"
                      placeholder="Escribí tu tarea acá..."
                      value={content}
                      onChange={(e: any) => setContent(e.target.value)}
                    />

                    {/* V3.9.30 — Entregar como archivo, foto o audio */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <p className="text-xs font-semibold text-slate-600 mb-2">
                        O adjunta un archivo
                      </p>
                      <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                        Foto de tu hoja, PDF o una grabación de audio (para practicar
                        pronunciación). Máximo 20 MB.
                      </p>
                      <input
                        ref={(el) => { fileInputs.current[a.id] = el; }}
                        type="file"
                        accept="image/*,application/pdf,audio/*"
                        className="hidden"
                        onChange={(e) => subirArchivo(a.id, e.target.files?.[0])}
                      />
                      <button
                        onClick={() => fileInputs.current[a.id]?.click()}
                        disabled={subiendo === a.id}
                        className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-lg transition disabled:opacity-50"
                      >
                        📎 {subiendo === a.id ? "Subiendo..." : "Elegir archivo"}
                      </button>
                    </div>

                    <Button onClick={() => submit(a.id)} disabled={!content.trim()}>
                      Enviar entrega
                    </Button>
                  </div>
                )}

                {a.feedback && (
                  <div className="mt-3 bg-brand-50 border-l-4 border-brand-500 rounded p-3">
                    <p className="text-xs font-bold text-brand-700 mb-1">Feedback del profesor:</p>
                    <p className="text-sm text-slate-700">{a.feedback}</p>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
