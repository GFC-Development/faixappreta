"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ColorPicker } from "@/components/color-picker";

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const inputClass = "w-full px-[13px] py-3 rounded-[9px] bg-[#15161a] border border-[#2a2b33] text-white placeholder:text-[#46484f] focus:outline-none focus:border-[#e08a1e] transition-colors text-sm";

export default function CreateTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#f97316");
  const [secondaryColor, setSecondaryColor] = useState("#ea580c");

  function handleNameChange(value: string) {
    setName(value);
    setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (adminPassword.length < 6) {
      setError("A senha deve ter no minimo 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      let logoUrl: string | undefined;

      if (logo) {
        const formData = new FormData();
        formData.append("file", logo);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          logoUrl = uploadData.url;
        }
      }

      const res = await fetch("/api/super-admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          adminName,
          adminEmail,
          adminPassword,
          logoUrl,
          primaryColor,
          secondaryColor,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao criar CT");
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
    <div className="min-h-screen bg-[#15161a]">
      <header className="border-b border-[#2a2b33] px-6 py-4">
        <button
          onClick={() => router.push("/super-admin")}
          className="flex items-center gap-2 text-[#6b6c73] hover:text-white transition-colors text-[13px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="font-archivo text-[24px] font-bold text-white mb-8">Criar novo CT</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-spline text-[9.5px] tracking-[.1em] uppercase text-[#6b6c73] mb-1.5">
              Nome do CT
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={inputClass}
              placeholder="Ex: CT Exemplo"
              required
            />
            {slug && (
              <p className="mt-1 text-[11px] text-[#46484f]">
                {slug}.faixappreta.com.br
              </p>
            )}
          </div>

          <div>
            <label className="block font-spline text-[9.5px] tracking-[.1em] uppercase text-[#6b6c73] mb-1.5">
              Dominio (slug)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={inputClass}
              placeholder="ct-exemplo"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-spline text-[9.5px] tracking-[.1em] uppercase text-[#6b6c73] mb-1.5">
                Nome do Admin
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className={inputClass}
                placeholder="Nome do professor"
                required
              />
            </div>
            <div>
              <label className="block font-spline text-[9.5px] tracking-[.1em] uppercase text-[#6b6c73] mb-1.5">
                Email do Admin
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className={inputClass}
                placeholder="admin@ct.com.br"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-spline text-[9.5px] tracking-[.1em] uppercase text-[#6b6c73] mb-1.5">
              Senha do Admin
            </label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className={inputClass}
              placeholder="Minimo 6 caracteres"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block font-spline text-[9.5px] tracking-[.1em] uppercase text-[#6b6c73] mb-1.5">
              Logo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-[#6b6c73] file:mr-4 file:py-2 file:px-4 file:rounded-[9px] file:border-0 file:bg-[#e08a1e] file:text-[#15161a] file:font-semibold file:cursor-pointer hover:file:bg-[#c9781a] file:text-sm"
            />
          </div>

          <ColorPicker
            label="Cor Principal"
            value={primaryColor}
            onChange={setPrimaryColor}
          />

          <ColorPicker
            label="Cor Secundaria"
            value={secondaryColor}
            onChange={setSecondaryColor}
          />

          {error && (
            <p className="text-[#b42318] text-[13px] text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-[9px] bg-[#e08a1e] text-[#15161a] font-semibold hover:bg-[#c9781a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Criando CT..." : "Criar CT"}
          </button>
        </form>
      </main>
    </div>
  );
}
