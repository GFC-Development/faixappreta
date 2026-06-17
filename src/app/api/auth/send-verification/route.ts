import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mail";
import crypto from "crypto";
import { checkRateLimits } from "@/lib/rate-limit";
import { prismaMaster } from "@/lib/prisma-master";
import { getTenantPrisma } from "@/lib/tenant-prisma";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    const limitCheck = await checkRateLimits(req, {
      email,
      ipLimit: 5,
      emailLimit: 3,
    });
    if (!limitCheck.success) {
      return NextResponse.json({ error: limitCheck.error }, { status: 429 });
    }

    if (!email) {
      return NextResponse.json({ error: "E-mail é obrigatório" }, { status: 400 });
    }

    // Dynamic tenant lookup by email
    const tenants = await prismaMaster.tenant.findMany({ where: { isActive: true } });
    let user = null;
    let targetPrisma = prisma;

    for (const tenant of tenants) {
      const p = await getTenantPrisma(tenant.slug);
      if (!p) continue;
      const u = await p.user.findUnique({
        where: { email },
        select: { name: true, emailVerified: true },
      });
      if (u) {
        user = u;
        targetPrisma = p;
        break;
      }
    }

    if (!user) {
      // Fallback to dev.db
      const u = await prisma.user.findUnique({
        where: { email },
        select: { name: true, emailVerified: true },
      });
      if (u) {
        user = u;
        targetPrisma = prisma;
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "E-mail já verificado" }, { status: 400 });
    }

    // Generate 6-digit verification code using cryptographically secure RNG
    const token = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Clean up old verification tokens on the correct tenant DB
    await targetPrisma.verificationToken.deleteMany({ where: { email } });

    await targetPrisma.verificationToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    await sendVerificationEmail(email, user.name, token);

    return NextResponse.json({ success: true, message: "Código enviado com sucesso!" });
  } catch (err) {
    console.error("[Send Verification Error]:", err);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
