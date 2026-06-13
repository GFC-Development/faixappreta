import { NextRequest, NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/tenant-prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const prisma = await getTenantPrisma(session.user.tenantSlug);
  if (!prisma) return NextResponse.json({ error: "Tenant nao encontrado" }, { status: 404 });

  const professors = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: {
      id: true,
      name: true,
      email: true,
      isOwner: true,
      instructorClasses: { select: { id: true } },
      instructorSlots: { select: { id: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const result = professors.map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    isOwner: p.isOwner,
    classCount: p.instructorClasses.length,
    slotCount: p.instructorSlots.length,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN" || !session.user.isOwner) {
    return NextResponse.json({ error: "Apenas o dono pode adicionar professores" }, { status: 403 });
  }

  const prisma = await getTenantPrisma(session.user.tenantSlug);
  if (!prisma) return NextResponse.json({ error: "Tenant nao encontrado" }, { status: 404 });

  const body = await req.json();
  const { name, email, password } = body;

  if (!name || !email || !password || password.length < 6) {
    return NextResponse.json({ error: "Nome, email e senha (min 6 chars) sao obrigatorios" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email ja cadastrado" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const professor = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "ADMIN",
      status: "APPROVED",
      isOwner: false,
    },
    select: { id: true, name: true, email: true, isOwner: true },
  });

  return NextResponse.json(professor, { status: 201 });
}
