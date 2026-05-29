"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StudentAvatar } from "@/components/student-avatar";
import { Check, X } from "lucide-react";

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
    return <div className="text-center py-8 text-zinc-500">Carregando...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-zinc-50">Aprovações de Cadastro</h1>

      {students.length === 0 ? (
        <Card className="!p-8">
          <p className="text-zinc-400 text-sm text-center">
            Nenhum cadastro pendente de aprovação.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {students.map((s) => (
            <Card key={s.id} className="!p-4 border-l-4 border-l-amber-500">
              <div className="flex items-center gap-4">
                <StudentAvatar name={s.name} photoUrl={s.photoUrl} size={48} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-50 truncate">{s.name}</p>
                  <p className="text-xs text-zinc-400 truncate">{s.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={s.studentType === "PARTICULAR" ? "success" : "default"}>
                      {s.studentType === "PARTICULAR" ? "Particular" : "Coletiva"}
                    </Badge>
                    {s.isKids && <Badge variant="warning">Kids</Badge>}
                    <span className="text-xs text-zinc-500">
                      {(s.modalities || "GRAPPLING").split(",").map((m) =>
                        m === "GRAPPLING" ? "Grappling" : "MMA"
                      ).join(", ")}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
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
    </div>
  );
}
