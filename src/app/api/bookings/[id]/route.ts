import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { privateSlot: true, groupClass: true },
  });

  if (!booking) {
    return NextResponse.json(
      { error: "Agendamento não encontrado" },
      { status: 404 }
    );
  }

  if (
    session.user.role !== "ADMIN" &&
    booking.userId !== session.user.id
  ) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  // Students cancelling private bookings: must be 12h before class time
  if (session.user.role !== "ADMIN" && booking.type === "PRIVATE" && booking.privateSlot) {
    const classDateTime = new Date(`${booking.date}T${booking.privateSlot.startTime}:00-03:00`);
    const now = new Date();
    const hoursUntilClass = (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilClass < 12) {
      return NextResponse.json(
        { error: "Cancelamento permitido até 12 horas antes do horário da aula" },
        { status: 403 }
      );
    }
  }

  // Students cancelling GROUP bookings: must be 1h before
  if (session.user.role !== "ADMIN" && booking.type === "GROUP" && booking.groupClass) {
    const classDateTime = new Date(`${booking.date}T${booking.groupClass.startTime}:00-03:00`);
    const hoursUntilClass = (classDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilClass < 1) {
      return NextResponse.json(
        { error: "Cancelamento de aula coletiva permitido até 1 hora antes" },
        { status: 403 }
      );
    }
  }

  // Students cannot cancel bound private slots directly (must use reschedule flow)
  if (session.user.role !== "ADMIN" && booking.type === "PRIVATE" && booking.privateSlot?.userId) {
    return NextResponse.json(
      { error: "Use a opção de remarcar para alterar aulas vinculadas" },
      { status: 403 }
    );
  }

  await prisma.booking.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
