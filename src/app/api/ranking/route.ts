import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { role: "STUDENT", status: "APPROVED" },
    select: {
      id: true,
      name: true,
      photoUrl: true,
      belt: true,
      degrees: true,
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
      name: u.name,
      photoUrl: u.photoUrl,
      belt: u.belt,
      degrees: u.degrees,
      presences: u._count.bookings + u.initialCheckins,
    }))
    .sort((a, b) => b.presences - a.presences)
    .slice(0, 10);

  return NextResponse.json(ranked);
}
