import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminScope";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
  }

  const admin = await prisma.staff.findUnique({
    where: { id: auth.session.id },
    include: { branch: { select: { id: true, name: true, city: true } } },
  });

  if (!admin || !admin.isActive) {
    return NextResponse.json({ error: "Admin account not found or inactive" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    admin: {
      id: admin.id,
      name: admin.name,
      username: admin.username,
      role: admin.role,
      branch: admin.branch,
    },
  });
}
