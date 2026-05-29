"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  addWeeks,
  subWeeks,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  Trash2,
  CalendarCheck,
  RefreshCw,
} from "lucide-react";
import { DAY_NAMES } from "@/lib/utils";

interface Booking {
  id: string;
  type: string;
  date: string;
  checkedIn: boolean;
  checkinStatus?: string | null;
  groupClassId?: string | null;
  privateSlotId?: string | null;
  privateSlot?: { id: string; startTime: string; endTime: string } | null;
  groupClass?: { id: string; name: string; startTime: string; endTime: string } | null;
}

interface GroupClass {
  id: string;
  name: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
  isKids: boolean;
}

interface PrivateSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  userId: string | null;
}

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
}

export default function AgendaPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [groupClasses, setGroupClasses] = useState<GroupClass[]>([]);
  const [mySlots, setMySlots] = useState<PrivateSlot[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [credits, setCredits] = useState<{ monthlyCredits: number; used: number; remaining: number } | null>(null);
  const [rescheduleInfo, setRescheduleInfo] = useState<{ bookingId: string | null; slotId: string; originalDate: string } | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<PrivateSlot[]>([]);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  useEffect(() => {
    fetch("/api/bookings").then((r) => r.json()).then(setBookings);
    fetch("/api/group-classes").then((r) => r.json()).then(setGroupClasses);
    fetch("/api/events").then((r) => r.json()).then(setEvents);
    if (session?.user.studentType === "PARTICULAR") {
      fetch("/api/credits").then((r) => r.json()).then(setCredits);
    }
  }, [session?.user.studentType]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const today = format(new Date(), "yyyy-MM-dd");
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedDayOfWeek = selectedDate.getDay();

  // Refetch slots when selected date changes to filter out taken open slots
  useEffect(() => {
    fetch(`/api/slots?date=${selectedDateStr}`).then((r) => r.json()).then(setMySlots);
  }, [selectedDateStr]);

  // Fetch available slots when reschedule date changes
  useEffect(() => {
    if (rescheduleDate) {
      fetch(`/api/slots?date=${rescheduleDate}`)
        .then((r) => r.json())
        .then((slots: PrivateSlot[]) => {
          const dayOfWeek = new Date(rescheduleDate + "T12:00:00").getDay();
          setRescheduleSlots(slots.filter((s) => !s.userId && s.dayOfWeek === dayOfWeek));
        });
    } else {
      setRescheduleSlots([]);
    }
  }, [rescheduleDate]);

  const userIsKids = session?.user.isKids || false;
  const dayClasses = groupClasses.filter((gc) => gc.dayOfWeek === selectedDayOfWeek && gc.isKids === userIsKids);
  const dayBookings = bookings.filter((b) => b.date === selectedDateStr);
  const dayEvents = events.filter((e) => e.date === selectedDateStr);
  const privateBookings = dayBookings.filter((b) => b.type === "PRIVATE");

  // Bound slots (assigned to this student) for the selected day
  const boundSlots = mySlots.filter((s) => s.dayOfWeek === selectedDayOfWeek && s.isAvailable && s.userId);
  // Open slots (available for any student to book)
  const openSlots = mySlots.filter((s) => s.dayOfWeek === selectedDayOfWeek && s.isAvailable && !s.userId);

  function getBookingForClass(classId: string): Booking | undefined {
    return dayBookings.find((b) => b.groupClassId === classId);
  }

  function getBookingForSlot(slotId: string): Booking | undefined {
    return privateBookings.find((b) => b.privateSlotId === slotId);
  }

  function hasItems(date: Date) {
    const dateStr = format(date, "yyyy-MM-dd");
    const dow = date.getDay();
    return (
      bookings.some((b) => b.date === dateStr) ||
      events.some((e) => e.date === dateStr) ||
      groupClasses.some((gc) => gc.dayOfWeek === dow) ||
      mySlots.some((s) => s.dayOfWeek === dow && s.isAvailable)
    );
  }

  async function handleBookAndCheckin(groupClassId: string) {
    setActionLoading(groupClassId);
    const bookRes = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "GROUP", groupClassId, date: selectedDateStr }),
    });
    if (!bookRes.ok) {
      const data = await bookRes.json();
      alert(data.error || "Erro ao agendar");
      setActionLoading(null);
      return;
    }
    const booking = await bookRes.json();
    if (selectedDateStr === today) {
      const checkinRes = await fetch(`/api/bookings/${booking.id}/checkin`, { method: "PATCH" });
      if (checkinRes.ok) booking.checkedIn = true;
    }
    setBookings((prev) => [...prev, booking]);
    setActionLoading(null);
  }

  async function handleCheckin(bookingId: string) {
    setActionLoading(bookingId);
    const res = await fetch(`/api/bookings/${bookingId}/checkin`, { method: "PATCH" });
    if (res.ok) {
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, checkedIn: true } : b)));
    }
    setActionLoading(null);
  }

  async function handleBookPrivate(slotId: string) {
    setActionLoading(slotId);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "PRIVATE", privateSlotId: slotId, date: selectedDateStr }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao agendar");
        return;
      }
      const booking = await res.json();
      setBookings((prev) => [...prev, booking]);
      if (session?.user.studentType === "PARTICULAR") {
        fetch("/api/credits").then((r) => r.json()).then(setCredits);
      }
    } catch {
      alert("Erro de conexão ao agendar");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReschedule(newSlotId: string) {
    if (!rescheduleInfo || !rescheduleDate) return;
    setRescheduleLoading(true);
    try {
      const res = await fetch("/api/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalSlotId: rescheduleInfo.slotId,
          originalDate: rescheduleInfo.originalDate,
          newSlotId,
          newDate: rescheduleDate,
        }),
      });
      if (res.ok) {
        const newBooking = await res.json();
        setBookings((prev) => [
          ...prev.filter((b) => b.id !== rescheduleInfo.bookingId),
          newBooking,
        ]);
        setRescheduleInfo(null);
        setRescheduleDate("");
        fetch(`/api/slots?date=${selectedDateStr}`).then((r) => r.json()).then(setMySlots);
        if (session?.user.studentType === "PARTICULAR") {
          fetch("/api/credits").then((r) => r.json()).then(setCredits);
        }
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao remarcar");
      }
    } catch {
      alert("Erro de conexão ao remarcar");
    }
    setRescheduleLoading(false);
  }

  async function handleCancel(bookingId: string) {
    if (!confirm("Cancelar este agendamento?")) return;
    setActionLoading(bookingId);
    const res = await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
    if (res.ok) {
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      // Refetch slots and credits
      fetch(`/api/slots?date=${selectedDateStr}`).then((r) => r.json()).then(setMySlots);
      if (session?.user.studentType === "PARTICULAR") {
        fetch("/api/credits").then((r) => r.json()).then(setCredits);
      }
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao cancelar");
    }
    setActionLoading(null);
  }

  function getCheckinLabel(booking: Booking) {
    if (booking.checkinStatus === "PRESENTE") return "Presente";
    if (booking.checkinStatus === "CANCELADO") return "Cancelou";
    if (booking.checkinStatus === "AUSENTE") return "Ausente";
    if (booking.checkedIn) return "Presente";
    return null;
  }

  // Bound slot cards (read-only)
  const privateSlotCards = boundSlots.map((slot) => {
    const booking = getBookingForSlot(slot.id);
    return { slot, booking };
  });

  // Open slot cards (bookable by student)
  const openSlotCards = openSlots.map((slot) => {
    const booking = getBookingForSlot(slot.id);
    return { slot, booking };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-50">Minha Agenda</h1>
        {credits && credits.monthlyCredits > 0 && (
          <Badge variant={credits.remaining > 0 ? "success" : "danger"}>
            Créditos: {credits.remaining}/{credits.monthlyCredits}
          </Badge>
        )}
      </div>

      {/* Week navigation */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
          >
            <ChevronLeft size={18} />
          </Button>
          <span className="font-medium text-sm text-zinc-50">
            {format(currentWeekStart, "d MMM", { locale: ptBR })} -{" "}
            {format(addDays(currentWeekStart, 6), "d MMM yyyy", {
              locale: ptBR,
            })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
          >
            <ChevronRight size={18} />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = format(day, "yyyy-MM-dd") === today;
            const has = hasItems(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`flex flex-col items-center p-1.5 sm:p-2 rounded-md text-sm transition-colors ${
                  isSelected
                    ? "bg-orange-500 text-zinc-50"
                    : isToday
                    ? "bg-zinc-800"
                    : "hover:bg-zinc-800"
                }`}
              >
                <span className="text-[10px] sm:text-xs uppercase text-zinc-400">
                  <span className="sm:hidden">{format(day, "EEEEE", { locale: ptBR })}</span>
                  <span className="hidden sm:inline">{format(day, "EEE", { locale: ptBR })}</span>
                </span>
                <span className="font-medium text-zinc-50 text-sm sm:text-base">{format(day, "d")}</span>
                {has && (
                  <div
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 sm:mt-1 ${
                      isSelected ? "bg-white" : "bg-orange-500"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Day details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-lg font-semibold text-zinc-50">
            {format(selectedDate, "d 'de' MMMM, EEEE", { locale: ptBR })}
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] sm:text-xs text-zinc-400">Meus horários</span>
            <button
              role="switch"
              aria-checked={showOnlyMine}
              onClick={() => setShowOnlyMine((v) => !v)}
              className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 shrink-0 items-center rounded-full transition-colors ${
                showOnlyMine ? "bg-orange-500" : "bg-zinc-700"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-white shadow transition-transform ${
                  showOnlyMine ? "translate-x-4 sm:translate-x-6" : "translate-x-0.5 sm:translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Events */}
        {dayEvents.map((event) => (
          <Card key={event.id} className="!p-4 border-l-4 border-l-gray-400">
            <p className="font-medium text-sm text-zinc-50">{event.title}</p>
            {event.description && (
              <p className="text-xs text-zinc-400 mt-1">
                {event.description}
              </p>
            )}
            <Badge className="mt-2">Evento</Badge>
          </Card>
        ))}

        {/* Group classes for the day (only for Grappling students) */}
        {(session?.user.modalities || "GRAPPLING").includes("GRAPPLING") && dayClasses.filter((gc) => {
          if (!showOnlyMine) return true;
          return !!getBookingForClass(gc.id);
        }).map((gc) => {
          const booking = getBookingForClass(gc.id);
          const isBooked = !!booking;
          const isCheckedIn = booking?.checkedIn || false;
          const isToday = selectedDateStr === today;
          const loading = actionLoading === gc.id || actionLoading === booking?.id;

          return (
            <Card
              key={gc.id}
              className={`!p-4 border-l-4 transition-colors ${
                isCheckedIn
                  ? "border-l-emerald-500"
                  : isBooked
                  ? "border-l-accent"
                  : "border-l-zinc-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-zinc-400" />
                    <span className="text-sm font-semibold text-zinc-50">
                      {gc.startTime} - {gc.endTime}
                    </span>
                  </div>
                  <p className="font-medium text-zinc-50">{gc.name}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="default">Coletiva</Badge>
                    {isCheckedIn && (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                        <CheckCircle size={14} />
                        Presente
                      </span>
                    )}
                    {isBooked && !isCheckedIn && (
                      <span className="flex items-center gap-1 text-orange-500 text-xs font-medium">
                        <CalendarCheck size={14} />
                        Agendado
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isBooked && (
                    <Button
                      size="sm"
                      disabled={loading}
                      onClick={() => handleBookAndCheckin(gc.id)}
                    >
                      {loading ? (
                        "..."
                      ) : isToday ? (
                        <>
                          <CheckCircle size={14} className="mr-1.5" />
                          Check-in
                        </>
                      ) : (
                        <>
                          <CalendarCheck size={14} className="mr-1.5" />
                          Agendar
                        </>
                      )}
                    </Button>
                  )}

                  {isBooked && !isCheckedIn && (
                    <>
                      {isToday && (
                        <Button
                          size="sm"
                          disabled={loading}
                          onClick={() => handleCheckin(booking!.id)}
                        >
                          {loading ? "..." : (
                            <>
                              <CheckCircle size={14} className="mr-1.5" />
                              Check-in
                            </>
                          )}
                        </Button>
                      )}
                      <button
                        onClick={() => handleCancel(booking!.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Cancelar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {/* Bound private slots */}
        {privateSlotCards.map(({ slot, booking }) => {
          const label = booking ? getCheckinLabel(booking) : null;
          return (
            <Card key={slot.id} className={`!p-4 border-l-4 ${
              label === "Presente" ? "border-l-emerald-500" :
              label === "Cancelou" ? "border-l-red-500" :
              label === "Ausente" ? "border-l-zinc-500" :
              "border-l-accent"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-zinc-400" />
                    <span className="text-sm font-semibold text-zinc-50">
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                  <p className="font-medium text-zinc-50">Aula Particular</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="success">Particular</Badge>
                    {label ? (
                      <span className={`flex items-center gap-1 text-xs font-medium ${
                        label === "Presente" ? "text-emerald-400" :
                        label === "Cancelou" ? "text-red-400" :
                        label === "Ausente" ? "text-zinc-400" : ""
                      }`}>
                        <CheckCircle size={14} />
                        {label}
                      </span>
                    ) : booking ? (
                      <span className="flex items-center gap-1 text-orange-500 text-xs font-medium">
                        <CalendarCheck size={14} />
                        Agendado
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-500">Sua aula</span>
                    )}
                  </div>
                </div>
                {!label && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setRescheduleInfo({
                      bookingId: booking?.id || null,
                      slotId: slot.id,
                      originalDate: selectedDateStr,
                    })}
                  >
                    <RefreshCw size={14} className="mr-1.5" />
                    Remarcar
                  </Button>
                )}
              </div>
            </Card>
          );
        })}

        {/* Open private slots (bookable) */}
        {openSlotCards.filter(({ booking }) => !showOnlyMine || !!booking).map(({ slot, booking }) => {
          const label = booking ? getCheckinLabel(booking) : null;
          const isBooked = !!booking;
          const loading = actionLoading === slot.id || actionLoading === booking?.id;
          return (
            <Card key={slot.id} className={`!p-4 border-l-4 ${
              label === "Presente" ? "border-l-emerald-500" :
              label === "Cancelou" ? "border-l-red-500" :
              label === "Ausente" ? "border-l-zinc-500" :
              isBooked ? "border-l-accent" :
              "border-l-zinc-800"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-zinc-400" />
                    <span className="text-sm font-semibold text-zinc-50">
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                  <p className="font-medium text-zinc-50">Aula Particular</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="success">Particular</Badge>
                    {label ? (
                      <span className={`flex items-center gap-1 text-xs font-medium ${
                        label === "Presente" ? "text-emerald-400" :
                        label === "Cancelou" ? "text-red-400" :
                        label === "Ausente" ? "text-zinc-400" : ""
                      }`}>
                        <CheckCircle size={14} />
                        {label}
                      </span>
                    ) : isBooked ? (
                      <span className="flex items-center gap-1 text-orange-500 text-xs font-medium">
                        <CalendarCheck size={14} />
                        Agendado
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-500">Disponível</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isBooked && !label && (
                    <Button
                      size="sm"
                      disabled={loading || (credits !== null && credits.monthlyCredits > 0 && credits.remaining <= 0)}
                      onClick={() => handleBookPrivate(slot.id)}
                    >
                      {loading ? "..." : (
                        <>
                          <CalendarCheck size={14} className="mr-1.5" />
                          Agendar
                        </>
                      )}
                    </Button>
                  )}
                  {isBooked && !label && (
                    <button
                      onClick={() => handleCancel(booking!.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Cancelar"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {/* Empty state */}
        {(() => {
          const hasGroupClasses = showOnlyMine
            ? dayClasses.some((gc) => !!getBookingForClass(gc.id))
            : dayClasses.length > 0;
          const hasOpenSlots = showOnlyMine
            ? openSlotCards.some(({ booking }) => !!booking)
            : openSlotCards.length > 0;
          const hasContent = hasGroupClasses || privateSlotCards.length > 0 || hasOpenSlots || dayEvents.length > 0;

          if (!hasContent) return (
            <Card className="!p-8">
              <p className="text-zinc-400 text-sm text-center">
                {showOnlyMine
                  ? "Nenhum horário agendado para este dia"
                  : DAY_NAMES[selectedDayOfWeek] === "Domingo" || DAY_NAMES[selectedDayOfWeek] === "Sábado"
                  ? "Sem treinos programados para o fim de semana"
                  : "Nenhum treino programado para este dia"}
              </p>
            </Card>
          );
          return null;
        })()}
      </div>

      {/* Reschedule modal */}
      {rescheduleInfo && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => { setRescheduleInfo(null); setRescheduleDate(""); }}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw size={18} className="text-orange-500" />
              <h2 className="text-lg font-semibold text-zinc-50">Remarcar Aula</h2>
            </div>
            <p className="text-sm text-zinc-400 mb-4">
              Selecione uma nova data e horário para sua aula.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-2">Nova data</label>
              <input
                type="date"
                min={today}
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {rescheduleDate && (
              <div className="mb-4">
                <p className="text-sm text-zinc-400 mb-3">
                  Horários disponíveis — {DAY_NAMES[new Date(rescheduleDate + "T12:00:00").getDay()]}
                </p>
                {rescheduleSlots.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">
                    Nenhum horário disponível nesta data
                  </p>
                ) : (
                  <div className="space-y-2">
                    {rescheduleSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-zinc-400" />
                          <span className="text-sm font-medium text-zinc-50">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          disabled={rescheduleLoading}
                          onClick={() => handleReschedule(slot.id)}
                        >
                          {rescheduleLoading ? "..." : "Selecionar"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setRescheduleInfo(null); setRescheduleDate(""); }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
