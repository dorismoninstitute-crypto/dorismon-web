"use client";
import { useState, useEffect } from "react";
import { adminBankAccounts, safeArray } from "@/lib/api";
import { LoadingScreen, ErrorBox, PageHeader, Card, CardBody, Badge, Button, Input, Select, Modal, ConfirmModal, showToast } from "@/components/ui";
import { Plus, Edit2, Trash2, Building2, CreditCard, Eye, EyeOff } from "lucide-react";

const BANKS_RD = [
  "BHD León", "Banreservas", "Popular", "Scotiabank", "Banco Santa Cruz",
  "Banco Vimenca", "Banco Caribe", "Banesco", "Citibank", "APAP",
  "ALAVER", "Asociación La Nacional", "Otro",
];

export default function AdminBankAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const [form, setForm] = useState<any>({
    bank_name: "", account_type: "savings", account_number: "",
    holder_name: "", holder_document: "", notes: "", is_active: true,
  });

  const load = () => {
    setLoading(true);
    adminBankAccounts.list()
      .then((d: any) => { setAccounts(safeArray(d)); setLoading(false); })
      .catch((e: any) => { setErr(e.message); setLoading(false); });
  };
  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ bank_name: "", account_type: "savings", account_number: "", holder_name: "", holder_document: "", notes: "", is_active: true });
    setShowModal(true);
  };

  const openEdit = (a: any) => {
    setEditing(a);
    setForm({ ...a });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.bank_name || !form.account_number || !form.holder_name || !form.holder_document) {
      showToast("error", "Completa todos los campos obligatorios");
      return;
    }
    try {
      if (editing) {
        await adminBankAccounts.update(editing.id, form);
        showToast("success", "✓ Cuenta actualizada");
      } else {
        await adminBankAccounts.create(form);
        showToast("success", "✓ Cuenta agregada");
      }
      setShowModal(false);
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  const toggleActive = async (a: any) => {
    try {
      await adminBankAccounts.update(a.id, { is_active: !a.is_active });
      showToast("success", a.is_active ? "Cuenta desactivada" : "Cuenta activada");
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  const deleteAccount = async () => {
    if (!confirmDelete) return;
    try {
      await adminBankAccounts.delete(confirmDelete.id);
      showToast("success", "Cuenta eliminada");
      setConfirmDelete(null);
      load();
    } catch (e: any) { showToast("error", e.message); }
  };

  if (loading) return <LoadingScreen />;
  if (err) return <ErrorBox message={err} />;

  const activeCount = accounts.filter(a => a.is_active).length;

  return (
    <>
      <PageHeader
        title="🏦 Cuentas Bancarias"
        subtitle="Configura las cuentas donde los estudiantes harán transferencias"
        action={<Button onClick={openCreate}><Plus size={16} className="mr-1" /> Nueva cuenta</Button>}
      />

      {/* Resumen */}
      <Card className="mb-5 bg-blue-50 border-blue-200">
        <CardBody>
          <div className="flex items-start gap-3">
            <Building2 size={24} className="text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="font-bold text-blue-900">
                {activeCount} {activeCount === 1 ? "cuenta activa" : "cuentas activas"}
                {accounts.length > activeCount && ` · ${accounts.length - activeCount} inactivas`}
              </p>
              <p className="text-xs text-blue-800 mt-1">
                Los estudiantes solo ven las cuentas activas en la pantalla de pago.
                Te recomendamos tener al menos 2 cuentas de bancos distintos.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {accounts.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <CreditCard size={48} className="text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700 mb-1">Aún no tienes cuentas configuradas</p>
              <p className="text-sm text-slate-500 mb-4">Agrega al menos una para que los estudiantes puedan pagar.</p>
              <Button onClick={openCreate}><Plus size={16} className="mr-1" /> Agregar primera cuenta</Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {accounts.map(a => (
            <Card key={a.id} className={!a.is_active ? "opacity-60" : ""}>
              <CardBody>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <CreditCard size={22} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{a.bank_name}</p>
                      <Badge variant={a.account_type === "savings" ? "info" : "brand"}>
                        {a.account_type === "savings" ? "Ahorros" : "Corriente"}
                      </Badge>
                    </div>
                  </div>
                  {a.is_active ? (
                    <Badge variant="success">Activa</Badge>
                  ) : (
                    <Badge>Inactiva</Badge>
                  )}
                </div>

                <div className="space-y-1.5 text-sm mb-3">
                  <div>
                    <span className="text-slate-500">Número:</span>{" "}
                    <span className="font-mono font-bold text-slate-900">{a.account_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Titular:</span>{" "}
                    <span className="font-semibold text-slate-900">{a.holder_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Cédula/RNC:</span>{" "}
                    <span className="font-mono text-slate-700">{a.holder_document}</span>
                  </div>
                  {a.notes && (
                    <p className="text-xs text-slate-600 italic mt-2 pt-2 border-t">{a.notes}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <Button size="sm" variant="outline" onClick={() => openEdit(a)} className="flex-1">
                    <Edit2 size={14} className="mr-1" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleActive(a)}>
                    {a.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setConfirmDelete(a)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Editar cuenta" : "Nueva cuenta bancaria"} size="lg">
        <div className="space-y-3">
          <Select
            label="Banco *"
            value={form.bank_name}
            onChange={(e: any) => setForm({ ...form, bank_name: e.target.value })}
          >
            <option value="">Seleccionar banco...</option>
            {BANKS_RD.map(b => <option key={b} value={b}>{b}</option>)}
          </Select>

          <Select
            label="Tipo de cuenta *"
            value={form.account_type}
            onChange={(e: any) => setForm({ ...form, account_type: e.target.value })}
          >
            <option value="savings">💰 Ahorros</option>
            <option value="checking">💳 Corriente</option>
          </Select>

          <Input
            label="Número de cuenta *"
            value={form.account_number}
            onChange={(e: any) => setForm({ ...form, account_number: e.target.value })}
            placeholder="1234567890"
          />

          <Input
            label="Nombre del titular *"
            value={form.holder_name}
            onChange={(e: any) => setForm({ ...form, holder_name: e.target.value })}
            placeholder="Ej: Luis Dorismon"
          />

          <Input
            label="Cédula o RNC del titular *"
            value={form.holder_document}
            onChange={(e: any) => setForm({ ...form, holder_document: e.target.value })}
            placeholder="001-1234567-8"
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Notas (opcional)
            </label>
            <textarea
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Ej: Preferida para transferencias grandes"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
            />
          </div>

          <Button onClick={save} className="w-full" size="lg">
            {editing ? "Guardar cambios" : "Agregar cuenta"}
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={deleteAccount}
        title="¿Eliminar cuenta?"
        message={`¿Estás seguro de eliminar la cuenta de ${confirmDelete?.bank_name}? Si tiene pagos asociados, solo se desactivará.`}
        confirmText="Eliminar"
      />
    </>
  );
}
