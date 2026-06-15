"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/super-admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Credenciais invalidas");
        return;
      }

      router.push("/super-admin");
    } catch {
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-primary">
      <div className="w-full max-w-md p-8 bg-surface-secondary rounded-xl border border-border">
        <h1 className="text-2xl font-bold text-center mb-2">faix<span className="text-red-600 font-extrabold">app</span>reta</h1>
        <p className="text-content-muted text-center mb-8">Super Admin</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-primary border border-border text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="admin@faixappreta.com.br"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-primary border border-border text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="********"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-accent text-white font-semibold hover:bg-accent-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
