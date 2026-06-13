import { NextRequest, NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/tenant-prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const prisma = await getTenantPrisma(session.user.tenantSlug);
  if (!prisma) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  const where: Record<string, unknown> = {};
  if (date) where.date = date;

  // Auto-create bookings for active private slots on this date
  if (date) {
    const bookingDate = new Date(date + "T12:00:00");
    const dayOfWeek = bookingDate.getDay();

    const activeSlots = await prisma.privateSlot.findMany({
      where: { dayOfWeek, isAvailable: true, userId: { not: null } },
    });

    // Don't recreate bookings for rescheduled slots
    const rescheduledSlotIds = new Set(
      (await prisma.rescheduleLog.findMany({
        where: { date, type: "RESCHEDULE" },
        select: { privateSlotId: true },
      })).map(r => r.privateSlotId)
    );

    for (const slot of activeSlots) {
      if (rescheduledSlotIds.has(slot.id)) continue;
      // Check if booking already exists for this student+slot+date
      const exists = await prisma.booking.findFirst({
        where: { userId: slot.userId!, privateSlotId: slot.id, date },
      });
      if (!exists) {
        await prisma.booking.create({
          data: {
            userId: slot.userId!,
            type: "PRIVATE",
            privateSlotId: slot.id,
            date,
          },
        });
      }
    }
  }

  // Non-owner professors only see bookings for their own classes/slots
  if (!session.user.isOwner) {
    const instructorId = session.user.id;
    where.OR = [
      { groupClass: { instructorId } },
      { privateSlot: { instructorId } },
    ];
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, belt: true, degrees: true, photoUrl: true } },
      privateSlot: { include: { instructor: { select: { id: true, name: true } } } },
      groupClass: { include: { instructor: { select: { id: true, name: true } } } },
    },
    orderBy: [{ date: "desc" }, { createdAt: "asc" }],
  });

  // Include rescheduled slot IDs so the frontend can hide them from "Pendente"
  if (date) {
    const rescheduleLogs = await prisma.rescheduleLog.findMany({
      where: { date, type: "RESCHEDULE" },
      select: { privateSlotId: true, userId: true },
    });
    return NextResponse.json({ bookings, rescheduleLogs });
  }

  return NextResponse.json({ bookings, rescheduleLogs: [] });
}
