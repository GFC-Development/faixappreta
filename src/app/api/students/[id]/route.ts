import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateStudentSchema } from "@/lib/validations";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      studentType: true,
      belt: true,
      degrees: true,
      photoUrl: true,
      monthlyDueDay: true,
      lastPaymentDate: true,
      lastGraduationDate: true,
      createdAt: true,
      bookings: {
        orderBy: { date: "desc" },
        include: {
          privateSlot: true,
          groupClass: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const result = updateStudentSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  // Check if belt or degrees changed to auto-update lastGraduationDate
  const current = await prisma.user.findUnique({
    where: { id: params.id },
    select: { belt: true, degrees: true },
  });

  const data: Record<string, unknown> = { ...result.data };

  // Convert lastPaymentDate string to Date
  if (data.lastPaymentDate && typeof data.lastPaymentDate === "string") {
    data.lastPaymentDate = new Date(data.lastPaymentDate as string);
  }

  if (
    current &&
    ((result.data.belt && result.data.belt !== current.belt) ||
      (result.data.degrees !== undefined && result.data.degrees !== current.degrees))
  ) {
    data.lastGraduationDate = new Date();
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      studentType: true,
      belt: true,
      degrees: true,
      photoUrl: true,
      monthlyDueDay: true,
      lastPaymentDate: true,
      lastGraduationDate: true,
    },
  });

  return NextResponse.json(user);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
