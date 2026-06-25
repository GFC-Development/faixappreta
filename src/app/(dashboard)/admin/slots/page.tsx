"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { TimeInput } from "@/components/ui/time-input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { DAY_NAMES } from "@/lib/utils";
import { Pencil, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";

interface Student {
  id: string;
  name: string;
}

interface Slot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  userId: string | null;
  user: { id: string; name: string } | null;
  instructorId: string | null;
  instructor: { id: string; name: string } | null;
}

interface Professor {
  id: string;
  name: string;
  isOwner: boolean;
}

export default function SlotsPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Slot[] | null>(null);
  const [form, setForm] = useState({
    dayOfWeek: 1,
    startTime: "08:00",
    instructorId: "" as string,
  });
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => {
    loadSlots();
    fetch("/api/students")
      .then((r) => r.json())
      .then(setStudents);
    fetch("/api/professors")
      .then((r) => r.json())
      .then(setProfessors);
  }, []);

  function loadSlots() {
    fetch("/api/slots")
      .then((r) => r.json())
      .then(setSlots);
  }

  function openEdit(group: Slot[]) {
    const first = group[0];
    setEditingGroup(group);
    setForm({ dayOfWeek: first.dayOfWeek, startTime: first.startTime, instructorId: first.instructorId || "" });
    setSelectedUserIds(group.filter((s) => s.userId).map((s) => s.userId!));
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingGroup(null);
    setForm({ dayOfWeek: 1, startTime: "08:00", instructorId: "" });
    setSelectedUserIds([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingGroup) {
      await handleEdit();
    } else {
      await handleCreate();
    }
  }

  async function handleCreate() {
    const submitForm = { ...form, instructorId: form.instructorId || undefined };
    const body = selectedUserIds.length > 0
      ? { ...submitForm, userIds: selectedUserIds }
      : { ...submitForm, userId: null };
    const res = await fetch("/api/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Erro ao criar horário");
      return;
    }
    closeModal();
    loadSlots();
  }

  async function handleEdit() {
    if (!editingGroup) return;

    const [h, m] = form.startTime.split(":").map(Number);
    const endTime = `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const instructorId = form.instructorId || undefined;

    const oldUserIds = editingGroup.filter((s) => s.userId).map((s) => s.userId!);
    const oldOpenSlot = editingGroup.find((s) => !s.userId);

    const keptUserIds = selectedUserIds.filter((uid) => oldUserIds.includes(uid));
    const addedUserIds = selectedUserIds.filter((uid) => !oldUserIds.includes(uid));
    const removedUserIds = oldUserIds.filter((uid) => !selectedUserIds.includes(uid));

    const needsOpenSlot = selectedUserIds.length === 0;
    let reusedAsOpenId: string | null = null;

    if (needsOpenSlot && !oldOpenSlot && removedUserIds.length > 0) {
      const firstRemovedSlot = editingGroup.find((s) => s.userId === removedUserIds[0]);
      if (firstRemovedSlot) reusedAsOpenId = firstRemovedSlot.id;
    }

    try {
      for (const uid of keptUserIds) {
        const slot = editingGroup.find((s) => s.userId === uid);
        if (slot) {
          await fetch(`/api/slots/${slot.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dayOfWeek: form.dayOfWeek, startTime: form.startTime, endTime, instructorId }),
          });
        }
      }

      for (const uid of removedUserIds) {
        const slot = editingGroup.find((s) => s.userId === uid);
        if (slot && slot.id !== reusedAsOpenId) {
          await fetch(`/api/slots/${slot.id}`, { method: "DELETE" });
        }
      }

      if (needsOpenSlot && oldOpenSlot) {
        await fetch(`/api/slots/${oldOpenSlot.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dayOfWeek: form.dayOfWeek, startTime: form.startTime, endTime }),
        });
      } else if (needsOpenSlot && reusedAsOpenId) {
        await fetch(`/api/slots/${reusedAsOpenId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dayOfWeek: form.dayOfWeek, startTime: form.startTime, endTime, userId: null, instructorId }),
        });
      } else if (selectedUserIds.length > 0 && oldOpenSlot) {
        await fetch(`/api/slots/${oldOpenSlot.id}`, { method: "DELETE" });
      }

      if (addedUserIds.length > 0) {
        await fetch("/api/slots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, endTime, userIds: addedUserIds }),
        });
      }

      closeModal();
      loadSlots();
    } catch {
      alert("Erro ao atualizar horário");
    }
  }

  async function toggleAvailability(slot: Slot) {
    await fetch(`/api/slots/${slot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !slot.isAvailable }),
    });
    loadSlots();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este horário?")) return;
    await fetch(`/api/slots/${id}`, { method: "DELETE" });
    loadSlots();
  }

  return (
    <div className="max-w-[900px] mx-auto">
      <PageHeader title="Horários Particulares">
        <Button onClick={() => { setEditingGroup(null); setModalOpen(true); }}>Novo Horário</Button>
      </PageHeader>

      <Card className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f1f1f3]">
                <th className="text-left py-[9px] px-[18px] font-spline text-[9px] tracking-[.1em] uppercase text-[#a8a8ad] bg-[#fafafa]">Dia</th>
                <th className="text-left py-[9px] px-[18px] font-spline text-[9px] tracking-[.1em] uppercase text-[#a8a8ad] bg-[#fafafa]">Início</th>
                <th className="text-left py-[9px] px-[18px] font-spline text-[9px] tracking-[.1em] uppercase text-[#a8a8ad] bg-[#fafafa]">Fim</th>
                <th className="text-left py-[9px] px-[18px] font-spline text-[9px] tracking-[.1em] uppercase text-[#a8a8ad] bg-[#fafafa]">Aluno</th>
                <th className="text-left py-[9px] px-[18px] font-spline text-[9px] tracking-[.1em] uppercase text-[#a8a8ad] bg-[#fafafa]">Status</th>
                {professors.length > 1 && (
                  <th className="text-left py-[9px] px-[18px] font-spline text-[9px] tracking-[.1em] uppercase text-[#a8a8ad] bg-[#fafafa]">Prof.</th>
                )}
                <th className="text-left py-[9px] px-[18px] bg-[#fafafa]"></th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const groups: Record<string, Slot[]> = {};
                for (const slot of slots) {
                  const key = `${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}`;
                  if (!groups[key]) groups[key] = [];
                  groups[key].push(slot);
                }
                return Object.values(groups).map((group) => {
                  const first = group[0];
                  return (
                    <tr key={group.map((s) => s.id).join(",")} className="border-b border-[#f1f1f3] hover:bg-[#fafafa] transition-colors">
                      <td className="py-[9px] px-[18px] text-[12.5px] text-[#17181c]">{DAY_NAMES[first.dayOfWeek]}</td>
                      <td className="py-[9px] px-[18px] text-[12.5px] text-[#5c5d63]">{first.startTime}</td>
                      <td className="py-[9px] px-[18px] text-[12.5px] text-[#5c5d63]">{first.endTime}</td>
                      <td className="py-[9px] px-[18px]">
                        {group.some((s) => s.user) ? (
                          <div className="flex flex-wrap gap-1">
                            {group.map((s) => s.user ? (
                              <span key={s.id} className="inline-flex items-center gap-1 bg-[#f4f4f6] rounded-[6px] px-2 py-0.5 text-[11px] text-[#3d3e44]">
                                {s.user.name}
                                <button
                                  onClick={() => handleDelete(s.id)}
                                  className="text-[#9b9ca2] hover:text-[#b42318] transition-colors"
                                  title="Remover aluno"
                                >
                                  <X size={10} />
                                </button>
                              </span>
                            ) : (
                              <span key={s.id} className="text-[#9b9ca2] text-[11px]">Aberto</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#9b9ca2] text-[12.5px]">Aberto</span>
                        )}
                      </td>
                      <td className="py-[9px] px-[18px]">
                        <button onClick={() => toggleAvailability(first)}>
                          <Badge variant={first.isAvailable ? "green" : "danger"}>
                            {first.isAvailable ? "Ativo" : "Inativo"}
                          </Badge>
                        </button>
                      </td>
                      {professors.length > 1 && (
                        <td className="py-[9px] px-[18px] text-[12.5px] text-[#5c5d63]">
                          {first.instructor?.name || "-"}
                        </td>
                      )}
                      <td className="py-[9px] px-[18px]">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(group)}
                            className="text-[#9b9ca2] hover:text-[#17181c] transition-colors"
                            title="Editar horário"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => {
                              if (!confirm("Excluir este horário e todos os alunos vinculados?")) return;
                              Promise.all(group.map((s) => fetch(`/api/slots/${s.id}`, { method: "DELETE" }))).then(loadSlots);
                            }}
                            className="text-[#9b9ca2] hover:text-[#b42318] transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
              {slots.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#9b9ca2] text-[13px]">
                    Nenhum horário cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingGroup ? "Editar Horário" : "Novo Horário"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-spline text-[9.5px] tracking-[.1em] uppercase text-[#9b9ca2] mb-1.5">
              Alunos {selectedUserIds.length > 0 && `(${selectedUserIds.length}/4)`}
            </label>
            {selectedUserIds.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {selectedUserIds.map((uid) => {
                  const student = students.find((s) => s.id === uid);
                  return (
                    <div key={uid} className="flex items-center justify-between bg-[#f4f4f6] rounded-[9px] px-3 py-2">
                      <span className="text-[13px] text-[#17181c]">{student?.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedUserIds((prev) => prev.filter((id) => id !== uid))}
                        className="text-[#9b9ca2] hover:text-[#b42318] transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {selectedUserIds.length < 4 && (
              <Select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedUserIds((prev) => [...prev, e.target.value]);
                  }
                }}
              >
                <option value="">{selectedUserIds.length === 0 ? "Aberto (qualquer particular)" : "Adicionar aluno..."}</option>
                {students
                  .filter((s) => !selectedUserIds.includes(s.id))
                  .map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
              </Select>
            )}
            {selectedUserIds.length === 0 && (
              <p className="text-[11px] text-[#9b9ca2] mt-1">Deixe vazio para horário aberto ou selecione até 4 alunos.</p>
            )}
          </div>
          <Select
            label="Dia da Semana"
            value={String(form.dayOfWeek)}
            onChange={(e) =>
              setForm({ ...form, dayOfWeek: Number(e.target.value) })
            }
          >
            {DAY_NAMES.map((name, i) => (
              <option key={i} value={i}>
                {name}
              </option>
            ))}
          </Select>
          <TimeInput
            label="Horário de Início"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            required
          />
          {professors.length > 1 && (
            <Select
              label="Professor"
              value={form.instructorId}
              onChange={(e) => setForm({ ...form, instructorId: e.target.value })}
            >
              <option value="">Auto (eu mesmo)</option>
              {professors.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.isOwner ? " (Dono)" : ""}
                </option>
              ))}
            </Select>
          )}
          <Button type="submit" className="w-full">
            {editingGroup ? "Salvar" : "Criar"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
