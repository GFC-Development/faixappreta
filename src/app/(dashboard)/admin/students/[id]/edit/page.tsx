"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StudentAvatar } from "@/components/student-avatar";
import { BeltVisual } from "@/components/belt-visual";
import { BELTS } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  belt: string;
  degrees: number;
  photoUrl: string | null;
  monthlyDueDay: number | null;
  lastPaymentDate: string | null;
  lastGraduationDate: string | null;
}

export default function EditStudentPage() {
  const { id } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [studentType, setStudentType] = useState("COLETIVA");
  const [belt, setBelt] = useState("");
  const [degrees, setDegrees] = useState(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [initialCheckins, setInitialCheckins] = useState<string>("0");
  const [monthlyDueDay, setMonthlyDueDay] = useState<string>("");
  const [lastPaymentDate, setLastPaymentDate] = useState<string>("");
  const [modalities, setModalities] = useState<string[]>(["GRAPPLING"]);
  const [resetPassword, setResetPassword] = useState("");

  useEffect(() => {
    fetch(`/api/students/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setStudent(data);
          setStudentType(data.studentType || "COLETIVA");
          setBelt(data.belt);
          setDegrees(data.degrees);
          setPhotoUrl(data.photoUrl);
          setModalities((data.modalities || "GRAPPLING").split(","));
          setInitialCheckins(String(data.initialCheckins || 0));
          setMonthlyDueDay(data.monthlyDueDay ? String(data.monthlyDueDay) : "");
          setLastPaymentDate(
            data.lastPaymentDate
              ? new Date(data.lastPaymentDate).toISOString().split("T")[0]
              : ""
          );
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    let newPhotoUrl = photoUrl;

    if (photoFile) {
      const fd = new FormData();
      fd.append("file", photoFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (!uploadRes.ok) {
        setError("Erro ao enviar foto");
        setSaving(false);
        return;
      }
      const uploadData = await uploadRes.json();
      newPhotoUrl = uploadData.url;
    }

    const body: Record<string, unknown> = { studentType, belt, degrees, photoUrl: newPhotoUrl, modalities: modalities.join(","), initialCheckins: Number(initialCheckins) || 0 };
    if (monthlyDueDay) {
      body.monthlyDueDay = Number(monthlyDueDay);
    } else {
      body.monthlyDueDay = null;
    }
    if (lastPaymentDate) {
      body.lastPaymentDate = lastPaymentDate;
    } else {
      body.lastPaymentDate = null;
    }

    const res = await fetch(`/api/students/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erro ao salvar");
      setSaving(false);
      return;
    }

    router.push(`/admin/students/${id}`);
  }

  async function handleRegisterPayment() {
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    const res = await fetch(`/api/students/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lastPaymentDate: today }),
    });
    if (res.ok) {
      setLastPaymentDate(today);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir este aluno? Todos os dados serão perdidos.")) return;

    await fetch(`/api/students/${id}`, { method: "DELETE" });
    router.push("/admin");
  }

  if (loading) {
    return <div className="text-center py-8 text-zinc-500">Carregando...</div>;
  }

  if (!student) {
    return <div className="text-center py-8 text-zinc-500">Aluno não encontrado</div>;
  }

  const displayPhoto = photoPreview || photoUrl;

  return (
    <div className="max-w-lg">
      <button
        onClick={() => router.push(`/admin/students/${id}`)}
        className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-50 mb-4"
      >
        <ArrowLeft size={16} />
        Voltar ao perfil
      </button>

      <h1 className="text-2xl font-bold mb-2 text-zinc-50">Editar Aluno</h1>
      <p className="text-sm text-zinc-400 mb-6">{student.name} ({student.email})</p>

      {/* Foto */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-zinc-50">Foto</h2>
        <div className="flex items-center gap-4">
          <StudentAvatar name={student.name} photoUrl={displayPhoto} size={64} />
          <label className="cursor-pointer inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 px-3 py-1.5 text-sm bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700">
            {displayPhoto ? "Alterar foto" : "Adicionar foto"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </label>
        </div>
      </Card>

      {/* Plano */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-zinc-50">Plano</h2>
        <Select
          label="Tipo de Aula"
          value={studentType}
          onChange={(e) => setStudentType(e.target.value)}
        >
          <option value="COLETIVA">Coletiva</option>
          <option value="PARTICULAR">Particular</option>
        </Select>
      </Card>

      {/* Modalidades */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-zinc-50">Modalidades</h2>
        <div className="flex flex-col gap-3">
          {[
            { value: "GRAPPLING", label: "Grappling / Jiu-Jitsu" },
            { value: "MMA", label: "MMA / Boxe" },
          ].map((m) => (
            <label key={m.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={modalities.includes(m.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setModalities((prev) => [...prev, m.value]);
                  } else {
                    setModalities((prev) => prev.filter((v) => v !== m.value));
                  }
                }}
                className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-zinc-200">{m.label}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Graduação */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-zinc-50">Graduação</h2>

        <div className="mb-5 p-4 bg-zinc-800 rounded-lg">
          <BeltVisual belt={belt} degrees={degrees} width={280} />
        </div>

        <form onSubmit={handleSave} id="edit-form" className="space-y-4">
          <Select
            label="Faixa"
            value={belt}
            onChange={(e) => { setBelt(e.target.value); setDegrees(0); }}
          >
            {BELTS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </Select>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Graus
            </label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDegrees(d)}
                  className={`w-10 h-10 rounded-md border text-sm font-medium transition-colors ${
                    degrees === d
                      ? "bg-orange-500 text-zinc-50 border-orange-500"
                      : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

        </form>

        {student.lastGraduationDate && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-zinc-400">
              Última graduação: {new Date(student.lastGraduationDate).toLocaleDateString("pt-BR")}
            </p>
            <button
              type="button"
              onClick={async () => {
                const res = await fetch(`/api/students/${id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ lastGraduationDate: null }),
                });
                if (res.ok) {
                  setStudent((prev) => prev ? { ...prev, lastGraduationDate: null } : prev);
                }
              }}
              className="text-xs text-red-400 hover:text-red-300 underline"
            >
              Limpar data
            </button>
          </div>
        )}
      </Card>

      {/* Presenças Iniciais */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-zinc-50">Presenças Iniciais</h2>
        <p className="text-sm text-zinc-400 mb-4">
          Número de presenças anteriores ao sistema. Soma no total para progressão de faixa/grau.
        </p>
        <Input
          label="Quantidade de presenças"
          type="number"
          min="0"
          value={initialCheckins}
          onChange={(e) => setInitialCheckins(e.target.value)}
        />
      </Card>

      {/* Pagamento */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-zinc-50">Pagamento</h2>
        <div className="space-y-4">
          <Input
            label="Dia de vencimento (1-31)"
            type="number"
            min="1"
            max="31"
            value={monthlyDueDay}
            onChange={(e) => setMonthlyDueDay(e.target.value)}
            placeholder="Ex: 10"
          />
          <Input
            label="Data do último pagamento"
            type="date"
            value={lastPaymentDate}
            onChange={(e) => setLastPaymentDate(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleRegisterPayment}
            disabled={saving}
          >
            Registrar pagamento hoje
          </Button>
        </div>
      </Card>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="flex gap-2 mb-6">
        <Button type="button" disabled={saving} onClick={handleSave}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(`/admin/students/${id}`)}
        >
          Cancelar
        </Button>
      </div>

      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-2 text-zinc-50">Redefinir Senha</h2>
        <p className="text-sm text-zinc-400 mb-4">
          Defina uma nova senha temporária para o aluno.
        </p>
        <div className="flex items-end gap-3">
          <Input
            label="Nova senha"
            type="text"
            placeholder="Mínimo 6 caracteres"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={saving || resetPassword.length < 6}
            onClick={async () => {
              setSaving(true);
              const res = await fetch(`/api/students/${id}/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: resetPassword }),
              });
              if (res.ok) {
                setResetPassword("");
                alert("Senha redefinida com sucesso!");
              }
              setSaving(false);
            }}
          >
            Redefinir
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-2 text-red-400">Zona de Perigo</h2>
        <p className="text-sm text-zinc-400 mb-4">
          Ao excluir o aluno, todos os agendamentos e dados serão removidos permanentemente.
        </p>
        <Button variant="danger" onClick={handleDelete}>
          Excluir Aluno
        </Button>
      </Card>
    </div>
  );
}
