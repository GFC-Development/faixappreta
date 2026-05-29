"use client";

import { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StudentAvatar } from "@/components/student-avatar";
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
  Clock,
  Users,
  User,
  RefreshCw,
  X,
  Search,
  Trash2,
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
  user: { id: string; name: string } | null;
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
  user: { id: string; name: string } | null;
}

interface Student {
  id: string;
  name: string;
  email: string;
  studentType: string;
  modalities: string;
  photoUrl: string | null;
}

interface RescheduleLog {
  privateSlotId: string;
  userId: string;
}

export default function AdminAgendaPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rescheduleLogs, setRescheduleLogs] = useState<RescheduleLog[]>([]);
  const [groupClasses, setGroupClasses] = useState<GroupClass[]>([]);
  const [slots, setSlots] = useState<PrivateSlot[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // Modal state
  const [modalTarget, setModalTarget] = useState<{ type: "PRIVATE"; slot: PrivateSlot; slotGroup?: PrivateSlot[] } | { type: "GROUP"; groupClass: GroupClass } | null>(null);
  const [modalSearch, setModalSearch] = useState("");
  const [bookingStudent, setBookingStudent] = useState<string | null>(null);

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedDayOfWeek = selectedDate.getDay();
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    fetch("/api/group-classes").then((r) => r.json()).then(setGroupClasses);
    fetch("/api/slots").then((r) => r.json()).then(setSlots);
    fetch("/api/students").then((r) => r.json()).then(setStudents);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/bookings/pending?date=${selectedDateStr}`)
      .then((r) => r.json())
      .then((data) => {
        setBookings(data.bookings || data);
        setRescheduleLogs(data.rescheduleLogs || []);
        setLoading(false);
      });
  }, [selectedDateStr]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const dayClasses = groupClasses.filter((gc) => gc.dayOfWeek === selectedDayOfWeek);
  const dayBookings = bookings.filter((b) => b.date === selectedDateStr);

  const daySlots = slots.filter(
    (s) => s.dayOfWeek === selectedDayOfWeek && s.isAvailable
  );

  function getBookingsForClass(classId: string): Booking[] {
    return dayBookings.filter((b) => b.groupClassId === classId);
  }

  function getBookingsForSlot(slotId: string): Booking[] {
    return dayBookings.filter((b) => b.privateSlotId === slotId);
  }

  function hasItems(date: Date) {
    const dow = date.getDay();
    return (
      groupClasses.some((gc) => gc.dayOfWeek === dow) ||
      slots.some((s) => s.dayOfWeek === dow && s.isAvailable)
    );
  }

  function statusBadge(booking: Booking) {
    if (booking.checkinStatus === "PRESENTE" || booking.checkedIn)
      return <Badge variant="success">Presente</Badge>;
    if (booking.checkinStatus === "CANCELADO")
      return <Badge variant="danger">Cancelou</Badge>;
    if (booking.checkinStatus === "AUSENTE")
      return <Badge variant="default">Ausente</Badge>;
    return <Badge variant="default">Agendado</Badge>;
  }

  function refetchBookings() {
    setLoading(true);
    fetch(`/api/bookings/pending?date=${selectedDateStr}`)
      .then((r) => r.json())
      .then((data) => {
        setBookings(data.bookings || data);
        setRescheduleLogs(data.rescheduleLogs || []);
        setLoading(false);
      });
  }

  async function handleBookForStudent(studentId: string) {
    if (!modalTarget) return;
    setBookingStudent(studentId);
    try {
      const body: Record<string, string> = {
        date: selectedDateStr,
        userId: studentId,
      };
      if (modalTarget.type === "PRIVATE") {
        body.type = "PRIVATE";
        body.privateSlotId = modalTarget.slot.id;
      } else {
        body.type = "GROUP";
        body.groupClassId = modalTarget.groupClass.id;
      }
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        refetchBookings();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao agendar");
      }
    } finally {
      setBookingStudent(null);
    }
  }

  async function handleDeleteBooking(bookingId: string) {
    if (!confirm("Remover este agendamento?")) return;
    const res = await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
    if (res.ok) {
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    }
  }

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(modalSearch.toLowerCase())
  );

  function modalityLabel(modalities: string) {
    return (modalities || "GRAPPLING").split(",").map((m) =>
      m === "GRAPPLING" ? "Grappling/JJ" : "MMA/Boxe"
    ).join(", ");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-50">Agenda do Dia</h1>
        <Button variant="ghost" size="sm" onClick={refetchBookings} disabled={loading}>
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </Button>
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
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-50">
          {format(selectedDate, "d 'de' MMMM, EEEE", { locale: ptBR })}
        </h2>

        {loading && (
          <p className="text-zinc-400 text-sm">Carregando...</p>
        )}

        {!loading && (
          <>
            {/* Group classes */}
            {dayClasses.map((gc) => {
              const classBookings = getBookingsForClass(gc.id);
              return (
                <Card key={gc.id} className="!p-4 border-l-4 border-l-accent">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={14} className="text-zinc-400" />
                    <span className="text-sm font-semibold text-zinc-50">
                      {gc.startTime} - {gc.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <p className="font-medium text-zinc-50">{gc.name}</p>
                    <Badge>Coletiva</Badge>
                    {gc.isKids && <Badge variant="warning">Kids</Badge>}
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <Users size={12} />
                      {classBookings.length}/{gc.capacity}
                    </span>
                  </div>
                  {classBookings.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {classBookings.map((b) => (
                        <div key={b.id} className="flex items-center justify-between text-sm">
                          <span className="text-zinc-300">{b.user?.name}</span>
                          {statusBadge(b)}
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => { setModalTarget({ type: "GROUP", groupClass: gc }); setModalSearch(""); }}
                  >
                    <Users size={14} className="mr-1.5" />
                    Gerenciar Alunos
                  </Button>
                </Card>
              );
            })}

            {/* Private slots — grouped by time */}
            {(() => {
              const slotGroups: Record<string, PrivateSlot[]> = {};
              for (const s of daySlots) {
                const key = `${s.startTime}-${s.endTime}`;
                if (!slotGroups[key]) slotGroups[key] = [];
                slotGroups[key].push(s);
              }
              return Object.entries(slotGroups).map(([key, groupSlots]) => {
                const first = groupSlots[0];
                const allBookings = groupSlots.flatMap((s) => getBookingsForSlot(s.id));
                // Show bound students that have no booking yet (excluding rescheduled)
                const bookedUserIds = new Set(allBookings.map((b) => b.user?.id));
                const rescheduledKey = new Set(rescheduleLogs.map((r) => `${r.privateSlotId}:${r.userId}`));
                const pendingSlots = groupSlots.filter((s) => s.userId && !bookedUserIds.has(s.userId) && !rescheduledKey.has(`${s.id}:${s.userId}`));
                // Effective bound: bound students that haven't rescheduled for this date
                const effectiveBound = groupSlots.some((s) => s.userId && !rescheduledKey.has(`${s.id}:${s.userId}`));
                const hasActivity = effectiveBound || allBookings.length > 0;

                return (
                  <Card key={key} className={`!p-4 border-l-4 ${hasActivity ? "border-l-emerald-500" : "border-l-yellow-500"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} className="text-zinc-400" />
                      <span className="text-sm font-semibold text-zinc-50">
                        {first.startTime} - {first.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <p className="font-medium text-zinc-50">Aula Particular</p>
                      <Badge variant={hasActivity ? "success" : "warning"}>
                        {hasActivity ? "Particular" : "Aberto"}
                      </Badge>
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Users size={12} />
                        {allBookings.length + pendingSlots.length}/4
                      </span>
                    </div>
                    {(allBookings.length > 0 || pendingSlots.length > 0) && (
                      <div className="space-y-1.5 mb-3">
                        {allBookings.map((b) => (
                          <div key={b.id} className="flex items-center justify-between text-sm">
                            <span className="text-zinc-300 flex items-center gap-1.5">
                              <User size={12} />
                              {b.user?.name}
                            </span>
                            {statusBadge(b)}
                          </div>
                        ))}
                        {pendingSlots.map((s) => (
                          <div key={s.id} className="flex items-center justify-between text-sm">
                            <span className="text-zinc-300 flex items-center gap-1.5">
                              <User size={12} />
                              {s.user?.name}
                            </span>
                            <Badge variant="default">Pendente</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => { setModalTarget({ type: "PRIVATE", slot: first, slotGroup: groupSlots }); setModalSearch(""); }}
                    >
                      <Users size={14} className="mr-1.5" />
                      Gerenciar Alunos
                    </Button>
                  </Card>
                );
              });
            })()}

            {/* Empty state */}
            {dayClasses.length === 0 && daySlots.length === 0 && (
              <Card className="!p-8">
                <p className="text-zinc-400 text-sm text-center">
                  {DAY_NAMES[selectedDayOfWeek] === "Domingo" || DAY_NAMES[selectedDayOfWeek] === "Sábado"
                    ? "Sem aulas programadas para o fim de semana"
                    : "Nenhuma aula programada para este dia"}
                </p>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Student selection modal */}
      {modalTarget && (() => {
        const modalBookings = modalTarget.type === "GROUP"
          ? getBookingsForClass(modalTarget.groupClass.id)
          : (modalTarget.slotGroup || [modalTarget.slot]).flatMap((s) => getBookingsForSlot(s.id));
        const bookedStudentIds = new Set(modalBookings.map((b) => b.user?.id).filter(Boolean));
        const availableStudents = filteredStudents.filter((s) => !bookedStudentIds.has(s.id));
        const capacity = modalTarget.type === "GROUP" ? modalTarget.groupClass.capacity : 4;
        const isFull = modalBookings.length >= capacity;

        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModalTarget(null)}>
            <div
              className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-50">Gerenciar Alunos</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {modalTarget.type === "PRIVATE"
                      ? `Particular ${modalTarget.slot.startTime} - ${modalTarget.slot.endTime}`
                      : `${modalTarget.groupClass.name} ${modalTarget.groupClass.startTime} - ${modalTarget.groupClass.endTime}`
                    }
                    {" | "}{format(selectedDate, "d/MM/yyyy")}
                  </p>
                </div>
                <button onClick={() => setModalTarget(null)} className="text-zinc-400 hover:text-zinc-200">
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                {/* Booked students */}
                {modalBookings.length > 0 && (
                  <div className="p-3 border-b border-zinc-800">
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
                      Agendados ({modalBookings.length}/{capacity})
                    </p>
                    <div className="space-y-2">
                      {modalBookings.map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-800"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-50 truncate">{b.user?.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {statusBadge(b)}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteBooking(b.id)}
                            className="text-red-400 hover:text-red-300 transition-colors p-1 shrink-0"
                            title="Remover agendamento"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add students section */}
                {!isFull && (
                  <>
                    <div className="p-4 border-b border-zinc-800">
                      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">Adicionar aluno</p>
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                          type="text"
                          placeholder="Buscar aluno..."
                          value={modalSearch}
                          onChange={(e) => setModalSearch(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="p-3 space-y-2">
                      {availableStudents.length === 0 ? (
                        <p className="text-center text-zinc-500 text-sm py-4">
                          {modalSearch ? "Nenhum aluno encontrado" : "Todos os alunos já estão agendados"}
                        </p>
                      ) : (
                        availableStudents.map((s) => (
                          <button
                            key={s.id}
                            disabled={bookingStudent !== null}
                            onClick={() => handleBookForStudent(s.id)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-colors text-left disabled:opacity-50"
                          >
                            <StudentAvatar name={s.name} photoUrl={s.photoUrl} size={40} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-zinc-50 truncate">{s.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-zinc-400">{modalityLabel(s.modalities)}</span>
                                <Badge variant={s.studentType === "PARTICULAR" ? "success" : "default"}>
                                  {s.studentType === "PARTICULAR" ? "Particular" : "Coletiva"}
                                </Badge>
                              </div>
                            </div>
                            {bookingStudent === s.id && (
                              <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}

                {isFull && modalBookings.length > 0 && (
                  <div className="p-4">
                    <p className="text-xs text-zinc-500 text-center">Aula lotada. Remova um aluno para adicionar outro.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
