"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthHero } from "@/components/auth/auth-hero";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthDivider } from "@/components/auth/auth-divider";
import { BackButton } from "@/components/auth/back-button";
import { OtpInput } from "@/components/auth/otp-input";

function getContrastColor(hex: string) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return luminance > 0.35 ? '#17181c' : '#ffffff';
}

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const tokenParam = searchParams.get("token") || "";
  const tenantSlug = searchParams.get("tenant") || "";

  const [email] = useState(emailParam);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);
  const [tenantName, setTenantName] = useState("");
  const [tenantLogoUrl, setTenantLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if ((emailParam || tokenParam) && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      let changed = false;
      if (url.searchParams.has("token")) {
        url.searchParams.delete("token");
        changed = true;
      }
      if (url.searchParams.has("email")) {
        url.searchParams.delete("email");
        changed = true;
      }
      if (changed) {
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [emailParam, tokenParam]);

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

  useEffect(() => {
    if (emailParam && tokenParam) {
      setIsAutoVerifying(true);
      autoVerify(emailParam, tokenParam);
    }
  }, [emailParam, tokenParam]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function autoVerify(emailVal: string, tokenVal: string) {
    setError("");
    setSuccess("");
    setInfo("");
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

  async function handleVerify() {
    if (otp.length !== 6) return;
    setError("");
    setSuccess("");
    setInfo("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: otp.trim() }),
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
    setInfo("");
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

      setInfo("Novo código enviado! Verifique sua caixa de entrada.");
      setResendCooldown(60);
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  if (isAutoVerifying) {
    return (
      <>
        <AuthHero tenantName={tenantName} tenantSlug={tenantSlug} logoUrl={tenantLogoUrl} />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-[22px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mb-4" />
          <h2 className="text-lg font-medium text-content-primary">Verificando seu e-mail...</h2>
          {error && (
            <div className="mt-4">
              <p className="text-sm text-red-500 mb-4">{error}</p>
              <AuthButton variant="secondary" onClick={() => setIsAutoVerifying(false)}>
                Inserir código manualmente
              </AuthButton>
            </div>
          )}
        </div>
      </>
    );
  }

  if (success) {
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
          <Link href={`/login${tenantSlug ? `?tenant=${tenantSlug}` : ""}`} className="w-full mt-[18px]">
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
        <BackButton href={`/register?tenant=${tenantSlug}`} />

        <h1 className="font-archivo font-bold text-[21px] mb-1">Verifique seu e-mail</h1>
        <p className="text-[13.5px] text-[#82838a] mb-6">
          Enviamos um código de 6 dígitos para <strong className="text-[#17181c]">{email}</strong>.
        </p>

        <OtpInput value={otp} onChange={setOtp} disabled={loading} />

        {info && (
          <p className="text-sm text-emerald-500 text-center mt-3">{info}</p>
        )}
        {error && (
          <p className="text-sm text-red-500 text-center mt-3">{error}</p>
        )}

        <div className="mt-[18px]">
          <AuthButton onClick={handleVerify} disabled={loading || otp.length !== 6}>
            {loading ? "Verificando..." : "Verificar"}
          </AuthButton>
        </div>

        <div className="text-center mt-[18px] text-[13px] text-[#82838a]">
          {resendCooldown > 0 ? (
            `Reenviar código em ${resendCooldown}s`
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={loading || !email}
              className="text-[#82838a] hover:text-content-primary transition-colors disabled:opacity-50"
            >
              Não recebeu? Reenviar código
            </button>
          )}
        </div>

        <AuthDivider />

        <Link
          href={`/login?tenant=${tenantSlug}`}
          className="text-center text-[13px] text-accent-dark font-semibold hover:text-accent transition-colors"
        >
          Verifiquei pelo link do e-mail →
        </Link>
      </div>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
