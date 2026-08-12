"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminStudentProfileApi } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Input, Select, Button, Badge, showToast } from "@/components/ui";
import QueVeElEstudiante from "@/components/QueVeElEstudiante";  // V3.9.35
import { ArrowLeft, User as UserIcon, MapPin, Heart, Shield, Info, Save } from "lucide-react";

const DOC_TYPES = [
  { v: "cedula", l: "Cédula" },
  { v: "pasaporte", l: "Pasaporte" },
  { v: "otro", l: "Otro" },
];

const RELATIONSHIPS = [
  { v: "padre", l: "Padre" },
  { v: "madre", l: "Madre" },
  { v: "hermano", l: "Hermano/a" },
  { v: "esposo", l: "Esposo/a" },
  { v: "tio", l: "Tío/a" },
  { v: "abuelo", l: "Abuelo/a" },
  { v: "amigo", l: "Amigo/a" },
  { v: "otro", l: "Otro" },
];

export default function AdminStudentProfilePage() {
  const params = useParams();
  const studentId = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState<any>({});
  // V3.9.9: cambio de nivel
  const [levels, setLevels] = useState<any[]>([]);
  const [showLevelChange, setShowLevelChange] = useState(false);
  const [newLevelId, setNewLevelId] = useState<string>("");
  const [levelReason, setLevelReason] = useState("");
  const [changingLevel, setChangingLevel] = useState(false);

  const load = () => {
    adminStudentProfileApi.get(studentId)
      .then((d: any) => {
        setProfile(d);
        setForm({
          birth_date: d.birth_date || "",
          document_type: d.document_type || "",
          document_number: d.document_number || "",
          address: d.address || "",
          city: d.city || "",
          sector: d.sector || "",
          nationality: d.nationality || "Dominicana",
          emergency_contact_name: d.emergency_contact_name || "",
          emergency_contact_relationship: d.emergency_contact_relationship || "",
          emergency_contact_phone: d.emergency_contact_phone || "",
          tutor_name: d.tutor_name || "",
          tutor_relationship: d.tutor_relationship || "",
          tutor_document: d.tutor_document || "",
          tutor_phone: d.tutor_phone || "",
          tutor_email: d.tutor_email || "",
          how_found_us: d.how_found_us || "",
          referred_by: d.referred_by || "",
          special_notes: d.special_notes || "",
        });
        setLoading(false);
      })
      .catch((e: any) => { setErr(e.message); setLoading(false); });
  };
  useEffect(load, [studentId]);

  // V3.9.9: cargar niveles disponibles para el cambio de nivel
  useEffect(() => {
    import("@/lib/api").then(({ adminApi }) => {
      adminApi.courses().then((cs: any) => {
        const courses = Array.isArray(cs) ? cs : (cs.items || []);
        if (courses[0]) {
          import("@/lib/api").then(({ api }) => {
            api(`/admin/levels-by-course/${courses[0].id}`, { auth: true }).then((lv: any) => {
              setLevels(Array.isArray(lv) ? lv : (lv.items || []));
            }).catch(() => {});
          });
        }
      }).catch(() => {});
    });
  }, []);

  // V3.9.9: cambiar el nivel del estudiante
  const doChangeLevel = async () => {
    if (!newLevelId) { showToast("error", "Selecciona un nivel"); return; }
    setChangingLevel(true);
    try {
      const { adminStudentProfileApi: apiSP } = await import("@/lib/api");
      const r: any = await apiSP.changeLevel(studentId, parseInt(newLevelId), levelReason);
      const enrollMsg = r.enrollments_updated > 0
        ? ` (${r.enrollments_updated} inscripción actualizada — el estudiante verá el nuevo nivel)`
        : " (⚠️ sin inscripción activa que actualizar — el estudiante debe estar inscrito para ver el cambio en sus clases)";
      showToast("success", `Nivel cambiado: ${r.old_level} → ${r.new_level}${enrollMsg}`);
      setShowLevelChange(false);
      setLevelReason("");
      setNewLevelId("");
      load();
    } catch (e: any) {
      showToast("error", e.message || "No se pudo cambiar el nivel");
    } finally {
      setChangingLevel(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await adminStudentProfileApi.update(studentId, form);
      showToast("success", "✓ Perfil actualizado");
      load();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <Link href="/dashboard/admin/users" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4">
        <ArrowLeft size={16} /> Volver a Usuarios
      </Link>

      <PageHeader
        title={`👤 ${profile?.full_name || "Perfil"}`}
        subtitle={`${profile?.email} ${profile?.is_minor ? "· MENOR DE EDAD" : ""}`}
      />

      {/* Resumen */}
      <Card className="mb-5">
        <CardBody>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Email</p>
              <p className="font-semibold">{profile?.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Teléfono</p>
              <p className="font-semibold">{profile?.phone || "Sin registrar"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Edad</p>
              <p className="font-semibold">
                {profile?.age ? `${profile.age} años` : "Sin fecha de nacimiento"}
                {profile?.is_minor && <Badge variant="warning" className="ml-2">Menor</Badge>}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Estado</p>
              <p className="font-semibold">
                {profile?.is_active ? <Badge variant="success">Activo</Badge> : <Badge variant="danger">Inactivo</Badge>}
                {profile?.is_paused && <Badge variant="warning" className="ml-1">Pausado</Badge>}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Inscrito desde</p>
              <p className="font-semibold">
                {profile?.enrolled_at ? new Date(profile.enrolled_at).toLocaleDateString("es-DO") : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Email verificado</p>
              <p className="font-semibold">
                {profile?.email_verified ? <Badge variant="success">Sí</Badge> : <Badge variant="warning">No</Badge>}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* V3.9.9: NIVEL ACTUAL + cambiar */}
      <Card className="mb-4">
        <CardBody>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Nivel actual</p>
              <p className="font-semibold text-lg">
                {profile?.current_level_code ? (
                  <Badge variant="brand">{profile.current_level_code}</Badge>
                ) : (
                  <span className="text-slate-400">Sin nivel asignado</span>
                )}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setShowLevelChange(!showLevelChange); setNewLevelId(profile?.current_level_id ? String(profile.current_level_id) : ""); }}>
              📚 Cambiar nivel
            </Button>
          </div>

          {/* V3.9.35 — Diagnóstico: por qué este estudiante ve las clases que ve */}
          <QueVeElEstudiante studentId={String(studentId)} />
          {showLevelChange && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              <p className="text-sm text-slate-600">Cambia el nivel del estudiante (ej: si quiere empezar de cero, o por decisión pedagógica). Esto no afecta sus pagos ni inscripciones.</p>
              <Select label="Nuevo nivel" value={newLevelId} onChange={(e: any) => setNewLevelId(e.target.value)}>
                <option value="">— Selecciona un nivel —</option>
                {levels.map((l: any) => (
                  <option key={l.id} value={l.id}>{l.code} — {l.name}</option>
                ))}
              </Select>
              <Input label="Motivo (opcional)" value={levelReason} onChange={(e: any) => setLevelReason(e.target.value)} placeholder="Ej: Quiere empezar de cero" />
              <div className="flex gap-2">
                <Button onClick={doChangeLevel} disabled={changingLevel} size="sm">
                  {changingLevel ? "Cambiando..." : "Confirmar cambio"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowLevelChange(false)}>Cancelar</Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* DATOS PERSONALES */}
      <Card className="mb-4">
        <CardBody>
          <h3 className="flex items-center gap-2 font-extrabold text-slate-900 mb-4">
            <UserIcon size={18} className="text-brand-600" />
            Datos personales
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            <Input
              label="Fecha de nacimiento"
              type="date"
              value={form.birth_date}
              onChange={(e: any) => setForm({ ...form, birth_date: e.target.value })}
            />
            <Input
              label="Nacionalidad"
              value={form.nationality}
              onChange={(e: any) => setForm({ ...form, nationality: e.target.value })}
            />
            <Select
              label="Tipo de documento"
              value={form.document_type}
              onChange={(e: any) => setForm({ ...form, document_type: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              {DOC_TYPES.map(d => <option key={d.v} value={d.v}>{d.l}</option>)}
            </Select>
            <Input
              label="Número de documento"
              value={form.document_number}
              onChange={(e: any) => setForm({ ...form, document_number: e.target.value })}
            />
          </div>
        </CardBody>
      </Card>

      {/* DIRECCIÓN */}
      <Card className="mb-4">
        <CardBody>
          <h3 className="flex items-center gap-2 font-extrabold text-slate-900 mb-4">
            <MapPin size={18} className="text-brand-600" />
            Dirección
          </h3>
          <div className="space-y-3">
            <Input
              label="Calle y número"
              value={form.address}
              onChange={(e: any) => setForm({ ...form, address: e.target.value })}
            />
            <div className="grid md:grid-cols-2 gap-3">
              <Input label="Ciudad" value={form.city} onChange={(e: any) => setForm({ ...form, city: e.target.value })} />
              <Input label="Sector" value={form.sector} onChange={(e: any) => setForm({ ...form, sector: e.target.value })} />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* CONTACTO EMERGENCIA */}
      <Card className="mb-4">
        <CardBody>
          <h3 className="flex items-center gap-2 font-extrabold text-slate-900 mb-4">
            <Heart size={18} className="text-red-600" />
            Contacto de emergencia
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            <Input
              label="Nombre completo"
              value={form.emergency_contact_name}
              onChange={(e: any) => setForm({ ...form, emergency_contact_name: e.target.value })}
            />
            <Select
              label="Relación"
              value={form.emergency_contact_relationship}
              onChange={(e: any) => setForm({ ...form, emergency_contact_relationship: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              {RELATIONSHIPS.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
            </Select>
            <Input
              label="Teléfono"
              value={form.emergency_contact_phone}
              onChange={(e: any) => setForm({ ...form, emergency_contact_phone: e.target.value })}
            />
          </div>
        </CardBody>
      </Card>

      {/* TUTOR (si menor) */}
      {profile?.is_minor && (
        <Card className="mb-4 border-amber-300 bg-amber-50">
          <CardBody>
            <h3 className="flex items-center gap-2 font-extrabold text-amber-900 mb-3">
              <Shield size={18} />
              Tutor / Responsable legal (obligatorio: menor de edad)
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <Input label="Nombre del tutor" value={form.tutor_name} onChange={(e: any) => setForm({ ...form, tutor_name: e.target.value })} />
              <Select label="Relación" value={form.tutor_relationship} onChange={(e: any) => setForm({ ...form, tutor_relationship: e.target.value })}>
                <option value="">Seleccionar...</option>
                {RELATIONSHIPS.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
              </Select>
              <Input label="Documento del tutor" value={form.tutor_document} onChange={(e: any) => setForm({ ...form, tutor_document: e.target.value })} />
              <Input label="Teléfono del tutor" value={form.tutor_phone} onChange={(e: any) => setForm({ ...form, tutor_phone: e.target.value })} />
              <div className="md:col-span-2">
                <Input label="Email del tutor" type="email" value={form.tutor_email} onChange={(e: any) => setForm({ ...form, tutor_email: e.target.value })} />
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* INFO ADICIONAL */}
      <Card className="mb-4">
        <CardBody>
          <h3 className="flex items-center gap-2 font-extrabold text-slate-900 mb-4">
            <Info size={18} className="text-brand-600" />
            Información adicional
          </h3>
          <div className="space-y-3">
            <Input
              label="¿Cómo se enteró del instituto?"
              value={form.how_found_us}
              onChange={(e: any) => setForm({ ...form, how_found_us: e.target.value })}
            />
            <Input
              label="¿Quién lo recomendó?"
              value={form.referred_by}
              onChange={(e: any) => setForm({ ...form, referred_by: e.target.value })}
            />
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Notas especiales (alergias, condiciones, etc.)
              </label>
              <textarea
                value={form.special_notes}
                onChange={(e) => setForm({ ...form, special_notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <Button onClick={save} disabled={saving} className="w-full" size="lg">
        <Save size={16} className="mr-2" />
        {saving ? "Guardando..." : "Guardar cambios del perfil"}
      </Button>
    </>
  );
}
