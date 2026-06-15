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
    <div className="min-h-screen bg-surface-primary">
      <header className="border-b border-border px-6 py-4">
        <button
          onClick={() => router.push("/super-admin")}
          className="flex items-center gap-2 text-content-secondary hover:text-content-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-8">Criar novo CT</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">
              Nome do CT
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-secondary border border-border text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Ex: CT Exemplo"
              required
            />
            {slug && (
              <p className="mt-1 text-sm text-content-muted">
                {slug}.faixappreta.com.br
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">
              Dominio (slug)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-secondary border border-border text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="ct-exemplo"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">
                Nome do Admin
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-surface-secondary border border-border text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Nome do professor"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">
                Email do Admin
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-surface-secondary border border-border text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="admin@ct.com.br"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">
              Senha do Admin
            </label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-secondary border border-border text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Minimo 6 caracteres"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">
              Logo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-content-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent file:text-white file:font-medium file:cursor-pointer hover:file:bg-accent-dark"
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
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accent-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Criando CT..." : "Criar CT"}
          </button>
        </form>
      </main>
    </div>
  );
}
