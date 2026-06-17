"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Logo } from "@/components/logo";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const tokenParam = searchParams.get("token") || "";
  const tenantSlug = searchParams.get("tenant") || "";

  const [email, setEmail] = useState(emailParam);
  const [token, setToken] = useState(tokenParam);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);
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

  // Auto verify if both email and token are in url
  useEffect(() => {
    if (emailParam && tokenParam) {
      setIsAutoVerifying(true);
      autoVerify(emailParam, tokenParam);
    }
  }, [emailParam, tokenParam]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function autoVerify(emailVal: string, tokenVal: string) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailVal, token: tokenVal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao verificar e-mail");
        setIsAutoVerifying(false);
      } else {
        setSuccess("E-mail verificado com sucesso! Seu cadastro agora está pendente de aprovação do professor.");
      }
    } catch {
      setError("Erro de rede");
      setIsAutoVerifying(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: token.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao verificar e-mail");
        setLoading(false);
        return;
      }

      setSuccess("E-mail verificado com sucesso! Seu cadastro agora está pendente de aprovação do professor.");
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao enviar código");
        return;
      }

      setSuccess("Novo código enviado! Verifique sua caixa de entrada.");
      setResendCooldown(60); // 1 minute cooldown
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  if (isAutoVerifying) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mx-auto mb-4"></div>
        <h2 className="text-lg font-medium text-content-primary">Verificando seu e-mail automaticamente...</h2>
        {error && (
          <div className="mt-4">
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <Button onClick={() => setIsAutoVerifying(false)} variant="secondary">
              Inserir código manualmente
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl text-emerald-500">✓</span>
        </div>
        <h2 className="text-xl font-bold text-content-primary mb-2">E-mail verificado!</h2>
        <p className="text-sm text-content-secondary mb-6 max-w-sm mx-auto">
          {success}
        </p>
        <Link href={`/login${tenantSlug ? `?tenant=${tenantSlug}` : ""}`}>
          <Button className="w-full" size="lg">
            Ir para o login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center mb-6">
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
        <p className="text-content-muted text-sm mt-1">
          Verificação de E-mail
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
          disabled={!!emailParam}
        />
        <Input
          label="Código de Verificação (6 dígitos)"
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value.substring(0, 6))}
          placeholder="123456"
          required
          maxLength={6}
          className="text-center tracking-widest font-mono text-lg"
        />

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Verificando..." : "Confirmar E-mail"}
        </Button>

        <div className="flex justify-between items-center text-sm pt-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={loading || resendCooldown > 0 || !email}
            className="text-accent hover:text-accent-dark transition-colors disabled:opacity-50 font-medium"
          >
            {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : "Reenviar código"}
          </button>
          <Link href={`/login${tenantSlug ? `?tenant=${tenantSlug}` : ""}`} className="text-content-secondary hover:text-content-primary transition-colors">
            Voltar para login
          </Link>
        </div>
      </form>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-primary px-4">
      <div className="w-full max-w-md">
        <Card>
          <Suspense fallback={
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
            </div>
          }>
            <VerifyEmailForm />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
