"use client";

import { Trophy } from "lucide-react";
import { RankingBoard } from "@/components/ranking-board";

export default function RankingPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Trophy size={28} className="text-yellow-400" />
        <h1 className="text-2xl font-bold text-zinc-50">Ranking de Presenças</h1>
      </div>
      <RankingBoard />
    </div>
  );
}
