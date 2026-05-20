"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { StudentAvatar } from "@/components/student-avatar";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    studentType: "COLETIVA",
  });
  const [modalities, setModalities] = useState<string[]>(["GRAPPLING"]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let photoUrl: string | null = null;

    if (photoFile) {
      const fd = new FormData();
      fd.append("file", photoFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (!uploadRes.ok) {
        setError("Erro ao enviar foto");
        setLoading(false);
        return;
      }
      const uploadData = await uploadRes.json();
      photoUrl = uploadData.url;
    }

    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, modalities: modalities.join(","), photoUrl }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Erro ao cadastrar");
      setLoading(false);
      return;
    }

    router.push("/login");
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
              Crie sua conta
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <StudentAvatar name={form.name || "?"} photoUrl={photoPreview} size={64} />
              <label className="cursor-pointer text-sm text-orange-500 hover:text-orange-400 transition-colors">
                {photoPreview ? "Alterar foto" : "Adicionar foto"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            </div>

            <Input
              label="Nome"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Seu nome completo"
              required
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="seu@email.com"
              required
            />
            <Input
              label="Senha"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
            <Select
              label="Tipo de Aula"
              value={form.studentType}
              onChange={(e) =>
                setForm({ ...form, studentType: e.target.value })
              }
            >
              <option value="COLETIVA">Coletiva</option>
              <option value="PARTICULAR">Particular</option>
            </Select>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Modalidades</label>
              <div className="flex flex-col gap-2">
                {[
                  { value: "GRAPPLING", label: "Grappling / Jiu-Jitsu" },
                  { value: "MMA", label: "MMA / Boxe" },
                ].map((m) => (
                  <label key={m.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modalities.includes(m.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setModalities((prev) => [...prev, m.value]);
                        } else if (modalities.length > 1) {
                          setModalities((prev) => prev.filter((v) => v !== m.value));
                        }
                      }}
                      className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-zinc-200">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Já tem conta?{" "}
            <Link href="/login" className="text-orange-500 hover:text-orange-400 transition-colors">
              Entrar
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
