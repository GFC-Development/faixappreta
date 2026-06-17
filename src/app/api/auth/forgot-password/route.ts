import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import { sendPasswordResetEmail } from "@/lib/mail";
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

    // Dynamic tenant lookup for the user email
    const tenants = await prismaMaster.tenant.findMany({ where: { isActive: true } });
    let user = null;
    let targetPrisma = prisma;

    for (const tenant of tenants) {
      const p = await getTenantPrisma(tenant.slug);
      if (!p) continue;
      const u = await p.user.findUnique({
        where: { email },
        select: { name: true },
      });
      if (u) {
        user = u;
        targetPrisma = p;
        break;
      }
    }

    if (!user) {
      // Fallback to default dev.db
      const u = await prisma.user.findUnique({
        where: { email },
        select: { name: true },
      });
      if (u) {
        user = u;
        targetPrisma = prisma;
      }
    }

    // To prevent email harvesting, we return success even if user not found, 
    // but in development we can output a log.
    if (!user) {
      console.log(`[Forgot Password] Request for non-existent email: ${email}`);
      return NextResponse.json({
        success: true,
        message: "Se o e-mail estiver cadastrado, um link de redefinição será enviado.",
      });
    }

    // Generate secure reset token
    const token = createId();
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Clean up old reset tokens on the correct tenant DB
    await targetPrisma.passwordResetToken.deleteMany({ where: { email } });

    await targetPrisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    await sendPasswordResetEmail(email, user.name, token);

    return NextResponse.json({
      success: true,
      message: "Se o e-mail estiver cadastrado, um link de redefinição será enviado.",
    });
  } catch (err) {
    console.error("[Forgot Password Error]:", err);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
