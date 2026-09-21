import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySecret } from "@/lib/crypto";
import { setStaffSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const { username, pin } = body || {};
  if (!username || !pin) {
    return NextResponse.json({ error: "Please enter your administrative username and PIN." }, { status: 400 });
  }

  const staff = await prisma.staff.findUnique({
    where: { username: String(username).trim().toLowerCase() },
    include: { branch: { select: { id: true, name: true, city: true } } },
  });

  const bad = NextResponse.json({ error: "Invalid administrative username or PIN." }, { status: 401 });

  if (!staff || !staff.isActive) return bad;
  if (!(await verifySecret(String(pin).trim(), staff.pinHash))) return bad;

  if (staff.role === "CASHIER") {
    return NextResponse.json(
      { error: "Cashier accounts cannot access the admin management portal. Please use the Staff Till at /staff/login." },
      { status: 403 }
    );
  }

  await prisma.staff.update({ where: { id: staff.id }, data: { lastLogin: new Date() } });
  await setStaffSession(staff);

  // Record Admin Sign-In Audit Log
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent")?.slice(0, 150) || "Browser Session";
    await prisma.auditLog.create({
      data: {
        action: "admin.login",
        staffId: staff.id,
        entityType: "AdminPortal",
        entityId: staff.id,
        reason: `Executive login by @${staff.username} (${staff.name} - ${staff.role})`,
        metadata: {
          username: staff.username,
          name: staff.name,
          role: staff.role,
          branch: staff.branch?.name || "Corporate HQ (All Outlets)",
          ip,
          userAgent,
        },
      },
    });
  } catch (auditErr) {
    console.error("Failed to write admin.login audit record:", auditErr);
  }

  return NextResponse.json({
    ok: true,
    admin: {
      id: staff.id,
      name: staff.name,
      role: staff.role,
      branch: staff.branch,
    },
  });
}
