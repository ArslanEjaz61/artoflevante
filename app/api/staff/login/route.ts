import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySecret } from "@/lib/crypto";
import { setStaffSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { username, pin } = body || {};
  if (!username || !pin) {
    return NextResponse.json({ error: "Enter your username and PIN." }, { status: 400 });
  }

  const staff = await prisma.staff.findUnique({
    where: { username: String(username).trim().toLowerCase() },
    include: { branch: { select: { id: true, name: true, city: true } } },
  });

  const bad = NextResponse.json({ error: "Wrong username or PIN." }, { status: 401 });

  if (!staff || !staff.isActive) return bad;
  if (!(await verifySecret(String(pin).trim(), staff.pinHash))) return bad;

  await prisma.staff.update({ where: { id: staff.id }, data: { lastLogin: new Date() } });
  await setStaffSession(staff);

  return NextResponse.json({
    ok: true,
    staff: {
      id: staff.id,
      name: staff.name,
      role: staff.role,
      branch: staff.branch,
    },
  });
}
