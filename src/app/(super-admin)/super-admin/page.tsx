"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Power, Building2, LogOut, Pencil } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  adminEmail: string;
  primaryColor: string;
  isActive: boolean;
  createdAt: string;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/super-admin/tenants")
      .then((r) => {
        if (r.status === 401) {
          router.push("/super-admin/login");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setTenants(data.tenants);
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await fetch("/api/super-admin/auth", { method: "DELETE" });
    router.push("/super-admin/login");
  }

  return (
    <div className="min-h-screen bg-[#15161a]">
      <header className="border-b border-[#2a2b33] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-[#e08a1e]" />
          <h1 className="font-archivo text-[18px] font-bold text-white">
            faix<span className="text-red-500 font-extrabold">app</span>reta
            <span className="text-[#6b6c73] font-normal ml-2 text-[14px]">CTs</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/super-admin/create")}
            className="flex items-center gap-2 px-4 py-2 bg-[#e08a1e] text-[#15161a] rounded-[9px] hover:bg-[#c9781a] transition-colors text-[13px] font-semibold"
          >
            <Plus className="w-4 h-4" />
            Novo CT
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-[#6b6c73] hover:text-white transition-colors"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <p className="text-[#6b6c73] text-center py-12">Carregando...</p>
        ) : tenants.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 text-[#46484f] mx-auto mb-4" />
            <p className="text-[#6b6c73] mb-2">Nenhum CT cadastrado</p>
            <button
              onClick={() => router.push("/super-admin/create")}
              className="text-[#e08a1e] hover:underline text-sm"
            >
              Criar primeiro CT
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {tenants.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-4 bg-[#1e1f25] rounded-[13px] border border-[#2a2b33]"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: t.primaryColor }}
                  >
                    {t.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[14px] text-white">{t.name}</h3>
                    <p className="text-[12px] text-[#6b6c73]">
                      {t.adminEmail}
                    </p>
                    <p className="text-[11px] text-[#46484f] mt-0.5">
                      Login: <a href={`/login?tenant=${t.slug}`} className="text-[#e08a1e] hover:underline">/login?tenant={t.slug}</a>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[20px] text-[11px] font-semibold ${
                      t.isActive
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-red-500/15 text-red-400"
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    {t.isActive ? "Ativo" : "Inativo"}
                  </span>
                  <button
                    onClick={() => router.push(`/super-admin/${t.id}/edit`)}
                    className="p-2 text-[#6b6c73] hover:text-[#e08a1e] hover:bg-[#e08a1e]/10 rounded-[8px] transition-colors"
                    title="Editar CT"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
