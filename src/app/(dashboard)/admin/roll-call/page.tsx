"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { StudentAvatar } from "@/components/student-avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";

interface BookingUser {
  id: string;
  name: string;
  belt: string;
  degrees: number;
  photoUrl: string | null;
}

interface Booking {
  id: string;
  userId: string;
  type: string;
  date: string;
  checkinStatus: string | null;
  checkedIn: boolean;
  user: BookingUser;
  privateSlot?: { startTime: string; endTime: string } | null;
  groupClass?: { name: string; startTime: string; endTime: string } | null;
}

export default function RollCallPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/bookings/pending?date=${selectedDate}`)
      .then((r) => r.json())
      .then((data) => {
        const bookingsData = Array.isArray(data) ? data : data.bookings || [];
        setBookings(bookingsData);
      })
      .finally(() => setLoading(false));
  }, [selectedDate]);

  async function setCheckinStatus(bookingId: string, checkinStatus: string) {
    setUpdating(bookingId);
    const res = await fetch(`/api/bookings/${bookingId}/checkin`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkinStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? updated : b))
      );
    }
    setUpdating(null);
  }

  async function handleDelete(bookingId: string) {
    if (!confirm("Excluir este agendamento?")) return;
    setUpdating(bookingId);
    const res = await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
    if (res.ok) {
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    }
    setUpdating(null);
  }

  const pending = bookings.filter((b) => !b.checkinStatus);
  const done = bookings.filter((b) => b.checkinStatus);

  const dateLabel = format(
    new Date(selectedDate + "T12:00:00"),
    "EEEE, dd 'de' MMMM",
    { locale: ptBR }
  );

  return (
    <div className="max-w-[700px] mx-auto">
      <PageHeader title="Chamada" subtitle="Registre a presença dos alunos nas aulas agendadas." />

      <div className="mb-6">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="h-[42px] rounded-[9px] border border-[#e6e6e9] bg-white px-[13px] text-sm text-[#17181c] focus:outline-none focus:border-accent transition-colors"
        />
        <p className="text-[11.5px] text-[#9b9ca2] mt-1.5 capitalize">{dateLabel}</p>
      </div>

      {loading ? (
        <p className="text-[#9b9ca2] text-[13px] text-center py-8">Carregando...</p>
      ) : bookings.length === 0 ? (
        <Card>
          <p className="text-[#9b9ca2] text-[13px] text-center py-6">
            Nenhum agendamento para esta data.
          </p>
        </Card>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-6">
              <h2 className="font-spline text-[9px] tracking-[.1em] uppercase text-[#a8a8ad] mb-3">
                Pendentes ({pending.length})
              </h2>
              <div className="space-y-2">
                {pending.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    updating={updating === b.id}
                    onSetStatus={setCheckinStatus}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {done.length > 0 && (
            <div>
              <h2 className="font-spline text-[9px] tracking-[.1em] uppercase text-[#a8a8ad] mb-3">
                Concluídos ({done.length})
              </h2>
              <div className="space-y-2">
                {done.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    updating={updating === b.id}
                    onSetStatus={setCheckinStatus}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BookingCard({
  booking,
  updating,
  onSetStatus,
  onDelete,
}: {
  booking: Booking;
  updating: boolean;
  onSetStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const b = booking;

  let classLabel: string;
  if (b.type === "PRIVATE" && b.privateSlot) {
    classLabel = `Aula Particular - ${b.privateSlot.startTime} - ${b.privateSlot.endTime}`;
  } else if (b.type === "GROUP" && b.groupClass) {
    classLabel = `${b.groupClass.name} - ${b.groupClass.startTime} - ${b.groupClass.endTime}`;
  } else {
    classLabel = b.type === "PRIVATE" ? "Aula Particular" : "Aula Coletiva";
  }

  return (
    <Card>
      <div className="flex items-center gap-3">
        <StudentAvatar name={b.user.name} photoUrl={b.user.photoUrl} size={36} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[13px] text-[#17181c] truncate">{b.user.name}</p>
          <p className="text-[11.5px] text-[#9b9ca2]">{classLabel}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {b.checkinStatus && (
            <Badge
              variant={
                b.checkinStatus === "PRESENTE" ? "green" :
                b.checkinStatus === "CANCELADO" ? "warning" : "danger"
              }
            >
              {b.checkinStatus === "PRESENTE" ? "Presente" :
               b.checkinStatus === "CANCELADO" ? "Cancelou" : "Ausente"}
            </Badge>
          )}
          <button
            onClick={() => onDelete(b.id)}
            disabled={updating}
            className="text-[#9b9ca2] hover:text-[#b42318] transition-colors p-1"
            title="Excluir"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onSetStatus(b.id, "PRESENTE")}
          disabled={updating}
          className={`flex-1 py-2 rounded-[8px] text-[11.5px] font-semibold transition-colors ${
            b.checkinStatus === "PRESENTE"
              ? "bg-[#0f7a4d] text-white"
              : "bg-[#e7f4ec] text-[#0f7a4d] hover:bg-[#d4eddf] border border-[#b9e2cb]"
          }`}
        >
          Presente
        </button>
        <button
          onClick={() => onSetStatus(b.id, "CANCELADO")}
          disabled={updating}
          className={`flex-1 py-2 rounded-[8px] text-[11.5px] font-semibold transition-colors ${
            b.checkinStatus === "CANCELADO"
              ? "bg-[#b45309] text-white"
              : "bg-[#fbf0dd] text-[#b45309] hover:bg-[#f5e5c8] border border-[#f0d9a8]"
          }`}
        >
          Cancelou
        </button>
        <button
          onClick={() => onSetStatus(b.id, "AUSENTE")}
          disabled={updating}
          className={`flex-1 py-2 rounded-[8px] text-[11.5px] font-semibold transition-colors ${
            b.checkinStatus === "AUSENTE"
              ? "bg-[#b42318] text-white"
              : "bg-[#fdeee9] text-[#b42318] hover:bg-[#fce0d8] border border-[#f5cfc6]"
          }`}
        >
          Ausente
        </button>
      </div>
    </Card>
  );
}
