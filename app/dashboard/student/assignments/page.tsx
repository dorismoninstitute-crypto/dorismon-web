"use client";
import { useEffect, useState } from "react";
import { studentApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Textarea, SuccessBox } from "@/components/ui";

export default function StudentAssignmentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    studentApi.assignments()
      .then(d => { setItems(safeArray(d)); setLoading(false); })
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

                {open === a.id && (
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <Textarea
                      label="Tu respuesta"
                      placeholder="Escribí tu tarea acá..."
                      value={content}
                      onChange={(e: any) => setContent(e.target.value)}
                    />
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
