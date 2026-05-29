import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const refDate = dateParam ? new Date(dateParam + "T12:00:00") : new Date();
  const monthStart = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, "0")}-01`;
  const nextMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1);
  const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { monthlyCredits: true },
  });

  const monthlyCredits = user?.monthlyCredits || 0;

  if (monthlyCredits === 0) {
    return NextResponse.json({ monthlyCredits: 0, used: 0, remaining: 0 });
  }

  const used = await prisma.booking.count({
    where: {
      userId: session.user.id,
      type: "PRIVATE",
      date: { gte: monthStart, lt: monthEnd },
    },
  });

  return NextResponse.json({
    monthlyCredits,
    used,
    remaining: Math.max(0, monthlyCredits - used),
  });
}
