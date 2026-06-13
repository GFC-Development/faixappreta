import { NextRequest, NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/tenant-prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN" || !session.user.isOwner) {
    return NextResponse.json({ error: "Apenas o dono pode editar professores" }, { status: 403 });
  }

  const prisma = await getTenantPrisma(session.user.tenantSlug);
  if (!prisma) return NextResponse.json({ error: "Tenant nao encontrado" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.name) data.name = body.name;
  if (body.email) data.email = body.email;
  if (body.password && body.password.length >= 6) {
    data.passwordHash = await bcrypt.hash(body.password, 10);
  }

  const professor = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, name: true, email: true, isOwner: true },
  });

  return NextResponse.json(professor);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN" || !session.user.isOwner) {
    return NextResponse.json({ error: "Apenas o dono pode remover professores" }, { status: 403 });
  }

  if (params.id === session.user.id) {
    return NextResponse.json({ error: "Voce nao pode remover a si mesmo" }, { status: 400 });
  }

  const prisma = await getTenantPrisma(session.user.tenantSlug);
  if (!prisma) return NextResponse.json({ error: "Tenant nao encontrado" }, { status: 404 });

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
