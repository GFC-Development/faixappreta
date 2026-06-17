"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Logo } from "@/components/logo";

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

  // Validate token on mount
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

  // Load tenant info when slug is resolved
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
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
        <p className="text-sm text-content-secondary mt-4">Verificando validade do link...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl text-emerald-500">✓</span>
        </div>
        <h2 className="text-xl font-bold text-content-primary mb-2">Senha Redefinida!</h2>
        <p className="text-sm text-content-secondary mb-6">
          Sua senha foi alterada com sucesso. Você já pode fazer login com sua nova senha.
        </p>
        <Link href={`/login${tenantSlug ? `?tenant=${tenantSlug}` : ""}`}>
          <Button className="w-full" size="lg">
            Ir para o login
          </Button>
        </Link>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl text-red-500">✕</span>
        </div>
        <h2 className="text-lg font-bold text-content-primary mb-2">Link Inválido</h2>
        <p className="text-sm text-content-secondary mb-6">
          {error}
        </p>
        <Link href={`/forgot-password${tenantSlug ? `?tenant=${tenantSlug}` : ""}`}>
          <Button className="w-full" size="lg">
            Solicitar novo link
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
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
        <p className="text-content-muted text-sm mt-1">
          Redefinir Senha
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nova Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          required
          minLength={6}
        />
        <Input
          label="Confirmar Nova Senha"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repita a nova senha"
          required
          minLength={6}
        />

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Redefinindo..." : "Alterar Senha"}
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-primary px-4">
      <div className="w-full max-w-md">
        <Card>
          <Suspense fallback={
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
