import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimits } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const { email, token } = await req.json();

    const limitCheck = await checkRateLimits(req, {
      email,
      ipLimit: 10,
      emailLimit: 5,
    });
    if (!limitCheck.success) {
      return NextResponse.json({ error: limitCheck.error }, { status: 429 });
    }

    if (!email || !token) {
      return NextResponse.json({ error: "E-mail e código são obrigatórios" }, { status: 400 });
    }

    // Find verification token
    const record = await prisma.verificationToken.findFirst({
      where: {
        email,
        token,
      },
    });

    if (!record) {
      return NextResponse.json({ error: "Código inválido ou expirado" }, { status: 400 });
    }

    // Check expiration
    if (record.expiresAt < new Date()) {
      await prisma.verificationToken.delete({ where: { id: record.id } });
      return NextResponse.json({ error: "Código expirado. Solicite um novo código." }, { status: 400 });
    }

    // Verify user email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    // Clean up verification token
    await prisma.verificationToken.delete({ where: { id: record.id } });

    return NextResponse.json({ success: true, message: "E-mail verificado com sucesso!" });
  } catch (err) {
    console.error("[Verify Email Error]:", err);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
