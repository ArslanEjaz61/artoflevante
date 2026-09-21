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

  // Record Staff POS Till Sign-In Audit Log
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent")?.slice(0, 150) || "POS Till Browser";
    await prisma.auditLog.create({
      data: {
        action: "staff.login",
        staffId: staff.id,
        entityType: "StaffTill",
        entityId: staff.id,
        reason: `POS Till session started for @${staff.username} (${staff.name} at ${staff.branch?.name || "Corporate HQ"})`,
        metadata: {
          username: staff.username,
          name: staff.name,
          role: staff.role,
          branchName: staff.branch?.name || "Corporate HQ (All Outlets)",
          branchCity: staff.branch?.city || "All",
          branchId: staff.branchId,
          ip,
          userAgent,
        },
      },
    });
  } catch (auditErr) {
    console.error("Failed to write staff.login audit record:", auditErr);
  }

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
