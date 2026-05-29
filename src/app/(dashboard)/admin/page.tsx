"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BeltIcon } from "@/components/belt-icon";
import { StudentAvatar } from "@/components/student-avatar";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, Calendar, Pencil, RefreshCw, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DAY_NAMES } from "@/lib/utils";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/students").then((r) => r.json()),
      fetch("/api/reschedule-logs").then((r) => r.json()),
    ]).then(([studentsData, logsData]) => {
      setStudents(studentsData);
      setRescheduleLogs(Array.isArray(logsData) ? logsData : []);
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
    (s) => s.studentType === "PARTICULAR"
  ).length;
  const totalCheckins = students.reduce(
    (sum, s) => sum + s._count.bookings + s.initialCheckins,
    0
  );

  if (loading) {
    return <div className="text-center py-8 text-zinc-500">Carregando...</div>;
  }

  return (
    <div className="min-w-0 overflow-hidden">
      <h1 className="text-2xl font-bold mb-6 text-zinc-50">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-orange-500/10">
              <Users size={22} className="text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Total Alunos</p>
              <p className="text-2xl font-bold text-zinc-50">{totalStudents}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <Calendar size={22} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Particulares</p>
              <p className="text-2xl font-bold text-zinc-50">{particular}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <CheckCircle size={22} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Check-ins Totais</p>
              <p className="text-2xl font-bold text-zinc-50">{totalCheckins}</p>
            </div>
          </div>
        </Card>
      </div>

      {rescheduleLogs.some((l) => !l.readByAdmin) && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RefreshCw size={18} className="text-orange-500" />
              <h2 className="text-lg font-semibold text-zinc-50">Notificações</h2>
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
                        log.readByAdmin ? "bg-zinc-800/50" : "bg-orange-500/10 border border-orange-500/20 border-b-0"
                      }`}
                    >
                      <div>
                        <span className="font-medium text-zinc-50">{log.user.name}</span>
                        {" cancelou "}
                        <span className="font-medium text-zinc-50">
                          {DAY_NAMES[log.privateSlot.dayOfWeek]} {log.privateSlot.startTime}
                        </span>
                        {" do dia "}
                        <span className="font-medium text-zinc-50">{formatDate(log.date)}</span>
                      </div>
                    </div>
                    <div
                      className={`flex items-center justify-between p-2.5 sm:p-3 rounded-b-lg text-xs sm:text-sm ${
                        log.readByAdmin ? "bg-zinc-800/50" : "bg-emerald-500/10 border border-emerald-500/20 border-t-0"
                      }`}
                    >
                      <div>
                        <span className="font-medium text-zinc-50">{log.user.name}</span>
                        {" agendou "}
                        <span className="font-medium text-zinc-50">
                          {DAY_NAMES[log.newPrivateSlot!.dayOfWeek]} {log.newPrivateSlot!.startTime}
                        </span>
                        {" do dia "}
                        <span className="font-medium text-zinc-50">{formatDate(log.newDate!)}</span>
                      </div>
                      {!log.readByAdmin && (
                        <button
                          onClick={() => markLogRead(log.id)}
                          className="text-zinc-400 hover:text-zinc-200 p-1"
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
                ? (log.readByAdmin ? "bg-zinc-800/50" : "bg-emerald-500/10 border border-emerald-500/20")
                : (log.readByAdmin ? "bg-zinc-800/50" : "bg-orange-500/10 border border-orange-500/20");
              const verb = isBooking ? "agendou" : "desmarcou";

              return (
                <div
                  key={log.id}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm ${bgClass}`}
                >
                  <div>
                    <span className="font-medium text-zinc-50">{log.user.name}</span>
                    {` ${verb} `}
                    <span className="font-medium text-zinc-50">
                      {DAY_NAMES[log.privateSlot.dayOfWeek]} {log.privateSlot.startTime}
                    </span>
                    {" do dia "}
                    <span className="font-medium text-zinc-50">{formatDate(log.date)}</span>
                  </div>
                  {!log.readByAdmin && (
                    <button
                      onClick={() => markLogRead(log.id)}
                      className="text-zinc-400 hover:text-zinc-200 p-1"
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
        <h2 className="text-lg font-semibold mb-4 text-zinc-50">Alunos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-2 sm:px-3 text-zinc-400 font-medium">Aluno</th>
                <th className="text-left py-3 px-2 sm:px-3 text-zinc-400 font-medium hidden sm:table-cell">Tipo</th>
                <th className="text-left py-3 px-2 sm:px-3 text-zinc-400 font-medium hidden sm:table-cell">Modalidades</th>
                <th className="text-left py-3 px-2 sm:px-3 text-zinc-400 font-medium">Faixa</th>
                <th className="text-left py-3 px-2 sm:px-3 text-zinc-400 font-medium hidden sm:table-cell">Check-ins</th>
                <th className="text-left py-3 px-2 sm:px-3 text-zinc-400 font-medium hidden sm:table-cell">Pagamento</th>
                <th className="text-left py-3 px-1 sm:px-3 text-zinc-400 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const paymentStatus = getPaymentStatus(s.monthlyDueDay, s.lastPaymentDate);
                return (
                  <tr
                    key={s.id}
                    className="border-b border-zinc-800 hover:bg-zinc-800 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/students/${s.id}`)}
                  >
                    <td className="py-3 px-2 sm:px-3 max-w-[140px] sm:max-w-none">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <StudentAvatar name={s.name} photoUrl={s.photoUrl} size={32} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-zinc-50 truncate">{s.name}</p>
                            {s.isKids && <Badge variant="warning">Kids</Badge>}
                          </div>
                          <p className="text-xs text-zinc-500 truncate hidden sm:block">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-3 hidden sm:table-cell">
                      <Badge
                        variant={
                          s.studentType === "PARTICULAR" ? "success" : "default"
                        }
                      >
                        {s.studentType}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 sm:px-3 hidden sm:table-cell">
                      <span className="text-xs text-zinc-400">
                        {(s.modalities || "GRAPPLING").split(",").map((m: string) =>
                          m === "GRAPPLING" ? "Grappling/JJ" : "MMA/Boxe"
                        ).join(", ")}
                      </span>
                    </td>
                    <td className="py-3 px-2 sm:px-3">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <BeltIcon belt={s.belt} size={16} />
                        <span className="text-zinc-300 text-xs sm:text-sm whitespace-nowrap">
                          {s.belt}
                          {s.degrees > 0 ? ` ${s.degrees}°` : ""}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-3 text-zinc-300 hidden sm:table-cell">{s._count.bookings + s.initialCheckins}</td>
                    <td className="py-3 px-2 sm:px-3 hidden sm:table-cell">
                      {paymentStatus ? (
                        <Badge variant={paymentStatus.variant}>
                          {paymentStatus.label}
                        </Badge>
                      ) : (
                        <span className="text-zinc-600 text-xs">-</span>
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
                    className="py-8 text-center text-zinc-500"
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
