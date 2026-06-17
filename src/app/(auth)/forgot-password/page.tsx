"use client";

import { Suspense, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { useSearchParams } from "next/navigation";

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
        <p className="text-content-muted text-sm mt-1">
          Recuperar Senha
        </p>
      </div>

      {success ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📧</span>
          </div>
          <h2 className="text-lg font-semibold text-content-primary mb-2">Verifique seu e-mail</h2>
          <p className="text-sm text-content-secondary mb-6">
            {success}
          </p>
          <Link href={`/login${tenantSlug ? `?tenant=${tenantSlug}` : ""}`}>
            <Button className="w-full">
              Voltar para login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-content-secondary mb-2">
            Insira o seu e-mail cadastrado e enviaremos um link de redefinição de senha.
          </p>
          
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
          />

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </Button>

          <p className="text-center text-sm text-content-muted mt-4">
            Lembrou a senha?{" "}
            <Link href={`/login${tenantSlug ? `?tenant=${tenantSlug}` : ""}`} className="text-accent hover:text-accent-dark transition-colors">
              Entrar
            </Link>
          </p>
        </form>
      )}
    </Card>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-primary px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="text-center text-content-muted">Carregando...</div>}>
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
