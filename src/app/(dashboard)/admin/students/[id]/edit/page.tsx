"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StudentAvatar } from "@/components/student-avatar";
import { BeltVisual } from "@/components/belt-visual";
import { getBeltsForType } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";

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
  lastBeltChangeDate: string | null;
}

export default function EditStudentPage() {
  const { id } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [belt, setBelt] = useState("");
  const [degrees, setDegrees] = useState(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [initialCheckins, setInitialCheckins] = useState<string>("0");
  const [lastGraduationDate, setLastGraduationDate] = useState<string>("");
  const [lastBeltChangeDate, setLastBeltChangeDate] = useState<string>("");
  const [isKids, setIsKids] = useState(false);
  const [originalBelt, setOriginalBelt] = useState("");
  const [originalDegrees, setOriginalDegrees] = useState(0);
  const [resetBeltProgress, setResetBeltProgress] = useState(false);
  const [resetDegreeProgress, setResetDegreeProgress] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [monthlyCredits, setMonthlyCredits] = useState<string>("0");

  useEffect(() => {
    fetch(`/api/students/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setStudent(data);
          setBelt(data.belt);
          setOriginalBelt(data.belt);
          setDegrees(data.degrees);
          setOriginalDegrees(data.degrees);
          setPhotoUrl(data.photoUrl);
          setIsKids(data.isKids || false);
          setInitialCheckins(String(data.initialCheckins || 0));
          setMonthlyCredits(String(data.monthlyCredits || 0));
          setLastGraduationDate(
            data.lastGraduationDate
              ? new Date(data.lastGraduationDate).toISOString().split("T")[0]
              : ""
          );
          setLastBeltChangeDate(
            data.lastBeltChangeDate
              ? new Date(data.lastBeltChangeDate).toISOString().split("T")[0]
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

    const body: Record<string, unknown> = { belt, degrees, photoUrl: newPhotoUrl, modalities: "GRAPPLING", isKids, initialCheckins: Number(initialCheckins) || 0, monthlyCredits: Number(monthlyCredits) || 0 };
    if (resetBeltProgress) body.resetBeltProgress = true;
    if (resetDegreeProgress) body.resetDegreeProgress = true;
    body.lastGraduationDate = lastGraduationDate || null;
    body.lastBeltChangeDate = lastBeltChangeDate || null;

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

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir este aluno? Todos os dados serão perdidos.")) return;

    await fetch(`/api/students/${id}`, { method: "DELETE" });
    router.push("/admin");
  }

  if (loading) {
    return <div className="text-center py-8 text-[#9b9ca2]">Carregando...</div>;
  }

  if (!student) {
    return <div className="text-center py-8 text-[#9b9ca2]">Aluno não encontrado</div>;
  }

  const displayPhoto = photoPreview || photoUrl;

  return (
    <div className="max-w-[520px] mx-auto">
      <button
        onClick={() => router.push(`/admin/students/${id}`)}
        className="flex items-center gap-1 text-[13px] text-[#9b9ca2] hover:text-[#17181c] mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar ao perfil
      </button>

      <PageHeader title="Editar Aluno" subtitle={`${student.name} (${student.email})`} />

      {/* Foto */}
      <Card className="mb-4">
        <h2 className="font-semibold text-[14px] text-[#17181c] mb-3">Foto</h2>
        <div className="flex items-center gap-4">
          <StudentAvatar name={student.name} photoUrl={displayPhoto} size={64} />
          <label className="cursor-pointer inline-flex items-center justify-center rounded-[9px] font-semibold transition-colors px-3 py-1.5 text-[13px] bg-[#f4f4f6] text-[#17181c] border border-[#e9e9ec] hover:bg-[#eaeaed]">
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

      {/* Kids */}
      <Card className="mb-4">
        <h2 className="font-semibold text-[14px] text-[#17181c] mb-3">Configurações</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isKids}
            onChange={(e) => {
              setIsKids(e.target.checked);
              setBelt("BRANCA");
              setDegrees(0);
            }}
            className="w-4 h-4 rounded border-[#e6e6e9] bg-white text-accent focus:ring-accent"
          />
          <span className="text-[13px] text-[#17181c]">Aluno Kids</span>
        </label>
      </Card>

      {/* Graduação */}
      <Card className="mb-4">
        <h2 className="font-semibold text-[14px] text-[#17181c] mb-3">Graduação</h2>

        <div className="mb-5 p-4 bg-[#f4f4f6] rounded-[9px]">
          <BeltVisual belt={belt} degrees={degrees} width={280} />
        </div>

        <form onSubmit={handleSave} id="edit-form" className="space-y-4">
          <Select
            label="Faixa"
            value={belt}
            onChange={(e) => { setBelt(e.target.value); setDegrees(0); }}
          >
            {getBeltsForType(isKids).map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </Select>
          {belt !== originalBelt && (
            <label className="flex items-start gap-3 cursor-pointer text-[11.5px] text-[#b45309] bg-[#fbf0dd] border border-[#f0d9a8] rounded-[9px] px-3 py-2">
              <input
                type="checkbox"
                checked={resetBeltProgress}
                onChange={(e) => setResetBeltProgress(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-[#e6e6e9] bg-white text-accent focus:ring-accent shrink-0"
              />
              <span>Resetar progresso para a próxima faixa (marque se for uma promoção real, desmarque se for apenas ajuste cadastral)</span>
            </label>
          )}

          <div>
            <label className="block font-spline text-[9.5px] tracking-[.1em] uppercase text-[#9b9ca2] mb-2">
              Graus
            </label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDegrees(d)}
                  className={`w-10 h-10 rounded-[8px] border text-sm font-semibold transition-colors ${
                    degrees === d
                      ? "bg-accent text-accent-on border-accent"
                      : "bg-[#f4f4f6] text-[#5c5d63] border-[#e9e9ec] hover:bg-[#eaeaed]"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            {degrees !== originalDegrees && (
              <label className="flex items-start gap-3 cursor-pointer text-[11.5px] text-[#b45309] bg-[#fbf0dd] border border-[#f0d9a8] rounded-[9px] px-3 py-2 mt-2">
                <input
                  type="checkbox"
                  checked={resetDegreeProgress}
                  onChange={(e) => setResetDegreeProgress(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-[#e6e6e9] bg-white text-accent focus:ring-accent shrink-0"
                />
                <span>Resetar progresso para o próximo grau (marque se for uma promoção real, desmarque se for apenas ajuste cadastral)</span>
              </label>
            )}
          </div>
        </form>

        <div className="mt-4 space-y-4">
          <Input
            label="Última graduação (grau)"
            type="date"
            value={lastGraduationDate}
            onChange={(e) => setLastGraduationDate(e.target.value)}
          />
          <Input
            label="Última troca de faixa"
            type="date"
            value={lastBeltChangeDate}
            onChange={(e) => setLastBeltChangeDate(e.target.value)}
          />
          <p className="text-[11px] text-[#9b9ca2]">
            Estas datas controlam a contagem de presenças para progressão. Deixe em branco para contar desde o início.
          </p>
        </div>
      </Card>

      {/* Presenças Iniciais */}
      <Card className="mb-4">
        <h2 className="font-semibold text-[14px] text-[#17181c] mb-2">Presenças Iniciais</h2>
        <p className="text-[13px] text-[#9b9ca2] mb-3">
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

      {error && <p className="text-sm text-[#b42318] mb-4">{error}</p>}

      <div className="flex gap-2 mb-4">
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

      <Card className="mb-4">
        <h2 className="font-semibold text-[14px] text-[#17181c] mb-2">Redefinir Senha</h2>
        <p className="text-[13px] text-[#9b9ca2] mb-3">
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
        <h2 className="font-semibold text-[14px] text-[#b42318] mb-2">Zona de Perigo</h2>
        <p className="text-[13px] text-[#9b9ca2] mb-3">
          Ao excluir o aluno, todos os agendamentos e dados serão removidos permanentemente.
        </p>
        <Button variant="danger" onClick={handleDelete}>
          Excluir Aluno
        </Button>
      </Card>
    </div>
  );
}
