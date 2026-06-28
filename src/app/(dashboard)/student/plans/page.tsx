"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  frequency: string;
  planType: string;
  monthlyCredits: number;
}

interface PendingRequest {
  id: string;
  plan: string;
  frequency: string;
  price: string;
  status: string;
  createdAt: string;
}

const FREQUENCY_LABELS: Record<string, string> = {
  mensal: "Mensal",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

export default function StudentPlansPage() {
  const { data: session } = useSession();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/plans").then((r) => r.json()),
      fetch("/api/plan-upgrade/my-request").then((r) => r.json()),
    ])
      .then(([plansData, reqData]) => {
        if (Array.isArray(plansData)) setPlans(plansData);
        if (reqData && reqData.id) setPendingRequest(reqData);
      })
      .finally(() => setLoading(false));
  }, []);

  const currentType = session?.user?.studentType || "COLETIVA";

  async function handleRequest(plan: Plan) {
    setRequesting(plan.id);
    setSuccess("");

    const res = await fetch("/api/plan-upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: plan.id,
        plan: plan.name,
        frequency: plan.frequency,
        price: plan.price,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setPendingRequest(data);
      setSuccess("Solicitação enviada! Aguarde a aprovação do admin.");
    } else {
      const data = await res.json();
      setSuccess("");
      alert(data.error || "Erro ao solicitar");
    }
    setRequesting(null);
  }

  if (loading) {
    return <div className="text-center py-8 text-[#9b9ca2]">Carregando...</div>;
  }

  return (
    <div className="max-w-[900px] mx-auto">
      <PageHeader title="Planos" />

      {pendingRequest && (
        <Card className="!p-4 mb-5 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-amber-500 shrink-0" />
            <div>
              <p className="text-[13px] font-medium text-[#17181c]">
                Solicitação pendente: <span className="font-bold">{pendingRequest.plan}</span>
              </p>
              <p className="text-[11.5px] text-[#5c5d63]">
                {pendingRequest.frequency} - {pendingRequest.price} - Enviada em{" "}
                {new Date(pendingRequest.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
        </Card>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-[9px] bg-emerald-500/10 text-emerald-600 text-[13px]">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {plans.length === 0 ? (
        <Card className="!p-8">
          <p className="text-[#9b9ca2] text-[13px] text-center">
            Nenhum plano disponível no momento.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((plan) => (
            <Card key={plan.id} className="!p-5">
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-[14px] text-[#17181c]">{plan.name}</h3>
                  <Badge variant={plan.planType === "PARTICULAR" ? "success" : "default"}>
                    {plan.planType === "PARTICULAR" ? "Particular" : "Coletiva"}
                  </Badge>
                </div>
                {plan.description && (
                  <p className="text-[11.5px] text-[#9b9ca2] mt-0.5">{plan.description}</p>
                )}
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#5c5d63]">Preço</span>
                  <span className="font-archivo font-bold text-[14px] text-[#17181c]">{plan.price}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#5c5d63]">Frequência</span>
                  <span className="text-[12px] text-[#17181c]">
                    {FREQUENCY_LABELS[plan.frequency] || plan.frequency}
                  </span>
                </div>
                {plan.monthlyCredits > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[#5c5d63]">Créditos/mês</span>
                    <span className="text-[12px] text-[#17181c]">{plan.monthlyCredits}</span>
                  </div>
                )}
              </div>

              {plan.planType === currentType ? (
                <div className="w-full py-2 text-center text-[12px] text-[#9b9ca2] bg-[#f4f4f6] rounded-[9px]">
                  Seu plano atual
                </div>
              ) : (
                <Button
                  onClick={() => handleRequest(plan)}
                  disabled={!!pendingRequest || requesting !== null}
                  className="w-full"
                >
                  {requesting === plan.id ? "Enviando..." : "Solicitar"}
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
