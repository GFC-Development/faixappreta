"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DAY_NAMES, isParticular as checkParticular } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";

interface Slot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  userId: string | null;
}

interface GroupClass {
  id: string;
  name: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
  isKids: boolean;
  classType: string;
  fixedRoster: boolean;
}

export default function BookingPage() {
  const { data: session } = useSession();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [groupClasses, setGroupClasses] = useState<GroupClass[]>([]);
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<{ monthlyCredits: number; used: number; remaining: number } | null>(null);

  const isParticular = checkParticular(session?.user.studentType || "");
  const hasGrappling = (session?.user.modalities || "GRAPPLING").includes("GRAPPLING");

  useEffect(() => {
    if (isParticular) {
      fetch("/api/slots")
        .then((r) => r.json())
        .then((data: Slot[]) => setSlots(data.filter((s) => s.isAvailable && !s.userId)));
      fetch("/api/credits").then((r) => r.json()).then(setCredits);
    }
    fetch("/api/group-classes")
      .then((r) => r.json())
      .then(setGroupClasses);
  }, [isParticular]);

  function getDateDayOfWeek(): number | null {
    if (!date) return null;
    return new Date(date + "T12:00:00").getDay();
  }

  const selectedDay = getDateDayOfWeek();

  const filteredSlots = selectedDay !== null
    ? slots.filter((s) => s.dayOfWeek === selectedDay)
    : [];

  const userIsKids = session?.user.isKids || false;
  const filteredClasses = selectedDay !== null
    ? groupClasses.filter((gc) => gc.dayOfWeek === selectedDay && gc.isKids === userIsKids && !gc.fixedRoster)
    : [];

  async function bookPrivate(slotId: string) {
    if (!date) return;
    setError("");
    setSuccess("");
    setLoading(true);

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "PRIVATE", privateSlotId: slotId, date }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
    } else {
      setSuccess("Aula particular agendada com sucesso!");
    }
  }

  async function bookGroup(classId: string) {
    if (!date) return;
    setError("");
    setSuccess("");
    setLoading(true);

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "GROUP", groupClassId: classId, date }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
    } else {
      setSuccess("Aula coletiva agendada com sucesso!");
    }
  }

  return (
    <div className="max-w-[520px] mx-auto">
      <PageHeader title="Agendar Aula" />

      <Card className="mb-4">
        <Input
          label="Selecione a data"
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setError("");
            setSuccess("");
          }}
        />
        {selectedDay !== null && (
          <p className="text-[13px] text-[#5c5d63] mt-2">
            {DAY_NAMES[selectedDay]}
          </p>
        )}
      </Card>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 text-[#b42318] text-[13px] rounded-[9px]">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-emerald-500/10 text-emerald-600 text-[13px] rounded-[9px]">
          {success}
        </div>
      )}

      {date && (
        <>
          {isParticular && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-[14px] text-[#17181c]">
                  Aulas Particulares
                </h2>
                {credits && credits.monthlyCredits > 0 && (
                  <Badge variant={credits.remaining > 0 ? "success" : "danger"}>
                    Créditos: {credits.remaining}/{credits.monthlyCredits}
                  </Badge>
                )}
              </div>
              {filteredSlots.length === 0 ? (
                <p className="text-[#9b9ca2] text-[13px]">
                  Nenhum horário particular disponível neste dia
                </p>
              ) : (
                <div className="grid gap-3">
                  {filteredSlots.map((slot) => (
                    <Card key={slot.id} className="!p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-[13px] text-[#17181c]">
                            {slot.startTime} - {slot.endTime}
                          </p>
                          <Badge variant="success">Particular</Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => bookPrivate(slot.id)}
                          disabled={loading || (credits !== null && credits.monthlyCredits > 0 && credits.remaining <= 0)}
                        >
                          Agendar
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {hasGrappling && <div>
            <h2 className="font-semibold text-[14px] text-[#17181c] mb-3">Aulas Coletivas</h2>
            {filteredClasses.length === 0 ? (
              <p className="text-[#9b9ca2] text-[13px]">
                Nenhuma aula coletiva neste dia
              </p>
            ) : (
              <div className="grid gap-3">
                {filteredClasses.map((gc) => (
                  <Card key={gc.id} className="!p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[13px] text-[#17181c]">{gc.name}</p>
                        <p className="text-[12px] text-[#5c5d63]">
                          {gc.startTime} - {gc.endTime}
                        </p>
                        <Badge>Coletiva - {gc.capacity} vagas</Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => bookGroup(gc.id)}
                        disabled={loading}
                      >
                        Agendar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>}

        </>
      )}
    </div>
  );
}
