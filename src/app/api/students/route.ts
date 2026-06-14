import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/mail";
import crypto from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const students = await prisma.user.findMany({
    where: { role: "STUDENT", status: "APPROVED" },
    select: {
      id: true,
      name: true,
      email: true,
      studentType: true,
      modalities: true,
      belt: true,
      degrees: true,
      initialCheckins: true,
      isKids: true,
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

  const { name, email, password, studentType, modalities, photoUrl, isKids } = result.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json(
      { error: "Email já cadastrado" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Admin creating student → auto-approve & auto-verify; self-registration → pending & unverified
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";
  const status = isAdmin ? "APPROVED" : "PENDING";
  const emailVerified = isAdmin ? new Date() : null;

  const user = await prisma.user.create({
    data: { 
      name, 
      email, 
      passwordHash, 
      studentType, 
      modalities: modalities || "GRAPPLING", 
      isKids: isKids || false, 
      photoUrl: photoUrl || null, 
      status,
      emailVerified
    },
    select: { id: true, name: true, email: true },
  });

  if (!isAdmin) {
    // Generate 6-digit verification code using cryptographically secure RNG
    const token = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Clean up any old verification tokens for this email
    await prisma.verificationToken.deleteMany({ where: { email } });

    await prisma.verificationToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    await sendVerificationEmail(email, name, token);
  }

  return NextResponse.json(user, { status: 201 });
}

