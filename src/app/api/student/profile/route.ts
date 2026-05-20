import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      initialCheckins: true,
      modalities: true,
      lastGraduationDate: true,
      lastBeltChangeDate: true,
      lastPaymentDate: true,
      monthlyDueDay: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (typeof body.photoUrl === "string" || body.photoUrl === null) {
    data.photoUrl = body.photoUrl;
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, photoUrl: true },
  });

  return NextResponse.json(updated);
}
