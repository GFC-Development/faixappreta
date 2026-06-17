"use client";

import { Suspense, useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Logo } from "@/components/logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get("tenant") || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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
        .catch(() => { });
    }
  }, [tenantSlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!tenantSlug) {
      setError("Tenant não identificado. Use o link fornecido pelo seu CT.");
      return;
    }

    setLoading(true);

    const checkRes = await fetch("/api/auth/check-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, tenantSlug }),
    });
    const checkData = await checkRes.json();
    if (checkData.status === "UNVERIFIED") {
      setError("Seu e-mail ainda não foi verificado. Redirecionando para verificação...");
      setLoading(false);
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      }, 2000);
      return;
    }
    if (checkData.status === "PENDING") {
      setError("Seu cadastro está aguardando aprovação do professor.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      tenantSlug,
      redirect: false,
    });

    if (result?.error) {
      setError("Email ou senha inválidos");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/session");
    const session = await res.json();

    if (session?.user?.role === "ADMIN") {
      router.push("/admin");
    } else {
      router.push("/student");
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
            faix<span className="text-red-600 font-extrabold">app</span>reta
          </h1>
        )}
        <p className="text-content-muted text-sm mt-1">
          {tenantName ? <>Powered by faix<span className="font-bold">app</span>reta</> : "Centro de Treinamento"}
        </p>
      </div>

      {!tenantSlug ? (
        <div className="text-center">
          <p className="text-sm text-content-secondary mb-4">
            Use o link fornecido pelo seu Centro de Treinamento para acessar o sistema.
          </p>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******"
              required
            />

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="text-center text-sm text-content-muted mt-6">
            Não tem conta?{" "}
            <Link href={`/register?tenant=${tenantSlug}`} className="text-accent hover:text-accent-dark transition-colors">
              Cadastre-se
            </Link>
          </p>
          <p className="text-center text-sm text-content-muted mt-3">
            Esqueceu sua senha?{" "}
            <Link
              href={`/forgot-password${tenantSlug ? `?tenant=${tenantSlug}` : ""}`}
              className="text-content-secondary hover:text-content-primary underline transition-colors"
            >
              Clique aqui
            </Link>
          </p>
        </>
      )}
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-primary px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="text-center text-content-muted">Carregando...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
