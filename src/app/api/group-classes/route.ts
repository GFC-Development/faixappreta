import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { groupClassSchema } from "@/lib/validations";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const classes = await prisma.groupClass.findMany({
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  return NextResponse.json(classes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const result = groupClassSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const groupClass = await prisma.groupClass.create({ data: { ...result.data, isKids: result.data.isKids || false, classType: result.data.classType || "GROUP" } });
  return NextResponse.json(groupClass, { status: 201 });
}
