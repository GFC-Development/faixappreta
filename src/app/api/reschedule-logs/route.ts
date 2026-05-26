import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const logs = await prisma.rescheduleLog.findMany({
    include: {
      user: { select: { id: true, name: true } },
      privateSlot: { select: { dayOfWeek: true, startTime: true } },
      newPrivateSlot: { select: { dayOfWeek: true, startTime: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Deduplicate: if a RESCHEDULE already covers a booking (same user + new slot + new date),
  // drop the standalone BOOKING log for that same user + slot + date
  const rescheduleTargets = new Set(
    logs
      .filter((l) => l.type === "RESCHEDULE" && l.newPrivateSlotId && l.newDate)
      .map((l) => `${l.userId}-${l.newPrivateSlotId}-${l.newDate}`)
  );

  const unique = logs.filter((log) => {
    if (log.type === "BOOKING") {
      return !rescheduleTargets.has(`${log.userId}-${log.privateSlotId}-${log.date}`);
    }
    return true;
  });

  return NextResponse.json(unique.slice(0, 20));
}
