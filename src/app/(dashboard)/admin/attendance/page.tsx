"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { StudentAvatar } from "@/components/student-avatar";
import { Belt } from "@/components/belt";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { BELT_COLORS, KIDS_BELT_COLORS } from "@/lib/utils";

interface StudentAttendance {
  id: string;
  name: string;
  belt: string;
  degrees: number;
  photoUrl: string | null;
  checkins: number;
}

interface Summary {
  totalCheckins: number;
  totalBookings: number;
  activeStudents: number;
  avgPerStudent: number;
  topStudent: string;
  topStudentCheckins: number;
}

function getDateRange(period: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split("T")[0];

  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return { from: d.toISOString().split("T")[0], to };
  }
  if (period === "month") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return { from: d.toISOString().split("T")[0], to };
  }
  if (period === "3months") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 3);
    return { from: d.toISOString().split("T")[0], to };
  }
  return { from: to, to };
}

function getBeltColor(belt: string): string {
  if (BELT_COLORS[belt]) return BELT_COLORS[belt];
  const kids = KIDS_BELT_COLORS[belt];
  if (kids) return kids[0];
  return "#FFFFFF";
}

export default function AttendancePage() {
  const router = useRouter();
  const [period, setPeriod] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  function fetchData(from: string, to: string) {
    setLoading(true);
    fetch(`/api/attendance?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => {
        setStudents(data.students || []);
        setSummary(data.summary || null);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (period === "custom") {
      if (customFrom && customTo) fetchData(customFrom, customTo);
      return;
    }
    const { from, to } = getDateRange(period);
    fetchData(from, to);
  }, [period, customFrom, customTo]);

  const sortedStudents = [...students].sort((a, b) => b.checkins - a.checkins);

  return (
    <div className="max-w-[1000px] mx-auto">
      <PageHeader title="Presenças" />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-2 mb-5">
        {[
          { value: "week", label: "Semana" },
          { value: "month", label: "Mês" },
          { value: "3months", label: "3 Meses" },
          { value: "custom", label: "Personalizado" },
        ].map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-colors ${
              period === p.value
                ? "bg-accent text-accent-on"
                : "bg-[#f4f4f6] text-[#5c5d63] hover:bg-[#eaeaed]"
            }`}
          >
            {p.label}
          </button>
        ))}

        {period === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-[36px] rounded-[8px] border border-[#e6e6e9] bg-white px-3 text-[12px] text-[#17181c]"
            />
            <span className="text-[#9b9ca2] text-[12px]">até</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-[36px] rounded-[8px] border border-[#e6e6e9] bg-white px-3 text-[12px] text-[#17181c]"
            />
          </div>
        )}
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="flex flex-wrap gap-3 mb-5">
          <StatCard label="Check-ins" value={summary.totalCheckins} />
          <StatCard label="Alunos Ativos" value={summary.activeStudents} />
          <StatCard label="Média por aluno" value={summary.avgPerStudent} />
          <StatCard label="Mais frequente" value={summary.topStudentCheckins} badge={<span className="text-[11.5px] text-[#9b9ca2] truncate max-w-[100px]">{summary.topStudent}</span>} />
        </div>
      )}

      {/* Students table */}
      <Card className="overflow-hidden !p-0">
        <div className="px-[18px] pt-[15px] pb-3">
          <span className="font-bold text-sm text-[#17181c]">Alunos</span>
        </div>
        {loading ? (
          <div className="text-center py-8 text-[#9b9ca2] text-[13px] border-t border-[#f1f1f3]">Carregando...</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block">
              <div className="grid grid-cols-[50px_1.5fr_1fr_.6fr] gap-2.5 px-[18px] py-[9px] font-spline text-[9px] tracking-[.1em] uppercase text-[#a8a8ad] bg-[#fafafa] border-t border-[#f1f1f3]">
                <div>#</div>
                <div>Aluno</div>
                <div>Faixa</div>
                <div>Pres.</div>
              </div>
              {sortedStudents.map((s, i) => (
                <div
                  key={s.id}
                  className="grid grid-cols-[50px_1.5fr_1fr_.6fr] gap-2.5 items-center px-[18px] py-[9px] border-t border-[#f1f1f3] cursor-pointer hover:bg-[#fafafa] transition-colors"
                  onClick={() => router.push(`/admin/students/${s.id}`)}
                >
                  <div className="font-archivo font-semibold text-[13px] text-[#9b9ca2]">{i + 1}</div>
                  <div className="flex items-center gap-[9px] min-w-0">
                    <StudentAvatar name={s.name} photoUrl={s.photoUrl} size={28} />
                    <span className="font-semibold text-[12.5px] text-[#17181c] truncate">{s.name}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24">
                      <Belt color={getBeltColor(s.belt)} degrees={s.degrees} />
                    </div>
                  </div>
                  <div className="font-archivo font-semibold text-[13px] text-[#3d3e44]">{s.checkins}</div>
                </div>
              ))}
            </div>

            {/* Mobile list */}
            <div className="sm:hidden">
              {sortedStudents.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 px-4 py-3 border-t border-[#f1f1f3]"
                  onClick={() => router.push(`/admin/students/${s.id}`)}
                >
                  <span className="font-archivo font-bold text-[13px] text-[#9b9ca2] w-6 text-center">{i + 1}</span>
                  <StudentAvatar name={s.name} photoUrl={s.photoUrl} size={32} />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-[13px] text-[#17181c] truncate block">{s.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-[70px]">
                        <Belt color={getBeltColor(s.belt)} degrees={s.degrees} />
                      </div>
                      <span className="text-[11px] text-[#9b9ca2]">{s.checkins} pres.</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {sortedStudents.length === 0 && (
              <div className="py-8 text-center text-[#9b9ca2] text-[13px] border-t border-[#f1f1f3]">
                Nenhum dado de presença no período
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
