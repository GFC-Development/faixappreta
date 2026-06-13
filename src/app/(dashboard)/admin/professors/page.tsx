"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";

interface Professor {
  id: string;
  name: string;
  email: string;
  isOwner: boolean;
  classCount: number;
  slotCount: number;
}

const emptyForm = { name: "", email: "", password: "" };

export default function ProfessorsPage() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadProfessors();
  }, []);

  function loadProfessors() {
    fetch("/api/professors")
      .then((r) => r.json())
      .then(setProfessors);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/professors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Erro ao criar professor");
      return;
    }
    setCreateModalOpen(false);
    setForm(emptyForm);
    loadProfessors();
  }

  function openEdit(p: Professor) {
    setEditingId(p.id);
    setForm({ name: p.name, email: p.email, password: "" });
    setEditModalOpen(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const body: Record<string, string> = {};
    if (form.name) body.name = form.name;
    if (form.email) body.email = form.email;
    if (form.password) body.password = form.password;

    const res = await fetch(`/api/professors/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Erro ao editar professor");
      return;
    }
    setEditModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    loadProfessors();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este professor? As aulas vinculadas ficarao sem professor.")) return;
    await fetch(`/api/professors/${id}`, { method: "DELETE" });
    loadProfessors();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-content-primary">Professores</h1>
        <Button onClick={() => { setForm(emptyForm); setCreateModalOpen(true); }}>
          Novo Professor
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-content-secondary">Nome</th>
                <th className="text-left py-2 px-2 text-content-secondary">Email</th>
                <th className="text-left py-2 px-2 text-content-secondary">Aulas</th>
                <th className="text-left py-2 px-2 text-content-secondary">Tipo</th>
                <th className="text-left py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {professors.map((p) => (
                <tr key={p.id} className="border-b border-border hover:bg-surface-tertiary">
                  <td className="py-2 px-2 font-medium text-content-primary">{p.name}</td>
                  <td className="py-2 px-2 text-content-primary">{p.email}</td>
                  <td className="py-2 px-2 text-content-primary">
                    {p.classCount + p.slotCount} aula(s)
                  </td>
                  <td className="py-2 px-2">
                    <Badge variant={p.isOwner ? "default" : "warning"}>
                      {p.isOwner ? "Dono" : "Professor"}
                    </Badge>
                  </td>
                  <td className="py-2 px-2">
                    {!p.isOwner && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="text-content-secondary hover:text-content-primary"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {professors.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-content-muted">
                    Nenhum professor cadastrado
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
        title="Novo Professor"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="Senha"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
          />
          <Button type="submit" className="w-full">
            Criar
          </Button>
        </form>
      </Modal>

      <Modal
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditingId(null); }}
        title="Editar Professor"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Nova Senha (deixe vazio para manter)"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={6}
          />
          <Button type="submit" className="w-full">
            Salvar
          </Button>
        </form>
      </Modal>
    </div>
  );
}
