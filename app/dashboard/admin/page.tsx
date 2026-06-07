"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, safeObj } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, StatCard } from "@/components/ui";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [finance, setFinance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    Promise.all([adminApi.dashboard(), adminApi.financeSummary()])
      .then(([d, f]) => { setData(d); setFinance(f); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err.includes("403") ? "Necesitás rol admin" : err} />;
  const d = safeObj(data, {}) as any;
  const stats = safeObj(d.stats, {}) as any;
  const f = safeObj(finance, {}) as any;

  return (
    <>
      <PageHeader title="Panel administrativo" subtitle="Resumen ejecutivo de Dorismon" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Estudiantes" value={stats.total_students} icon="🎓" color="brand" />
        <StatCard label="Profesores" value={stats.total_teachers} icon="👨‍🏫" color="success" />
        <StatCard label="Cursos activos" value={stats.total_courses} icon="📚" color="info" />
        <StatCard label="Clases semana" value={stats.scheduled_classes} icon="📅" color="warning" />
      </div>

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

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/dashboard/admin/users", icon: "👥", label: "Usuarios" },
          { href: "/dashboard/admin/courses", icon: "📚", label: "Cursos" },
          { href: "/dashboard/admin/sessions", icon: "📅", label: "Clases" },
          { href: "/dashboard/admin/settings", icon: "⚙️", label: "Configuración" },
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
