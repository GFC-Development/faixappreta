"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { ColorPicker } from "@/components/color-picker";

interface TenantData {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  adminName: string;
  adminEmail: string;
  isActive: boolean;
}

export default function EditTenantPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#f97316");
  const [secondaryColor, setSecondaryColor] = useState("#ea580c");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [newLogo, setNewLogo] = useState<File | null>(null);

  useEffect(() => {
    fetch(`/api/super-admin/tenants/${tenantId}`)
      .then((r) => {
        if (r.status === 401) {
          router.push("/super-admin/login");
          return null;
        }
        if (!r.ok) {
          setError("CT não encontrado");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data?.tenant) {
          const t: TenantData = data.tenant;
          setName(t.name);
          setSlug(t.slug);
          setLogoUrl(t.logoUrl || "");
          setPrimaryColor(t.primaryColor);
          setSecondaryColor(t.secondaryColor);
          setAdminName(t.adminName);
          setAdminEmail(t.adminEmail);
          setIsActive(t.isActive);
        }
      })
      .finally(() => setLoading(false));
  }, [tenantId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      let finalLogoUrl = logoUrl;

      if (newLogo) {
        const formData = new FormData();
        formData.append("file", newLogo);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalLogoUrl = uploadData.url;
        }
      }

      const res = await fetch(`/api/super-admin/tenants/${tenantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          logoUrl: finalLogoUrl,
          primaryColor,
          secondaryColor,
          adminName,
          adminEmail,
          isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao salvar");
        return;
      }

      setSuccess("CT atualizado com sucesso!");
      if (newLogo && finalLogoUrl) {
        setLogoUrl(finalLogoUrl);
        setNewLogo(null);
      }
    } catch {
      setError("Erro ao conectar com o servidor");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <p className="text-content-muted">Carregando...</p>
      </div>
    );
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
        <h1 className="text-2xl font-bold mb-2">Editar CT</h1>
        <p className="text-content-muted text-sm mb-8">
          {slug}.faixappreta.com.br
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">
              Nome do CT
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-secondary border border-border text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent"
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
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">
              Logo
            </label>
            {logoUrl && !newLogo && (
              <div className="flex items-center gap-4 mb-3">
                <img
                  src={logoUrl}
                  alt="Logo atual"
                  className="w-16 h-16 rounded-lg object-contain bg-surface-secondary border border-border"
                />
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className="flex items-center gap-1 text-sm text-red-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remover logo
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewLogo(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-content-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent file:text-white file:font-medium file:cursor-pointer hover:file:bg-accent-dark"
            />
            {newLogo && (
              <p className="mt-1 text-xs text-content-muted">
                Nova logo selecionada: {newLogo.name}
              </p>
            )}
          </div>

          <ColorPicker
            label="Cor Principal"
            value={primaryColor}
            onChange={setPrimaryColor}
          />

          <ColorPicker
            label="Cor Secundária"
            value={secondaryColor}
            onChange={setSecondaryColor}
          />

          <div className="flex items-center gap-3 p-4 rounded-lg bg-surface-secondary border border-border">
            <label className="flex items-center gap-3 cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
              />
              <div>
                <span className="text-sm font-medium text-content-primary">CT Ativo</span>
                <p className="text-xs text-content-muted">Desativar impede o acesso dos usuários</p>
              </div>
            </label>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          {success && (
            <p className="text-green-500 text-sm text-center">{success}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accent-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      </main>
    </div>
  );
}
