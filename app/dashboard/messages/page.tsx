"use client";
import { useEffect, useState } from "react";
import { messagesApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Button, Modal, Input, Select, Badge, showToast } from "@/components/ui";
import Avatar from "@/components/Avatar";
import { MessageCircle, Send, Inbox, Mail, Plus, Reply } from "lucide-react";

export default function MessagesPage() {
  const [tab, setTab] = useState<"inbox" | "sent">("inbox");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [contacts, setContacts] = useState<any[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({
    to_user_id: "", subject: "", body: "",
    reply_to_id: "" as string | undefined,
  });

  const [openMsg, setOpenMsg] = useState<any>(null);

  const load = () => {
    setLoading(true);
    const fetch = tab === "inbox" ? messagesApi.inbox() : messagesApi.sent();
    fetch
      .then((d: any) => { setItems(safeArray(d)); setLoading(false); })
      .catch((e: any) => { setErr(e.message); setLoading(false); });
  };
  useEffect(load, [tab]);

  useEffect(() => {
    messagesApi.contacts().then((d: any) => setContacts(safeArray(d))).catch(() => {});
  }, []);

  const openCompose = (replyTo?: any) => {
    if (replyTo) {
      setForm({
        to_user_id: replyTo.from_user_id || "",
        subject: replyTo.subject.startsWith("Re:") ? replyTo.subject : `Re: ${replyTo.subject}`,
        body: "",
        reply_to_id: replyTo.id,
      });
    } else {
      setForm({ to_user_id: "", subject: "", body: "", reply_to_id: undefined });
    }
    setShowCompose(true);
  };

  const send = async () => {
    if (!form.to_user_id || !form.subject || !form.body) {
      showToast("error", "Completa destinatario, asunto y mensaje");
      return;
    }
    try {
      await messagesApi.send({
        to_user_id: form.to_user_id,
        subject: form.subject,
        body: form.body,
        reply_to_id: form.reply_to_id || undefined,
      });
      showToast("success", "✅ Mensaje enviado");
      setShowCompose(false);
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  const openMessage = async (m: any) => {
    setOpenMsg(m);
    if (tab === "inbox" && !m.read_at) {
      try {
        await messagesApi.markRead(m.id);
      } catch {}
    }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  return (
    <>
      <PageHeader
        title="Mensajes"
        subtitle="Comunicate con tus profesores, estudiantes o administradores"
        action={
          <Button onClick={() => openCompose()}>
            <Plus size={14} className="inline mr-1" /> Nuevo mensaje
          </Button>
        }
      />

      {/* Tabs */}
      <Card className="mb-4">
        <CardBody>
          <div className="flex gap-2">
            <Button
              variant={tab === "inbox" ? "primary" : "outline"}
              onClick={() => setTab("inbox")}
              size="sm"
            >
              <Inbox size={14} className="inline mr-1" /> Recibidos
            </Button>
            <Button
              variant={tab === "sent" ? "primary" : "outline"}
              onClick={() => setTab("sent")}
              size="sm"
            >
              <Send size={14} className="inline mr-1" /> Enviados
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Lista */}
      {items.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12 text-slate-400">
              <Mail size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="font-semibold">No tienes mensajes {tab === "inbox" ? "recibidos" : "enviados"}</p>
              <p className="text-xs mt-1">Haz clic en "+ Nuevo mensaje" para empezar una conversación.</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {items.map((m: any) => {
                const unread = tab === "inbox" && !m.read_at;
                const personName = tab === "inbox" ? m.from_name : m.to_name;
                const personGender = tab === "inbox" ? m.from_gender : null;
                return (
                  <button
                    key={m.id}
                    onClick={() => openMessage(m)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition flex gap-3 items-start ${unread ? "bg-brand-50" : ""}`}
                  >
                    <Avatar name={personName} gender={personGender} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className={`text-sm ${unread ? "font-extrabold text-slate-900" : "font-semibold text-slate-700"}`}>
                          {personName}
                        </p>
                        {m.is_ticket && <Badge variant={m.priority === "high" ? "danger" : "info"}>
                          {m.priority === "high" ? "🚨" : "🆘"} Ticket
                        </Badge>}
                        {unread && <Badge variant="brand">Nuevo</Badge>}
                      </div>
                      <p className={`text-sm truncate ${unread ? "font-bold" : ""}`}>{m.subject}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{m.body.slice(0, 100)}</p>
                    </div>
                    <p className="text-xs text-slate-400 flex-shrink-0">
                      {m.created_at && new Date(m.created_at).toLocaleDateString("es", { day: "numeric", month: "short" })}
                    </p>
                  </button>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Modal compose */}
      <Modal open={showCompose} onClose={() => setShowCompose(false)} title={form.reply_to_id ? "Responder" : "Nuevo mensaje"} size="lg">
        <div className="space-y-3">
          <Select
            label="Para *"
            value={form.to_user_id}
            onChange={(e: any) => setForm({ ...form, to_user_id: e.target.value })}
          >
            <option value="">Seleccionar destinatario...</option>
            {contacts.map((c: any) => (
              <option key={c.user_id} value={c.user_id}>
                {c.full_name} — {c.label}
              </option>
            ))}
          </Select>
          {contacts.length === 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              ⚠️ No tienes contactos disponibles. Si eres estudiante, asegúrate de tener un profesor asignado.
            </p>
          )}

          <Input
            label="Asunto *"
            value={form.subject}
            onChange={(e: any) => setForm({ ...form, subject: e.target.value })}
            placeholder="De qué se trata"
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Mensaje *</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={6}
              placeholder="Escribí tu mensaje..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
            />
          </div>

          <Button onClick={send} className="w-full" size="lg">
            <Send size={14} className="inline mr-1" /> Enviar mensaje
          </Button>
        </div>
      </Modal>

      {/* Modal ver mensaje */}
      <Modal open={!!openMsg} onClose={() => setOpenMsg(null)} title={openMsg?.subject || ""} size="lg">
        {openMsg && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <Avatar name={tab === "inbox" ? openMsg.from_name : openMsg.to_name} gender={openMsg.from_gender} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">
                  {tab === "inbox" ? `De: ${openMsg.from_name}` : `Para: ${openMsg.to_name}`}
                </p>
                <p className="text-xs text-slate-500">
                  {openMsg.created_at && new Date(openMsg.created_at).toLocaleString("es", { dateStyle: "long", timeStyle: "short" })}
                </p>
              </div>
              {openMsg.is_ticket && (
                <Badge variant={openMsg.priority === "high" ? "danger" : "info"}>
                  Ticket {openMsg.status}
                </Badge>
              )}
            </div>

            <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed py-2">
              {openMsg.body}
            </div>

            {tab === "inbox" && (
              <Button onClick={() => { setOpenMsg(null); openCompose(openMsg); }} className="w-full">
                <Reply size={14} className="inline mr-1" /> Responder
              </Button>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
