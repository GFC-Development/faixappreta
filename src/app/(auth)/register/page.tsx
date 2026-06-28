"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AuthHero } from "@/components/auth/auth-hero";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";
import { BackButton } from "@/components/auth/back-button";
import { PhotoUpload } from "@/components/auth/photo-upload";
import { KidsToggle } from "@/components/auth/kids-toggle";

function getContrastColor(hex: string) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return luminance > 0.35 ? '#17181c' : '#ffffff';
}

function RegisterForm() {
  const router = useRouter();
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
  const [registered] = useState(false);
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
            document.documentElement.style.setProperty("--color-accent-on", getContrastColor(data.primaryColor));
          }
          if (data.secondaryColor) {
            document.documentElement.style.setProperty("--color-accent-dark", data.secondaryColor);
            document.documentElement.style.setProperty("--color-accent-dark-on", getContrastColor(data.secondaryColor));
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

    router.push(`/verify-email?email=${encodeURIComponent(form.email)}${tenantSlug ? `&tenant=${tenantSlug}` : ""}`);
  }

  if (!tenantSlug) {
    return (
      <>
        <AuthHero tenantName="" tenantSlug="" logoUrl={null} />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-[22px]">
          <h1 className="font-archivo font-bold text-[21px] mb-2">Cadastro</h1>
          <p className="text-[13.5px] text-[#82838a]">
            Use o link fornecido pelo seu Centro de Treinamento para se cadastrar.
          </p>
        </div>
      </>
    );
  }

  if (registered) {
    return (
      <>
        <AuthHero tenantName={tenantName} tenantSlug={tenantSlug} logoUrl={tenantLogoUrl} />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-[22px_22px_28px]">
          <div className="w-[76px] h-[76px] rounded-3xl bg-[#fbf0dd] flex items-center justify-center mb-5">
            <span className="w-[30px] h-[30px] rounded-full border-[3px] border-accent border-t-transparent block animate-spin" />
          </div>
          <h2 className="font-archivo font-bold text-[22px] mb-2">Quase lá!</h2>
          <p className="text-sm text-[#5c5d63] leading-relaxed max-w-[300px]">
            E-mail verificado. Seu cadastro foi enviado para o professor — você poderá entrar assim que ele <strong className="text-[#17181c]">aprovar sua conta</strong>.
          </p>
          <div className="bg-white border border-[#e8e8e6] rounded-[14px] p-[14px_16px] mt-6 w-full flex items-center gap-3 text-left">
            <div className="w-[38px] h-[38px] flex-none rounded-[10px] bg-[#17181c] flex items-center justify-center font-archivo font-extrabold text-[17px] text-accent">
              {(tenantName || "F").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-[13.5px]">{tenantName || "faixappreta"}</div>
              <div className="text-[11.5px] text-[#9b9ca2]">Você receberá um e-mail ao ser aprovado</div>
            </div>
          </div>
          <Link href={`/login?tenant=${tenantSlug}`} className="w-full mt-[18px]">
            <AuthButton variant="secondary">Voltar ao login</AuthButton>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <AuthHero tenantName={tenantName} tenantSlug={tenantSlug} logoUrl={tenantLogoUrl} />

      <div className="flex-1 flex flex-col p-[22px_22px_28px]">
        <BackButton href={`/login?tenant=${tenantSlug}`} />

        <h1 className="font-archivo font-bold text-[21px] mb-1">Criar conta</h1>
        <p className="text-[13.5px] text-[#82838a] mb-5">
          Preencha seus dados para treinar{tenantName ? ` na ${tenantName}` : ""}.
        </p>

        <PhotoUpload preview={photoPreview} onChange={handlePhotoChange} />

        <form onSubmit={handleSubmit} className="space-y-3">
          <AuthInput
            label="Nome completo"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Seu nome"
            required
          />
          <AuthInput
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="voce@email.com"
            required
          />
          <AuthInput
            label="Senha"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Crie uma senha"
            required
            minLength={6}
          />

          <div className="pt-1">
            <KidsToggle checked={isKids} onChange={setIsKids} />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <div className="pt-2.5">
            <AuthButton type="submit" disabled={loading}>
              {loading ? "Cadastrando..." : "Criar conta"}
            </AuthButton>
          </div>
        </form>

        <p className="text-center text-[11px] text-[#a8a8ad] mt-3.5 leading-relaxed">
          Ao criar a conta você concorda com os termos da academia.<br />
          Enviaremos um código de verificação para seu e-mail.
        </p>
      </div>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-content-muted">Carregando...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
