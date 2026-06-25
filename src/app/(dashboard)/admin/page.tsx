"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StudentAvatar } from "@/components/student-avatar";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DAY_NAMES, getPlanLabel, isParticular } from "@/lib/utils";
import { useTenantInfo } from "@/components/tenant-theme";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Belt } from "@/components/belt";
import { BELT_COLORS, KIDS_BELT_COLORS } from "@/lib/utils";

interface RescheduleLog {
  id: string;
  type: string;
  date: string;
  newDate: string | null;
  readByAdmin: boolean;
  createdAt: string;
  user: { id: string; name: string };
  privateSlot: { dayOfWeek: number; startTime: string };
  newPrivateSlot: { dayOfWeek: number; startTime: string } | null;
}

interface Student {
  id: string;
  name: string;
  email: string;
  studentType: string;
  modalities: string;
  isKids: boolean;
  belt: string;
  degrees: number;
  photoUrl: string | null;
  monthlyDueDay: number | null;
  lastPaymentDate: string | null;
  initialCheckins: number;
  _count: { bookings: number };
}

function getPaymentStatus(
  monthlyDueDay: number | null,
  lastPaymentDate: string | null
): { label: string; color: string } | null {
  if (!monthlyDueDay) return null;

  const now = new Date();
  const currentMonth = now.getFullYear() * 12 + now.getMonth();

  if (!lastPaymentDate) {
    return { label: "Atrasado", color: "#b42318" };
  }

  const payment = new Date(lastPaymentDate);
  const paymentMonth = payment.getFullYear() * 12 + payment.getMonth();
  const diff = currentMonth - paymentMonth;

  if (diff <= 0) return { label: "Em dia", color: "#0f7a4d" };
  if (diff === 1) return { label: "Pendente", color: "#b45309" };
  return { label: "Atrasado", color: "#b42318" };
}

function getBeltColor(belt: string): string {
  if (BELT_COLORS[belt]) return BELT_COLORS[belt];
  const kids = KIDS_BELT_COLORS[belt];
  if (kids) return kids[0];
  return "#FFFFFF";
}

export default function AdminDashboard() {
  const router = useRouter();
  const tenantInfo = useTenantInfo();
  const [students, setStudents] = useState<Student[]>([]);
  const [rescheduleLogs, setRescheduleLogs] = useState<RescheduleLog[]>([]);
  const [pendingCounts, setPendingCounts] = useState<{ pendingStudents: number; pendingUpgrades: number }>({ pendingStudents: 0, pendingUpgrades: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/students").then((r) => r.json()).catch(() => []),
      fetch("/api/reschedule-logs").then((r) => r.json()).catch(() => []),
      fetch("/api/admin/pending-counts").then((r) => r.ok ? r.json() : { pendingStudents: 0, pendingUpgrades: 0 }).catch(() => ({ pendingStudents: 0, pendingUpgrades: 0 })),
    ]).then(([studentsData, logsData, counts]) => {
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setRescheduleLogs(Array.isArray(logsData) ? logsData : []);
      if (counts && typeof counts.pendingStudents === "number") setPendingCounts(counts);
    }).finally(() => setLoading(false));
  }, []);

  async function markLogRead(logId: string) {
    const res = await fetch(`/api/reschedule-logs/${logId}`, { method: "PATCH" });
    if (res.ok) {
      setRescheduleLogs((prev) => prev.map((l) => l.id === logId ? { ...l, readByAdmin: true } : l));
    }
  }

  async function markAllLogsRead() {
    const unread = rescheduleLogs.filter((l) => !l.readByAdmin);
    await Promise.all(unread.map((l) => fetch(`/api/reschedule-logs/${l.id}`, { method: "PATCH" })));
    setRescheduleLogs((prev) => prev.map((l) => ({ ...l, readByAdmin: true })));
  }

  const totalStudents = students.length;
  const particular = students.filter((s) => isParticular(s.studentType)).length;
  const totalCheckins = students.reduce((sum, s) => sum + s._count.bookings + s.initialCheckins, 0);

  if (loading) {
    return <div className="text-center py-8 text-content-muted">Carregando...</div>;
  }

  return (
    <div className="max-w-[1180px] mx-auto">
      <PageHeader title="Visão geral">
        <div className="flex gap-2">
          <Link href="/admin/roll-call">
            <Button variant="primary" size="lg">+ Fazer chamada</Button>
          </Link>
        </div>
      </PageHeader>

      {/* Stats */}
      <div className="flex flex-wrap gap-3 mb-3.5">
        <StatCard label="Alunos ativos" value={totalStudents} />
        <StatCard label="Particular" value={particular} badge={<span className="text-[11.5px] text-[#9b9ca2]">alunos</span>} />
        <StatCard label="Check-ins total" value={totalCheckins} />
      </div>

      {/* Pending alerts */}
      <div className="flex flex-wrap gap-3 mb-3.5">
        {pendingCounts.pendingStudents > 0 && (
          <Link href="/admin/approvals" className="flex-1 min-w-[220px]">
            <Card className="border-[#f0e3c8] flex items-center gap-3 cursor-pointer hover:bg-[#fafafa] transition-colors">
              <div className="w-[34px] h-[34px] flex-none rounded-[9px] bg-[#fbf0dd] text-[#b45309] flex items-center justify-center font-archivo font-bold text-[15px]">
                {pendingCounts.pendingStudents}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-[13px] text-[#17181c]">Aprovações pendentes</div>
                <div className="text-[11.5px] text-[#9b9ca2]">Novos cadastros</div>
              </div>
              <span className="text-accent-dark font-bold">→</span>
            </Card>
          </Link>
        )}
        {pendingCounts.pendingUpgrades > 0 && tenantInfo?.enablePlans !== false && (
          <Link href="/admin/plans" className="flex-1 min-w-[220px]">
            <Card className="flex items-center gap-3 cursor-pointer hover:bg-[#fafafa] transition-colors">
              <div className="w-[34px] h-[34px] flex-none rounded-[9px] bg-[#fdf0db] text-accent-dark flex items-center justify-center font-archivo font-bold text-[15px]">
                {pendingCounts.pendingUpgrades}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-[13px] text-[#17181c]">Pedidos de upgrade</div>
                <div className="text-[11.5px] text-[#9b9ca2]">Mudança de plano</div>
              </div>
              <span className="text-[#9b9ca2] font-bold">→</span>
            </Card>
          </Link>
        )}
      </div>

      {/* Reschedule notifications */}
      {rescheduleLogs.some((l) => !l.readByAdmin) && (
        <Card className="mb-3.5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#17181c]">Notificações</span>
              <span className="h-[18px] min-w-[18px] rounded-[9px] bg-accent text-[#17181c] text-[10px] font-bold flex items-center justify-center px-1.5">
                {rescheduleLogs.filter((l) => !l.readByAdmin).length}
              </span>
            </div>
            <Button size="sm" variant="secondary" onClick={markAllLogsRead}>
              <Check size={14} className="mr-1" />
              Marcar todas
            </Button>
          </div>
          <div className="space-y-2">
            {rescheduleLogs.filter((l) => !l.readByAdmin).slice(0, 10).map((log) => {
              const isReschedule = log.type === "RESCHEDULE" && log.newPrivateSlot;
              const isBooking = log.type === "BOOKING";
              const formatDate = (d: string) => d.split("-").reverse().slice(0, 2).join("/");

              if (isReschedule) {
                return (
                  <div key={log.id} className="relative">
                    <div className="flex items-center justify-between p-3 rounded-t-lg text-[13px] bg-accent/10 border border-accent/20 border-b-0">
                      <div>
                        <span className="font-semibold text-[#17181c]">{log.user.name}</span>
                        {" cancelou "}
                        <span className="font-semibold text-[#17181c]">
                          {DAY_NAMES[log.privateSlot.dayOfWeek]} {log.privateSlot.startTime}
                        </span>
                        {" do dia "}
                        <span className="font-semibold text-[#17181c]">{formatDate(log.date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-b-lg text-[13px] bg-[#e7f4ec] border border-[#b9e2cb] border-t-0">
                      <div>
                        <span className="font-semibold text-[#17181c]">{log.user.name}</span>
                        {" agendou "}
                        <span className="font-semibold text-[#17181c]">
                          {DAY_NAMES[log.newPrivateSlot!.dayOfWeek]} {log.newPrivateSlot!.startTime}
                        </span>
                        {" do dia "}
                        <span className="font-semibold text-[#17181c]">{formatDate(log.newDate!)}</span>
                      </div>
                      <button onClick={() => markLogRead(log.id)} className="text-[#5c5d63] hover:text-[#17181c] p-1" title="Marcar como lida">
                        <Check size={16} />
                      </button>
                    </div>
                  </div>
                );
              }

              const bgClass = isBooking ? "bg-[#e7f4ec] border border-[#b9e2cb]" : "bg-accent/10 border border-accent/20";
              const verb = isBooking ? "agendou" : "desmarcou";

              return (
                <div key={log.id} className={`flex items-center justify-between p-3 rounded-lg text-[13px] ${bgClass}`}>
                  <div>
                    <span className="font-semibold text-[#17181c]">{log.user.name}</span>
                    {` ${verb} `}
                    <span className="font-semibold text-[#17181c]">
                      {DAY_NAMES[log.privateSlot.dayOfWeek]} {log.privateSlot.startTime}
                    </span>
                    {" do dia "}
                    <span className="font-semibold text-[#17181c]">{formatDate(log.date)}</span>
                  </div>
                  <button onClick={() => markLogRead(log.id)} className="text-[#5c5d63] hover:text-[#17181c] p-1" title="Marcar como lida">
                    <Check size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Students table */}
      <Card className="overflow-hidden !p-0">
        <div className="flex items-center justify-between px-[18px] pt-[15px] pb-3">
          <span className="font-bold text-sm text-[#17181c]">Alunos recentes</span>
          <Link href="/admin/approvals" className="text-xs text-accent-dark font-semibold cursor-pointer">Ver todos</Link>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block">
          <div className="grid grid-cols-[1.7fr_1.2fr_.6fr_.9fr_.7fr_.9fr] gap-2.5 px-[18px] py-[9px] font-spline text-[9px] tracking-[.1em] uppercase text-[#a8a8ad] bg-[#fafafa] border-t border-[#f1f1f3]">
            <div>Aluno</div>
            <div>Faixa</div>
            <div>Grau</div>
            <div>Tipo</div>
            <div>Pres.</div>
            <div>Pagto</div>
          </div>
          {students.slice(0, 10).map((s) => {
            const paymentStatus = getPaymentStatus(s.monthlyDueDay, s.lastPaymentDate);
            const checkins = s._count.bookings + s.initialCheckins;
            return (
              <div
                key={s.id}
                className="grid grid-cols-[1.7fr_1.2fr_.6fr_.9fr_.7fr_.9fr] gap-2.5 items-center px-[18px] py-[9px] border-t border-[#f1f1f3] cursor-pointer hover:bg-[#fafafa] transition-colors"
                onClick={() => router.push(`/admin/students/${s.id}`)}
              >
                <div className="flex items-center gap-[9px] min-w-0">
                  <StudentAvatar name={s.name} photoUrl={s.photoUrl} size={28} />
                  <span className="font-semibold text-[12.5px] text-[#17181c] truncate">{s.name}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-24">
                    <Belt color={getBeltColor(s.belt)} degrees={s.degrees} />
                  </div>
                </div>
                <div className="font-archivo font-semibold text-[13px] text-[#5c5d63]">{s.degrees}º</div>
                <div>
                  <Badge variant={isParticular(s.studentType) ? "success" : "default"}>
                    {getPlanLabel(s.studentType)}
                  </Badge>
                </div>
                <div className="font-archivo font-semibold text-[13px] text-[#3d3e44]">{checkins}</div>
                <div>
                  {paymentStatus ? (
                    <span className="text-[11px] font-semibold" style={{ color: paymentStatus.color }}>
                      ● {paymentStatus.label}
                    </span>
                  ) : (
                    <span className="text-[#9b9ca2] text-xs">-</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile list */}
        <div className="sm:hidden">
          {students.slice(0, 10).map((s) => {
            const paymentStatus = getPaymentStatus(s.monthlyDueDay, s.lastPaymentDate);
            const checkins = s._count.bookings + s.initialCheckins;
            return (
              <div
                key={s.id}
                className="flex items-center gap-[11px] px-4 py-3 border-t border-[#f1f1f3]"
                onClick={() => router.push(`/admin/students/${s.id}`)}
              >
                <StudentAvatar name={s.name} photoUrl={s.photoUrl} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[13.5px] text-[#17181c]">{s.name}</span>
                    {paymentStatus && (
                      <span className="text-[11px] font-semibold" style={{ color: paymentStatus.color }}>
                        ● {paymentStatus.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 mt-[7px]">
                    <div className="w-[90px]">
                      <Belt color={getBeltColor(s.belt)} degrees={s.degrees} />
                    </div>
                    <span className="text-[11px] text-[#9b9ca2]">{checkins} pres.</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {students.length === 0 && (
          <div className="py-8 text-center text-[#9b9ca2] text-[13px] border-t border-[#f1f1f3]">
            Nenhum aluno cadastrado
          </div>
        )}
      </Card>
    </div>
  );
}
