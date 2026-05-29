import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const students = await prisma.user.findMany({
    where: { role: "STUDENT", status: "PENDING" },
    select: {
      id: true,
      name: true,
      email: true,
      studentType: true,
      modalities: true,
      isKids: true,
      photoUrl: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(students);
}
