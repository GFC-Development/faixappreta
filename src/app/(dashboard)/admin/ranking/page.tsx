"use client";

import { RankingBoard } from "@/components/ranking-board";
import { PageHeader } from "@/components/page-header";

export default function RankingPage() {
  return (
    <div className="max-w-[900px] mx-auto">
      <PageHeader title="Ranking de Presenças" />
      <RankingBoard />
    </div>
  );
}
