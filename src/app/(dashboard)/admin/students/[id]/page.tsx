"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StudentAvatar } from "@/components/student-avatar";
import { BeltVisual, BeltProgress } from "@/components/belt-visual";
import { DegreeProgress } from "@/components/degree-progress";
import { getBeltsForType } from "@/lib/utils";
import { ArrowLeft, CheckCircle, XCircle, Clock, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/stat-card";

interface Booking {
  id: string;
  type: string;
  date: string;
  status: string;
  checkedIn: boolean;
  checkinStatus: string | null;
  createdAt: string;
  privateSlot?: { startTime: string; endTime: string } | null;
  groupClass?: { name: string; startTime: string; endTime: string } | null;
}

interface Student {
  id: string;
  name: string;
  email: string;
  modalities: string;
  isKids: boolean;
  belt: string;
  degrees: number;
  initialCheckins: number;
  photoUrl: string | null;
  lastGraduationDate: string | null;
  lastBeltChangeDate: string | null;
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

function getNextBelt(current: string, isKids: boolean): string | null {
  const belts = getBeltsForType(isKids);
  const idx = belts.indexOf(current);
  if (idx === -1 || idx >= belts.length - 1) return null;
  return belts[idx + 1];
}

export default function StudentProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [requirements, setRequirements] = useState<BeltRequirement[]>([]);
  const [degreeRequirements, setDegreeRequirements] = useState<DegreeRequirementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addCount, setAddCount] = useState(1);
  const [saving, setSaving] = useState(false);
  const [promoting, setPromoting] = useState(false);

  async function addManualCheckins() {
    if (addCount < 1) return;
    setSaving(true);
    const res = await fetch("/api/bookings/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id, count: addCount }),
    });
    if (res.ok) {
      const data = await res.json();
      setStudent((prev) => {
        if (!prev) return prev;
        return { ...prev, initialCheckins: data.initialCheckins };
      });
      setShowAddForm(false);
      setAddCount(1);
    }
    setSaving(false);
  }

  async function deleteBooking(bookingId: string) {
    if (!confirm("Excluir esta presença?")) return;
    const res = await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
    if (res.ok) {
      setStudent((prev) => {
        if (!prev) return prev;
        return { ...prev, bookings: prev.bookings.filter((b) => b.id !== bookingId) };
      });
    }
  }

  async function promoteBelt(isApto: boolean) {
    if (!student || !nextBelt) return;
    if (!isApto) {
      if (!confirm(`ATENÇÃO: ${student.name} ainda não preencheu os requisitos mínimos para promoção de faixa. Deseja promover mesmo assim?`)) return;
    } else {
      if (!confirm(`Promover ${student.name} para faixa ${nextBelt}?`)) return;
    }
    setPromoting(true);
    const res = await fetch(`/api/students/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        belt: nextBelt,
        degrees: 0,
        resetBeltProgress: true,
        resetDegreeProgress: true,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setStudent((prev) => prev ? { ...prev, ...updated } : prev);
    }
    setPromoting(false);
  }

  async function promoteDegree(isApto: boolean) {
    if (!student || !nextDegree) return;
    if (!isApto) {
      if (!confirm(`ATENÇÃO: ${student.name} ainda não preencheu os requisitos mínimos para o ${nextDegree}° grau. Deseja promover mesmo assim?`)) return;
    } else {
      if (!confirm(`Promover ${student.name} para ${nextDegree}° grau?`)) return;
    }
    setPromoting(true);
    const res = await fetch(`/api/students/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        degrees: nextDegree,
        resetDegreeProgress: true,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setStudent((prev) => prev ? { ...prev, ...updated } : prev);
    }
    setPromoting(false);
  }

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
    return <div className="text-center py-8 text-[#9b9ca2]">Carregando...</div>;
  }

  if (!student) {
    return <div className="text-center py-8 text-[#9b9ca2]">Aluno não encontrado</div>;
  }

  const checkins = student.bookings.filter((b) => b.checkedIn);
  const totalCheckins = checkins.length + student.initialCheckins;
  const totalBookings = student.bookings.length;
  const frequencia = totalBookings > 0
    ? Math.round((checkins.length / totalBookings) * 100)
    : 0;

  const checkinsSinceBeltChange = student.lastBeltChangeDate
    ? checkins.filter((b) => b.date > student.lastBeltChangeDate!.split("T")[0]).length
    : totalCheckins;

  const checkinsSinceGraduation = student.lastGraduationDate
    ? checkins.filter((b) => b.date > student.lastGraduationDate!.split("T")[0]).length
    : totalCheckins;

  const nextBelt = getNextBelt(student.belt, student.isKids);
  const nextBeltReq = nextBelt
    ? requirements.find((r) => r.belt === nextBelt)
    : null;

  const nextDegree = student.degrees < 4 ? student.degrees + 1 : null;
  const degreeReq = nextDegree
    ? degreeRequirements.find((r) => r.belt === student.belt && r.degree === nextDegree)
    : null;

  return (
    <div className="max-w-[700px] mx-auto">
      <button
        onClick={() => router.push("/admin")}
        className="flex items-center gap-1 text-[13px] text-[#9b9ca2] hover:text-[#17181c] mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          <StudentAvatar name={student.name} photoUrl={student.photoUrl} size={56} />
          <div>
            <h1 className="font-archivo font-bold text-xl text-[#17181c]">{student.name}</h1>
            <p className="text-[13px] text-[#9b9ca2]">{student.email}</p>
          </div>
        </div>
        <Link href={`/admin/students/${id}/edit`}>
          <Button size="sm" variant="secondary">
            <Pencil size={14} className="mr-1.5" />
            Editar
          </Button>
        </Link>
      </div>

      {/* Dados Pessoais */}
      <Card className="mb-4">
        <h2 className="font-semibold text-[14px] text-[#17181c] mb-3">Dados Pessoais</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
          <div>
            <p className="font-spline text-[9px] tracking-[.1em] uppercase text-[#a8a8ad]">Nome</p>
            <p className="font-semibold text-[#17181c] mt-0.5">{student.name}</p>
          </div>
          <div>
            <p className="font-spline text-[9px] tracking-[.1em] uppercase text-[#a8a8ad]">Email</p>
            <p className="font-semibold text-[#17181c] mt-0.5">{student.email}</p>
          </div>
          <div>
            <p className="font-spline text-[9px] tracking-[.1em] uppercase text-[#a8a8ad]">Kids</p>
            <div className="mt-0.5">
              {student.isKids ? <Badge variant="warning">Kids</Badge> : <span className="font-semibold text-[#17181c]">Não</span>}
            </div>
          </div>
          <div>
            <p className="font-spline text-[9px] tracking-[.1em] uppercase text-[#a8a8ad]">Cadastrado em</p>
            <p className="font-semibold text-[#17181c] mt-0.5">
              {new Date(student.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      </Card>

      {/* Graduação */}
      <Card className="mb-4">
        <h2 className="font-semibold text-[14px] text-[#17181c] mb-3">Graduação</h2>

        <div className="mb-2">
          <BeltVisual belt={student.belt} degrees={student.degrees} width={320} />
        </div>

        {student.lastGraduationDate && (
          <p className="text-[11px] text-[#9b9ca2] mb-3">
            Última graduação: {new Date(student.lastGraduationDate).toLocaleDateString("pt-BR")}
          </p>
        )}

        {degreeReq && (
          <>
            <DegreeProgress
              checkins={checkinsSinceGraduation}
              belt={student.belt}
              nextDegree={nextDegree!}
              requiredClasses={degreeReq.requiredClasses}
            />
            <div className={`flex items-center justify-between p-3 rounded-[9px] text-[13px] ${
              checkinsSinceGraduation >= degreeReq.requiredClasses
                ? "bg-[#e7f4ec] text-[#0f7a4d] border border-[#b9e2cb]"
                : "bg-[#fbf0dd] text-[#b45309] border border-[#f0d9a8]"
            }`}>
              <span>
                {checkinsSinceGraduation >= degreeReq.requiredClasses
                  ? `Apto para ${nextDegree}° grau`
                  : `Ainda não apto para ${nextDegree}° grau`}
              </span>
              <Button
                size="sm"
                disabled={promoting}
                onClick={() => promoteDegree(checkinsSinceGraduation >= degreeReq.requiredClasses)}
              >
                {promoting ? "..." : "Promover"}
              </Button>
            </div>
          </>
        )}

        {nextBelt && nextBeltReq && nextBeltReq.requiredClasses > 0 ? (
          <>
            <BeltProgress
              checkins={checkinsSinceBeltChange}
              nextBelt={nextBelt}
              requiredClasses={nextBeltReq.requiredClasses}
              width={320}
            />
            <div className={`flex items-center justify-between p-3 rounded-[9px] text-[13px] mt-2 ${
              checkinsSinceBeltChange >= nextBeltReq.requiredClasses
                ? "bg-[#e7f4ec] text-[#0f7a4d] border border-[#b9e2cb]"
                : "bg-[#fbf0dd] text-[#b45309] border border-[#f0d9a8]"
            }`}>
              <span>
                {checkinsSinceBeltChange >= nextBeltReq.requiredClasses
                  ? `Apto para faixa ${nextBelt}`
                  : `Ainda não apto para faixa ${nextBelt}`}
              </span>
              <Button
                size="sm"
                disabled={promoting}
                onClick={() => promoteBelt(checkinsSinceBeltChange >= nextBeltReq.requiredClasses)}
              >
                {promoting ? "..." : "Promover"}
              </Button>
            </div>
          </>
        ) : nextBelt && (!nextBeltReq || nextBeltReq.requiredClasses === 0) ? (
          <p className="text-[11.5px] text-[#9b9ca2] border-t border-[#f1f1f3] pt-3 mt-3">
            Requisito para faixa {nextBelt} não configurado.{" "}
            <Link href="/admin/belt-requirements" className="underline text-accent-dark hover:text-accent">
              Configurar
            </Link>
          </p>
        ) : (
          <p className="text-[11.5px] text-[#9b9ca2] border-t border-[#f1f1f3] pt-3 mt-3">
            Faixa máxima atingida.
          </p>
        )}
      </Card>

      {/* Frequência */}
      <div className="flex flex-wrap gap-3 mb-4">
        <StatCard label="Agendamentos" value={totalBookings} />
        <StatCard label="Check-ins" value={totalCheckins} badge={student.initialCheckins > 0 ? <span className="text-[11px] text-[#9b9ca2]">({student.initialCheckins} iniciais)</span> : undefined} />
        <StatCard label="Presença" value={`${frequencia}%`} />
      </div>

      {/* Histórico de Aulas */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[14px] text-[#17181c]">Histórico de Aulas</h2>
          <Button size="sm" variant="secondary" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={14} className="mr-1.5" />
            Adicionar Presença
          </Button>
        </div>

        {showAddForm && (
          <div className="mb-4 p-3 bg-[#f4f4f6] rounded-[9px] space-y-3">
            <p className="text-[11.5px] text-[#9b9ca2]">
              Adicione presenças retroativas para este aluno. O total será somado ao contador de check-ins.
            </p>
            <div className="flex items-end gap-3">
              <div>
                <label className="font-spline text-[9px] tracking-[.1em] uppercase text-[#a8a8ad] block mb-1">Quantidade</label>
                <input
                  type="number"
                  min={1}
                  value={addCount}
                  onChange={(e) => setAddCount(Number(e.target.value))}
                  className="w-24 h-[36px] rounded-[8px] border border-[#e6e6e9] bg-white px-3 text-sm text-[#17181c]"
                />
              </div>
              <Button size="sm" onClick={addManualCheckins} disabled={saving || addCount < 1}>
                {saving ? "Salvando..." : "Adicionar"}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {student.bookings.length === 0 && !showAddForm ? (
          <p className="text-[#9b9ca2] text-[13px] text-center py-4">
            Nenhum agendamento registrado
          </p>
        ) : (
          <div className="divide-y divide-[#f1f1f3]">
            {student.bookings.map((b) => {
              let label: string;
              if (b.type === "PRIVATE" && b.privateSlot) {
                label = `Particular: ${b.privateSlot.startTime} - ${b.privateSlot.endTime}`;
              } else if (b.type === "GROUP" && b.groupClass) {
                label = `${b.groupClass.name}: ${b.groupClass.startTime} - ${b.groupClass.endTime}`;
              } else {
                label = b.type === "PRIVATE" ? "Particular (manual)" : "Coletiva (manual)";
              }

              return (
                <div key={b.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-[13px] font-semibold text-[#17181c]">{label}</p>
                    <p className="text-[11.5px] text-[#9b9ca2]">
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
                    {b.checkinStatus === "PRESENTE" ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-[#0f7a4d]">
                        <CheckCircle size={14} /> Presente
                      </span>
                    ) : b.checkinStatus === "CANCELADO" ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-[#b45309]">
                        <Clock size={14} /> Cancelou
                      </span>
                    ) : b.checkinStatus === "AUSENTE" ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-[#b42318]">
                        <XCircle size={14} /> Ausente
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-[#9b9ca2]">
                        <Clock size={14} /> Pendente
                      </span>
                    )}
                    <button
                      onClick={() => deleteBooking(b.id)}
                      className="text-[#9b9ca2] hover:text-[#b42318] transition-colors"
                      title="Excluir presença"
                    >
                      <Trash2 size={14} />
                    </button>
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
