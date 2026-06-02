import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bookingSchema } from "@/lib/validations";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const date = searchParams.get("date");

  const where: Record<string, unknown> = {};

  if (session.user.role === "STUDENT") {
    where.userId = session.user.id;
  } else if (userId) {
    where.userId = userId;
  }

  if (date) where.date = date;

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, belt: true, degrees: true } },
      privateSlot: true,
      groupClass: true,
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(bookings);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const result = bookingSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { type, privateSlotId, groupClassId, date, userId: targetUserId } = result.data;

  // Admin can book for another user
  const bookingUserId = (session.user.role === "ADMIN" && targetUserId) ? targetUserId : session.user.id;

  // Rule: ESSENCIAL students can only book GROUP classes (skip for admin booking on behalf)
  if (type === "PRIVATE" && session.user.role !== "ADMIN" && session.user.studentType === "ESSENCIAL") {
    return NextResponse.json(
      { error: "Alunos do plano Essencial não podem agendar aulas particulares" },
      { status: 403 }
    );
  }

  if (type === "PRIVATE") {
    if (!privateSlotId) {
      return NextResponse.json(
        { error: "Slot obrigatório para aula particular" },
        { status: 400 }
      );
    }

    // Check monthly credits for students
    if (session.user.role !== "ADMIN") {
      const student = await prisma.user.findUnique({
        where: { id: bookingUserId },
        select: { monthlyCredits: true },
      });
      if (student && student.monthlyCredits > 0) {
        const bookingMonth = date.substring(0, 7); // "YYYY-MM"
        const monthStart = bookingMonth + "-01";
        const nextMonth = new Date(date + "T12:00:00");
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const monthEnd = nextMonth.toISOString().substring(0, 10);
        const usedCredits = await prisma.booking.count({
          where: {
            userId: bookingUserId,
            type: "PRIVATE",
            date: { gte: monthStart, lt: monthEnd },
          },
        });
        if (usedCredits >= student.monthlyCredits) {
          return NextResponse.json(
            { error: "Limite de créditos mensais atingido" },
            { status: 403 }
          );
        }
      }
    }

    // Check slot exists and is available
    const slot = await prisma.privateSlot.findUnique({
      where: { id: privateSlotId },
    });
    if (!slot || !slot.isAvailable) {
      return NextResponse.json(
        { error: "Horário não disponível" },
        { status: 400 }
      );
    }

    // Students can only book unbound slots or rescheduled slots
    if (session.user.role !== "ADMIN" && slot.userId) {
      const isRescheduled = await prisma.rescheduleLog.findUnique({
        where: { privateSlotId_date_type: { privateSlotId, date, type: "RESCHEDULE" } },
      });
      if (!isRescheduled) {
        return NextResponse.json(
          { error: "Este horário é vinculado a um aluno específico" },
          { status: 403 }
        );
      }
    }

    // Check date matches day of week
    const bookingDate = new Date(date + "T12:00:00");
    if (bookingDate.getDay() !== slot.dayOfWeek) {
      return NextResponse.json(
        { error: "Data não corresponde ao dia da semana do horário" },
        { status: 400 }
      );
    }

    // Check advance booking time (6h for students)
    if (session.user.role !== "ADMIN") {
      const classDateTime = new Date(`${date}T${slot.startTime}:00-03:00`);
      const hoursUntilClass = (classDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilClass < 6) {
        return NextResponse.json(
          { error: "Agendamento de aula particular permitido até 6 horas antes" },
          { status: 403 }
        );
      }
    }

    // Check if slot is already booked on this date
    const existingBookings = await prisma.booking.findMany({
      where: { privateSlotId, date },
    });

    // Check if this student is already booked
    if (existingBookings.some((b) => b.userId === bookingUserId)) {
      return NextResponse.json(
        { error: "Este aluno já está agendado neste horário" },
        { status: 409 }
      );
    }

    if (session.user.role === "ADMIN") {
      // Admin can book up to 4 students per private slot
      if (existingBookings.length >= 4) {
        return NextResponse.json(
          { error: "Limite de 4 alunos por aula particular atingido" },
          { status: 409 }
        );
      }
    } else {
      // Students can only book if no one else has booked (1 per open slot)
      if (existingBookings.length > 0) {
        return NextResponse.json(
          { error: "Este horário já foi reservado por outro aluno nesta data" },
          { status: 409 }
        );
      }
    }

    const booking = await prisma.booking.create({
      data: {
        userId: bookingUserId,
        type: "PRIVATE",
        privateSlotId,
        date,
      },
      include: { privateSlot: true, user: { select: { id: true, name: true } } },
    });

    // Create admin alert when student books an open slot
    if (session.user.role !== "ADMIN" && !slot.userId) {
      await prisma.rescheduleLog.create({
        data: {
          type: "BOOKING",
          userId: bookingUserId,
          privateSlotId,
          date,
        },
      });
    }

    return NextResponse.json(booking, { status: 201 });
  }

  // GROUP booking
  if (!groupClassId) {
    return NextResponse.json(
      { error: "Aula obrigatória para aula coletiva" },
      { status: 400 }
    );
  }

  const groupClass = await prisma.groupClass.findUnique({
    where: { id: groupClassId },
  });
  if (!groupClass) {
    return NextResponse.json(
      { error: "Aula não encontrada" },
      { status: 404 }
    );
  }

  // Rule: SEMI_PRIVATE classes can only be booked by Pro/Premium students
  if (groupClass.classType === "SEMI_PRIVATE" && session.user.role !== "ADMIN" && session.user.studentType === "ESSENCIAL") {
    return NextResponse.json(
      { error: "Aulas semi-particulares são exclusivas para alunos dos planos Pro e Premium" },
      { status: 403 }
    );
  }

  // Check date matches day of week
  const bookingDate = new Date(date + "T12:00:00");
  if (bookingDate.getDay() !== groupClass.dayOfWeek) {
    return NextResponse.json(
      { error: "Data não corresponde ao dia da semana da aula" },
      { status: 400 }
    );
  }

  // Check capacity
  const currentBookings = await prisma.booking.count({
    where: { groupClassId, date },
  });
  if (currentBookings >= groupClass.capacity) {
    return NextResponse.json(
      { error: "Aula lotada" },
      { status: 409 }
    );
  }

  // Check advance booking time (1h for students)
  if (session.user.role !== "ADMIN") {
    const classDateTime = new Date(`${date}T${groupClass.startTime}:00-03:00`);
    const hoursUntilClass = (classDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilClass < 1) {
      return NextResponse.json(
        { error: "Agendamento de aula coletiva permitido até 1 hora antes" },
        { status: 403 }
      );
    }
  }

  // Check if already booked
  const existing = await prisma.booking.findFirst({
    where: { userId: bookingUserId, groupClassId, date },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Este aluno já está agendado nesta aula" },
      { status: 409 }
    );
  }

  const booking = await prisma.booking.create({
    data: {
      userId: bookingUserId,
      type: "GROUP",
      groupClassId,
      date,
    },
    include: { groupClass: true },
  });

  return NextResponse.json(booking, { status: 201 });
}
