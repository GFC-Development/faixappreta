import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { role: "STUDENT", status: "APPROVED" },
    select: {
      id: true,
      initialCheckins: true,
      _count: {
        select: {
          bookings: { where: { checkinStatus: "PRESENTE" } },
        },
      },
    },
  });

  const ranked = users
    .map((u) => ({
      id: u.id,
      presences: u._count.bookings + u.initialCheckins,
    }))
    .sort((a, b) => b.presences - a.presences);

  const position = ranked.findIndex((u) => u.id === session.user.id) + 1;
  const total = ranked.length;
  const myPresences = ranked.find((u) => u.id === session.user.id)?.presences ?? 0;

  return NextResponse.json({ position, total, presences: myPresences });
}
