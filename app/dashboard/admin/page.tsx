"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, adminInsights, adminCertCandidates, safeObj, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, StatCard, Badge, Button } from "@/components/ui";
import AlertasAdmin from "@/components/AlertasAdmin";  // V3.9.30
import SinHorarioAviso from "@/components/SinHorarioAviso";  // V3.9.36
import { EstudiantesEnRiesgo } from "@/components/PanelSeguimiento";  // V3.9.49
import { Award, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [finance, setFinance] = useState<any>(null);
  const [atRisk, setAtRisk] = useState<any[]>([]);
  const [certCandidates, setCertCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    Promise.all([
      adminApi.dashboard(),
      adminApi.financeSummary(),
      adminInsights.atRiskStudents().catch(() => []),
      adminCertCandidates.list().catch(() => []),
    ])
      .then(([d, f, a, c]) => {
        setData(d);
        setFinance(f);
        setAtRisk(safeArray(a));
        setCertCandidates(safeArray(c));
        setLoading(false);
      })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err.includes("403") ? "Necesitas rol admin" : err} />;
  const d = safeObj(data, {}) as any;
  const stats = safeObj(d.stats, {}) as any;
  const f = safeObj(finance, {}) as any;

  return (
    <>
      <PageHeader title="Panel administrativo" subtitle="Resumen ejecutivo de Dorismon" />

      {/* V1.6.4: Banner para cargar plantilla si NO hay módulos */}
      {/* V3.9.30: alertas que SÍ se pueden resolver */}
      <AlertasAdmin />
      <SinHorarioAviso />
      <EstudiantesEnRiesgo paraAdmin />

      {stats.total_modules === 0 && (
        <Card className="mb-4 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardBody>
            <div className="flex items-start gap-3">
              <div className="text-3xl flex-shrink-0">📚</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-amber-900 mb-1">Tu sistema todavía no tiene módulos cargados</h3>
                <p className="text-sm text-amber-800 mb-3">
                  Para que el progreso de los estudiantes avance al tomar asistencia, las clases deben estar vinculadas a módulos.
                  Puedes cargar una <strong>plantilla pre-hecha</strong> con módulos típicos por nivel CEFR (A1, A2, B1, B2, C1, C2) y editarlos después.
                </p>
                <Link href="/dashboard/admin/content">
                  <Button size="sm">
                    📚 Ir a Contenido y cargar plantilla
                  </Button>
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* V1.6.3: Banner candidatos a certificación */}
      {certCandidates.length > 0 && (
        <Card className="mb-4 border-emerald-200 bg-gradient-to-br from-emerald-50 to-accent-50">
          <CardBody>
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 bg-emerald-600 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                <Award size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-emerald-900 mb-1">
                  🎓 {certCandidates.length} {certCandidates.length === 1 ? "estudiante listo" : "estudiantes listos"} para certificar
                </h3>
                <p className="text-sm text-emerald-800 mb-3">
                  Completaron todos los módulos y tienen buena asistencia. Emití sus certificados con 1 click.
                </p>
                <Link href="/dashboard/admin/certification-ready">
                  <Button size="sm" variant="primary">
                    Ver candidatos
                    <ArrowRight size={14} className="inline ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* V1.5.1: Banner asignación de profesores */}
      {(stats.unassigned_students > 0 || stats.teachers_without_students > 0) && (
        <Card className="mb-4 border-blue-200 bg-blue-50">
          <CardBody>
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">🔄</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-blue-900 mb-1">Asignación de profesores</h3>
                <p className="text-sm text-blue-800 mb-3">
                  {stats.unassigned_students > 0 && (
                    <span>
                      <strong>{stats.unassigned_students}</strong> {stats.unassigned_students === 1 ? "estudiante" : "estudiantes"} sin profesor asignado.
                    </span>
                  )}
                  {stats.unassigned_students > 0 && stats.teachers_without_students > 0 && " · "}
                  {stats.teachers_without_students > 0 && (
                    <span>
                      <strong>{stats.teachers_without_students}</strong> {stats.teachers_without_students === 1 ? "profesor" : "profesores"} sin estudiantes.
                    </span>
                  )}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {stats.unassigned_students > 0 && (
                    <Button size="sm" onClick={async () => {
                      const adminAssign = (await import("@/lib/api")).adminAssign;
                      const { showToast } = await import("@/components/ui");
                      try {
                        const r: any = await adminAssign.autoAssign();
                        showToast("success", `${r.assigned} estudiantes auto-asignados. ${r.skipped} sin profe disponible.`);
                        setTimeout(() => location.reload(), 1500);
                      } catch (e: any) { showToast("error", e.message); }
                    }}>
                      🪄 Auto-asignar profesores
                    </Button>
                  )}
                  <Link href="/dashboard/admin/enrollments">
                    <Button size="sm" variant="outline">Asignar manualmente</Button>
                  </Link>
                  <Link href="/dashboard/admin/users?role=teacher">
                    <Button size="sm" variant="outline">Configurar niveles de profes</Button>
                  </Link>
                </div>

                {/* V2.3: Lista de profes sin alumnos (si los hay) */}
                {stats.teachers_without_students_list && stats.teachers_without_students_list.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-xs font-bold text-blue-900 mb-2">📋 Profesores sin estudiantes asignados:</p>
                    <div className="space-y-1">
                      {stats.teachers_without_students_list.map((t: any) => (
                        <div key={t.user_id} className="flex items-center gap-2 text-xs">
                          <span className="w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold">
                            {t.full_name?.[0]?.toUpperCase() || "?"}
                          </span>
                          <span className="font-semibold text-blue-900">{t.full_name}</span>
                          <span className="text-blue-700">·</span>
                          <span className="text-blue-700">{t.email}</span>
                          {t.modalities && (
                            <span className="text-blue-600">· {t.modalities}</span>
                          )}
                          {t.levels_taught && (
                            <span className="text-blue-600">· Niveles: {t.levels_taught}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Estudiantes" value={stats.total_students} icon="🎓" color="brand" />
        <StatCard label="Profesores" value={stats.total_teachers} icon="👨‍🏫" color="success" />
        <StatCard label="Cursos activos" value={stats.total_courses} icon="📚" color="info" />
        <StatCard label="Clases semana" value={stats.scheduled_classes} icon="📅" color="warning" />
      </div>

      {/* V3.9.31 — El bloque viejo de "Estudiantes en riesgo" se eliminó.
          Era el que nunca se podía quitar: mostraba la lista pero sin forma
          de resolverla. Ahora esa información vive en <AlertasAdmin />, con
          botón de WhatsApp y "Ya lo manejé". */}

      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        <Card>
          <CardBody>
            <h3 className="font-bold mb-4">💰 Finanzas</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-600">Ingresos del mes</span>
                <span className="text-2xl font-bold text-emerald-600">${f.income_month?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-600">Ingresos del año</span>
                <span className="text-xl font-bold">${f.income_year?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-600">Pagos pendientes</span>
                <span className="text-xl font-bold text-amber-600">${f.pending_amount?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Suscripciones activas</span>
                <span className="text-xl font-bold text-brand-600">{f.active_subscriptions || 0}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="font-bold mb-4">📊 Métricas operativas</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-600">Nuevos estudiantes este mes</span>
                <span className="text-xl font-bold text-brand-600">{stats.new_students_month}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-600">Pagos pendientes</span>
                <span className="text-xl font-bold text-amber-600">{stats.pending_payments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Certificados emitidos</span>
                <span className="text-xl font-bold text-emerald-600">{stats.certificates_issued}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/dashboard/admin/users", icon: "👥", label: "Usuarios" },
          { href: "/dashboard/admin/sessions", icon: "🗓", label: "Programar clase" },
          { href: "/dashboard/admin/enrollments", icon: "📋", label: "Inscribir alumno" },
          { href: "/dashboard/admin/certificates", icon: "🎓", label: "Emitir certificado" },
        ].map(l => (
          <Link key={l.href} href={l.href}>
            <Card className="hover:shadow-md transition cursor-pointer">
              <CardBody className="text-center py-6">
                <div className="text-3xl mb-2">{l.icon}</div>
                <p className="font-semibold text-sm">{l.label}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
