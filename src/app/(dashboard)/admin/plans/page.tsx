"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { StudentAvatar } from "@/components/student-avatar";
import { CreditCard, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { getPlanLabel } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  frequency: string;
  planType: string;
  monthlyCredits: number;
  isActive: boolean;
}

interface UpgradeRequest {
  id: string;
  plan: string;
  frequency: string;
  details: string | null;
  price: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    photoUrl: string | null;
    studentType: string;
  };
}

const FREQUENCY_LABELS: Record<string, string> = {
  mensal: "Mensal",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

function formatDetails(details: string | null): string {
  if (!details) return "";
  return details
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [tab, setTab] = useState<"plans" | "requests">("plans");

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formFrequency, setFormFrequency] = useState("mensal");
  const [formPlanType, setFormPlanType] = useState("COLETIVA");
  const [formCredits, setFormCredits] = useState(0);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/plans").then((r) => r.json()),
      fetch("/api/plan-upgrade").then((r) => r.json()),
    ])
      .then(([plansData, reqData]) => {
        if (Array.isArray(plansData)) setPlans(plansData);
        if (Array.isArray(reqData)) setRequests(reqData);
      })
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditingPlan(null);
    setFormName("");
    setFormDescription("");
    setFormPrice("");
    setFormFrequency("mensal");
    setFormPlanType("COLETIVA");
    setFormCredits(0);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(plan: Plan) {
    setEditingPlan(plan);
    setFormName(plan.name);
    setFormDescription(plan.description);
    setFormPrice(plan.price);
    setFormFrequency(plan.frequency);
    setFormPlanType(plan.planType);
    setFormCredits(plan.monthlyCredits);
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!formName || !formPrice || !formFrequency) {
      setFormError("Preencha todos os campos obrigatórios");
      return;
    }

    setFormError("");
    const payload = {
      name: formName,
      description: formDescription,
      price: formPrice,
      frequency: formFrequency,
      planType: formPlanType,
      monthlyCredits: formCredits,
    };

    if (editingPlan) {
      const res = await fetch(`/api/plans/${editingPlan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setModalOpen(false);
      } else {
        const data = await res.json();
        setFormError(data.error || "Erro ao salvar");
      }
    } else {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        setPlans((prev) => [...prev, created]);
        setModalOpen(false);
      } else {
        const data = await res.json();
        setFormError(data.error || "Erro ao criar");
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Desativar este plano?")) return;
    const res = await fetch(`/api/plans/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPlans((prev) => prev.filter((p) => p.id !== id));
    }
  }

  async function handleApprove(id: string) {
    setActionId(id);
    const res = await fetch(`/api/plan-upgrade/${id}`, { method: "PATCH" });
    if (res.ok) {
      setRequests((prev) => prev.filter((r) => r.id !== id));
    }
    setActionId(null);
  }

  async function handleReject(id: string) {
    if (!confirm("Rejeitar esta solicitação de plano?")) return;
    setActionId(id);
    const res = await fetch(`/api/plan-upgrade/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRequests((prev) => prev.filter((r) => r.id !== id));
    }
    setActionId(null);
  }

  if (loading) {
    return <div className="text-center py-8 text-content-muted">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CreditCard size={28} className="text-accent" />
          <h1 className="text-2xl font-bold text-content-primary">Planos</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("plans")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "plans"
              ? "bg-accent text-white"
              : "bg-surface-secondary text-content-secondary hover:text-content-primary"
          }`}
        >
          Planos Cadastrados
        </button>
        <button
          onClick={() => setTab("requests")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
            tab === "requests"
              ? "bg-accent text-white"
              : "bg-surface-secondary text-content-secondary hover:text-content-primary"
          }`}
        >
          Solicitações
          {requests.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {requests.length}
            </span>
          )}
        </button>
      </div>

      {tab === "plans" && (
        <>
          <div className="mb-4">
            <Button onClick={openCreate}>
              <Plus size={16} className="mr-1.5" />
              Novo Plano
            </Button>
          </div>

          {plans.length === 0 ? (
            <Card className="!p-8">
              <p className="text-content-secondary text-sm text-center">
                Nenhum plano cadastrado.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {plans.map((plan) => (
                <Card key={plan.id} className="!p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-content-primary">{plan.name}</h3>
                      {plan.description && (
                        <p className="text-xs text-content-secondary mt-0.5">{plan.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(plan)}
                        className="p-1.5 text-content-muted hover:text-accent transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="p-1.5 text-content-muted hover:text-red-500 transition-colors"
                        title="Desativar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={plan.planType === "PARTICULAR" ? "success" : "default"}>
                      {plan.planType === "PARTICULAR" ? "Particular" : "Coletiva"}
                    </Badge>
                    <span className="text-sm font-bold text-content-primary">{plan.price}</span>
                    <span className="text-xs text-content-secondary">
                      {FREQUENCY_LABELS[plan.frequency] || plan.frequency}
                    </span>
                  </div>
                  {plan.monthlyCredits > 0 && (
                    <p className="text-xs text-content-muted mt-1.5">
                      {plan.monthlyCredits} créditos/mês
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "requests" && (
        <>
          {requests.length === 0 ? (
            <Card className="!p-8">
              <p className="text-content-secondary text-sm text-center">
                Nenhuma solicitação de plano pendente.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <Card key={r.id} className="!p-4 border-l-4 border-l-blue-500">
                  <div className="flex items-center gap-4">
                    <StudentAvatar name={r.user.name} photoUrl={r.user.photoUrl} size={48} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-content-primary truncate">{r.user.name}</p>
                      <p className="text-xs text-content-secondary truncate">{r.user.email}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="default">
                          Atual: {getPlanLabel(r.user.studentType)}
                        </Badge>
                        <Badge variant="success">
                          Plano {r.plan}
                        </Badge>
                        <span className="text-xs text-content-secondary">
                          {r.frequency}{r.details ? ` - ${formatDetails(r.details)}` : ""}
                        </span>
                        <span className="text-sm font-bold text-content-primary">{r.price}</span>
                      </div>
                      <p className="text-xs text-content-muted mt-1">
                        Solicitado em {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        disabled={actionId !== null}
                        onClick={() => handleApprove(r.id)}
                      >
                        <Check size={14} className="mr-1.5" />
                        Aprovar
                      </Button>
                      <button
                        disabled={actionId !== null}
                        onClick={() => handleReject(r.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Rejeitar"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPlan ? "Editar Plano" : "Novo Plano"}
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Ex: Plano Mensal Coletiva"
            required
          />

          <div className="w-full">
            <label className="block text-sm font-medium text-content-secondary mb-1.5">
              Descrição
            </label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-primary px-3 py-2.5 text-sm text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition-all"
              rows={2}
              placeholder="Descrição do plano (opcional)"
            />
          </div>

          <Input
            label="Preço"
            value={formPrice}
            onChange={(e) => setFormPrice(e.target.value)}
            placeholder="R$ 179,90"
            required
          />

          <Select
            label="Frequência"
            value={formFrequency}
            onChange={(e) => setFormFrequency(e.target.value)}
          >
            <option value="mensal">Mensal</option>
            <option value="trimestral">Trimestral</option>
            <option value="semestral">Semestral</option>
            <option value="anual">Anual</option>
          </Select>

          <Select
            label="Tipo"
            value={formPlanType}
            onChange={(e) => setFormPlanType(e.target.value)}
          >
            <option value="COLETIVA">Coletiva</option>
            <option value="PARTICULAR">Particular</option>
          </Select>

          <Input
            label="Créditos mensais"
            type="number"
            value={formCredits}
            onChange={(e) => setFormCredits(Number(e.target.value))}
            min={0}
          />

          {formError && (
            <p className="text-red-500 text-sm">{formError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} className="flex-1">
              {editingPlan ? "Salvar" : "Criar"}
            </Button>
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm text-content-secondary hover:text-content-primary transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
