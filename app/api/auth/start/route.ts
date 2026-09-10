import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeMobile, isValidEmail, DEFAULT_COUNTRY } from "@/lib/mobile";
import { hashSecret, randomOtp } from "@/lib/crypto";
import { sendOtp, isDevDelivery } from "@/lib/sms";
import { getNumber } from "@/lib/loyalty";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { name, mobile, countryCode, email, birthday, branchId, mode } = body || {};
  const purpose = mode === "login" ? "login" : "register";

  const normalized = normalizeMobile(mobile, countryCode || DEFAULT_COUNTRY);
  if (!normalized) {
    return NextResponse.json(
      { error: "Enter a valid mobile number for the country you selected." },
      { status: 400 }
    );
  }

  const existing = await prisma.customer.findUnique({ where: { mobile: normalized } });

  if (purpose === "register") {
    if (existing) {
      return NextResponse.json(
        { error: "This number is already registered. Please sign in instead.", alreadyRegistered: true },
        { status: 409 }
      );
    }
    if (!name || String(name).trim().length < 2) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    }
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!branchId) {
      return NextResponse.json({ error: "Please choose your home branch." }, { status: 400 });
    }
    const branch = await prisma.branch.findFirst({ where: { id: branchId, isActive: true } });
    if (!branch) {
      return NextResponse.json({ error: "That branch is not available." }, { status: 400 });
    }
  } else {
    if (!existing) {
      return NextResponse.json(
        { error: "No account found for this number. Please register first.", notRegistered: true },
        { status: 404 }
      );
    }
    if (existing.isBlocked) {
      return NextResponse.json({ error: "This account is not active." }, { status: 403 });
    }
  }

  // Clear pending OTPs for this number/purpose
  await prisma.otpCode.deleteMany({ where: { mobile: normalized, purpose, consumedAt: null } });

  const code = randomOtp();
  const ttl = await getNumber("otp_ttl_seconds") || 300;

  await prisma.otpCode.create({
    data: {
      mobile: normalized,
      codeHash: await hashSecret(code),
      purpose,
      expiresAt: new Date(Date.now() + ttl * 1000),
      pendingName: purpose === "register" ? String(name).trim() : null,
      pendingEmail: purpose === "register" && email ? String(email).trim() : null,
      pendingBirthday: purpose === "register" && birthday ? new Date(birthday) : null,
      pendingBranchId: purpose === "register" ? branchId : null,
    },
  });

  try {
    await sendOtp(normalized, code);
  } catch (err: any) {
    console.error("OTP send failed:", err?.message || err);
    return NextResponse.json(
      { error: "Could not send the code. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    mobile: normalized,
    purpose,
    expiresInSeconds: ttl,
    ...(isDevDelivery() ? { devCode: code } : {}),
  });
}
