import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: {
      id: true,
      name: true,
      email: true,
      studentType: true,
      modalities: true,
      belt: true,
      degrees: true,
      initialCheckins: true,
      photoUrl: true,
      monthlyDueDay: true,
      lastPaymentDate: true,
      createdAt: true,
      _count: { select: { bookings: { where: { checkedIn: true } } } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = registerSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, email, password, studentType, modalities, photoUrl } = result.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json(
      { error: "Email já cadastrado" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, studentType, modalities: modalities || "GRAPPLING", photoUrl: photoUrl || null },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json(user, { status: 201 });
}
