"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StudentAvatar } from "@/components/student-avatar";
import { PageHeader } from "@/components/page-header";

export default function AccountPage() {
  const { data: session, update } = useSession();
  const [photoUrl, setPhotoUrl] = useState<string | null>(session?.user.photoUrl ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  if (!session) return null;

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setPhotoSuccess(false);
    }
  }

  async function handleSavePhoto() {
    if (!photoFile) return;
    setSavingPhoto(true);

    const fd = new FormData();
    fd.append("file", photoFile);
    const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
    if (!uploadRes.ok) {
      setSavingPhoto(false);
      return;
    }
    const { url } = await uploadRes.json();

    const res = await fetch("/api/student/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrl: url }),
    });

    if (res.ok) {
      setPhotoUrl(url);
      setPhotoFile(null);
      setPhotoPreview(null);
      setPhotoSuccess(true);
      update();
    }
    setSavingPhoto(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError("Nova senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem");
      return;
    }

    setSavingPassword(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();
    setSavingPassword(false);

    if (!res.ok) {
      setPasswordError(data.error || "Erro ao alterar senha");
      return;
    }

    setPasswordSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  const displayPhoto = photoPreview || photoUrl;

  return (
    <div className="max-w-[520px] mx-auto">
      <PageHeader title="Minha Conta" />

      <Card className="mb-4">
        <h2 className="font-semibold text-[14px] text-[#17181c] mb-3">Foto de Perfil</h2>
        <div className="flex items-center gap-4 mb-4">
          <StudentAvatar name={session.user.name} photoUrl={displayPhoto} size={64} />
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
        {photoFile && (
          <Button size="sm" onClick={handleSavePhoto} disabled={savingPhoto}>
            {savingPhoto ? "Salvando..." : "Salvar foto"}
          </Button>
        )}
        {photoSuccess && (
          <p className="text-sm text-emerald-600 mt-2">Foto atualizada!</p>
        )}
      </Card>

      <Card className="mb-4">
        <h2 className="font-semibold text-[14px] text-[#17181c] mb-3">Alterar Senha</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Senha atual"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            label="Nova senha"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
          />
          <Input
            label="Confirmar nova senha"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {passwordError && (
            <p className="text-sm text-[#b42318]">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="text-sm text-emerald-600">Senha alterada com sucesso!</p>
          )}
          <Button type="submit" disabled={savingPassword}>
            {savingPassword ? "Alterando..." : "Alterar Senha"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
