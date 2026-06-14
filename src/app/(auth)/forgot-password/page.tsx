"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] px-4">
      <div className="w-full max-w-md">
        <Card>
          <div className="flex flex-col items-center mb-8">
            <Image src="/logo.png" alt="PQ" width={72} height={72} />
            <h1 className="text-3xl font-bold text-zinc-50 tracking-tight font-teko uppercase mt-3">
              PQ <span className="text-accent">FIGHTERS</span>
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Recuperar Senha
            </p>
          </div>

          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📧</span>
              </div>
              <h2 className="text-lg font-semibold text-zinc-50 mb-2">Verifique seu e-mail</h2>
              <p className="text-sm text-zinc-400 mb-6">
                {success}
              </p>
              <Link href="/login">
                <Button className="w-full">
                  Voltar para login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-zinc-400 mb-2">
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
                <p className="text-sm text-red-400 text-center">{error}</p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>

              <p className="text-center text-sm text-zinc-500 mt-4">
                Lembrou a senha?{" "}
                <Link href="/login" className="text-orange-500 hover:text-orange-400 transition-colors">
                  Entrar
                </Link>
              </p>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
