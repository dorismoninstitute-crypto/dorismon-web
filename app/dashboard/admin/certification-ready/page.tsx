"use client";
import { useEffect, useState } from "react";
import { adminCertCandidates, safeArray, getLevelTheme } from "@/lib/api";
import { LoadingScreen, ErrorBox, EmptyState, PageHeader, Card, CardBody, Badge, Button, Modal, Input, showToast } from "@/components/ui";
import Avatar from "@/components/Avatar";
import { GraduationCap, CheckCircle2, Award, TrendingUp, BookOpen } from "lucide-react";

export default function CertificationReadyPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [issuing, setIssuing] = useState<any>(null);
  const [form, setForm] = useState({ final_grade: 80, hours_completed: 60 });

  const load = () => {
    setLoading(true);
    adminCertCandidates.list()
      .then((d: any) => { setItems(safeArray(d)); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openIssue = (c: any) => {
    setIssuing(c);
    setForm({ final_grade: 80, hours_completed: 60 });
  };

  const doIssue = async () => {
    if (!issuing) return;
    try {
      const r: any = await adminCertCandidates.issue(issuing.enrollment_id, form);
      showToast("success", `🎓 Certificado emitido: ${r.code}`);
      setIssuing(null);
      load();
    } catch (e: any) {
      showToast("error", e.message);
    }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader
        title="Listos para certificar"
        subtitle="Estudiantes que cumplen criterios para recibir su certificado"
      />

      {items.length === 0 ? (
        <EmptyState
          icon="🎓"
          title="Ningún candidato por ahora"
          description="Cuando un estudiante complete todos sus módulos y tenga ≥70% de asistencia, aparecerá aquí."
        />
      ) : (
        <>
          <Card className="mb-4 border-emerald-200 bg-emerald-50">
            <CardBody>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                  <Award size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-emerald-900">
                    {items.length} {items.length === 1 ? "estudiante listo" : "estudiantes listos"} para certificar
                  </h3>
                  <p className="text-sm text-emerald-800">
                    Estos estudiantes completaron todos los módulos de su nivel y tienen buena asistencia.
                    Revisá y emití su certificado con 1 click.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="space-y-3">
            {items.map((c: any) => {
              const theme = getLevelTheme(c.level_code);
              return (
                <Card key={c.enrollment_id}>
                  <CardBody>
                    <div className="flex items-start gap-3">
                      <Avatar name={c.student_name} gender={c.gender} size="lg" ring />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-bold text-slate-900">{c.student_name}</p>
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${theme.bg} text-white`}>
                            {c.level_code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{c.student_email}</p>
                        <p className="text-xs text-slate-500 mt-1">{c.course_name} · {c.level_name}</p>

                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div className="bg-slate-50 rounded-lg p-2">
                            <div className="flex items-center gap-1 text-xs text-slate-500 mb-0.5">
                              <BookOpen size={12} />
                              <span>Módulos</span>
                            </div>
                            <p className="font-bold text-slate-900 text-sm">
                              {c.modules_completed}/{c.total_modules}
                              <span className="text-emerald-600 ml-1">✓</span>
                            </p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2">
                            <div className="flex items-center gap-1 text-xs text-slate-500 mb-0.5">
                              <TrendingUp size={12} />
                              <span>Asistencia</span>
                            </div>
                            <p className="font-bold text-slate-900 text-sm">
                              {c.attendance_pct !== null ? `${c.attendance_pct}%` : "Sin registros"}
                              {c.attendance_pct !== null && c.attendance_pct >= 70 && <span className="text-emerald-600 ml-1">✓</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                      <Button size="sm" onClick={() => openIssue(c)} className="flex-1 md:flex-none">
                        <GraduationCap size={14} className="inline mr-1" />
                        Emitir certificado
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Modal emitir */}
      <Modal open={!!issuing} onClose={() => setIssuing(null)} title={`Emitir certificado: ${issuing?.student_name || ""}`}>
        <div className="space-y-3">
          <div className="bg-brand-50 border border-brand-200 rounded-lg p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-700 mb-1">Detalles</p>
            <p className="text-sm text-brand-900">
              <strong>{issuing?.course_name}</strong> · Nivel <strong>{issuing?.level_code}</strong> ({issuing?.level_name})
            </p>
            <p className="text-xs text-brand-700 mt-1">
              Módulos: {issuing?.modules_completed}/{issuing?.total_modules} · Asistencia: {issuing?.attendance_pct}%
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              label="Nota final (0-100)"
              value={form.final_grade}
              onChange={(e: any) => setForm({ ...form, final_grade: parseFloat(e.target.value) })}
              step="1"
              min="0"
              max="100"
            />
            <Input
              type="number"
              label="Horas completadas"
              value={form.hours_completed}
              onChange={(e: any) => setForm({ ...form, hours_completed: parseInt(e.target.value) })}
              min="0"
            />
          </div>
          <p className="text-xs text-slate-500">
            💡 El sistema generará un código único verificable y notificará al estudiante automáticamente.
          </p>
          <Button onClick={doIssue} className="w-full" size="lg">
            <Award size={16} className="inline mr-1.5" />
            Emitir certificado
          </Button>
        </div>
      </Modal>
    </>
  );
}
