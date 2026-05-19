import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "Parâmetros 'from' e 'to' são obrigatórios" }, { status: 400 });
  }

  // Get all students with their bookings in the period
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: {
      id: true,
      name: true,
      belt: true,
      degrees: true,
      initialCheckins: true,
      photoUrl: true,
      bookings: {
        where: {
          date: { gte: from, lte: to },
          checkedIn: true,
        },
        select: { id: true, date: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // Count total classes in period (all bookings, not just checked-in)
  const totalBookingsInPeriod = await prisma.booking.count({
    where: {
      date: { gte: from, lte: to },
    },
  });

  const studentsData = students.map((s) => ({
    id: s.id,
    name: s.name,
    belt: s.belt,
    degrees: s.degrees,
    photoUrl: s.photoUrl,
    checkins: s.bookings.length + s.initialCheckins,
  }));

  const totalCheckins = studentsData.reduce((sum, s) => sum + s.checkins, 0);
  const activeStudents = studentsData.filter((s) => s.checkins > 0).length;
  const avgPerStudent = activeStudents > 0 ? Math.round(totalCheckins / activeStudents * 10) / 10 : 0;
  const topStudent = studentsData.reduce(
    (top, s) => (s.checkins > top.checkins ? s : top),
    { name: "-", checkins: 0 } as { name: string; checkins: number }
  );

  return NextResponse.json({
    students: studentsData,
    summary: {
      totalCheckins,
      totalBookings: totalBookingsInPeriod,
      activeStudents,
      avgPerStudent,
      topStudent: topStudent.name,
      topStudentCheckins: topStudent.checkins,
    },
  });
}
