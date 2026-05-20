"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BeltVisual, BeltProgress } from "@/components/belt-visual";
import { DegreeProgress } from "@/components/degree-progress";
import { NotificationBanner } from "@/components/notification-banner";
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
  CalendarDays,
} from "lucide-react";
import { DAY_NAMES, getBeltsForType } from "@/lib/utils";

interface BeltRequirement {
  belt: string;
  requiredClasses: number;
}

interface DegreeRequirementData {
  belt: string;
  degree: number;
  requiredClasses: number;
}

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

function getNextBelt(current: string, isKids: boolean): string | null {
  const belts = getBeltsForType(isKids);
  const idx = belts.indexOf(current);
  if (idx === -1 || idx >= belts.length - 1) return null;
  return belts[idx + 1];
}

export default function StudentHome() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [groupClasses, setGroupClasses] = useState<GroupClass[]>([]);
  const [mySlots, setMySlots] = useState<PrivateSlot[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [requirements, setRequirements] = useState<BeltRequirement[]>([]);
  const [degreeRequirements, setDegreeRequirements] = useState<DegreeRequirementData[]>([]);
  const [initialCheckins, setInitialCheckins] = useState(0);
  const [lastGraduationDate, setLastGraduationDate] = useState<string | null>(null);
  const [lastBeltChangeDate, setLastBeltChangeDate] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bookings").then((r) => r.json()).then(setBookings);
    fetch("/api/group-classes").then((r) => r.json()).then(setGroupClasses);
    fetch("/api/events").then((r) => r.json()).then(setEvents);
    fetch("/api/belt-requirements").then((r) => r.json()).then(setRequirements);
    fetch("/api/belt-requirements?type=degree")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setDegreeRequirements(data); });
    fetch("/api/student/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.initialCheckins) setInitialCheckins(data.initialCheckins);
        if (data.lastGraduationDate) setLastGraduationDate(data.lastGraduationDate);
        if (data.lastBeltChangeDate) setLastBeltChangeDate(data.lastBeltChangeDate);
      })
      .catch(() => {});
  }, []);

  const checkins = bookings.filter((b) => b.checkedIn).length + initialCheckins;

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

  const userIsKids = session?.user.isKids || false;
  const dayClasses = groupClasses.filter((gc) => gc.dayOfWeek === selectedDayOfWeek && gc.isKids === userIsKids);
  const dayBookings = bookings.filter((b) => b.date === selectedDateStr);
  const dayEvents = events.filter((e) => e.date === selectedDateStr);
  const privateBookings = dayBookings.filter((b) => b.type === "PRIVATE");

  // Bound slots (assigned to this student) for the selected day
  const boundSlots = mySlots.filter((s) => s.dayOfWeek === selectedDayOfWeek && s.isAvailable && s.userId);
  // Open slots (available for any student to book)
  const openSlots = mySlots.filter((s) => s.dayOfWeek === selectedDayOfWeek && s.isAvailable && !s.userId);

  // Upcoming events (next 30 days)
  const upcomingEvents = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const in30 = format(addDays(new Date(), 30), "yyyy-MM-dd");
    return events
      .filter((e) => e.date >= todayStr && e.date <= in30)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [events]);

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
    } catch {
      alert("Erro de conexão ao agendar");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(bookingId: string) {
    if (!confirm("Cancelar este agendamento?")) return;
    setActionLoading(bookingId);
    const res = await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
    if (res.ok) {
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
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

  if (!session) return null;

  const { user } = session;
  const hasGrappling = (user.modalities || "GRAPPLING").includes("GRAPPLING");
  const nextBelt = getNextBelt(user.belt, user.isKids);
  const nextBeltReq = nextBelt ? requirements.find((r) => r.belt === nextBelt) : null;
  const checkinsSinceBeltChange = lastBeltChangeDate
    ? bookings.filter((b) => b.checkedIn && b.date > lastBeltChangeDate.split("T")[0]).length
    : checkins;
  const checkinsSinceGraduation = lastGraduationDate
    ? bookings.filter((b) => b.checkedIn && b.date > lastGraduationDate.split("T")[0]).length
    : checkins;
  const nextDegree = user.degrees < 4 ? user.degrees + 1 : null;
  const degreeReq = nextDegree
    ? degreeRequirements.find((r) => r.belt === user.belt && r.degree === nextDegree)
    : null;

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
      <h1 className="text-2xl font-bold mb-6 text-zinc-50">
        Olá, {user.name}!
      </h1>

      <NotificationBanner />

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <div className="mb-6 space-y-2">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide flex items-center gap-2">
            <CalendarDays size={16} />
            Próximos Eventos
          </h2>
          {upcomingEvents.map((event) => (
            <Card key={event.id} className="!p-4 border-l-4 border-l-amber-500">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-sm text-zinc-50">{event.title}</p>
                  {event.description && (
                    <p className="text-xs text-zinc-400 mt-0.5">{event.description}</p>
                  )}
                </div>
                <span className="text-xs text-zinc-500 shrink-0">
                  {new Date(event.date + "T12:00:00").toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Belt card (only for Grappling students) */}
      {hasGrappling ? (
        <Card className="mb-6">
          <div className="mb-1">
            <BeltVisual belt={user.belt} degrees={user.degrees} width={320} />
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-zinc-400">
              Plano: {user.studentType === "PARTICULAR" ? "Particular + Coletiva" : "Coletiva"}
            </p>
            <p className="text-sm text-zinc-400">
              Total: <span className="font-semibold text-zinc-200">{checkins} presenças</span>
            </p>
          </div>

          {lastGraduationDate && (
            <p className="text-xs text-zinc-500 mt-1">
              Última graduação: {new Date(lastGraduationDate).toLocaleDateString("pt-BR")}
            </p>
          )}

          {degreeReq && (
            <DegreeProgress
              checkins={checkinsSinceGraduation}
              belt={user.belt}
              nextDegree={nextDegree!}
              requiredClasses={degreeReq.requiredClasses}
            />
          )}

          {nextBelt && nextBeltReq && nextBeltReq.requiredClasses > 0 ? (
            <BeltProgress
              checkins={checkinsSinceBeltChange}
              nextBelt={nextBelt}
              requiredClasses={nextBeltReq.requiredClasses}
              width={320}
            />
          ) : nextBelt && (!nextBeltReq || nextBeltReq.requiredClasses === 0) ? (
            <p className="text-xs text-zinc-400 border-t border-zinc-800 pt-3 mt-3">
              Requisito para faixa {nextBelt} não configurado.
            </p>
          ) : (
            <p className="text-xs text-zinc-400 border-t border-zinc-800 pt-3 mt-3">
              Faixa máxima atingida.
            </p>
          )}
        </Card>
      ) : (
        <Card className="mb-6">
          <p className="text-sm text-zinc-400">
            Plano: {user.studentType === "PARTICULAR" ? "Particular + Coletiva" : "Coletiva"}
          </p>
          <p className="text-2xl font-bold text-zinc-50 mt-2">{checkins} presenças</p>
        </Card>
      )}

      {/* Agenda - Week navigation */}
      <h2 className="text-lg font-semibold mb-3 text-zinc-50">Minha Agenda</h2>

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
            {format(addDays(currentWeekStart, 6), "d MMM yyyy", { locale: ptBR })}
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
        <h3 className="text-base font-semibold text-zinc-50">
          {format(selectedDate, "d 'de' MMMM, EEEE", { locale: ptBR })}
        </h3>

        {/* Events on this day */}
        {dayEvents.map((event) => (
          <Card key={event.id} className="!p-4 border-l-4 border-l-amber-500">
            <p className="font-medium text-sm text-zinc-50">{event.title}</p>
            {event.description && (
              <p className="text-xs text-zinc-400 mt-1">{event.description}</p>
            )}
            <Badge className="mt-2">Evento</Badge>
          </Card>
        ))}

        {/* Group classes (only for Grappling students) */}
        {hasGrappling && dayClasses.map((gc) => {
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

        {/* Bound private slots (read-only) */}
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
                    ) : (
                      <span className="flex items-center gap-1 text-orange-500 text-xs font-medium">
                        <CalendarCheck size={14} />
                        Agendado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {/* Open private slots (bookable) */}
        {openSlotCards.map(({ slot, booking }) => {
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
                      disabled={loading}
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
        {dayClasses.length === 0 && privateSlotCards.length === 0 && openSlotCards.length === 0 && dayEvents.length === 0 && (
          <Card className="!p-8">
            <p className="text-zinc-400 text-sm text-center">
              {DAY_NAMES[selectedDayOfWeek] === "Domingo" || DAY_NAMES[selectedDayOfWeek] === "Sábado"
                ? "Sem treinos programados para o fim de semana"
                : "Nenhum treino programado para este dia"}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
