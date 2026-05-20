"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BeltIcon } from "@/components/belt-icon";
import { StudentAvatar } from "@/components/student-avatar";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, Calendar, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  name: string;
  email: string;
  studentType: string;
  modalities: string;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then(setStudents)
      .finally(() => setLoading(false));
  }, []);

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
    <div>
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

      <Card>
        <h2 className="text-lg font-semibold mb-4 text-zinc-50">Alunos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-3 text-zinc-400 font-medium">Aluno</th>
                <th className="text-left py-3 px-3 text-zinc-400 font-medium hidden sm:table-cell">Tipo</th>
                <th className="text-left py-3 px-3 text-zinc-400 font-medium hidden sm:table-cell">Modalidades</th>
                <th className="text-left py-3 px-3 text-zinc-400 font-medium">Faixa</th>
                <th className="text-left py-3 px-3 text-zinc-400 font-medium hidden sm:table-cell">Check-ins</th>
                <th className="text-left py-3 px-3 text-zinc-400 font-medium hidden sm:table-cell">Pagamento</th>
                <th className="text-left py-3 px-3 text-zinc-400 font-medium"></th>
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
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <StudentAvatar name={s.name} photoUrl={s.photoUrl} size={32} />
                        <div>
                          <p className="font-medium text-zinc-50">{s.name}</p>
                          <p className="text-xs text-zinc-500">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 hidden sm:table-cell">
                      <Badge
                        variant={
                          s.studentType === "PARTICULAR" ? "success" : "default"
                        }
                      >
                        {s.studentType}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 hidden sm:table-cell">
                      <span className="text-xs text-zinc-400">
                        {(s.modalities || "GRAPPLING").split(",").map((m: string) =>
                          m === "GRAPPLING" ? "Grappling/JJ" : "MMA/Boxe"
                        ).join(", ")}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <BeltIcon belt={s.belt} size={16} />
                        <span className="text-zinc-300">
                          {s.belt}
                          {s.degrees > 0 ? ` ${s.degrees}°` : ""}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-zinc-300 hidden sm:table-cell">{s._count.bookings + s.initialCheckins}</td>
                    <td className="py-3 px-3 hidden sm:table-cell">
                      {paymentStatus ? (
                        <Badge variant={paymentStatus.variant}>
                          {paymentStatus.label}
                        </Badge>
                      ) : (
                        <span className="text-zinc-600 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <Link
                        href={`/admin/students/${s.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button size="sm" variant="secondary">
                          <Pencil size={14} className="mr-1.5" />
                          Editar
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
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
