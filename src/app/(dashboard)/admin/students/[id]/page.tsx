"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StudentAvatar } from "@/components/student-avatar";
import { BeltVisual, BeltProgress } from "@/components/belt-visual";
import { DegreeProgress } from "@/components/degree-progress";
import { BELTS } from "@/lib/utils";
import { ArrowLeft, CheckCircle, XCircle, Pencil } from "lucide-react";
import Link from "next/link";

interface Booking {
  id: string;
  type: string;
  date: string;
  status: string;
  checkedIn: boolean;
  createdAt: string;
  privateSlot?: { startTime: string; endTime: string } | null;
  groupClass?: { name: string; startTime: string; endTime: string } | null;
}

interface Student {
  id: string;
  name: string;
  email: string;
  studentType: string;
  belt: string;
  degrees: number;
  photoUrl: string | null;
  monthlyDueDay: number | null;
  lastPaymentDate: string | null;
  lastGraduationDate: string | null;
  createdAt: string;
  bookings: Booking[];
}

interface BeltRequirement {
  belt: string;
  requiredClasses: number;
}

interface DegreeRequirementData {
  belt: string;
  degree: number;
  requiredClasses: number;
}

function getNextBelt(current: string): string | null {
  const idx = BELTS.indexOf(current);
  if (idx === -1 || idx >= BELTS.length - 1) return null;
  return BELTS[idx + 1];
}

function getPaymentStatus(
  monthlyDueDay: number | null,
  lastPaymentDate: string | null
): { label: string; variant: "green" | "warning" | "danger" } | null {
  if (!monthlyDueDay) return null;
  const now = new Date();
  const currentMonth = now.getFullYear() * 12 + now.getMonth();
  if (!lastPaymentDate) return { label: "Atrasado", variant: "danger" };
  const payment = new Date(lastPaymentDate);
  const paymentMonth = payment.getFullYear() * 12 + payment.getMonth();
  const diff = currentMonth - paymentMonth;
  if (diff <= 0) return { label: "Em dia", variant: "green" };
  if (diff === 1) return { label: "Pendente", variant: "warning" };
  return { label: "Atrasado", variant: "danger" };
}

export default function StudentProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [requirements, setRequirements] = useState<BeltRequirement[]>([]);
  const [degreeRequirements, setDegreeRequirements] = useState<DegreeRequirementData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/students/${id}`).then((r) => r.json()),
      fetch("/api/belt-requirements").then((r) => r.json()),
      fetch("/api/belt-requirements?type=degree").then((r) => r.json()),
    ])
      .then(([studentData, reqData, degreeReqData]) => {
        if (!studentData.error) setStudent(studentData);
        setRequirements(reqData);
        if (Array.isArray(degreeReqData)) setDegreeRequirements(degreeReqData);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="text-center py-8 text-zinc-500">Carregando...</div>;
  }

  if (!student) {
    return <div className="text-center py-8 text-zinc-500">Aluno não encontrado</div>;
  }

  const checkins = student.bookings.filter((b) => b.checkedIn);
  const totalBookings = student.bookings.length;
  const frequencia = totalBookings > 0
    ? Math.round((checkins.length / totalBookings) * 100)
    : 0;

  const nextBelt = getNextBelt(student.belt);
  const nextBeltReq = nextBelt
    ? requirements.find((r) => r.belt === nextBelt)
    : null;

  const paymentStatus = getPaymentStatus(student.monthlyDueDay, student.lastPaymentDate);

  // Degree progress
  const nextDegree = student.degrees < 4 ? student.degrees + 1 : null;
  const degreeReq = nextDegree
    ? degreeRequirements.find((r) => r.belt === student.belt && r.degree === nextDegree)
    : null;

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => router.push("/admin")}
        className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-50 mb-4"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <StudentAvatar name={student.name} photoUrl={student.photoUrl} size={56} />
          <h1 className="text-2xl font-bold text-zinc-50">Perfil do Aluno</h1>
        </div>
        <Link href={`/admin/students/${id}/edit`}>
          <Button size="sm" variant="secondary">
            <Pencil size={14} className="mr-1.5" />
            Editar
          </Button>
        </Link>
      </div>

      {/* Dados Pessoais */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-zinc-50">Dados Pessoais</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-zinc-400">Nome</p>
            <p className="font-medium text-zinc-50">{student.name}</p>
          </div>
          <div>
            <p className="text-zinc-400">Email</p>
            <p className="font-medium text-zinc-50">{student.email}</p>
          </div>
          <div>
            <p className="text-zinc-400">Tipo de Plano</p>
            <Badge variant={student.studentType === "PARTICULAR" ? "success" : "default"}>
              {student.studentType}
            </Badge>
          </div>
          <div>
            <p className="text-zinc-400">Cadastrado em</p>
            <p className="font-medium text-zinc-50">
              {new Date(student.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      </Card>

      {/* Pagamento */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-zinc-50">Pagamento</h2>
        {student.monthlyDueDay ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-zinc-400">Dia de vencimento</p>
              <p className="font-medium text-zinc-50">Dia {student.monthlyDueDay}</p>
            </div>
            <div>
              <p className="text-zinc-400">Último pagamento</p>
              <p className="font-medium text-zinc-50">
                {student.lastPaymentDate
                  ? new Date(student.lastPaymentDate).toLocaleDateString("pt-BR")
                  : "Nenhum"}
              </p>
            </div>
            <div>
              <p className="text-zinc-400">Status</p>
              {paymentStatus && (
                <Badge variant={paymentStatus.variant}>{paymentStatus.label}</Badge>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            Vencimento não configurado.{" "}
            <Link href={`/admin/students/${id}/edit`} className="text-orange-500 underline">
              Configurar
            </Link>
          </p>
        )}
      </Card>

      {/* Graduação */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-zinc-50">Graduação</h2>

        <div className="mb-2">
          <BeltVisual belt={student.belt} degrees={student.degrees} width={320} />
        </div>

        {student.lastGraduationDate && (
          <p className="text-xs text-zinc-400 mb-3">
            Última graduação: {new Date(student.lastGraduationDate).toLocaleDateString("pt-BR")}
          </p>
        )}

        {/* Degree progress */}
        {degreeReq && (
          <DegreeProgress
            checkins={checkins.length}
            belt={student.belt}
            nextDegree={nextDegree!}
            requiredClasses={degreeReq.requiredClasses}
          />
        )}

        {/* Belt progress */}
        {nextBelt && nextBeltReq && nextBeltReq.requiredClasses > 0 ? (
          <BeltProgress
            checkins={checkins.length}
            nextBelt={nextBelt}
            requiredClasses={nextBeltReq.requiredClasses}
            width={320}
          />
        ) : nextBelt && (!nextBeltReq || nextBeltReq.requiredClasses === 0) ? (
          <p className="text-xs text-zinc-400 border-t border-zinc-800 pt-3 mt-3">
            Requisito para faixa {nextBelt} não configurado.{" "}
            <Link href="/admin/belt-requirements" className="underline text-orange-500 hover:text-orange-500/80">
              Configurar
            </Link>
          </p>
        ) : (
          <p className="text-xs text-zinc-400 border-t border-zinc-800 pt-3 mt-3">
            Faixa máxima atingida.
          </p>
        )}
      </Card>

      {/* Frequência */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-zinc-50">Frequência</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-zinc-50">{totalBookings}</p>
            <p className="text-sm text-zinc-400">Agendamentos</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-50">{checkins.length}</p>
            <p className="text-sm text-zinc-400">Check-ins</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-50">{frequencia}%</p>
            <p className="text-sm text-zinc-400">Presença</p>
          </div>
        </div>
      </Card>

      {/* Histórico de Aulas */}
      <Card>
        <h2 className="text-lg font-semibold mb-4 text-zinc-50">Histórico de Aulas</h2>
        {student.bookings.length === 0 ? (
          <p className="text-zinc-400 text-sm text-center py-4">
            Nenhum agendamento registrado
          </p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {student.bookings.map((b) => {
              const label = b.type === "PRIVATE"
                ? `Particular: ${b.privateSlot?.startTime} - ${b.privateSlot?.endTime}`
                : `${b.groupClass?.name}: ${b.groupClass?.startTime} - ${b.groupClass?.endTime}`;

              return (
                <div key={b.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-50">{label}</p>
                    <p className="text-xs text-zinc-400">
                      {new Date(b.date + "T12:00:00").toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={b.type === "PRIVATE" ? "success" : "default"}>
                      {b.type === "PRIVATE" ? "Particular" : "Coletiva"}
                    </Badge>
                    {b.checkedIn ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                        <CheckCircle size={14} />
                        Presente
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-zinc-500 text-xs">
                        <XCircle size={14} />
                        Ausente
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
