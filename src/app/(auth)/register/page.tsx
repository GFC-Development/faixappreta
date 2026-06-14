"use client";

import { Suspense, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { StudentAvatar } from "@/components/student-avatar";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { useSearchParams } from "next/navigation";

function RegisterForm() {
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get("tenant") || "";
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isKids, setIsKids] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [tenantName, setTenantName] = useState("");
  const [tenantLogoUrl, setTenantLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (tenantSlug) {
      fetch(`/api/tenant-info?slug=${encodeURIComponent(tenantSlug)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.name) setTenantName(data.name);
          if (data.logoUrl) setTenantLogoUrl(data.logoUrl);
          if (data.primaryColor) {
            document.documentElement.style.setProperty("--color-accent", data.primaryColor);
          }
          if (data.secondaryColor) {
            document.documentElement.style.setProperty("--color-accent-dark", data.secondaryColor);
          }
        })
        .catch(() => {});
    }
  }, [tenantSlug]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!tenantSlug) {
      setError("Tenant não identificado.");
      return;
    }

    setLoading(true);

    let photoUrl: string | null = null;

    if (photoFile) {
      const fd = new FormData();
      fd.append("file", photoFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (!uploadRes.ok) {
        setError("Erro ao enviar foto");
        setLoading(false);
        return;
      }
      const uploadData = await uploadRes.json();
      photoUrl = uploadData.url;
    }

    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, modalities: "GRAPPLING", isKids, photoUrl, tenantSlug }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Erro ao cadastrar");
      setLoading(false);
      return;
    }

    setRegistered(true);
  }

  if (!tenantSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-primary px-4">
        <div className="w-full max-w-md">
          <Card>
            <div className="flex flex-col items-center text-center">
              <Logo size={72} logoUrl={tenantLogoUrl} />
              <h1 className="text-3xl font-bold text-content-primary tracking-tight font-teko uppercase mt-3">
                faix<span className="text-accent font-extrabold">app</span>reta
              </h1>
              <p className="text-sm text-content-secondary mt-4">
                Use o link fornecido pelo seu Centro de Treinamento para se cadastrar.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-primary px-4">
        <div className="w-full max-w-md">
          <Card>
            <div className="flex flex-col items-center text-center">
              <Logo size={72} logoUrl={tenantLogoUrl} />
              <h1 className="text-3xl font-bold text-content-primary tracking-tight font-teko uppercase mt-3">
                faix<span className="text-accent font-extrabold">app</span>reta
              </h1>
              <div className="mt-6 mb-4">
                <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">&#9203;</span>
                </div>
                <h2 className="text-lg font-semibold text-content-primary mb-2">Cadastro enviado!</h2>
                <p className="text-sm text-content-secondary">
                  Seu cadastro foi recebido e está aguardando aprovação do professor. Você receberá acesso assim que for aprovado.
                </p>
              </div>
              <Link href={`/login?tenant=${tenantSlug}`}>
                <Button variant="secondary" size="sm">
                  Voltar para o login
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-primary px-4">
      <div className="w-full max-w-md">
        <Card>
          <div className="flex flex-col items-center mb-8">
            <Logo size={72} logoUrl={tenantLogoUrl} />
            {tenantName ? (
              <h1 className="text-2xl font-bold text-content-primary tracking-tight font-teko uppercase mt-3">
                {tenantName}
              </h1>
            ) : (
              <h1 className="text-3xl font-bold text-content-primary tracking-tight font-teko uppercase mt-3">
                faix<span className="text-accent font-extrabold">app</span>reta
              </h1>
            )}
            <p className="text-content-muted text-sm mt-1">Crie sua conta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <StudentAvatar name={form.name || "?"} photoUrl={photoPreview} size={64} />
              <label className="cursor-pointer text-sm text-accent hover:text-accent-dark transition-colors">
                {photoPreview ? "Alterar foto" : "Adicionar foto"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            </div>

            <Input
              label="Nome"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Seu nome completo"
              required
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="seu@email.com"
              required
            />
            <Input
              label="Senha"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Minimo 6 caracteres"
              required
              minLength={6}
            />
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isKids}
                  onChange={(e) => setIsKids(e.target.checked)}
                  className="w-4 h-4 rounded border-border bg-surface-primary text-accent focus:ring-accent"
                />
                <span className="text-sm font-medium text-content-secondary">Aluno Kids</span>
              </label>
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </form>

          <p className="text-center text-sm text-content-muted mt-6">
            Ja tem conta?{" "}
            <Link href={`/login?tenant=${tenantSlug}`} className="text-accent hover:text-accent-dark transition-colors">
              Entrar
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-surface-primary text-content-muted">Carregando...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
