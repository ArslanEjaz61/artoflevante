import { NextResponse } from "next/server";
import { getStaffSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staff = await prisma.staff.findUnique({
    where: { id: session.id },
    include: { branch: { select: { id: true, name: true, city: true } } },
  });

  if (!staff || !staff.isActive) {
    return NextResponse.json({ error: "Account inactive or not found" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    staff: {
      id: staff.id,
      name: staff.name,
      username: staff.username,
      role: staff.role,
      branch: staff.branch,
    },
  });
}
