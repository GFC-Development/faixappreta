"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const tokenParam = searchParams.get("token") || "";

  const [email, setEmail] = useState(emailParam);
  const [token, setToken] = useState(tokenParam);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);

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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <h2 className="text-lg font-medium text-zinc-200">Verificando seu e-mail automaticamente...</h2>
        {error && (
          <div className="mt-4">
            <p className="text-sm text-red-400 mb-4">{error}</p>
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
        <h2 className="text-xl font-bold text-zinc-50 mb-2">E-mail verificado!</h2>
        <p className="text-sm text-zinc-400 mb-6 max-w-sm mx-auto">
          {success}
        </p>
        <Link href="/login">
          <Button className="w-full" size="lg">
            Ir para o login
          </Button>
        </Link>
      </div>
    );
  }

  return (
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
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "Verificando..." : "Confirmar E-mail"}
      </Button>

      <div className="flex justify-between items-center text-sm pt-2">
        <button
          type="button"
          onClick={handleResend}
          disabled={loading || resendCooldown > 0 || !email}
          className="text-orange-500 hover:text-orange-400 transition-colors disabled:opacity-50"
        >
          {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : "Reenviar código"}
        </button>
        <Link href="/login" className="text-zinc-400 hover:text-zinc-300">
          Voltar para login
        </Link>
      </div>
    </form>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] px-4">
      <div className="w-full max-w-md">
        <Card>
          <div className="flex flex-col items-center mb-6">
            <Image src="/logo.png" alt="PQ" width={72} height={72} />
            <h1 className="text-3xl font-bold text-zinc-50 tracking-tight font-teko uppercase mt-3">
              PQ <span className="text-accent">FIGHTERS</span>
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Verificação de E-mail
            </p>
          </div>

          <Suspense fallback={
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            </div>
          }>
            <VerifyEmailForm />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
