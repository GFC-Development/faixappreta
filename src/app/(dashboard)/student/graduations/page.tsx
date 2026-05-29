"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { BeltVisual } from "@/components/belt-visual";

interface GraduationLog {
  id: string;
  belt: string;
  degrees: number;
  type: string;
  createdAt: string;
}

export default function GraduationsPage() {
  const [logs, setLogs] = useState<GraduationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/graduations")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setLogs(data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-8 text-zinc-500">Carregando...</div>;
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6 text-zinc-50">Graduações</h1>

      {logs.length === 0 ? (
        <Card className="!p-8">
          <p className="text-zinc-400 text-sm text-center">
            Nenhuma graduação registrada ainda.
          </p>
        </Card>
      ) : (
        <div className="relative pl-8">
          {/* Vertical timeline line */}
          <div className="absolute left-3 top-2 bottom-2 w-px border-l-2 border-dashed border-zinc-700" />

          <div className="space-y-6">
            {logs.map((log) => {
              const date = new Date(log.createdAt);
              const formatted = date.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

              return (
                <div key={log.id} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-5 top-3 w-3 h-3 rounded-full bg-orange-500 border-2 border-zinc-900" />

                  <Card className="!p-4">
                    <div className="mb-2">
                      <BeltVisual belt={log.belt} degrees={log.degrees} width={240} />
                    </div>
                    <p className="text-sm font-medium text-zinc-50">
                      {log.type === "BELT" ? "Promoção de Faixa" : `${log.degrees}° grau`}
                    </p>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">
                      Graduação JIU JITSU
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">{formatted}</p>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
