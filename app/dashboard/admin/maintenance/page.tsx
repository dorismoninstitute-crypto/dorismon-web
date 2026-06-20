"use client";
import { useState } from "react";
import { adminHelpers } from "@/lib/api";
import { PageHeader, Card, CardBody, Button, showToast } from "@/components/ui";

export default function MaintenancePage() {
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [done, setDone] = useState<any>(null);

  const runDryRun = async () => {
    setLoading(true);
    setDone(null);
    try {
      const r = await adminHelpers.cleanDataDryRun();
      setPreview(r);
    } catch (e: any) {
      showToast("error", e.message || "Error al simular");
    } finally {
      setLoading(false);
    }
  };

  const execute = async () => {
    if (confirmText !== "BORRAR DATOS DE PRUEBA") {
      showToast("error", "Escribe exactamente: BORRAR DATOS DE PRUEBA");
      return;
    }
    setExecuting(true);
    try {
      const r = await adminHelpers.cleanDataExecute();
      setDone(r);
      setPreview(null);
      setConfirmText("");
      showToast("success", "Limpieza completada");
    } catch (e: any) {
      showToast("error", e.message || "Error al limpiar");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Mantenimiento"
        subtitle="Herramientas avanzadas — usar con cuidado"
      />

      {/* Advertencia */}
      <Card className="mb-4 border-2 border-amber-300 bg-amber-50">
        <CardBody>
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-amber-900">Empezar producción en limpio</p>
              <p className="text-sm text-amber-800 mt-1">
                Esta herramienta borra los datos <strong>operativos de prueba</strong> (clases,
                inscripciones, asistencias, pagos a profesores, comprobantes) para empezar con
                el sistema limpio.
              </p>
              <p className="text-sm text-amber-800 mt-2">
                <strong>Se conservan:</strong> usuarios, perfiles, resultados de placement,
                niveles asignados, cursos, planes, sedes y aulas.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Paso 1: Simular */}
      <Card className="mb-4">
        <CardBody>
          <p className="font-bold text-slate-900 mb-1">Paso 1 — Ver qué se borraría</p>
          <p className="text-sm text-slate-600 mb-3">
            Primero simula (no borra nada) para ver el conteo exacto.
          </p>
          <Button onClick={runDryRun} loading={loading} variant="outline">
            Simular limpieza
          </Button>

          {preview && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900 mb-2">
                Se borrarían {preview.total_records_to_delete} registros:
              </p>
              <ul className="space-y-1">
                {preview.detail
                  .filter((d: any) => d.registros > 0)
                  .map((d: any, i: number) => (
                    <li key={i} className="text-sm text-slate-700 flex justify-between">
                      <span>{d.tabla}</span>
                      <span className="font-mono font-bold">{d.registros}</span>
                    </li>
                  ))}
                {preview.detail.every((d: any) => d.registros === 0) && (
                  <li className="text-sm text-slate-500">
                    No hay datos operativos para borrar. El sistema ya está limpio.
                  </li>
                )}
              </ul>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Paso 2: Ejecutar */}
      {preview && preview.total_records_to_delete > 0 && (
        <Card className="mb-4 border-2 border-red-300">
          <CardBody>
            <p className="font-bold text-red-900 mb-1">Paso 2 — Confirmar y borrar</p>
            <p className="text-sm text-slate-600 mb-3">
              Esta acción <strong>no se puede deshacer</strong>. Para confirmar, escribe exactamente:
              <br />
              <code className="bg-slate-100 px-2 py-0.5 rounded text-red-700 font-bold">
                BORRAR DATOS DE PRUEBA
              </code>
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Escribe la frase de confirmación"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-3"
            />
            <Button
              onClick={execute}
              loading={executing}
              disabled={confirmText !== "BORRAR DATOS DE PRUEBA"}
              className="bg-red-600 hover:bg-red-700"
            >
              Borrar datos de prueba ahora
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Resultado */}
      {done && (
        <Card className="border-2 border-emerald-300 bg-emerald-50">
          <CardBody>
            <p className="font-bold text-emerald-900">✅ {done.message}</p>
            <p className="text-sm text-emerald-800 mt-1">
              Total borrado: {done.total_deleted} registros. El sistema está limpio y listo.
            </p>
          </CardBody>
        </Card>
      )}
    </>
  );
}
