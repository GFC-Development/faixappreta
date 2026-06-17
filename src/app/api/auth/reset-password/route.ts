import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimits } from "@/lib/rate-limit";
import { passwordSchema } from "@/lib/validations";
import { prismaMaster } from "@/lib/prisma-master";
import { getTenantPrisma } from "@/lib/tenant-prisma";

// Verify if a token is valid and not expired
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ valid: false, error: "Token não fornecido" }, { status: 400 });
    }

    // Dynamic tenant lookup by token
    const tenants = await prismaMaster.tenant.findMany({ where: { isActive: true } });
    let record = null;
    let targetPrisma = prisma;
    let tenantSlug = "";

    for (const tenant of tenants) {
      const p = await getTenantPrisma(tenant.slug);
      if (!p) continue;
      const r = await p.passwordResetToken.findUnique({
        where: { token },
      });
      if (r) {
        record = r;
        targetPrisma = p;
        tenantSlug = tenant.slug;
        break;
      }
    }

    if (!record) {
      // Fallback to dev.db
      const r = await prisma.passwordResetToken.findUnique({
        where: { token },
      });
      if (r) {
        record = r;
        targetPrisma = prisma;
      }
    }

    if (!record) {
      return NextResponse.json({ valid: false, error: "Token inválido" }, { status: 400 });
    }

    if (record.expiresAt < new Date()) {
      await targetPrisma.passwordResetToken.delete({ where: { token } });
      return NextResponse.json({ valid: false, error: "Token expirado" }, { status: 400 });
    }

    return NextResponse.json({ valid: true, tenantSlug });
  } catch (err) {
    console.error("[Verify Reset Token Error]:", err);
    return NextResponse.json({ valid: false, error: "Erro interno no servidor" }, { status: 500 });
  }
}

// Perform the password reset
export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    // Check IP rate limit first
    const ipCheck = await checkRateLimits(req, {
      ipLimit: 10,
    });
    if (!ipCheck.success) {
      return NextResponse.json({ error: ipCheck.error }, { status: 429 });
    }

    if (!token || !password) {
      return NextResponse.json({ error: "Token e nova senha são obrigatórios" }, { status: 400 });
    }

    const passResult = passwordSchema.safeParse(password);
    if (!passResult.success) {
      return NextResponse.json({ error: passResult.error.issues[0].message }, { status: 400 });
    }

    // Dynamic tenant lookup by token
    const tenants = await prismaMaster.tenant.findMany({ where: { isActive: true } });
    let record = null;
    let targetPrisma = prisma;

    for (const tenant of tenants) {
      const p = await getTenantPrisma(tenant.slug);
      if (!p) continue;
      const r = await p.passwordResetToken.findUnique({
        where: { token },
      });
      if (r) {
        record = r;
        targetPrisma = p;
        break;
      }
    }

    if (!record) {
      // Fallback to dev.db
      const r = await prisma.passwordResetToken.findUnique({
        where: { token },
      });
      if (r) {
        record = r;
        targetPrisma = prisma;
      }
    }

    if (!record) {
      return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 });
    }

    if (record.expiresAt < new Date()) {
      await targetPrisma.passwordResetToken.delete({ where: { token } });
      return NextResponse.json({ error: "Token expirado" }, { status: 400 });
    }

    // Check Email rate limit now that we have it
    const emailCheck = await checkRateLimits(req, {
      email: record.email,
      emailLimit: 5,
    });
    if (!emailCheck.success) {
      return NextResponse.json({ error: emailCheck.error }, { status: 429 });
    }

    const user = await targetPrisma.user.findUnique({
      where: { email: record.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user password on the correct tenant DB
    await targetPrisma.user.update({
      where: { email: record.email },
      data: { passwordHash },
    });

    // Delete token
    await targetPrisma.passwordResetToken.delete({ where: { token } });

    return NextResponse.json({ success: true, message: "Senha redefinida com sucesso!" });
  } catch (err) {
    console.error("[Reset Password Error]:", err);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
