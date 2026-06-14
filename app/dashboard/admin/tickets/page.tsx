"use client";
import { useEffect, useState } from "react";
import { adminTicketsApi, messagesApi, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Button, Modal, Input, Badge, showToast } from "@/components/ui";
import Avatar from "@/components/Avatar";
import { AlertTriangle, MessageCircle, Bug, Settings, Inbox, CheckCircle2, Clock, Reply, X } from "lucide-react";

const STATUS_LABELS: any = {
  open: { label: "🟡 Abierto", color: "warning" },
  in_progress: { label: "🔵 En proceso", color: "info" },
  resolved: { label: "✅ Resuelto", color: "success" },
  closed: { label: "⚫ Cerrado", color: "default" },
};

const CATEGORY_ICONS: any = {
  urgent: { Icon: AlertTriangle, color: "text-red-600 bg-red-50" },
  consultation: { Icon: MessageCircle, color: "text-blue-600 bg-blue-50" },
  bug: { Icon: Bug, color: "text-purple-600 bg-purple-50" },
  request: { Icon: Settings, color: "text-amber-600 bg-amber-50" },
  general: { Icon: MessageCircle, color: "text-slate-600 bg-slate-50" },
};

export default function AdminTicketsPage() {
  const [filter, setFilter] = useState<string>("open");  // open / in_progress / resolved / closed / all
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [openTicket, setOpenTicket] = useState<any>(null);
  const [replyForm, setReplyForm] = useState({ subject: "", body: "" });
  const [showReply, setShowReply] = useState(false);

  const load = () => {
    setLoading(true);
    adminTicketsApi.list(filter === "all" ? undefined : filter)
      .then((d: any) => { setTickets(safeArray(d)); setLoading(false); })
      .catch((e: any) => { setErr(e.message); setLoading(false); });
  };
  useEffect(load, [filter]);

  const changeStatus = async (id: string, status: string) => {
    try {
      await adminTicketsApi.updateStatus(id, status);
      showToast("success", `Estado actualizado a ${STATUS_LABELS[status]?.label || status}`);
      load();
      if (openTicket?.id === id) setOpenTicket({ ...openTicket, status });
    } catch (e: any) { showToast("error", e.message); }
  };

  const openReply = (t: any) => {
    setReplyForm({
      subject: t.subject.startsWith("Re:") ? t.subject : `Re: ${t.subject}`,
      body: "",
    });
    setShowReply(true);
  };

  const sendReply = async () => {
    if (!openTicket || !replyForm.body.trim()) {
      showToast("error", "Escribí una respuesta");
      return;
    }
    try {
      await messagesApi.send({
        to_user_id: openTicket.from_user_id,
        subject: replyForm.subject,
        body: replyForm.body,
        reply_to_id: openTicket.id,
      });
      showToast("success", "✅ Respuesta enviada");
      setShowReply(false);
      // Auto-marcar como in_progress si está open
      if (openTicket.status === "open") {
        await changeStatus(openTicket.id, "in_progress");
      }
    } catch (e: any) { showToast("error", e.message); }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  // Stats por estado
  const openCount = tickets.filter(t => t.status === "open").length;
  const inProgressCount = tickets.filter(t => t.status === "in_progress").length;
  const urgentCount = tickets.filter(t => t.priority === "high" && t.status === "open").length;

  return (
    <>
      <PageHeader title="Tickets de soporte" subtitle="Gestioná los pedidos de ayuda de tus usuarios" />

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold uppercase tracking-wider text-red-700">Urgentes</p>
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <p className="text-3xl font-black text-red-900">{urgentCount}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Abiertos</p>
            <Inbox size={18} className="text-amber-600" />
          </div>
          <p className="text-3xl font-black text-amber-900">{openCount}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700">En proceso</p>
            <Clock size={18} className="text-blue-600" />
          </div>
          <p className="text-3xl font-black text-blue-900">{inProgressCount}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Total</p>
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-900">{tickets.length}</p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-4">
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {[
              { v: "open", l: "🟡 Abiertos" },
              { v: "in_progress", l: "🔵 En proceso" },
              { v: "resolved", l: "✅ Resueltos" },
              { v: "closed", l: "⚫ Cerrados" },
              { v: "all", l: "Todos" },
            ].map((f) => (
              <Button
                key={f.v}
                variant={filter === f.v ? "primary" : "outline"}
                onClick={() => setFilter(f.v)}
                size="sm"
              >
                {f.l}
              </Button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Lista de tickets */}
      {tickets.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12 text-slate-400">
              <Inbox size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="font-semibold">No hay tickets {filter !== "all" ? `con estado "${STATUS_LABELS[filter]?.label || filter}"` : ""}</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-2">
          {tickets.map((t: any) => {
            const cat = CATEGORY_ICONS[t.category] || CATEGORY_ICONS.general;
            return (
              <Card key={t.id} className={t.priority === "high" ? "border-red-200" : ""}>
                <CardBody>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.color}`}>
                      <cat.Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-bold text-slate-900">{t.subject}</p>
                        {t.priority === "high" && <Badge variant="danger">🚨 URGENTE</Badge>}
                        <Badge variant={STATUS_LABELS[t.status]?.color}>{STATUS_LABELS[t.status]?.label}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mb-2">
                        <Avatar name={t.from_name} gender={t.from_gender} size="xs" />
                        <span>{t.from_name}</span>
                        <span>·</span>
                        <span>{t.from_role === "student" ? "Estudiante" : t.from_role === "teacher" ? "Profesor" : "Admin"}</span>
                        <span>·</span>
                        <span>{t.created_at && new Date(t.created_at).toLocaleString("es", { dateStyle: "short", timeStyle: "short" })}</span>
                      </p>
                      <p className="text-sm text-slate-700 line-clamp-2">{t.body}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => setOpenTicket(t)}>
                      Ver detalle
                    </Button>
                    {t.status === "open" && (
                      <Button size="sm" onClick={() => changeStatus(t.id, "in_progress")}>
                        🔵 Tomar caso
                      </Button>
                    )}
                    {t.status !== "resolved" && t.status !== "closed" && (
                      <Button size="sm" variant="outline" onClick={() => changeStatus(t.id, "resolved")} className="text-emerald-700 border-emerald-200">
                        ✅ Marcar resuelto
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal ticket detalle */}
      <Modal open={!!openTicket} onClose={() => setOpenTicket(null)} title={openTicket?.subject || ""} size="lg">
        {openTicket && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <Avatar name={openTicket.from_name} gender={openTicket.from_gender} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{openTicket.from_name}</p>
                <p className="text-xs text-slate-500">
                  {openTicket.from_role === "student" ? "Estudiante" : openTicket.from_role === "teacher" ? "Profesor" : "Admin"}
                  {" · "}
                  {openTicket.created_at && new Date(openTicket.created_at).toLocaleString("es", { dateStyle: "long", timeStyle: "short" })}
                </p>
              </div>
              <Badge variant={STATUS_LABELS[openTicket.status]?.color}>{STATUS_LABELS[openTicket.status]?.label}</Badge>
            </div>

            <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed py-2 bg-slate-50 p-3 rounded-lg">
              {openTicket.body}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => openReply(openTicket)} size="sm">
                <Reply size={14} className="inline mr-1" /> Responder al usuario
              </Button>
              {openTicket.status !== "in_progress" && openTicket.status !== "resolved" && openTicket.status !== "closed" && (
                <Button onClick={() => changeStatus(openTicket.id, "in_progress")} size="sm" variant="outline">
                  🔵 En proceso
                </Button>
              )}
              {openTicket.status !== "resolved" && (
                <Button onClick={() => changeStatus(openTicket.id, "resolved")} size="sm" variant="outline" className="text-emerald-700">
                  ✅ Resuelto
                </Button>
              )}
              {openTicket.status !== "closed" && (
                <Button onClick={() => changeStatus(openTicket.id, "closed")} size="sm" variant="outline">
                  <X size={14} className="inline mr-1" /> Cerrar
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal reply */}
      <Modal open={showReply} onClose={() => setShowReply(false)} title={`Responder a ${openTicket?.from_name || ""}`} size="lg">
        <div className="space-y-3">
          <Input
            label="Asunto"
            value={replyForm.subject}
            onChange={(e: any) => setReplyForm({ ...replyForm, subject: e.target.value })}
          />
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Tu respuesta *</label>
            <textarea
              value={replyForm.body}
              onChange={(e) => setReplyForm({ ...replyForm, body: e.target.value })}
              rows={8}
              placeholder="Escribí tu respuesta..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
            />
          </div>
          <Button onClick={sendReply} className="w-full" size="lg">
            <Reply size={14} className="inline mr-1" /> Enviar respuesta
          </Button>
        </div>
      </Modal>
    </>
  );
}
