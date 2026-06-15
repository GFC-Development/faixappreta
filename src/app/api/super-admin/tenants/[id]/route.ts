import { NextRequest, NextResponse } from "next/server";
import { prismaMaster } from "@/lib/prisma-master";
import { verifySuperAdmin } from "@/lib/super-admin-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await verifySuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tenant = await prismaMaster.tenant.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      adminName: true,
      adminEmail: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: "CT não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ tenant });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await verifySuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const existing = await prismaMaster.tenant.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "CT não encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const { name, logoUrl, primaryColor, secondaryColor, adminName, adminEmail, isActive } = body;

  const tenant = await prismaMaster.tenant.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
      ...(primaryColor !== undefined && { primaryColor }),
      ...(secondaryColor !== undefined && { secondaryColor }),
      ...(adminName !== undefined && { adminName }),
      ...(adminEmail !== undefined && { adminEmail }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json({
    ok: true,
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
    },
  });
}
