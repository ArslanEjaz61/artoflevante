import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffSession } from "@/lib/session";
import { hashSecret, verifySecret } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const { currentPin, newPin, confirmPin } = body || {};

  if (!currentPin || !newPin || !confirmPin) {
    return NextResponse.json({ error: "Please fill in all PIN fields." }, { status: 400 });
  }

  const cleanCurrent = String(currentPin).trim();
  const cleanNew = String(newPin).trim();
  const cleanConfirm = String(confirmPin).trim();

  if (cleanNew !== cleanConfirm) {
    return NextResponse.json({ error: "New PIN and Confirm PIN do not match." }, { status: 400 });
  }

  if (cleanNew.length < 4) {
    return NextResponse.json({ error: "New PIN must be at least 4 digits long." }, { status: 400 });
  }

  // Fetch current staff record from db
  const staff = await prisma.staff.findUnique({
    where: { id: session.id },
  });

  if (!staff || !staff.isActive) {
    return NextResponse.json({ error: "Account not found or inactive." }, { status: 404 });
  }

  // Verify old PIN
  const isMatch = await verifySecret(cleanCurrent, staff.pinHash);
  if (!isMatch) {
    return NextResponse.json({ error: "The current PIN you entered is incorrect." }, { status: 400 });
  }

  // Hash new PIN and save
  const newPinHash = await hashSecret(cleanNew);
  await prisma.staff.update({
    where: { id: staff.id },
    data: { pinHash: newPinHash },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      staffId: staff.id,
      action: "staff.pin_changed",
      entityType: "staff",
      entityId: staff.id,
      metadata: {
        username: staff.username,
        role: staff.role,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Your admin security PIN has been updated successfully.",
  });
}
