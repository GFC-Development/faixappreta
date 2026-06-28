"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { BeltVisual } from "@/components/belt-visual";
import { PageHeader } from "@/components/page-header";

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
    return <div className="text-center py-8 text-[#9b9ca2]">Carregando...</div>;
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="Graduações" />

      {logs.length === 0 ? (
        <Card className="!p-8">
          <p className="text-[#5c5d63] text-sm text-center">
            Nenhuma graduação registrada ainda.
          </p>
        </Card>
      ) : (
        <div className="relative pl-8">
          <div className="absolute left-[15px] top-2 bottom-2 border-l-2 border-dashed border-[#e9e9ec]" />

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
                  <div className="absolute -left-[22px] top-3 w-3 h-3 rounded-full bg-accent border-2 border-[#f4f4f6]" />

                  <Card className="!p-4">
                    <div className="mb-2">
                      <BeltVisual belt={log.belt} degrees={log.degrees} width={240} />
                    </div>
                    <p className="text-sm font-medium text-[#17181c]">
                      {log.type === "BELT" ? "Promoção de Faixa" : `${log.degrees}° grau`}
                    </p>
                    <p className="text-[10px] font-spline uppercase tracking-[.1em] text-[#9b9ca2]">
                      Graduação JIU JITSU
                    </p>
                    <p className="text-xs text-[#5c5d63] mt-1">{formatted}</p>
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
