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
  RefreshCw,
} from "lucide-react";
import { DAY_NAMES, getBeltsForType, isParticular } from "@/lib/utils";
import { Trophy } from "lucide-react";

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
  fixedRoster: boolean;
  enrollments?: { userId: string }[];
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
  const [credits, setCredits] = useState<{ monthlyCredits: number; used: number; remaining: number } | null>(null);
  const [rescheduleInfo, setRescheduleInfo] = useState<{ bookingId: string | null; slotId: string; originalDate: string } | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<PrivateSlot[]>([]);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [rankPosition, setRankPosition] = useState<{ position: number; total: number; presences: number } | null>(null);

  useEffect(() => {
    fetch("/api/bookings").then((r) => r.json()).then(setBookings);
    fetch("/api/group-classes").then((r) => r.json()).then(setGroupClasses);
    fetch("/api/events").then((r) => r.json()).then(setEvents);
    fetch("/api/belt-requirements").then((r) => r.json()).then(setRequirements);
    if (isParticular(session?.user.studentType || "")) {
      fetch("/api/credits").then((r) => r.json()).then(setCredits);
    }
    fetch("/api/ranking/my-position").then((r) => r.json()).then(setRankPosition).catch(() => {});
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkins = bookings.filter((b) => b.checkedIn).length + initialCheckins;

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const today = format(new Date(), "yyyy-MM-dd");
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedDayOfWeek = selectedDate.getDay();

  useEffect(() => {
    fetch(`/api/slots?date=${selectedDateStr}`).then((r) => r.json()).then(setMySlots);
  }, [selectedDateStr]);

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
  const allDayClasses = groupClasses.filter((gc) => gc.dayOfWeek === selectedDayOfWeek && gc.isKids === userIsKids);
  const fixedRosterClasses = allDayClasses.filter((gc) => gc.fixedRoster && gc.enrollments?.some((e) => e.userId === user.id));
  const dayClasses = allDayClasses.filter((gc) => !gc.fixedRoster);
  const dayBookings = bookings.filter((b) => b.date === selectedDateStr);
  const dayEvents = events.filter((e) => e.date === selectedDateStr);
  const privateBookings = dayBookings.filter((b) => b.type === "PRIVATE");

  const boundSlots = mySlots.filter((s) => s.dayOfWeek === selectedDayOfWeek && s.isAvailable && s.userId);
  const openSlots = mySlots.filter((s) => s.dayOfWeek === selectedDayOfWeek && s.isAvailable && !s.userId);

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
      groupClasses.some((gc) => gc.dayOfWeek === dow && (!gc.fixedRoster || gc.enrollments?.some((e) => e.userId === user.id))) ||
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
        if (isParticular(session?.user.studentType || "")) {
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

  const privateSlotCards = boundSlots.map((slot) => {
    const booking = getBookingForSlot(slot.id);
    return { slot, booking };
  });

  const openSlotCards = openSlots.map((slot) => {
    const booking = getBookingForSlot(slot.id);
    return { slot, booking };
  });

  return (
    <div>
      <h1 className="font-archivo text-[24px] font-bold mb-5 text-[#17181c]">
        Olá, {user.name}!
      </h1>

      <NotificationBanner />

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <div className="mb-5 space-y-2">
          <h2 className="font-spline text-[9.5px] tracking-[.1em] uppercase text-[#9b9ca2] flex items-center gap-2">
            <CalendarDays size={14} />
            Próximos Eventos
          </h2>
          {upcomingEvents.map((event) => (
            <Card key={event.id} className="!p-4 border-l-4 border-l-amber-500">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-[13px] text-[#17181c]">{event.title}</p>
                  {event.description && (
                    <p className="text-[11.5px] text-[#5c5d63] mt-0.5">{event.description}</p>
                  )}
                </div>
                <span className="text-[11px] text-[#9b9ca2] shrink-0">
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

      {/* Belt card */}
      {hasGrappling ? (
        <Card className="mb-5">
          <div className="flex flex-col sm:flex-row items-start gap-3">
            <div className="flex-1 w-full">
              <div className="mb-1">
                <BeltVisual belt={user.belt} degrees={user.degrees} width={320} />
              </div>
              </div>
            {rankPosition && rankPosition.position > 0 && (
              <div className="shrink-0 flex sm:flex-col items-center gap-2 sm:gap-0 bg-[#f4f4f6] rounded-[9px] px-4 py-2.5 sm:py-3 border border-[#e9e9ec] w-full sm:w-auto">
                <Trophy size={18} className="text-yellow-400 sm:mb-1" />
                <p className="font-archivo text-xl sm:text-2xl font-bold text-[#17181c]">{rankPosition.position}°</p>
                <p className="text-[10px] font-spline uppercase tracking-[.1em] text-[#9b9ca2] hidden sm:block">ranking</p>
                <p className="text-[11px] text-[#5c5d63] sm:mt-0.5">{rankPosition.presences} {rankPosition.presences === 1 ? "presença" : "presenças"}</p>
              </div>
            )}
          </div>

          {lastGraduationDate && (
            <p className="text-[11px] text-[#9b9ca2] mt-1">
              Última graduação: {new Date(lastGraduationDate).toLocaleDateString("pt-BR")}
            </p>
          )}

          {degreeReq && (
            <DegreeProgress
              checkins={checkinsSinceGraduation}
              belt={user.belt}
              nextDegree={nextDegree!}
              requiredClasses={degreeReq.requiredClasses}
              showCount={false}
            />
          )}

          {nextBelt && nextBeltReq && nextBeltReq.requiredClasses > 0 ? (
            <>
              <BeltProgress
                checkins={checkinsSinceBeltChange}
                nextBelt={nextBelt}
                requiredClasses={nextBeltReq.requiredClasses}
                width={320}
                showCount={false}
              />
              <div className={`mt-3 p-3 rounded-[9px] text-[13px] ${
                checkinsSinceBeltChange >= nextBeltReq.requiredClasses
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
              }`}>
                {checkinsSinceBeltChange >= nextBeltReq.requiredClasses
                  ? "Apto para promoção de faixa"
                  : "Ainda não apto para promoção de faixa"}
              </div>
            </>
          ) : nextBelt && (!nextBeltReq || nextBeltReq.requiredClasses === 0) ? (
            <p className="text-[11.5px] text-[#5c5d63] border-t border-[#e9e9ec] pt-3 mt-3">
              Requisito para faixa {nextBelt} não configurado.
            </p>
          ) : (
            <p className="text-[11.5px] text-[#5c5d63] border-t border-[#e9e9ec] pt-3 mt-3">
              Faixa máxima atingida.
            </p>
          )}
        </Card>
      ) : (
        <Card className="mb-5">
          <p className="font-archivo text-[32px] font-bold text-[#17181c]">{checkins} <span className="text-[14px] font-hanken font-normal text-[#5c5d63]">{checkins === 1 ? "presença" : "presenças"}</span></p>
        </Card>
      )}

      {/* Agenda - Week navigation */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-[14px] text-[#17181c]">Minha Agenda</h2>
        {credits && credits.monthlyCredits > 0 && (
          <Badge variant={credits.remaining > 0 ? "success" : "danger"}>
            Créditos: {credits.remaining}/{credits.monthlyCredits}
          </Badge>
        )}
      </div>

      <Card className="mb-5">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
          >
            <ChevronLeft size={18} />
          </Button>
          <span className="font-medium text-[13px] text-[#17181c]">
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
                className={`flex flex-col items-center p-1.5 sm:p-2 rounded-[8px] text-sm transition-colors ${
                  isSelected
                    ? "bg-accent text-accent-on"
                    : isToday
                    ? "bg-[#f4f4f6]"
                    : "hover:bg-[#f4f4f6]"
                }`}
              >
                <span className={`text-[10px] sm:text-[11px] uppercase transition-colors ${isSelected ? "opacity-80" : "text-[#9b9ca2]"}`}>
                  <span className="sm:hidden">{format(day, "EEEEE", { locale: ptBR })}</span>
                  <span className="hidden sm:inline">{format(day, "EEE", { locale: ptBR })}</span>
                </span>
                <span className={`font-medium text-sm sm:text-base transition-colors ${!isSelected && "text-[#17181c]"}`}>{format(day, "d")}</span>
                {has && (
                  <div
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 sm:mt-1 ${
                      isSelected ? "bg-white" : "bg-accent"
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
          <h3 className="text-[13px] sm:text-[14px] font-semibold text-[#17181c]">
            {format(selectedDate, "d 'de' MMMM, EEEE", { locale: ptBR })}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] sm:text-[11px] text-[#5c5d63]">Meus horários</span>
            <button
              role="switch"
              aria-checked={showOnlyMine}
              onClick={() => setShowOnlyMine((v) => !v)}
              className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 shrink-0 items-center rounded-full transition-colors ${
                showOnlyMine ? "bg-accent" : "bg-[#e9e9ec]"
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

        {/* Events on this day */}
        {dayEvents.map((event) => (
          <Card key={event.id} className="!p-4 border-l-4 border-l-amber-500">
            <p className="font-medium text-[13px] text-[#17181c]">{event.title}</p>
            {event.description && (
              <p className="text-[11.5px] text-[#5c5d63] mt-1">{event.description}</p>
            )}
            <Badge className="mt-2">Evento</Badge>
          </Card>
        ))}

        {/* Fixed roster classes */}
        {hasGrappling && fixedRosterClasses.map((gc) => {
          const booking = getBookingForClass(gc.id);
          const isCheckedIn = booking?.checkedIn || false;
          const isTodaySelected = selectedDateStr === today;
          const loading = actionLoading === booking?.id;

          return (
            <Card
              key={gc.id}
              className={`!p-4 border-l-4 transition-colors ${
                isCheckedIn ? "border-l-emerald-500" : "border-l-accent"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-[#5c5d63]" />
                    <span className="text-[13px] font-semibold text-[#17181c]">
                      {gc.startTime} - {gc.endTime}
                    </span>
                  </div>
                  <p className="font-medium text-[13px] text-[#17181c]">{gc.name}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="default">Turma Fixa</Badge>
                    {isCheckedIn && (
                      <span className="flex items-center gap-1 text-emerald-600 text-[11.5px] font-medium">
                        <CheckCircle size={14} />
                        Presente
                      </span>
                    )}
                    {!isCheckedIn && booking && (
                      <span className="flex items-center gap-1 text-accent text-[11.5px] font-medium">
                        <CalendarCheck size={14} />
                        Matriculado
                      </span>
                    )}
                    {!booking && (
                      <span className="text-[11.5px] text-[#9b9ca2]">Matriculado</span>
                    )}
                  </div>
                </div>
                {booking && !isCheckedIn && isTodaySelected && (
                  <Button
                    size="sm"
                    disabled={!!loading}
                    onClick={() => handleCheckin(booking.id)}
                  >
                    {loading ? "..." : (
                      <>
                        <CheckCircle size={14} className="mr-1.5" />
                        Check-in
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}

        {/* Group classes */}
        {hasGrappling && dayClasses.filter((gc) => {
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
                  : "border-l-[#e9e9ec]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-[#5c5d63]" />
                    <span className="text-[13px] font-semibold text-[#17181c]">
                      {gc.startTime} - {gc.endTime}
                    </span>
                  </div>
                  <p className="font-medium text-[13px] text-[#17181c]">{gc.name}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="default">Coletiva</Badge>
                    {isCheckedIn && (
                      <span className="flex items-center gap-1 text-emerald-600 text-[11.5px] font-medium">
                        <CheckCircle size={14} />
                        Presente
                      </span>
                    )}
                    {isBooked && !isCheckedIn && (
                      <span className="flex items-center gap-1 text-accent text-[11.5px] font-medium">
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
                        className="text-[#b42318] hover:text-red-700 p-1"
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
              label === "Ausente" ? "border-l-[#9b9ca2]" :
              "border-l-accent"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-[#5c5d63]" />
                    <span className="text-[13px] font-semibold text-[#17181c]">
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                  <p className="font-medium text-[13px] text-[#17181c]">Aula Particular</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="success">Particular</Badge>
                    {label ? (
                      <span className={`flex items-center gap-1 text-[11.5px] font-medium ${
                        label === "Presente" ? "text-emerald-600" :
                        label === "Cancelou" ? "text-[#b42318]" :
                        label === "Ausente" ? "text-[#5c5d63]" : ""
                      }`}>
                        <CheckCircle size={14} />
                        {label}
                      </span>
                    ) : booking ? (
                      <span className="flex items-center gap-1 text-accent text-[11.5px] font-medium">
                        <CalendarCheck size={14} />
                        Agendado
                      </span>
                    ) : (
                      <span className="text-[11.5px] text-[#9b9ca2]">Sua aula</span>
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
              label === "Ausente" ? "border-l-[#9b9ca2]" :
              isBooked ? "border-l-accent" :
              "border-l-[#e9e9ec]"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-[#5c5d63]" />
                    <span className="text-[13px] font-semibold text-[#17181c]">
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                  <p className="font-medium text-[13px] text-[#17181c]">Aula Particular</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="success">Particular</Badge>
                    {label ? (
                      <span className={`flex items-center gap-1 text-[11.5px] font-medium ${
                        label === "Presente" ? "text-emerald-600" :
                        label === "Cancelou" ? "text-[#b42318]" :
                        label === "Ausente" ? "text-[#5c5d63]" : ""
                      }`}>
                        <CheckCircle size={14} />
                        {label}
                      </span>
                    ) : isBooked ? (
                      <span className="flex items-center gap-1 text-accent text-[11.5px] font-medium">
                        <CalendarCheck size={14} />
                        Agendado
                      </span>
                    ) : (
                      <span className="text-[11.5px] text-[#9b9ca2]">Disponível</span>
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
                      className="text-[#b42318] hover:text-red-700 p-1"
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
          const hasContent = hasGroupClasses || fixedRosterClasses.length > 0 || privateSlotCards.length > 0 || hasOpenSlots || dayEvents.length > 0;
          if (!hasContent) return (
            <Card className="!p-8">
              <p className="text-[#9b9ca2] text-[13px] text-center">
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
          className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4"
          onClick={() => { setRescheduleInfo(null); setRescheduleDate(""); }}
        >
          <div
            className="bg-white border border-[#e9e9ec] rounded-[18px] p-6 w-full max-w-[460px] max-h-[80vh] overflow-y-auto animate-fp-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw size={18} className="text-accent" />
              <h2 className="font-archivo text-[18px] font-bold text-[#17181c]">Remarcar Aula</h2>
            </div>
            <p className="text-[13px] text-[#5c5d63] mb-4">
              Selecione uma nova data e horário para sua aula.
            </p>

            <div className="mb-4">
              <label className="block font-spline text-[9.5px] tracking-[.1em] uppercase text-[#9b9ca2] mb-1.5">Nova data</label>
              <input
                type="date"
                min={today}
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full rounded-[9px] border border-[#e6e6e9] bg-white px-[13px] py-3 text-sm text-[#17181c] focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {rescheduleDate && (
              <div className="mb-4">
                <p className="text-[13px] text-[#5c5d63] mb-3">
                  Horários disponíveis — {DAY_NAMES[new Date(rescheduleDate + "T12:00:00").getDay()]}
                </p>
                {rescheduleSlots.length === 0 ? (
                  <p className="text-[13px] text-[#9b9ca2] text-center py-4">
                    Nenhum horário disponível nesta data
                  </p>
                ) : (
                  <div className="space-y-2">
                    {rescheduleSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3 bg-[#f4f4f6] rounded-[9px]"
                      >
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-[#5c5d63]" />
                          <span className="text-[13px] font-medium text-[#17181c]">
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
