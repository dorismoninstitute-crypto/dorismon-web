"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, showToast } from "@/components/ui";
import { MessageCircle, Check, Users, Clock, AlertCircle } from "lucide-react";

/**
 * V3.9.29 — Reactivación: la plata que ya está esperando.
 *
 * Dos fugas del negocio en un solo lugar:
 *  1. Hicieron el test de nivel y nunca se inscribieron
 *  2. Estudiantes inscritos que dejaron de venir
 *
 * Cada uno con un botón que abre WhatsApp CON EL MENSAJE YA ESCRITO.
 * Solo hay que tocar enviar.
 *
 * NOTA: no se pueden mandar WhatsApp automáticos sin la API de negocios de
 * WhatsApp (que exige verificación de empresa y cobra por mensaje). Esto es
 * lo más rápido posible sin eso: un toque por persona.
 */

function telefonoWhatsApp(tel?: string | null): string | null {
  if (!tel) return null;
  const digitos = tel.replace(/\D/g, "");
  if (digitos.length < 10) return null;
  // República Dominicana: si vienen 10 dígitos, anteponer el 1
  return digitos.length === 10 ? "1" + digitos : digitos;
}

function abrirWhatsApp(tel: string, mensaje: string) {
  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`, "_blank");
}

export default function ReactivacionPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [contactados, setContactados] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<"leads" | "inactive">("leads");

  const load = async () => {
    try {
      const r = await api("/admin/reactivation", { auth: true });
      setData(r);
      setErr("");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const marcarContactado = async (id: string) => {
    setContactados((p) => ({ ...p, [id]: true }));
    api(`/admin/reactivation/${id}/contacted`, {
      method: "POST", auth: true, body: { via: "whatsapp" },
    }).catch(() => {});
  };

  const escribirLead = (p: any) => {
    const tel = telefonoWhatsApp(p.phone);
    if (!tel) {
      showToast("error", "Esta persona no tiene teléfono registrado");
      return;
    }
    const nombre = (p.name || "").split(" ")[0];
    const nivel = p.level_code ? ` Tu resultado fue nivel ${p.level_code}.` : "";
    const msg =
      `Hola ${nombre}, te saludamos de Dorismon Language Institute. ` +
      `Vimos que hiciste nuestro test de nivel de inglés.${nivel} ` +
      `¿Te gustaría agendar tu clase de prueba GRATIS para conocer a tu profesor? ` +
      `Sin compromiso. 😊`;
    abrirWhatsApp(tel, msg);
    marcarContactado(p.student_id);
  };

  const escribirInactivo = (p: any) => {
    const tel = telefonoWhatsApp(p.phone);
    if (!tel) {
      showToast("error", "Esta persona no tiene teléfono registrado");
      return;
    }
    const nombre = (p.name || "").split(" ")[0];
    const msg =
      `Hola ${nombre}, ¿cómo estás? Te escribimos de Dorismon Language Institute. ` +
      `Notamos que no te hemos visto en clase últimamente y queremos saber si todo está bien. ` +
      `Si necesitas cambiar tu horario o retomar donde lo dejaste, con gusto te ayudamos. ` +
      `¡Te esperamos! 📚`;
    abrirWhatsApp(tel, msg);
    marcarContactado(p.student_id);
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  const leads = data?.leads || [];
  const inactivos = data?.inactive || [];
  const lista = tab === "leads" ? leads : inactivos;

  return (
    <div>
      <PageHeader
        title="Reactivación"
        subtitle="Gente que ya mostró interés y se está perdiendo. Un toque para escribirles."
      />

      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setTab("leads")}
          className={`text-left p-4 rounded-2xl border-2 transition ${
            tab === "leads" ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-amber-600" />
            <p className="font-bold text-sm text-slate-800">Hicieron el test y no se inscribieron</p>
          </div>
          <p className="text-2xl font-bold text-amber-700">{leads.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Ya mostraron interés</p>
        </button>

        <button
          onClick={() => setTab("inactive")}
          className={`text-left p-4 rounded-2xl border-2 transition ${
            tab === "inactive" ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-rose-600" />
            <p className="font-bold text-sm text-slate-800">Estudiantes que dejaron de venir</p>
          </div>
          <p className="text-2xl font-bold text-rose-700">{inactivos.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Sin asistir hace {data?.dias_inactivo || 21} días o más
          </p>
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5 text-xs text-blue-800 leading-relaxed">
        💡 El botón abre WhatsApp con el mensaje ya escrito — solo tocas enviar. Cuesta mucho
        menos recuperar a alguien que ya te conoce que conseguir a alguien nuevo.
      </div>

      {lista.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500 text-center py-10">
              {tab === "leads"
                ? "No hay nadie pendiente. Todos los que hicieron el test están inscritos. 🎉"
                : "Ningún estudiante está inactivo. ¡Buen trabajo! 🎉"}
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-2">
          {lista.map((p: any) => {
            const tel = telefonoWhatsApp(p.phone);
            const yaEscrito = contactados[p.student_id];
            return (
              <Card key={p.student_id}>
                <CardBody className="py-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {(p.name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                    </div>

                    <div className="flex-1 min-w-[160px]">
                      <p className="font-semibold text-sm text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-500 truncate">{p.email}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        {tab === "leads" ? (
                          <>
                            {p.level_code && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                                Nivel {p.level_code}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">
                              Test hace {p.days_ago} días
                            </span>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {p.never_attended
                              ? "Nunca ha asistido a clase"
                              : `Última clase hace ${p.days_ago} días`}
                          </span>
                        )}
                      </div>
                    </div>

                    {tel ? (
                      <button
                        onClick={() => (tab === "leads" ? escribirLead(p) : escribirInactivo(p))}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-lg transition flex-shrink-0 ${
                          yaEscrito
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        {yaEscrito ? <Check className="w-3.5 h-3.5" /> : <MessageCircle className="w-3.5 h-3.5" />}
                        {yaEscrito ? "Ya le escribiste" : "Escribir por WhatsApp"}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 flex-shrink-0">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Sin teléfono
                      </span>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
