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
      modalities: true,
      isKids: true,
      belt: true,
      degrees: true,
      initialCheckins: true,
      monthlyCredits: true,
      photoUrl: true,
      monthlyDueDay: true,
      lastPaymentDate: true,
      lastGraduationDate: true,
      lastBeltChangeDate: true,
      createdAt: true,
      bookings: {
        orderBy: { date: "desc" },
        include: {
          privateSlot: true,
          groupClass: true,
        },
      },
      graduationLogs: {
        orderBy: { createdAt: "desc" },
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

  const data: Record<string, unknown> = { ...result.data };

  // Convert date strings to Date objects
  if (data.lastPaymentDate && typeof data.lastPaymentDate === "string") {
    data.lastPaymentDate = new Date(data.lastPaymentDate as string);
  }
  if (data.lastGraduationDate === null) {
    // Allow explicitly clearing
  } else if (data.lastGraduationDate && typeof data.lastGraduationDate === "string") {
    data.lastGraduationDate = new Date(data.lastGraduationDate as string);
  }
  if (data.lastBeltChangeDate === null) {
    // Allow explicitly clearing
  } else if (data.lastBeltChangeDate && typeof data.lastBeltChangeDate === "string") {
    data.lastBeltChangeDate = new Date(data.lastBeltChangeDate as string);
  }

  // Reset belt progress if explicitly requested (overrides manual date)
  if (data.resetBeltProgress) {
    data.lastBeltChangeDate = new Date();
    delete data.resetBeltProgress;
  }

  // Reset degree progress if explicitly requested (overrides manual date)
  if (data.resetDegreeProgress) {
    data.lastGraduationDate = new Date();
    delete data.resetDegreeProgress;
  }

  // Fetch current values before update to detect belt/degree changes
  const current = await prisma.user.findUnique({
    where: { id: params.id },
    select: { belt: true, degrees: true },
  });

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      studentType: true,
      modalities: true,
      isKids: true,
      belt: true,
      degrees: true,
      initialCheckins: true,
      monthlyCredits: true,
      photoUrl: true,
      monthlyDueDay: true,
      lastPaymentDate: true,
      lastGraduationDate: true,
      lastBeltChangeDate: true,
    },
  });

  // Create graduation log if belt or degrees changed
  if (current && user.belt !== current.belt) {
    await prisma.graduationLog.create({
      data: { userId: params.id, belt: user.belt, degrees: user.degrees, type: "BELT" },
    });
  }
  if (current && user.degrees !== current.degrees && user.belt === current.belt) {
    await prisma.graduationLog.create({
      data: { userId: params.id, belt: user.belt, degrees: user.degrees, type: "DEGREE" },
    });
  }

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
