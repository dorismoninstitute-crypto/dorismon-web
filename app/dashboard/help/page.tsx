"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { messagesApi } from "@/lib/api";
import { PageHeader, Card, CardBody, Button, Input, showToast } from "@/components/ui";
import { AlertTriangle, MessageCircle, Bug, Settings, HelpCircle, Send } from "lucide-react";

const HELP_CATEGORIES = [
  {
    id: "urgent",
    icon: AlertTriangle,
    color: "red",
    title: "🚨 Problema URGENTE",
    description: "Link de clase no funciona, no puedo entrar al sistema, error que me impide usar la plataforma.",
    priority: "high",
    is_ticket: true,
  },
  {
    id: "consultation",
    icon: MessageCircle,
    color: "blue",
    title: "💬 Consulta general",
    description: "Dudas sobre tu curso, horarios, certificados, planes, etc.",
    priority: "normal",
    is_ticket: true,
  },
  {
    id: "bug",
    icon: Bug,
    color: "purple",
    title: "🐛 Reportar un error",
    description: "Encontraste algo que no funciona bien en la plataforma.",
    priority: "normal",
    is_ticket: true,
  },
  {
    id: "request",
    icon: Settings,
    color: "amber",
    title: "📝 Hacer un pedido",
    description: "Pedido de cambio de horario, cambio de profesor, ajuste de tu cuenta.",
    priority: "normal",
    is_ticket: true,
  },
];

export default function HelpPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<typeof HELP_CATEGORIES[0] | null>(null);
  const [form, setForm] = useState({ subject: "", body: "" });
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!selectedCategory) return;
    if (!form.subject.trim() || !form.body.trim()) {
      showToast("error", "Completa asunto y descripción");
      return;
    }
    setSending(true);
    try {
      await messagesApi.send({
        subject: form.subject,
        body: form.body,
        is_ticket: true,
        category: selectedCategory.id,
        priority: selectedCategory.priority,
      });
      showToast("success", "✅ Tu ticket fue enviado. El admin lo recibirá pronto.");
      setForm({ subject: "", body: "" });
      setSelectedCategory(null);
      setTimeout(() => router.push("/dashboard/messages"), 1500);
    } catch (e: any) { showToast("error", e.message); }
    finally { setSending(false); }
  };

  return (
    <>
      <PageHeader title="Centro de ayuda" subtitle="¿En qué podemos ayudarte?" />

      {!selectedCategory ? (
        <>
          <p className="text-sm text-slate-600 mb-4">
            Elige qué tipo de problema tienes. Tu solicitud llegará al administrador con la prioridad correcta.
          </p>

          <div className="grid md:grid-cols-2 gap-3">
            {HELP_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c)}
                className={`text-left p-5 rounded-2xl border-2 hover:shadow-card transition bg-white ${
                  c.color === "red" ? "border-red-100 hover:border-red-300" :
                  c.color === "blue" ? "border-blue-100 hover:border-blue-300" :
                  c.color === "purple" ? "border-purple-100 hover:border-purple-300" :
                  "border-amber-100 hover:border-amber-300"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                  c.color === "red" ? "bg-red-50 text-red-600" :
                  c.color === "blue" ? "bg-blue-50 text-blue-600" :
                  c.color === "purple" ? "bg-purple-50 text-purple-600" :
                  "bg-amber-50 text-amber-600"
                }`}>
                  <c.icon size={22} />
                </div>
                <h3 className="font-extrabold text-slate-900 mb-1">{c.title}</h3>
                <p className="text-xs text-slate-600">{c.description}</p>
              </button>
            ))}
          </div>

          <Card className="mt-5 bg-slate-50">
            <CardBody>
              <div className="flex items-start gap-3">
                <HelpCircle className="text-slate-400 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm font-bold text-slate-700">¿Quieres escribirle directo a alguien?</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Usá <a href="/dashboard/messages" className="text-brand-600 font-bold hover:underline">Mensajes</a> para hablar con tu profesor o el administrador sin abrir un ticket formal.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </>
      ) : (
        <Card>
          <CardBody>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 mb-4"
            >
              ← Volver a categorías
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                selectedCategory.color === "red" ? "bg-red-50 text-red-600" :
                selectedCategory.color === "blue" ? "bg-blue-50 text-blue-600" :
                selectedCategory.color === "purple" ? "bg-purple-50 text-purple-600" :
                "bg-amber-50 text-amber-600"
              }`}>
                <selectedCategory.icon size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900">{selectedCategory.title}</h3>
                <p className="text-xs text-slate-500">{selectedCategory.description}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Input
                label="Asunto *"
                value={form.subject}
                onChange={(e: any) => setForm({ ...form, subject: e.target.value })}
                placeholder={
                  selectedCategory.id === "urgent" ? "Ej: No puedo entrar al Zoom de la clase de las 7pm" :
                  selectedCategory.id === "consultation" ? "Ej: ¿Cuándo es mi próximo examen?" :
                  selectedCategory.id === "bug" ? "Ej: Al hacer click en el botón X no pasa nada" :
                  "Ej: Quisiera cambiar mi horario a las tardes"
                }
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Describe el problema *</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  rows={8}
                  placeholder="Contanos qué pasó, qué intentaste y qué esperabas que pasara."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                />
              </div>

              {selectedCategory.id === "urgent" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">
                  🚨 <strong>Prioridad ALTA</strong> — Tu ticket llega al admin con alerta urgente.
                </div>
              )}

              <Button onClick={submit} loading={sending} className="w-full" size="lg">
                <Send size={14} className="inline mr-1" /> Enviar ticket
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </>
  );
}
