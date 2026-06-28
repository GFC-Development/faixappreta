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
  enablePlans: boolean;
  enableTimer: boolean;
}

const inputClass = "w-full px-[13px] py-3 rounded-[9px] bg-[#15161a] border border-[#2a2b33] text-white placeholder:text-[#46484f] focus:outline-none focus:border-[#e08a1e] transition-colors text-sm";

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
  const [enablePlans, setEnablePlans] = useState(true);
  const [enableTimer, setEnableTimer] = useState(true);
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
          setEnablePlans(t.enablePlans);
          setEnableTimer(t.enableTimer);
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
          enablePlans,
          enableTimer,
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
      <div className="min-h-screen bg-[#15161a] flex items-center justify-center">
        <p className="text-[#6b6c73]">Carregando...</p>
      </div>
    );
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
        <h1 className="font-archivo text-[24px] font-bold text-white mb-1">Editar CT</h1>
        <p className="font-spline text-[11px] text-[#46484f] mb-8">
          {slug}.faixappreta.com.br
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-spline text-[9.5px] tracking-[.1em] uppercase text-[#6b6c73] mb-1.5">
              Nome do CT
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
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
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-spline text-[9.5px] tracking-[.1em] uppercase text-[#6b6c73] mb-1.5">
              Logo
            </label>
            {logoUrl && !newLogo && (
              <div className="flex items-center gap-4 mb-3">
                <img
                  src={logoUrl}
                  alt="Logo atual"
                  className="w-16 h-16 rounded-[9px] object-contain bg-[#1e1f25] border border-[#2a2b33]"
                />
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className="flex items-center gap-1 text-[12px] text-red-400 hover:text-red-300 transition-colors"
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
              className="w-full text-sm text-[#6b6c73] file:mr-4 file:py-2 file:px-4 file:rounded-[9px] file:border-0 file:bg-[#e08a1e] file:text-[#15161a] file:font-semibold file:cursor-pointer hover:file:bg-[#c9781a] file:text-sm"
            />
            {newLogo && (
              <p className="mt-1 text-[11px] text-[#46484f]">
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

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 rounded-[9px] bg-[#1e1f25] border border-[#2a2b33]">
              <label className="flex items-center gap-3 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-[#2a2b33] bg-[#15161a] text-[#e08a1e] focus:ring-[#e08a1e]"
                />
                <div>
                  <span className="text-[13px] font-medium text-white">CT Ativo</span>
                  <p className="text-[11px] text-[#6b6c73]">Desativar impede o acesso dos usuários</p>
                </div>
              </label>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-[9px] bg-[#1e1f25] border border-[#2a2b33]">
              <label className="flex items-center gap-3 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={enablePlans}
                  onChange={(e) => setEnablePlans(e.target.checked)}
                  className="w-4 h-4 rounded border-[#2a2b33] bg-[#15161a] text-[#e08a1e] focus:ring-[#e08a1e]"
                />
                <div>
                  <span className="text-[13px] font-medium text-white">Módulo Planos</span>
                  <p className="text-[11px] text-[#6b6c73]">Habilitar página de planos para admin e alunos</p>
                </div>
              </label>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-[9px] bg-[#1e1f25] border border-[#2a2b33]">
              <label className="flex items-center gap-3 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={enableTimer}
                  onChange={(e) => setEnableTimer(e.target.checked)}
                  className="w-4 h-4 rounded border-[#2a2b33] bg-[#15161a] text-[#e08a1e] focus:ring-[#e08a1e]"
                />
                <div>
                  <span className="text-[13px] font-medium text-white">Módulo Timer</span>
                  <p className="text-[11px] text-[#6b6c73]">Habilitar timer de treino para admin</p>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <p className="text-[#b42318] text-[13px] text-center">{error}</p>
          )}
          {success && (
            <p className="text-emerald-400 text-[13px] text-center">{success}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-[9px] bg-[#e08a1e] text-[#15161a] font-semibold hover:bg-[#c9781a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      </main>
    </div>
  );
}
