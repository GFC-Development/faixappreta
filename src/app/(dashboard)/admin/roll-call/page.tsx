"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { StudentAvatar } from "@/components/student-avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";

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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PRESENTE: { label: "Presente", color: "text-emerald-400", icon: <CheckCircle size={14} /> },
  CANCELADO: { label: "Cancelou", color: "text-amber-400", icon: <Clock size={14} /> },
  AUSENTE: { label: "Ausente", color: "text-red-400", icon: <XCircle size={14} /> },
};

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
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-zinc-50 mb-1">Chamada</h1>
      <p className="text-sm text-zinc-400 mb-6">
        Registre a presença dos alunos nas aulas agendadas.
      </p>

      <div className="mb-6">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-50"
        />
        <p className="text-xs text-zinc-400 mt-1 capitalize">{dateLabel}</p>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm text-center py-8">Carregando...</p>
      ) : bookings.length === 0 ? (
        <Card>
          <p className="text-zinc-400 text-sm text-center py-8">
            Nenhum agendamento para esta data.
          </p>
        </Card>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wider">
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
              <h2 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wider">
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

  const currentStatus = b.checkinStatus ? STATUS_CONFIG[b.checkinStatus] : null;

  return (
    <Card className="!p-3">
      <div className="flex items-center gap-3">
        <StudentAvatar name={b.user.name} photoUrl={b.user.photoUrl} size={40} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-50 truncate">{b.user.name}</p>
          <p className="text-xs text-zinc-400">{classLabel}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {currentStatus && (
            <span className={`flex items-center gap-1 text-xs font-medium ${currentStatus.color}`}>
              {currentStatus.icon}
              {currentStatus.label}
            </span>
          )}
          <button
            onClick={() => onDelete(b.id)}
            disabled={updating}
            className="text-zinc-500 hover:text-red-400 transition-colors p-1"
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
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
            b.checkinStatus === "PRESENTE"
              ? "bg-emerald-500 text-white"
              : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
          }`}
        >
          Presente
        </button>
        <button
          onClick={() => onSetStatus(b.id, "CANCELADO")}
          disabled={updating}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
            b.checkinStatus === "CANCELADO"
              ? "bg-amber-500 text-white"
              : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30"
          }`}
        >
          Cancelou
        </button>
        <button
          onClick={() => onSetStatus(b.id, "AUSENTE")}
          disabled={updating}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
            b.checkinStatus === "AUSENTE"
              ? "bg-red-500 text-white"
              : "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
          }`}
        >
          Ausente
        </button>
      </div>
    </Card>
  );
}
