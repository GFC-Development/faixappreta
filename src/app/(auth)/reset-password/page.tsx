"use client";

import { useState, useEffect, Suspense } from "react";
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

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [tenantSlug, setTenantSlug] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantLogoUrl, setTenantLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (token && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("token")) {
        url.searchParams.delete("token");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setError("Token de redefinição não fornecido.");
      setIsValidating(false);
      return;
    }

    async function checkToken() {
      try {
        const res = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await res.json();

        if (res.ok && data.valid) {
          setIsTokenValid(true);
          if (data.tenantSlug) {
            setTenantSlug(data.tenantSlug);
          }
        } else {
          setError(data.error || "O link de redefinição é inválido ou expirou.");
        }
      } catch {
        setError("Erro ao verificar validade do link.");
      } finally {
        setIsValidating(false);
      }
    }

    checkToken();
  }, [token]);

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

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao redefinir senha.");
        setLoading(false);
        return;
      }

      setSuccess("Sua senha foi redefinida com sucesso!");
    } catch {
      setError("Erro ao se conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  if (isValidating) {
    return (
      <>
        <AuthHero tenantName={tenantName} tenantSlug={tenantSlug} logoUrl={tenantLogoUrl} />
        <div className="flex-1 flex flex-col items-center justify-center p-[22px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          <p className="text-sm text-[#82838a] mt-4">Verificando validade do link...</p>
        </div>
      </>
    );
  }

  if (success) {
    return (
      <>
        <AuthHero tenantName={tenantName} tenantSlug={tenantSlug} logoUrl={tenantLogoUrl} />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-[22px_22px_28px]">
          <div className="w-[76px] h-[76px] rounded-3xl bg-emerald-500/10 flex items-center justify-center mb-5">
            <span className="text-3xl text-emerald-500">✓</span>
          </div>
          <h2 className="font-archivo font-bold text-[22px] mb-2">Senha redefinida!</h2>
          <p className="text-sm text-[#5c5d63] leading-relaxed max-w-[300px]">
            Sua senha foi alterada com sucesso. Você já pode fazer login com sua nova senha.
          </p>
          <Link href={`/login${tenantSlug ? `?tenant=${tenantSlug}` : ""}`} className="w-full mt-6">
            <AuthButton>Ir para o login</AuthButton>
          </Link>
        </div>
      </>
    );
  }

  if (!isTokenValid) {
    return (
      <>
        <AuthHero tenantName={tenantName} tenantSlug={tenantSlug} logoUrl={tenantLogoUrl} />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-[22px_22px_28px]">
          <div className="w-[76px] h-[76px] rounded-3xl bg-red-500/10 flex items-center justify-center mb-5">
            <span className="text-3xl text-red-500">✕</span>
          </div>
          <h2 className="font-archivo font-bold text-[22px] mb-2">Link inválido</h2>
          <p className="text-sm text-[#5c5d63] leading-relaxed max-w-[300px]">{error}</p>
          <Link href={`/forgot-password${tenantSlug ? `?tenant=${tenantSlug}` : ""}`} className="w-full mt-6">
            <AuthButton>Solicitar novo link</AuthButton>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <AuthHero tenantName={tenantName} tenantSlug={tenantSlug} logoUrl={tenantLogoUrl} />

      <div className="flex-1 flex flex-col p-[22px_22px_28px]">
        <BackButton href={`/login${tenantSlug ? `?tenant=${tenantSlug}` : ""}`} label="Login" />

        <h1 className="font-archivo font-bold text-[21px] mb-1">Redefinir senha</h1>
        <p className="text-[13.5px] text-[#82838a] mb-[22px]">
          Crie uma nova senha para sua conta.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <AuthInput
            label="Nova senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nova senha"
            required
            minLength={6}
          />
          <AuthInput
            label="Confirmar nova senha"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a senha"
            required
            minLength={6}
          />

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <div className="pt-2.5">
            <AuthButton type="submit" disabled={loading}>
              {loading ? "Redefinindo..." : "Redefinir senha"}
            </AuthButton>
          </div>
        </form>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
