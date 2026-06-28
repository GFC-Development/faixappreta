"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthHero } from "@/components/auth/auth-hero";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";
import { BackButton } from "@/components/auth/back-button";

function getContrastColor(hex: string) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return luminance > 0.35 ? '#17181c' : '#ffffff';
}

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get("tenant") || "";
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao solicitar redefinição");
        setLoading(false);
        return;
      }

      setSuccess("E-mail enviado! Se o endereço informado estiver cadastrado, você receberá um link para redefinir sua senha.");
    } catch {
      setError("Erro ao enviar a solicitação. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AuthHero tenantName={tenantName} tenantSlug={tenantSlug} logoUrl={tenantLogoUrl} />

      <div className="flex-1 flex flex-col p-[22px_22px_28px]">
        <BackButton href={`/login${tenantSlug ? `?tenant=${tenantSlug}` : ""}`} />

        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-1.5">
            <div className="w-[76px] h-[76px] rounded-3xl bg-[#fbf0dd] flex items-center justify-center mb-5">
              <span className="text-3xl">📧</span>
            </div>
            <h2 className="font-archivo font-bold text-[22px] mb-2">Verifique seu e-mail</h2>
            <p className="text-sm text-[#5c5d63] leading-relaxed max-w-[300px]">
              {success}
            </p>
            <Link href={`/login${tenantSlug ? `?tenant=${tenantSlug}` : ""}`} className="w-full mt-6">
              <AuthButton variant="secondary">Voltar ao login</AuthButton>
            </Link>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <h1 className="font-archivo font-bold text-[21px] mb-1">Esqueci minha senha</h1>
            <p className="text-[13.5px] text-[#82838a] mb-[22px]">
              Informe seu e-mail e enviaremos um link para redefinir a senha.
            </p>

            <form onSubmit={handleSubmit}>
              <AuthInput
                label="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                required
              />

              {error && (
                <p className="text-sm text-red-500 text-center mt-3">{error}</p>
              )}

              <div className="mt-[22px]">
                <AuthButton type="submit" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar link"}
                </AuthButton>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-content-muted">Carregando...</div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
