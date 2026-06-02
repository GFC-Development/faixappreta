"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TimeInput } from "@/components/ui/time-input";
import { Modal } from "@/components/ui/modal";
import { DAY_NAMES } from "@/lib/utils";
import { Trash2, Pencil } from "lucide-react";

interface GroupClass {
  id: string;
  name: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
  isKids: boolean;
  classType: string;
}

const emptyForm = {
  name: "",
  dayOfWeek: 1,
  startTime: "08:00",
  endTime: "09:00",
  capacity: 20,
  isKids: false,
  classType: "GROUP" as string,
};

export default function GroupClassesPage() {
  const [classes, setClasses] = useState<GroupClass[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadClasses();
  }, []);

  function loadClasses() {
    fetch("/api/group-classes")
      .then((r) => r.json())
      .then(setClasses);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/group-classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setCreateModalOpen(false);
    setForm(emptyForm);
    loadClasses();
  }

  function openEdit(gc: GroupClass) {
    setEditingId(gc.id);
    setForm({
      name: gc.name,
      dayOfWeek: gc.dayOfWeek,
      startTime: gc.startTime,
      endTime: gc.endTime,
      capacity: gc.capacity,
      isKids: gc.isKids,
      classType: gc.classType || "GROUP",
    });
    setEditModalOpen(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    await fetch(`/api/group-classes/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setEditModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    loadClasses();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta aula?")) return;
    await fetch(`/api/group-classes/${id}`, { method: "DELETE" });
    loadClasses();
  }

  const formFields = (
    <>
      <Input
        label="Nome"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
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
        label="Início"
        value={form.startTime}
        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
        required
      />
      <TimeInput
        label="Fim"
        value={form.endTime}
        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
        required
      />
      <Input
        label="Capacidade"
        type="number"
        min="1"
        value={String(form.capacity)}
        onChange={(e) =>
          setForm({ ...form, capacity: Number(e.target.value) })
        }
        required
      />
      <Select
        label="Tipo de Aula"
        value={form.classType}
        onChange={(e) => setForm({ ...form, classType: e.target.value, capacity: e.target.value === "SEMI_PRIVATE" ? 4 : form.capacity })}
      >
        <option value="GROUP">Coletiva</option>
        <option value="SEMI_PRIVATE">Semi-Particular</option>
      </Select>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isKids}
          onChange={(e) => setForm({ ...form, isKids: e.target.checked })}
          className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500"
        />
        <span className="text-sm text-zinc-200">Aula Kids</span>
      </label>
    </>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-50">Aulas</h1>
        <Button onClick={() => { setForm(emptyForm); setCreateModalOpen(true); }}>Nova Aula</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-2 px-2 text-zinc-400">Nome</th>
                <th className="text-left py-2 px-2 text-zinc-400">Dia</th>
                <th className="text-left py-2 px-2 text-zinc-400">Horário</th>
                <th className="text-left py-2 px-2 text-zinc-400">Capacidade</th>
                <th className="text-left py-2 px-2 text-zinc-400">Tipo</th>
                <th className="text-left py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {classes.map((gc) => (
                <tr key={gc.id} className="border-b border-zinc-800 hover:bg-zinc-800">
                  <td className="py-2 px-2 font-medium text-zinc-50">{gc.name}</td>
                  <td className="py-2 px-2 text-zinc-50">{DAY_NAMES[gc.dayOfWeek]}</td>
                  <td className="py-2 px-2 text-zinc-50">
                    {gc.startTime} - {gc.endTime}
                  </td>
                  <td className="py-2 px-2 text-zinc-50">{gc.capacity} alunos</td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1">
                      <Badge variant={(gc.classType || "GROUP") === "SEMI_PRIVATE" ? "warning" : "default"}>
                        {(gc.classType || "GROUP") === "SEMI_PRIVATE" ? "Semi-Particular" : "Coletiva"}
                      </Badge>
                      {gc.isKids && <Badge variant="warning">Kids</Badge>}
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(gc)}
                        className="text-zinc-400 hover:text-zinc-200"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(gc.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {classes.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    Nenhuma aula cadastrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Nova Aula"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formFields}
          <Button type="submit" className="w-full">
            Criar
          </Button>
        </form>
      </Modal>

      <Modal
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditingId(null); }}
        title="Editar Aula"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          {formFields}
          <Button type="submit" className="w-full">
            Salvar
          </Button>
        </form>
      </Modal>
    </div>
  );
}
