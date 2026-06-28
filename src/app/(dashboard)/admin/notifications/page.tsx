"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/page-header";

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", message: "" });

  useEffect(() => {
    loadNotifications();
  }, []);

  function loadNotifications() {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then(setNotifications);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setModalOpen(false);
    setForm({ title: "", message: "" });
    loadNotifications();
  }

  return (
    <div className="max-w-[800px] mx-auto">
      <PageHeader title="Notificações">
        <Button onClick={() => setModalOpen(true)}>Nova Notificação</Button>
      </PageHeader>

      <div className="space-y-3">
        {notifications.map((n) => (
          <Card key={n.id}>
            <h3 className="font-semibold text-[13.5px] text-[#17181c]">{n.title}</h3>
            <p className="text-[13px] text-[#5c5d63] mt-1">{n.message}</p>
            <p className="text-[11px] text-[#9b9ca2] mt-2">
              {new Date(n.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </Card>
        ))}
        {notifications.length === 0 && (
          <Card>
            <p className="text-center text-[#9b9ca2] text-[13px] py-6">
              Nenhuma notificação enviada
            </p>
          </Card>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nova Notificação"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Título"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <div>
            <label className="block font-spline text-[9.5px] tracking-[.1em] uppercase text-[#9b9ca2] mb-1.5">
              Mensagem
            </label>
            <textarea
              className="w-full rounded-[9px] border border-[#e6e6e9] bg-white px-[13px] py-3 text-sm text-[#17181c] placeholder-[#9b9ca2] focus:outline-none focus:border-accent transition-colors"
              rows={4}
              value={form.message}
              onChange={(e) =>
                setForm({ ...form, message: e.target.value })
              }
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Enviar
          </Button>
        </form>
      </Modal>
    </div>
  );
}
