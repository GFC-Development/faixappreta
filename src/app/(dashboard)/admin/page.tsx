"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BeltIcon } from "@/components/belt-icon";
import { StudentAvatar } from "@/components/student-avatar";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, Calendar, Pencil, RefreshCw, Check, UserPlus, ArrowUpCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DAY_NAMES, getPlanLabel, isPremiumOrPro } from "@/lib/utils";

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
): { label: string; variant: "green" | "warning" | "danger" } | null {
  if (!monthlyDueDay) return null;

  const now = new Date();
  const currentMonth = now.getFullYear() * 12 + now.getMonth();

  if (!lastPaymentDate) {
    return { label: "Atrasado", variant: "danger" };
  }

  const payment = new Date(lastPaymentDate);
  const paymentMonth = payment.getFullYear() * 12 + payment.getMonth();
  const diff = currentMonth - paymentMonth;

  if (diff <= 0) return { label: "Em dia", variant: "green" };
  if (diff === 1) return { label: "Pendente", variant: "warning" };
  return { label: "Atrasado", variant: "danger" };
}

export default function AdminDashboard() {
  const router = useRouter();
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
  const particular = students.filter(
    (s) => isPremiumOrPro(s.studentType)
  ).length;
  const totalCheckins = students.reduce(
    (sum, s) => sum + s._count.bookings + s.initialCheckins,
    0
  );

  if (loading) {
    return <div className="text-center py-8 text-content-muted">Carregando...</div>;
  }

  return (
    <div className="min-w-0 overflow-hidden">
      <h1 className="text-2xl font-bold mb-6 text-content-primary">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/10">
              <Users size={22} className="text-accent" />
            </div>
            <div>
              <p className="text-sm text-content-secondary">Total Alunos</p>
              <p className="text-2xl font-bold text-content-primary">{totalStudents}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <Calendar size={22} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-content-secondary">Particulares</p>
              <p className="text-2xl font-bold text-content-primary">{particular}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <CheckCircle size={22} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-content-secondary">Check-ins Totais</p>
              <p className="text-2xl font-bold text-content-primary">{totalCheckins}</p>
            </div>
          </div>
        </Card>
      </div>

      {(pendingCounts.pendingStudents > 0 || pendingCounts.pendingUpgrades > 0) && (
        <div className="space-y-3 mb-6">
          {pendingCounts.pendingStudents > 0 && (
            <Link href="/admin/approvals">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors cursor-pointer">
                <UserPlus size={20} className="text-amber-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-content-primary">
                    {pendingCounts.pendingStudents === 1
                      ? "1 novo aluno aguardando aprovação"
                      : `${pendingCounts.pendingStudents} novos alunos aguardando aprovação`}
                  </p>
                </div>
                <Badge variant="warning">{pendingCounts.pendingStudents}</Badge>
              </div>
            </Link>
          )}
          {pendingCounts.pendingUpgrades > 0 && (
            <Link href="/admin/plan-upgrades">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 transition-colors cursor-pointer">
                <ArrowUpCircle size={20} className="text-blue-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-content-primary">
                    {pendingCounts.pendingUpgrades === 1
                      ? "1 solicitação de upgrade de plano"
                      : `${pendingCounts.pendingUpgrades} solicitações de upgrade de plano`}
                  </p>
                </div>
                <Badge variant="default">{pendingCounts.pendingUpgrades}</Badge>
              </div>
            </Link>
          )}
        </div>
      )}

      {rescheduleLogs.some((l) => !l.readByAdmin) && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RefreshCw size={18} className="text-accent" />
              <h2 className="text-lg font-semibold text-content-primary">Notificações</h2>
              {rescheduleLogs.filter((l) => !l.readByAdmin).length > 0 && (
                <Badge variant="warning">
                  {rescheduleLogs.filter((l) => !l.readByAdmin).length}
                </Badge>
              )}
            </div>
            {rescheduleLogs.some((l) => !l.readByAdmin) && (
              <Button size="sm" variant="secondary" onClick={markAllLogsRead}>
                <Check size={14} className="mr-1" />
                Marcar todas
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {rescheduleLogs.filter((l) => !l.readByAdmin).slice(0, 10).map((log) => {
              const isReschedule = log.type === "RESCHEDULE" && log.newPrivateSlot;
              const isBooking = log.type === "BOOKING";
              const formatDate = (d: string) => d.split("-").reverse().slice(0, 2).join("/");

              if (isReschedule) {
                // Cascade: cancel (amber) + book (green) linked
                return (
                  <div key={log.id} className="relative">
                    <div
                      className={`flex items-center justify-between p-2.5 sm:p-3 rounded-t-lg text-xs sm:text-sm ${
                        log.readByAdmin ? "bg-surface-tertiary/50" : "bg-accent/10 border border-accent/20 border-b-0"
                      }`}
                    >
                      <div>
                        <span className="font-medium text-content-primary">{log.user.name}</span>
                        {" cancelou "}
                        <span className="font-medium text-content-primary">
                          {DAY_NAMES[log.privateSlot.dayOfWeek]} {log.privateSlot.startTime}
                        </span>
                        {" do dia "}
                        <span className="font-medium text-content-primary">{formatDate(log.date)}</span>
                      </div>
                    </div>
                    <div
                      className={`flex items-center justify-between p-2.5 sm:p-3 rounded-b-lg text-xs sm:text-sm ${
                        log.readByAdmin ? "bg-surface-tertiary/50" : "bg-emerald-500/10 border border-emerald-500/20 border-t-0"
                      }`}
                    >
                      <div>
                        <span className="font-medium text-content-primary">{log.user.name}</span>
                        {" agendou "}
                        <span className="font-medium text-content-primary">
                          {DAY_NAMES[log.newPrivateSlot!.dayOfWeek]} {log.newPrivateSlot!.startTime}
                        </span>
                        {" do dia "}
                        <span className="font-medium text-content-primary">{formatDate(log.newDate!)}</span>
                      </div>
                      {!log.readByAdmin && (
                        <button
                          onClick={() => markLogRead(log.id)}
                          className="text-content-secondary hover:text-content-primary p-1"
                          title="Marcar como lida"
                        >
                          <Check size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              // Single box: green for booking, amber for cancel
              const bgClass = isBooking
                ? (log.readByAdmin ? "bg-surface-tertiary/50" : "bg-emerald-500/10 border border-emerald-500/20")
                : (log.readByAdmin ? "bg-surface-tertiary/50" : "bg-accent/10 border border-accent/20");
              const verb = isBooking ? "agendou" : "desmarcou";

              return (
                <div
                  key={log.id}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm ${bgClass}`}
                >
                  <div>
                    <span className="font-medium text-content-primary">{log.user.name}</span>
                    {` ${verb} `}
                    <span className="font-medium text-content-primary">
                      {DAY_NAMES[log.privateSlot.dayOfWeek]} {log.privateSlot.startTime}
                    </span>
                    {" do dia "}
                    <span className="font-medium text-content-primary">{formatDate(log.date)}</span>
                  </div>
                  {!log.readByAdmin && (
                    <button
                      onClick={() => markLogRead(log.id)}
                      className="text-content-secondary hover:text-content-primary p-1"
                      title="Marcar como lida"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-semibold mb-4 text-content-primary">Alunos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 sm:px-3 text-content-secondary font-medium">Aluno</th>
                <th className="text-left py-3 px-2 sm:px-3 text-content-secondary font-medium hidden sm:table-cell">Tipo</th>
                <th className="text-left py-3 px-2 sm:px-3 text-content-secondary font-medium hidden sm:table-cell">Modalidades</th>
                <th className="text-left py-3 px-2 sm:px-3 text-content-secondary font-medium">Faixa</th>
                <th className="text-left py-3 px-2 sm:px-3 text-content-secondary font-medium hidden sm:table-cell">Check-ins</th>
                <th className="text-left py-3 px-2 sm:px-3 text-content-secondary font-medium hidden sm:table-cell">Pagamento</th>
                <th className="text-left py-3 px-1 sm:px-3 text-content-secondary font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const paymentStatus = getPaymentStatus(s.monthlyDueDay, s.lastPaymentDate);
                return (
                  <tr
                    key={s.id}
                    className="border-b border-border hover:bg-surface-tertiary cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/students/${s.id}`)}
                  >
                    <td className="py-3 px-2 sm:px-3 max-w-[140px] sm:max-w-none">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <StudentAvatar name={s.name} photoUrl={s.photoUrl} size={32} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-content-primary truncate">{s.name}</p>
                            {s.isKids && <Badge variant="warning">Kids</Badge>}
                          </div>
                          <p className="text-xs text-content-muted truncate hidden sm:block">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-3 hidden sm:table-cell">
                      <Badge
                        variant={
                          isPremiumOrPro(s.studentType) ? "success" : "default"
                        }
                      >
                        {getPlanLabel(s.studentType)}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 sm:px-3 hidden sm:table-cell">
                      <span className="text-xs text-content-secondary">
                        {(s.modalities || "GRAPPLING").split(",").map((m: string) =>
                          m === "GRAPPLING" ? "Grappling/JJ" : "MMA/Boxe"
                        ).join(", ")}
                      </span>
                    </td>
                    <td className="py-3 px-2 sm:px-3">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <BeltIcon belt={s.belt} size={16} />
                        <span className="text-content-secondary text-xs sm:text-sm whitespace-nowrap">
                          {s.belt}
                          {s.degrees > 0 ? ` ${s.degrees}°` : ""}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-3 text-content-secondary hidden sm:table-cell">{s._count.bookings + s.initialCheckins}</td>
                    <td className="py-3 px-2 sm:px-3 hidden sm:table-cell">
                      {paymentStatus ? (
                        <Badge variant={paymentStatus.variant}>
                          {paymentStatus.label}
                        </Badge>
                      ) : (
                        <span className="text-content-muted text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3 px-1 sm:px-3">
                      <Link
                        href={`/admin/students/${s.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button size="sm" variant="secondary">
                          <Pencil size={14} className="sm:mr-1.5" />
                          <span className="hidden sm:inline">Editar</span>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-content-muted"
                  >
                    Nenhum aluno cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
