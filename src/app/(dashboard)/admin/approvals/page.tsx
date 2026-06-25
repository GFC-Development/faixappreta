"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StudentAvatar } from "@/components/student-avatar";
import { Check, X } from "lucide-react";
import { getPlanLabel, isParticular } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";

interface PendingStudent {
  id: string;
  name: string;
  email: string;
  studentType: string;
  modalities: string;
  isKids: boolean;
  photoUrl: string | null;
  createdAt: string;
}

export default function ApprovalsPage() {
  const [students, setStudents] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/students/pending")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setStudents(data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove(id: string) {
    setActionId(id);
    const res = await fetch(`/api/students/${id}/approve`, { method: "PATCH" });
    if (res.ok) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
    }
    setActionId(null);
  }

  async function handleReject(id: string) {
    if (!confirm("Rejeitar e excluir este cadastro?")) return;
    setActionId(id);
    const res = await fetch(`/api/students/${id}/approve`, { method: "DELETE" });
    if (res.ok) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
    }
    setActionId(null);
  }

  if (loading) {
    return <div className="text-center py-8 text-[#9b9ca2]">Carregando...</div>;
  }

  return (
    <div className="max-w-[800px] mx-auto">
      <PageHeader title="Aprovações de Cadastro" subtitle={`${students.length} pendente${students.length !== 1 ? "s" : ""}`} />

      {students.length === 0 ? (
        <Card>
          <p className="text-[#9b9ca2] text-[13px] text-center py-6">
            Nenhum cadastro pendente de aprovação.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {students.map((s) => (
            <Card key={s.id}>
              <div className="flex items-center gap-4">
                <StudentAvatar name={s.name} photoUrl={s.photoUrl} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[13.5px] text-[#17181c] truncate">{s.name}</p>
                  <p className="text-[11.5px] text-[#9b9ca2] truncate">{s.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant={isParticular(s.studentType) ? "success" : "default"}>
                      {getPlanLabel(s.studentType)}
                    </Badge>
                    {s.isKids && <Badge variant="warning">Kids</Badge>}
                    <span className="text-[11px] text-[#9b9ca2]">
                      {(s.modalities || "GRAPPLING").split(",").map((m) =>
                        m === "GRAPPLING" ? "Grappling" : "MMA"
                      ).join(", ")}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9b9ca2] mt-1">
                    Cadastrado em {new Date(s.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    disabled={actionId !== null}
                    onClick={() => handleApprove(s.id)}
                  >
                    <Check size={14} className="mr-1.5" />
                    Aprovar
                  </Button>
                  <button
                    disabled={actionId !== null}
                    onClick={() => handleReject(s.id)}
                    className="p-2 text-[#b42318] hover:bg-[#fdeee9] rounded-[9px] transition-colors disabled:opacity-50"
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
    </div>
  );
}
