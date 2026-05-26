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
}

export default function SlotsPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Slot[] | null>(null);
  const [form, setForm] = useState({
    dayOfWeek: 1,
    startTime: "08:00",
  });
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => {
    loadSlots();
    fetch("/api/students")
      .then((r) => r.json())
      .then(setStudents);
  }, []);

  function loadSlots() {
    fetch("/api/slots")
      .then((r) => r.json())
      .then(setSlots);
  }

  function openEdit(group: Slot[]) {
    const first = group[0];
    setEditingGroup(group);
    setForm({ dayOfWeek: first.dayOfWeek, startTime: first.startTime });
    setSelectedUserIds(group.filter((s) => s.userId).map((s) => s.userId!));
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingGroup(null);
    setForm({ dayOfWeek: 1, startTime: "08:00" });
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
    const body = selectedUserIds.length > 0
      ? { ...form, userIds: selectedUserIds }
      : { ...form, userId: null };
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

    const oldUserIds = editingGroup.filter((s) => s.userId).map((s) => s.userId!);
    const oldOpenSlot = editingGroup.find((s) => !s.userId);

    // Update existing slots that stay (same user)
    const keptUserIds = selectedUserIds.filter((uid) => oldUserIds.includes(uid));
    const addedUserIds = selectedUserIds.filter((uid) => !oldUserIds.includes(uid));
    const removedUserIds = oldUserIds.filter((uid) => !selectedUserIds.includes(uid));

    // If going to open (no students selected), pick one slot to convert instead of deleting all
    const needsOpenSlot = selectedUserIds.length === 0;
    // Slot we'll reuse as open (prefer existing open slot, otherwise first removed)
    let reusedAsOpenId: string | null = null;

    if (needsOpenSlot && !oldOpenSlot && removedUserIds.length > 0) {
      const firstRemovedSlot = editingGroup.find((s) => s.userId === removedUserIds[0]);
      if (firstRemovedSlot) reusedAsOpenId = firstRemovedSlot.id;
    }

    try {
      // Update kept slots (day/time might have changed)
      for (const uid of keptUserIds) {
        const slot = editingGroup.find((s) => s.userId === uid);
        if (slot) {
          await fetch(`/api/slots/${slot.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dayOfWeek: form.dayOfWeek, startTime: form.startTime, endTime }),
          });
        }
      }

      // Delete removed student slots (skip the one we'll reuse as open)
      for (const uid of removedUserIds) {
        const slot = editingGroup.find((s) => s.userId === uid);
        if (slot && slot.id !== reusedAsOpenId) {
          await fetch(`/api/slots/${slot.id}`, { method: "DELETE" });
        }
      }

      // Handle open slot
      if (needsOpenSlot && oldOpenSlot) {
        // Keep existing open slot, update day/time
        await fetch(`/api/slots/${oldOpenSlot.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dayOfWeek: form.dayOfWeek, startTime: form.startTime, endTime }),
        });
      } else if (needsOpenSlot && reusedAsOpenId) {
        // Convert a removed student slot into an open slot
        await fetch(`/api/slots/${reusedAsOpenId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dayOfWeek: form.dayOfWeek, startTime: form.startTime, endTime, userId: null }),
        });
      } else if (selectedUserIds.length > 0 && oldOpenSlot) {
        // Remove old open slot (students were added)
        await fetch(`/api/slots/${oldOpenSlot.id}`, { method: "DELETE" });
      }

      // Create new student slots
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-50">Horários Particulares</h1>
        <Button onClick={() => { setEditingGroup(null); setModalOpen(true); }}>Novo Horário</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-2 px-2 text-zinc-400">Dia</th>
                <th className="text-left py-2 px-2 text-zinc-400">Início</th>
                <th className="text-left py-2 px-2 text-zinc-400">Fim</th>
                <th className="text-left py-2 px-2 text-zinc-400">Aluno</th>
                <th className="text-left py-2 px-2 text-zinc-400">Status</th>
                <th className="text-left py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Group slots by day+time
                const groups: Record<string, Slot[]> = {};
                for (const slot of slots) {
                  const key = `${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}`;
                  if (!groups[key]) groups[key] = [];
                  groups[key].push(slot);
                }
                return Object.values(groups).map((group) => {
                  const first = group[0];
                  return (
                    <tr key={group.map((s) => s.id).join(",")} className="border-b border-zinc-800 hover:bg-zinc-800">
                      <td className="py-2 px-2 text-zinc-50">{DAY_NAMES[first.dayOfWeek]}</td>
                      <td className="py-2 px-2 text-zinc-50">{first.startTime}</td>
                      <td className="py-2 px-2 text-zinc-50">{first.endTime}</td>
                      <td className="py-2 px-2 text-zinc-50">
                        {group.some((s) => s.user) ? (
                          <div className="flex flex-wrap gap-1">
                            {group.map((s) => s.user ? (
                              <span key={s.id} className="inline-flex items-center gap-1 bg-zinc-800 rounded px-2 py-0.5 text-xs">
                                {s.user.name}
                                <button
                                  onClick={() => handleDelete(s.id)}
                                  className="text-zinc-500 hover:text-red-400 transition-colors"
                                  title="Remover aluno"
                                >
                                  <X size={10} />
                                </button>
                              </span>
                            ) : (
                              <span key={s.id} className="text-zinc-500 text-xs">Aberto</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-zinc-500">Aberto</span>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        <button onClick={() => toggleAvailability(first)}>
                          <Badge variant={first.isAvailable ? "success" : "danger"}>
                            {first.isAvailable ? "Ativo" : "Inativo"}
                          </Badge>
                        </button>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(group)}
                            className="text-zinc-400 hover:text-zinc-200"
                            title="Editar horário"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (!confirm("Excluir este horário e todos os alunos vinculados?")) return;
                              Promise.all(group.map((s) => fetch(`/api/slots/${s.id}`, { method: "DELETE" }))).then(loadSlots);
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
              {slots.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
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
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Alunos {selectedUserIds.length > 0 && `(${selectedUserIds.length}/4)`}
            </label>
            {selectedUserIds.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {selectedUserIds.map((uid) => {
                  const student = students.find((s) => s.id === uid);
                  return (
                    <div key={uid} className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2">
                      <span className="text-sm text-zinc-50">{student?.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedUserIds((prev) => prev.filter((id) => id !== uid))}
                        className="text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {selectedUserIds.length < 4 && (
              <div className="flex items-center gap-2">
                <Select
                  label=""
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
              </div>
            )}
            {selectedUserIds.length === 0 && (
              <p className="text-xs text-zinc-500 mt-1">Deixe vazio para horário aberto ou selecione até 4 alunos.</p>
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
          <Button type="submit" className="w-full">
            {editingGroup ? "Salvar" : "Criar"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
