"use client";
import { useState, useEffect } from "react";
import { auth, profileApi } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Input, Button, showToast } from "@/components/ui";
import Avatar from "@/components/Avatar";
import { User as UserIcon, Phone, Mail, Lock, Save, Briefcase } from "lucide-react";

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Form perfil
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "", gender: "", bio: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  // Form contraseña
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    auth.me()
      .then((u: any) => {
        setUser(u);
        setProfileForm({
          full_name: u.full_name || "",
          phone: u.phone || "",
          gender: u.gender || "",
          bio: u.bio || "",
        });
        setLoading(false);
      })
      .catch((e: any) => { setErr(e.message); setLoading(false); });
  }, []);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const r: any = await profileApi.update({
        full_name: profileForm.full_name,
        phone: profileForm.phone,
        gender: profileForm.gender,
        bio: profileForm.bio,
      });
      setUser({ ...user, ...r.user });
      showToast("success", "Perfil actualizado");
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) {
      showToast("error", "Las contraseñas no coinciden");
      return;
    }
    if (pwForm.new_password.length < 8) {
      showToast("error", "La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setSavingPw(true);
    try {
      await profileApi.changePassword(pwForm.current_password, pwForm.new_password);
      showToast("success", "Contraseña actualizada");
      setPwForm({ current_password: "", new_password: "", confirm: "" });
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  const roleLabel = user.role === "super_admin" ? "Administrador" : user.role === "teacher" ? "Profesor" : "Estudiante";

  return (
    <>
      <PageHeader title="Mi cuenta" subtitle="Configurá tu perfil y seguridad" />

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Columna izquierda: avatar y datos básicos */}
        <div className="lg:col-span-1">
          <Card>
            <CardBody className="text-center py-8">
              <div className="flex justify-center mb-4">
                <Avatar name={user.full_name} gender={profileForm.gender || user.gender} size="xl" ring />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">{user.full_name}</h2>
              <p className="text-sm text-slate-500 mb-3">{user.email}</p>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700">
                {roleLabel}
              </span>
            </CardBody>
          </Card>

          <Card className="mt-4">
            <CardBody>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Información</p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-slate-400" />
                  <span className="text-slate-700">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" />
                    <span className="text-slate-700">{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Briefcase size={14} className="text-slate-400" />
                  <span className="text-slate-700">{roleLabel}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* V1.6.4: Aviso de upload futuro */}
          <Card className="mt-4 bg-brand-50 border-brand-100">
            <CardBody>
              <p className="text-xs text-brand-700">
                💡 <strong>Próximamente:</strong> Vas a poder subir tu foto de perfil real desde acá. Mientras tanto, el avatar se genera con tus iniciales.
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Columna derecha: forms */}
        <div className="lg:col-span-2 space-y-5">
          {/* Perfil */}
          <Card>
            <CardBody>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <UserIcon size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900">Perfil</h3>
                  <p className="text-xs text-slate-500">Tu información personal</p>
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  label="Nombre completo"
                  value={profileForm.full_name}
                  onChange={(e: any) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  placeholder="Ej: María Rodríguez"
                />
                <Input
                  label="Teléfono"
                  value={profileForm.phone}
                  onChange={(e: any) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="Ej: 829-555-1234"
                />

                {/* V1.6.4: Selector de género */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Género (opcional)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "female", label: "Femenino", gradient: "from-pink-400 to-fuchsia-500" },
                      { value: "male", label: "Masculino", gradient: "from-blue-500 to-teal-500" },
                      { value: "", label: "Prefiero no decir", gradient: "from-slate-400 to-slate-600" },
                    ].map((g) => (
                      <button
                        key={g.value || "none"}
                        type="button"
                        onClick={() => setProfileForm({ ...profileForm, gender: g.value })}
                        className={`p-3 rounded-xl border-2 transition ${
                          (profileForm.gender || "") === g.value
                            ? "border-brand-500 bg-brand-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${g.gradient} mx-auto mb-2`} />
                        <p className="text-xs font-semibold text-slate-700">{g.label}</p>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    💡 Se usa para personalizar el color de tu avatar.
                  </p>
                </div>

                {user.role === "teacher" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Bio (visible a estudiantes)
                    </label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      placeholder="Profesor con experiencia enseñando inglés..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                    />
                  </div>
                )}

                <Button onClick={saveProfile} loading={savingProfile} className="w-full md:w-auto">
                  <Save size={16} className="inline mr-1.5" />
                  Guardar perfil
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Cambiar contraseña */}
          <Card>
            <CardBody>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center">
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900">Seguridad</h3>
                  <p className="text-xs text-slate-500">Cambiá tu contraseña</p>
                </div>
              </div>

              <form onSubmit={savePassword} className="space-y-4">
                <Input
                  type="password"
                  label="Contraseña actual"
                  required
                  value={pwForm.current_password}
                  onChange={(e: any) => setPwForm({ ...pwForm, current_password: e.target.value })}
                />
                <Input
                  type="password"
                  label="Nueva contraseña"
                  required
                  value={pwForm.new_password}
                  onChange={(e: any) => setPwForm({ ...pwForm, new_password: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                />
                <Input
                  type="password"
                  label="Confirmar nueva contraseña"
                  required
                  value={pwForm.confirm}
                  onChange={(e: any) => setPwForm({ ...pwForm, confirm: e.target.value })}
                />
                <Button type="submit" loading={savingPw} variant="primary">
                  <Lock size={16} className="inline mr-1.5" />
                  Actualizar contraseña
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
