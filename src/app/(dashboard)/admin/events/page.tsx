"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", date: "" });

  useEffect(() => {
    loadEvents();
  }, []);

  function loadEvents() {
    fetch("/api/events")
      .then((r) => r.json())
      .then(setEvents);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setModalOpen(false);
    setForm({ title: "", description: "", date: "" });
    loadEvents();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este evento?")) return;
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    loadEvents();
  }

  return (
    <div className="max-w-[800px] mx-auto">
      <PageHeader title="Eventos">
        <Button onClick={() => setModalOpen(true)}>Novo Evento</Button>
      </PageHeader>

      <div className="space-y-3">
        {events.map((event) => {
          const d = new Date(event.date + "T12:00:00");
          const day = d.getDate();
          const month = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
          return (
            <Card key={event.id}>
              <div className="flex items-start gap-4">
                <div className="w-[50px] h-[50px] flex-none rounded-[10px] bg-[#f4f4f6] flex flex-col items-center justify-center">
                  <span className="font-archivo font-bold text-[18px] text-[#17181c] leading-none">{day}</span>
                  <span className="font-spline text-[9px] uppercase text-[#9b9ca2] tracking-wider">{month}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[13.5px] text-[#17181c]">{event.title}</h3>
                  {event.description && (
                    <p className="text-[13px] text-[#5c5d63] mt-0.5">{event.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="text-[#9b9ca2] hover:text-[#b42318] transition-colors p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          );
        })}
        {events.length === 0 && (
          <Card>
            <p className="text-center text-[#9b9ca2] text-[13px] py-6">
              Nenhum evento cadastrado
            </p>
          </Card>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo Evento"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Título"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Input
            label="Data"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
          <div>
            <label className="block font-spline text-[9.5px] tracking-[.1em] uppercase text-[#9b9ca2] mb-1.5">
              Descrição
            </label>
            <textarea
              className="w-full rounded-[9px] border border-[#e6e6e9] bg-white px-[13px] py-3 text-sm text-[#17181c] placeholder-[#9b9ca2] focus:outline-none focus:border-accent transition-colors"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <Button type="submit" className="w-full">
            Criar
          </Button>
        </form>
      </Modal>
    </div>
  );
}
