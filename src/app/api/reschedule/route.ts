import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { originalSlotId, originalDate, newSlotId, newDate } = await req.json();

  if (!originalSlotId || !originalDate || !newSlotId || !newDate) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  // Validate original slot belongs to this student
  const originalSlot = await prisma.privateSlot.findUnique({ where: { id: originalSlotId } });
  if (!originalSlot || originalSlot.userId !== session.user.id) {
    return NextResponse.json({ error: "Horário não encontrado" }, { status: 404 });
  }

  // 12h rule on the original slot
  const classDateTime = new Date(`${originalDate}T${originalSlot.startTime}:00-03:00`);
  const now = new Date();
  const hoursUntilClass = (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntilClass < 12) {
    return NextResponse.json(
      { error: "Remarcação permitida até 12 horas antes do horário da aula" },
      { status: 403 }
    );
  }

  // Check new slot exists and is available
  const newSlot = await prisma.privateSlot.findUnique({ where: { id: newSlotId } });
  if (!newSlot || !newSlot.isAvailable) {
    return NextResponse.json({ error: "Horário não disponível" }, { status: 400 });
  }

  // Check day of week matches new date
  const newBookingDate = new Date(newDate + "T12:00:00");
  if (newBookingDate.getDay() !== newSlot.dayOfWeek) {
    return NextResponse.json({ error: "Data não corresponde ao dia da semana do horário" }, { status: 400 });
  }

  // New slot must be open or rescheduled by another student
  if (newSlot.userId && newSlot.userId !== session.user.id) {
    const isRescheduled = await prisma.rescheduleLog.findUnique({
      where: { privateSlotId_date_type: { privateSlotId: newSlotId, date: newDate, type: "RESCHEDULE" } },
    });
    if (!isRescheduled) {
      return NextResponse.json({ error: "Este horário é vinculado a outro aluno" }, { status: 403 });
    }
  }

  // Check if new slot is already booked on that date
  const existingNewBooking = await prisma.booking.findFirst({
    where: { privateSlotId: newSlotId, date: newDate },
  });
  if (existingNewBooking) {
    return NextResponse.json({ error: "Este horário já está reservado nesta data" }, { status: 409 });
  }

  // Find existing booking for the original slot+date (may not exist if auto-creation hasn't run)
  const existingOldBooking = await prisma.booking.findFirst({
    where: { privateSlotId: originalSlotId, date: originalDate, userId: session.user.id },
  });

  // Atomic transaction: optionally delete old booking + create reschedule log + create new booking
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ops: any[] = [];
  if (existingOldBooking) {
    ops.push(prisma.booking.delete({ where: { id: existingOldBooking.id } }));
  }
  ops.push(
    prisma.rescheduleLog.create({
      data: {
        type: "RESCHEDULE",
        userId: session.user.id,
        privateSlotId: originalSlotId,
        date: originalDate,
        newPrivateSlotId: newSlotId,
        newDate: newDate,
      },
    })
  );
  ops.push(
    prisma.booking.create({
      data: {
        userId: session.user.id,
        type: "PRIVATE",
        privateSlotId: newSlotId,
        date: newDate,
      },
      include: {
        privateSlot: true,
        user: { select: { id: true, name: true } },
      },
    })
  );

  const results = await prisma.$transaction(ops);
  const newBooking = results[results.length - 1];

  return NextResponse.json(newBooking, { status: 201 });
}
