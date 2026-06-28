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
    <div className="min-h-screen flex items-center justify-center bg-[#15161a]">
      <div className="w-full max-w-[440px] p-8 bg-[#1e1f25] rounded-[18px] border border-[#2a2b33]">
        <h1 className="font-archivo text-[24px] font-bold text-center mb-1 text-white">
          faix<span className="text-red-500 font-extrabold">app</span>reta
        </h1>
        <p className="font-spline text-[10px] tracking-[.15em] uppercase text-[#6b6c73] text-center mb-8">Super Admin</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-spline text-[9.5px] tracking-[.1em] uppercase text-[#6b6c73] mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-[13px] py-3 rounded-[9px] bg-[#15161a] border border-[#2a2b33] text-white placeholder:text-[#46484f] focus:outline-none focus:border-[#e08a1e] transition-colors text-sm"
              placeholder="admin@faixappreta.com.br"
              required
            />
          </div>

          <div>
            <label className="block font-spline text-[9.5px] tracking-[.1em] uppercase text-[#6b6c73] mb-1.5">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-[13px] py-3 rounded-[9px] bg-[#15161a] border border-[#2a2b33] text-white placeholder:text-[#46484f] focus:outline-none focus:border-[#e08a1e] transition-colors text-sm"
              placeholder="********"
              required
            />
          </div>

          {error && (
            <p className="text-[#b42318] text-[13px] text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-[9px] bg-[#e08a1e] text-[#15161a] font-semibold hover:bg-[#c9781a] transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
