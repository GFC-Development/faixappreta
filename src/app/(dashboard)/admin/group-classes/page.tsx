"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TimeInput } from "@/components/ui/time-input";
import { Modal } from "@/components/ui/modal";
import { StudentAvatar } from "@/components/student-avatar";
import { DAY_NAMES } from "@/lib/utils";
import { Trash2, Pencil, Users, UserPlus, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";

interface Instructor {
  id: string;
  name: string;
}

interface Enrollment {
  id: string;
  userId: string;
  user: { id: string; name: string; photoUrl: string | null; belt?: string };
}

interface GroupClass {
  id: string;
  name: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
  isKids: boolean;
  classType: string;
  fixedRoster: boolean;
  instructorId: string | null;
  instructor: Instructor | null;
  enrollments: Enrollment[];
}

interface Professor {
  id: string;
  name: string;
  isOwner: boolean;
}

interface Student {
  id: string;
  name: string;
  photoUrl: string | null;
}

const emptyForm = {
  name: "",
  dayOfWeek: 1,
  startTime: "08:00",
  endTime: "09:00",
  capacity: 20,
  isKids: false,
  classType: "GROUP" as string,
  fixedRoster: false,
  instructorId: "" as string,
};

export default function GroupClassesPage() {
  const [classes, setClasses] = useState<GroupClass[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [enrollingClass, setEnrollingClass] = useState<GroupClass | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [enrollSearch, setEnrollSearch] = useState("");

  useEffect(() => {
    loadClasses();
    fetch("/api/professors")
      .then((r) => r.json())
      .then(setProfessors);
    fetch("/api/students")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setStudents(data.map((s: Student) => ({ id: s.id, name: s.name, photoUrl: s.photoUrl })));
      });
  }, []);

  function loadClasses() {
    fetch("/api/group-classes")
      .then((r) => r.json())
      .then(setClasses);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const submitData = { ...form, instructorId: form.instructorId || undefined };
    await fetch("/api/group-classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submitData),
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
      fixedRoster: gc.fixedRoster,
      instructorId: gc.instructorId || "",
    });
    setEditModalOpen(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const submitData = { ...form, instructorId: form.instructorId || null };
    await fetch(`/api/group-classes/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submitData),
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

  function openEnrollments(gc: GroupClass) {
    setEnrollingClass(gc);
    setEnrollSearch("");
    setEnrollModalOpen(true);
  }

  async function addEnrollment(userId: string) {
    if (!enrollingClass) return;
    const res = await fetch(`/api/group-classes/${enrollingClass.id}/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      loadClasses();
      const enrollment = await res.json();
      setEnrollingClass((prev) =>
        prev ? { ...prev, enrollments: [...prev.enrollments, enrollment] } : prev
      );
    }
  }

  async function removeEnrollment(userId: string) {
    if (!enrollingClass) return;
    const res = await fetch(`/api/group-classes/${enrollingClass.id}/enrollments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      loadClasses();
      setEnrollingClass((prev) =>
        prev ? { ...prev, enrollments: prev.enrollments.filter((e) => e.userId !== userId) } : prev
      );
    }
  }

  const enrolledIds = new Set(enrollingClass?.enrollments.map((e) => e.userId) || []);
  const availableStudents = students.filter(
    (s) =>
      !enrolledIds.has(s.id) &&
      s.name.toLowerCase().includes(enrollSearch.toLowerCase())
  );

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
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isKids}
          onChange={(e) => setForm({ ...form, isKids: e.target.checked })}
          className="w-4 h-4 rounded border-[#e6e6e9] bg-white text-accent focus:ring-accent"
        />
        <span className="text-sm text-[#17181c]">Aula Kids</span>
      </label>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.fixedRoster}
          onChange={(e) => setForm({ ...form, fixedRoster: e.target.checked })}
          className="w-4 h-4 rounded border-[#e6e6e9] bg-white text-accent focus:ring-accent"
        />
        <div>
          <span className="text-sm text-[#17181c]">Turma Fixa</span>
          <p className="text-[11px] text-[#9b9ca2]">Alunos são matriculados pelo professor e aparecem automaticamente na chamada</p>
        </div>
      </label>
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
    </>
  );

  return (
    <div className="max-w-[900px] mx-auto">
      <PageHeader title="Aulas Coletivas">
        <Button onClick={() => { setForm(emptyForm); setCreateModalOpen(true); }}>Nova Aula</Button>
      </PageHeader>

      <Card className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f1f1f3]">
                <th className="text-left py-[9px] px-[18px] font-spline text-[9px] tracking-[.1em] uppercase text-[#a8a8ad] bg-[#fafafa]">Nome</th>
                <th className="text-left py-[9px] px-[18px] font-spline text-[9px] tracking-[.1em] uppercase text-[#a8a8ad] bg-[#fafafa]">Dia</th>
                <th className="text-left py-[9px] px-[18px] font-spline text-[9px] tracking-[.1em] uppercase text-[#a8a8ad] bg-[#fafafa]">Horário</th>
                <th className="text-left py-[9px] px-[18px] font-spline text-[9px] tracking-[.1em] uppercase text-[#a8a8ad] bg-[#fafafa]">Cap.</th>
                <th className="text-left py-[9px] px-[18px] font-spline text-[9px] tracking-[.1em] uppercase text-[#a8a8ad] bg-[#fafafa]">Tipo</th>
                {professors.length > 1 && (
                  <th className="text-left py-[9px] px-[18px] font-spline text-[9px] tracking-[.1em] uppercase text-[#a8a8ad] bg-[#fafafa]">Prof.</th>
                )}
                <th className="text-left py-[9px] px-[18px] bg-[#fafafa]"></th>
              </tr>
            </thead>
            <tbody>
              {classes.map((gc) => (
                <tr key={gc.id} className="border-b border-[#f1f1f3] hover:bg-[#fafafa] transition-colors">
                  <td className="py-[9px] px-[18px] font-semibold text-[12.5px] text-[#17181c]">{gc.name}</td>
                  <td className="py-[9px] px-[18px] text-[12.5px] text-[#5c5d63]">{DAY_NAMES[gc.dayOfWeek]}</td>
                  <td className="py-[9px] px-[18px] text-[12.5px] text-[#5c5d63]">
                    {gc.startTime} - {gc.endTime}
                  </td>
                  <td className="py-[9px] px-[18px] font-archivo font-semibold text-[13px] text-[#3d3e44]">{gc.capacity}</td>
                  <td className="py-[9px] px-[18px]">
                    <div className="flex items-center gap-1">
                      {gc.fixedRoster ? (
                        <Badge variant="success">Fixa ({gc.enrollments.length})</Badge>
                      ) : (
                        <Badge variant="default">Aberta</Badge>
                      )}
                      {gc.isKids && <Badge variant="warning">Kids</Badge>}
                    </div>
                  </td>
                  {professors.length > 1 && (
                    <td className="py-[9px] px-[18px] text-[12.5px] text-[#5c5d63]">
                      {gc.instructor?.name || "-"}
                    </td>
                  )}
                  <td className="py-[9px] px-[18px]">
                    <div className="flex items-center gap-2">
                      {gc.fixedRoster && (
                        <button
                          onClick={() => openEnrollments(gc)}
                          className="text-accent hover:text-accent-dark transition-colors"
                          title="Gerenciar Alunos"
                        >
                          <Users size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(gc)}
                        className="text-[#9b9ca2] hover:text-[#17181c] transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(gc.id)}
                        className="text-[#9b9ca2] hover:text-[#b42318] transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {classes.length === 0 && (
                <tr>
                  <td colSpan={professors.length > 1 ? 7 : 6} className="py-8 text-center text-[#9b9ca2] text-[13px]">
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

      {/* Enrollment Modal */}
      <Modal
        open={enrollModalOpen}
        onClose={() => { setEnrollModalOpen(false); setEnrollingClass(null); }}
        title={`Alunos - ${enrollingClass?.name || ""}`}
      >
        <div className="space-y-4">
          {enrollingClass && enrollingClass.enrollments.length > 0 && (
            <div>
              <p className="font-spline text-[9px] tracking-[.1em] uppercase text-[#a8a8ad] mb-2">
                Matriculados ({enrollingClass.enrollments.length})
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {enrollingClass.enrollments.map((e) => (
                  <div key={e.id} className="flex items-center gap-2 p-2 rounded-[9px] bg-[#f4f4f6]">
                    <StudentAvatar name={e.user.name} photoUrl={e.user.photoUrl} size={28} />
                    <span className="text-[13px] text-[#17181c] flex-1 truncate">{e.user.name}</span>
                    <button
                      onClick={() => removeEnrollment(e.userId)}
                      className="text-[#9b9ca2] hover:text-[#b42318] p-1 transition-colors"
                      title="Remover"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Input
              label="Adicionar Aluno"
              placeholder="Buscar por nome..."
              value={enrollSearch}
              onChange={(e) => setEnrollSearch(e.target.value)}
            />
            {enrollSearch && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {availableStudents.slice(0, 10).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => addEnrollment(s.id)}
                    className="flex items-center gap-2 p-2 rounded-[9px] hover:bg-[#f4f4f6] w-full text-left transition-colors"
                  >
                    <StudentAvatar name={s.name} photoUrl={s.photoUrl} size={28} />
                    <span className="text-[13px] text-[#17181c]">{s.name}</span>
                    <UserPlus size={14} className="ml-auto text-accent" />
                  </button>
                ))}
                {availableStudents.length === 0 && (
                  <p className="text-[11.5px] text-[#9b9ca2] text-center py-2">Nenhum aluno encontrado</p>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
