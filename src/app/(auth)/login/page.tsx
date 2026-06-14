"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Check if account is pending approval
    const checkRes = await fetch("/api/auth/check-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
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
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] px-4">
      <div className="w-full max-w-md">
        <Card>
          <div className="flex flex-col items-center mb-8">
            <Image src="/logo.png" alt="PQ" width={72} height={72} />
            <h1 className="text-3xl font-bold text-zinc-50 tracking-tight font-teko uppercase mt-3">
              PQ <span className="text-accent">FIGHTERS</span>
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Centro de Treinamento
            </p>
          </div>

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
              placeholder="••••••"
              required
            />

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Não tem conta?{" "}
            <Link href="/register" className="text-orange-500 hover:text-orange-400 transition-colors">
              Cadastre-se
            </Link>
          </p>
          <p className="text-center text-sm text-zinc-600 mt-3">
            Esqueceu sua senha?{" "}
            <Link
              href="/forgot-password"
              className="text-zinc-400 hover:text-zinc-300 underline transition-colors"
            >
              Clique aqui
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
