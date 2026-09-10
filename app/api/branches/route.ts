import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true, city: true, address: true, hours: true },
      orderBy: [{ city: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ branches });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch branches." }, { status: 500 });
  }
}
