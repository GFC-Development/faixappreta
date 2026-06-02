"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { StudentAvatar } from "@/components/student-avatar";
import { Trophy } from "lucide-react";

interface RankedStudent {
  id: string;
  name: string;
  photoUrl: string | null;
  belt: string;
  degrees: number;
  presences: number;
}

function badgeClass(position: number): string {
  switch (position) {
    case 1: return "bg-yellow-500 text-zinc-900";
    case 2: return "bg-gray-300 text-zinc-900";
    case 3: return "bg-amber-700 text-zinc-900";
    default: return "bg-white text-zinc-900";
  }
}

function presColor(position: number): string {
  switch (position) {
    case 1: return "text-yellow-400";
    case 2: return "text-gray-300";
    case 3: return "text-amber-600";
    default: return "text-zinc-400";
  }
}

export function RankingBoard({ compact = false }: { compact?: boolean }) {
  const [ranking, setRanking] = useState<RankedStudent[]>([]);
  const [monthLabel, setMonthLabel] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ranking")
      .then((r) => r.json())
      .then((data) => {
        setRanking(data.ranked || []);
        setMonthLabel(data.monthLabel || "");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-4 text-zinc-500">Carregando...</div>;
  }

  if (ranking.length === 0) {
    return (
      <p className="text-zinc-400 text-sm text-center py-4">
        Nenhum aluno com presenças registradas
      </p>
    );
  }

  const top2 = ranking.slice(0, 2);
  const rest = ranking.slice(2);
  const avatarTop = compact ? 44 : 72;
  const avatarRest = compact ? 34 : 56;

  return (
    <div className="space-y-2">
      {monthLabel && (
        <p className={`${compact ? "text-xs" : "text-sm"} text-zinc-400 text-center capitalize`}>
          {monthLabel}
        </p>
      )}
      {/* Top 2 */}
      <div className="grid grid-cols-2 gap-2">
        {top2.map((student, i) => {
          const pos = i + 1;
          const isChampion = pos === 1;
          const border = isChampion
            ? "border-2 border-yellow-500/30 bg-gradient-to-b from-yellow-500/5 to-transparent"
            : "border border-zinc-700";

          return (
            <Card key={student.id} className={`!p-0 overflow-hidden ${border}`}>
              <div className={`flex items-center gap-3 ${compact ? "p-2.5" : "p-5"}`}>
                <div className="relative shrink-0">
                  <StudentAvatar name={student.name} photoUrl={student.photoUrl} size={avatarTop} />
                  <div className={`absolute -top-1.5 -left-1.5 ${compact ? "w-5 h-5 text-[10px]" : "w-7 h-7 text-xs"} rounded-full flex items-center justify-center font-bold shadow-lg ${badgeClass(pos)}`}>
                    {pos}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {isChampion && <Trophy size={compact ? 12 : 18} className="text-yellow-400 shrink-0" />}
                    <p className={`${compact ? "text-xs" : "text-lg"} font-bold text-zinc-50 truncate`}>{student.name}</p>
                  </div>
                  <p className={`${compact ? "text-[10px]" : "text-xs"} ${presColor(pos)} font-semibold mt-0.5`}>
                    {student.presences} {student.presences === 1 ? "presença" : "presenças"}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 3-10 grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {rest.map((student, i) => {
          const pos = i + 3;
          return (
            <Card key={student.id} className="!p-2">
              <div className="flex flex-col items-center text-center gap-1">
                <div className="relative">
                  <StudentAvatar name={student.name} photoUrl={student.photoUrl} size={avatarRest} />
                  <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow ${badgeClass(pos)}`}>
                    {pos}
                  </div>
                </div>
                <p className={`font-semibold ${compact ? "text-[11px]" : "text-sm"} text-zinc-50 truncate w-full`}>{student.name}</p>
                <p className={`${compact ? "text-[10px]" : "text-xs"} ${presColor(pos)} font-semibold`}>
                  {student.presences} {student.presences === 1 ? "presença" : "presenças"}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
