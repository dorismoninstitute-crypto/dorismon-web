"use client";
import { useState, useEffect } from "react";
import { studentProfileApi } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Input, Select, Button, Badge, showToast } from "@/components/ui";
import { User as UserIcon, FileText, MapPin, Phone, Heart, Shield, Info, CheckCircle2, AlertCircle } from "lucide-react";

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

const HOW_FOUND_US = [
  { v: "google", l: "Google" },
  { v: "facebook", l: "Facebook" },
  { v: "instagram", l: "Instagram" },
  { v: "tiktok", l: "TikTok" },
  { v: "referred", l: "Me lo recomendó alguien" },
  { v: "walked_by", l: "Pasé por ahí" },
  { v: "other", l: "Otro" },
];

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState<any>({});

  const load = () => {
    studentProfileApi.get()
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
  useEffect(load, []);

  // Calcular edad en vivo
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };
  const computedAge = calculateAge(form.birth_date);
  const isMinor = computedAge !== null && computedAge < 18;

  const save = async () => {
    setSaving(true);
    try {
      const r: any = await studentProfileApi.update(form);
      showToast("success", "✅ Perfil actualizado");
      if (r.profile_complete) {
        showToast("success", "🎉 ¡Perfil completo!");
      }
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
      <PageHeader title="Mi perfil completo" subtitle="Información personal, contacto de emergencia y tutor" />

      {/* Estado del perfil */}
      <Card className={`mb-5 ${profile?.profile_complete ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
        <CardBody>
          <div className="flex items-center gap-3">
            {profile?.profile_complete ? (
              <CheckCircle2 size={24} className="text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle size={24} className="text-amber-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              {profile?.profile_complete ? (
                <>
                  <p className="font-bold text-emerald-900">✅ Tu perfil está completo</p>
                  <p className="text-xs text-emerald-700">Todos los datos importantes están registrados.</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-amber-900">⚠️ Tu perfil está incompleto</p>
                  <p className="text-xs text-amber-700">
                    Completá los campos marcados con * para mejor servicio del instituto.
                  </p>
                </>
              )}
            </div>
            {computedAge !== null && (
              <Badge variant={isMinor ? "warning" : "info"}>
                {computedAge} años — {isMinor ? "Menor" : "Adulto"}
              </Badge>
            )}
          </div>
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
              label="Fecha de nacimiento *"
              type="date"
              value={form.birth_date}
              onChange={(e: any) => setForm({ ...form, birth_date: e.target.value })}
            />
            <Input
              label="Nacionalidad"
              value={form.nationality}
              onChange={(e: any) => setForm({ ...form, nationality: e.target.value })}
              placeholder="Dominicana"
            />
            <Select
              label="Tipo de documento *"
              value={form.document_type}
              onChange={(e: any) => setForm({ ...form, document_type: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              {DOC_TYPES.map(d => <option key={d.v} value={d.v}>{d.l}</option>)}
            </Select>
            <Input
              label="Número de documento *"
              value={form.document_number}
              onChange={(e: any) => setForm({ ...form, document_number: e.target.value })}
              placeholder="001-1234567-8"
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
              label="Calle y número *"
              value={form.address}
              onChange={(e: any) => setForm({ ...form, address: e.target.value })}
              placeholder="Av Lincoln 1234"
            />
            <div className="grid md:grid-cols-2 gap-3">
              <Input
                label="Ciudad"
                value={form.city}
                onChange={(e: any) => setForm({ ...form, city: e.target.value })}
                placeholder="Santo Domingo"
              />
              <Input
                label="Sector / Barrio"
                value={form.sector}
                onChange={(e: any) => setForm({ ...form, sector: e.target.value })}
                placeholder="Naco"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* CONTACTO DE EMERGENCIA */}
      <Card className="mb-4">
        <CardBody>
          <h3 className="flex items-center gap-2 font-extrabold text-slate-900 mb-4">
            <Heart size={18} className="text-red-600" />
            Contacto de emergencia *
          </h3>
          <p className="text-xs text-slate-600 mb-3">
            Persona a la que el instituto puede llamar si te pasa algo durante una clase.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <Input
              label="Nombre completo *"
              value={form.emergency_contact_name}
              onChange={(e: any) => setForm({ ...form, emergency_contact_name: e.target.value })}
            />
            <Select
              label="Relación contigo *"
              value={form.emergency_contact_relationship}
              onChange={(e: any) => setForm({ ...form, emergency_contact_relationship: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              {RELATIONSHIPS.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
            </Select>
            <Input
              label="Teléfono *"
              value={form.emergency_contact_phone}
              onChange={(e: any) => setForm({ ...form, emergency_contact_phone: e.target.value })}
              placeholder="809-555-1234"
            />
          </div>
        </CardBody>
      </Card>

      {/* TUTOR (si es menor) */}
      {isMinor && (
        <Card className="mb-4 border-amber-300 bg-amber-50">
          <CardBody>
            <h3 className="flex items-center gap-2 font-extrabold text-amber-900 mb-3">
              <Shield size={18} />
              Tutor / Responsable legal *
            </h3>
            <p className="text-xs text-amber-800 mb-4">
              Como sos menor de edad, los datos del tutor son <strong>obligatorios</strong> para que el instituto pueda comunicarse con él/ella.
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              <Input
                label="Nombre completo del tutor *"
                value={form.tutor_name}
                onChange={(e: any) => setForm({ ...form, tutor_name: e.target.value })}
              />
              <Select
                label="Relación contigo *"
                value={form.tutor_relationship}
                onChange={(e: any) => setForm({ ...form, tutor_relationship: e.target.value })}
              >
                <option value="">Seleccionar...</option>
                {RELATIONSHIPS.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
              </Select>
              <Input
                label="Documento del tutor *"
                value={form.tutor_document}
                onChange={(e: any) => setForm({ ...form, tutor_document: e.target.value })}
                placeholder="001-1234567-8"
              />
              <Input
                label="Teléfono del tutor *"
                value={form.tutor_phone}
                onChange={(e: any) => setForm({ ...form, tutor_phone: e.target.value })}
                placeholder="809-555-1234"
              />
              <Input
                label="Email del tutor"
                type="email"
                value={form.tutor_email}
                onChange={(e: any) => setForm({ ...form, tutor_email: e.target.value })}
                className="md:col-span-2"
              />
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
            <Select
              label="¿Cómo te enteraste del instituto?"
              value={form.how_found_us}
              onChange={(e: any) => setForm({ ...form, how_found_us: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              {HOW_FOUND_US.map(h => <option key={h.v} value={h.v}>{h.l}</option>)}
            </Select>
            {form.how_found_us === "referred" && (
              <Input
                label="¿Quién te recomendó?"
                value={form.referred_by}
                onChange={(e: any) => setForm({ ...form, referred_by: e.target.value })}
                placeholder="Nombre de la persona"
              />
            )}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Notas especiales (alergias, condiciones, etc.)
              </label>
              <textarea
                value={form.special_notes}
                onChange={(e) => setForm({ ...form, special_notes: e.target.value })}
                rows={3}
                placeholder="Si tenés alguna alergia, condición médica o algo que el instituto debería saber..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Botón guardar */}
      <Button onClick={save} disabled={saving} className="w-full" size="lg">
        {saving ? "Guardando..." : "💾 Guardar cambios"}
      </Button>

      <p className="text-xs text-slate-500 text-center mt-4 mb-8">
        Los campos con <strong>*</strong> son recomendados para completar tu perfil.
      </p>
    </>
  );
}
