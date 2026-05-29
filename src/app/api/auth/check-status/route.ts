import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ status: "UNKNOWN" });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { status: true },
  });

  if (!user) {
    return NextResponse.json({ status: "UNKNOWN" });
  }

  return NextResponse.json({ status: user.status });
}
