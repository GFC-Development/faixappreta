import { NextRequest, NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/tenant-prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const prisma = await getTenantPrisma(session.user.tenantSlug);
  if (!prisma) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });

  const body = await req.json();

  // Only allow safe fields to be updated
  const allowed: Record<string, unknown> = {};
  if (body.dayOfWeek !== undefined) allowed.dayOfWeek = Number(body.dayOfWeek);
  if (body.startTime !== undefined) allowed.startTime = body.startTime;
  if (body.endTime !== undefined) allowed.endTime = body.endTime;
  if (body.isAvailable !== undefined) allowed.isAvailable = body.isAvailable;
  if (body.userId !== undefined) allowed.userId = body.userId || null;
  if (body.instructorId !== undefined) allowed.instructorId = body.instructorId || null;

  const slot = await prisma.privateSlot.update({
    where: { id: params.id },
    data: allowed,
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json(slot);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const prisma = await getTenantPrisma(session.user.tenantSlug);
  if (!prisma) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });

  await prisma.privateSlot.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
