"use client";

import { Suspense, useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthHero } from "@/components/auth/auth-hero";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthDivider } from "@/components/auth/auth-divider";

function getContrastColor(hex: string) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return luminance > 0.35 ? '#17181c' : '#ffffff';
}

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
        router.push(`/verify-email?email=${encodeURIComponent(email)}${tenantSlug ? `&tenant=${tenantSlug}` : ""}`);
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

    // Use full page navigation to ensure JWT cookie is sent with the request
    if (session?.user?.role === "ADMIN") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/student";
    }
  }

  return (
    <>
      <AuthHero tenantName={tenantName} tenantSlug={tenantSlug} logoUrl={tenantLogoUrl} />

      <div className="flex-1 flex flex-col p-[22px_22px_28px]">
        {!tenantSlug ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-1.5">
            <h1 className="font-archivo font-bold text-[21px] mb-2">Acesse seu CT</h1>
            <p className="text-[13.5px] text-[#82838a]">
              Use o link fornecido pelo seu Centro de Treinamento para acessar o sistema.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <h1 className="font-archivo font-bold text-[21px] mb-1">Entrar</h1>
            <p className="text-[13.5px] text-[#82838a] mb-[22px]">
              Acesse sua conta de aluno{tenantName ? ` na ${tenantName}` : ""}.
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

              <div className="mt-3.5">
                <AuthInput
                  label="Senha"
                  labelRight={
                    <Link
                      href={`/forgot-password${tenantSlug ? `?tenant=${tenantSlug}` : ""}`}
                      className="text-[11.5px] font-semibold text-accent-dark hover:text-accent transition-colors"
                    >
                      Esqueci
                    </Link>
                  }
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center mt-3">{error}</p>
              )}

              <div className="mt-[22px]">
                <AuthButton type="submit" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </AuthButton>
              </div>
            </form>

            <AuthDivider />

            <Link href={`/register?tenant=${tenantSlug}`}>
              <AuthButton variant="secondary">Criar conta de aluno</AuthButton>
            </Link>
          </div>
        )}

        {tenantSlug && (
          <div className="text-center text-[11.5px] text-[#a8a8ad] mt-[18px]">
            Novos cadastros passam por aprovação do professor.
          </div>
        )}
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-content-muted">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
