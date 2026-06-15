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
    <div className="min-h-screen bg-surface-primary">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-accent" />
          <h1 className="text-xl font-bold">faix<span className="text-red-600 font-extrabold">app</span>reta - CTs</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/super-admin/create")}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Novo CT
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-content-muted hover:text-content-primary transition-colors"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <p className="text-content-muted text-center py-12">Carregando...</p>
        ) : tenants.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 text-content-muted mx-auto mb-4" />
            <p className="text-content-secondary mb-2">Nenhum CT cadastrado</p>
            <button
              onClick={() => router.push("/super-admin/create")}
              className="text-accent hover:underline text-sm"
            >
              Criar primeiro CT
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {tenants.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-4 bg-surface-secondary rounded-xl border border-border"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: t.primaryColor }}
                  >
                    {t.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold">{t.name}</h3>
                    <p className="text-sm text-content-muted">
                      {t.adminEmail}
                    </p>
                    <p className="text-xs text-content-muted mt-0.5">
                      Login: <a href={`/login?tenant=${t.slug}`} className="text-accent hover:underline">/login?tenant={t.slug}</a>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      t.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    {t.isActive ? "Ativo" : "Inativo"}
                  </span>
                  <button
                    onClick={() => router.push(`/super-admin/${t.id}/edit`)}
                    className="p-2 text-content-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
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
