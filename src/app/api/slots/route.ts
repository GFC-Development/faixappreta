import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slotSchema } from "@/lib/validations";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  // Students see their bound slots + (PARTICULAR only) unbound available slots
  if (session.user.role === "STUDENT") {
    const date = searchParams.get("date");
    const isParticular = session.user.studentType === "PARTICULAR";
    const orFilter = isParticular
      ? [{ userId: session.user.id }, { userId: null, isAvailable: true }]
      : [{ userId: session.user.id }];
    const slots = await prisma.privateSlot.findMany({
      where: { OR: orFilter },
      include: { user: { select: { id: true, name: true } } },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    // If date provided, hide open slots already booked by another student
    if (date) {
      const takenBookings = await prisma.booking.findMany({
        where: {
          date,
          type: "PRIVATE",
          privateSlotId: { not: null },
          userId: { not: session.user.id },
          privateSlot: { userId: null },
        },
        select: { privateSlotId: true },
      });
      const takenSlotIds = new Set(takenBookings.map((b) => b.privateSlotId));
      return NextResponse.json(slots.filter((s) => !takenSlotIds.has(s.id)));
    }

    return NextResponse.json(slots);
  }

  // Admin: optional filter by userId
  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;

  const slots = await prisma.privateSlot.findMany({
    where,
    include: { user: { select: { id: true, name: true } } },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  return NextResponse.json(slots);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const result = slotSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const data = { ...result.data, userId: result.data.userId || null };

  // Check for duplicate slot (same day + time)
  const existing = await prisma.privateSlot.findFirst({
    where: {
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Já existe um horário neste dia e horário" },
      { status: 409 }
    );
  }

  const slot = await prisma.privateSlot.create({
    data,
    include: { user: { select: { id: true, name: true } } },
  });
  return NextResponse.json(slot, { status: 201 });
}
