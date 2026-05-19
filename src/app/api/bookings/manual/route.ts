import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { userId, count } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });
  }

  const increment = typeof count === "number" && count > 0 ? count : 1;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { initialCheckins: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { initialCheckins: user.initialCheckins + increment },
    select: { id: true, initialCheckins: true },
  });

  return NextResponse.json(updated);
}
