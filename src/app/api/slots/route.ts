import { NextRequest, NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/tenant-prisma";
import { slotSchema } from "@/lib/validations";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const prisma = await getTenantPrisma(session.user.tenantSlug);
  if (!prisma) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  // Students see their bound slots + (PRO/PREMIUM only) unbound available slots
  if (session.user.role === "STUDENT") {
    const date = searchParams.get("date");
    const isParticular = session.user.studentType === "PREMIUM" || session.user.studentType === "PRO";
    const orFilter = isParticular
      ? [{ userId: session.user.id }, { userId: null, isAvailable: true }]
      : [{ userId: session.user.id }];
    const slots = await prisma.privateSlot.findMany({
      where: { OR: orFilter },
      include: { user: { select: { id: true, name: true } } },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    // If date provided, hide open slots already booked by another student
    // and show rescheduled slots from other students
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

      // Find own rescheduled slots for this date (should not show as "Sua aula")
      const ownRescheduled = await prisma.rescheduleLog.findMany({
        where: { userId: session.user.id, date, type: "RESCHEDULE" },
        select: { privateSlotId: true },
      });
      const ownRescheduledIds = new Set(ownRescheduled.map((r) => r.privateSlotId));

      const filtered = slots.filter((s) => !takenSlotIds.has(s.id) && !ownRescheduledIds.has(s.id));

      // Find rescheduled slots from other students available on this date
      if (isParticular) {
        const dayOfWeek = new Date(date + "T12:00:00").getDay();
        const rescheduledSlots = await prisma.privateSlot.findMany({
          where: {
            dayOfWeek,
            isAvailable: true,
            userId: { not: null },
            NOT: { userId: session.user.id },
            rescheduleLogs: { some: { date, type: "RESCHEDULE" } },
            bookings: { none: { date } },
          },
        });
        // Add rescheduled slots as if they were open (hide bound user info)
        for (const rs of rescheduledSlots) {
          if (!filtered.some((s) => s.id === rs.id)) {
            filtered.push({ ...rs, userId: null, user: null });
          }
        }
        filtered.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
      }

      return NextResponse.json(filtered);
    }

    return NextResponse.json(slots);
  }

  // Admin: optional filter by userId
  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;

  const slots = await prisma.privateSlot.findMany({
    where,
    include: {
      user: { select: { id: true, name: true } },
      instructor: { select: { id: true, name: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  return NextResponse.json(slots);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const prisma = await getTenantPrisma(session.user.tenantSlug);
  if (!prisma) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });

  const body = await req.json();
  const result = slotSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  // Auto-calculate endTime as startTime + 1 hour if not provided
  let endTime = result.data.endTime;
  if (!endTime) {
    const [h, m] = result.data.startTime.split(":").map(Number);
    endTime = `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  const data = { ...result.data, endTime, userId: result.data.userId || null, instructorId: result.data.instructorId || session.user.id };

  // Support creating multiple slots for the same time with different students
  const userIds: (string | null)[] = Array.isArray(body.userIds) ? body.userIds : [];
  if (userIds.length === 0 && data.userId) userIds.push(data.userId);
  if (userIds.length === 0) userIds.push(null);

  // Check for duplicates (same day+time+user)
  const existingSlots = await prisma.privateSlot.findMany({
    where: {
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
    },
  });

  const existingUserIds = new Set(existingSlots.map((s) => s.userId));

  // If creating an open slot, check if one already exists
  if (userIds.length === 1 && userIds[0] === null && existingUserIds.has(null)) {
    return NextResponse.json(
      { error: "Já existe um horário aberto neste dia e horário" },
      { status: 409 }
    );
  }

  const duplicateUsers = userIds.filter((uid) => uid && existingUserIds.has(uid));
  if (duplicateUsers.length > 0) {
    return NextResponse.json(
      { error: "Um ou mais alunos já possuem horário neste dia e horário" },
      { status: 409 }
    );
  }

  const created = [];
  for (const uid of userIds) {
    const slot = await prisma.privateSlot.create({
      data: { ...data, userId: uid },
      include: { user: { select: { id: true, name: true } } },
    });
    created.push(slot);
  }

  return NextResponse.json(created.length === 1 ? created[0] : created, { status: 201 });
}
