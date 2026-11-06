import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeMobile, isValidEmail, DEFAULT_COUNTRY } from "@/lib/mobile";
import { hashSecret, randomOtp } from "@/lib/crypto";
import { sendOtp, isDevDelivery } from "@/lib/sms";
import { sendOtpEmail } from "@/lib/email";

// Helper for security rate limiting: max 3 requests in a 10-minute sliding window
async function checkRateLimit(identifier: string) {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const recentOtps = await prisma.otpCode.findMany({
    where: {
      mobile: identifier,
      createdAt: { gte: tenMinutesAgo },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, createdAt: true },
  });

  if (recentOtps.length >= 3) {
    const oldest = recentOtps[0];
    const remainingMs = Math.max(0, oldest.createdAt.getTime() + 10 * 60 * 1000 - Date.now());
    const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
    const remainingSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
    return {
      limited: true,
      error: `Security limit: Maximum 3 verification codes allowed within 10 minutes. Please wait ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"} before requesting another code.`,
      remainingMinutes,
      remainingSeconds,
    };
  }

  return { limited: false, used: recentOtps.length };
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const { name, mobile, countryCode, email, birthday, branchId, mode, loginMethod } = body || {};
  const purpose = mode === "login" ? "login" : "register";
  const isEmailLogin = purpose === "login" && (loginMethod === "email" || (!mobile && Boolean(email)));

  // Strict 5-minute standard expiration (300 seconds)
  const ttl = 300;

  // ==============================================================
  // 1. EMAIL LOGIN FLOW
  // ==============================================================
  if (isEmailLogin) {
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const customer = await prisma.customer.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" } },
    });

    if (!customer) {
      return NextResponse.json(
        {
          error: "No loyalty account found with this email. Please check your email or sign in with your mobile number.",
          notRegistered: true,
        },
        { status: 404 }
      );
    }

    if (customer.isBlocked) {
      return NextResponse.json({ error: "This loyalty account is currently inactive." }, { status: 403 });
    }

    const identifier = `email:${cleanEmail}`;

    // Security Rate Limiting: max 3 requests per 10 minutes
    const rateCheck = await checkRateLimit(identifier);
    if (rateCheck.limited) {
      return NextResponse.json(
        {
          error: rateCheck.error,
          retryAfterMinutes: rateCheck.remainingMinutes,
          retryAfterSeconds: rateCheck.remainingSeconds,
        },
        { status: 429 }
      );
    }

    // Clear old unconsumed OTPs for this email login
    await prisma.otpCode.deleteMany({
      where: { mobile: identifier, purpose, consumedAt: null },
    });

    const code = randomOtp();
    await prisma.otpCode.create({
      data: {
        mobile: identifier,
        codeHash: await hashSecret(code),
        purpose,
        expiresAt: new Date(Date.now() + ttl * 1000),
        pendingEmail: cleanEmail,
      },
    });

    let deliveryResult = { ok: true, provider: "email" };
    try {
      deliveryResult = await sendOtpEmail(cleanEmail, code, customer.name);
    } catch (err: any) {
      console.error("Email OTP send error:", err);
    }

    const isDev = process.env.NODE_ENV !== "production";
    return NextResponse.json({
      ok: true,
      loginMethod: "email",
      email: cleanEmail,
      purpose,
      expiresInSeconds: ttl,
      channel: deliveryResult.provider,
      attemptsUsed: (rateCheck.used ?? 0) + 1,
      maxAttempts: 3,
      windowMinutes: 10,
      ...(isDev ? { devCode: code } : {}),
    });
  }

  // ==============================================================
  // 2. MOBILE NUMBER (DEFAULT LOGIN & REGISTRATION) FLOW
  // ==============================================================
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

  // Security Rate Limiting: max 3 requests per 10 minutes
  const rateCheck = await checkRateLimit(normalized);
  if (rateCheck.limited) {
    return NextResponse.json(
      {
        error: rateCheck.error,
        retryAfterMinutes: rateCheck.remainingMinutes,
        retryAfterSeconds: rateCheck.remainingSeconds,
      },
      { status: 429 }
    );
  }

  // Clear pending OTPs for this number/purpose
  await prisma.otpCode.deleteMany({ where: { mobile: normalized, purpose, consumedAt: null } });

  const code = randomOtp();

  await prisma.otpCode.create({
    data: {
      mobile: normalized,
      codeHash: await hashSecret(code),
      purpose,
      expiresAt: new Date(Date.now() + ttl * 1000),
      pendingName: purpose === "register" ? String(name).trim() : null,
      pendingEmail: purpose === "register" && email ? String(email).trim().toLowerCase() : null,
      pendingBirthday: purpose === "register" && birthday ? new Date(birthday) : null,
      pendingBranchId: purpose === "register" ? branchId : null,
    },
  });

  let deliveryResult: { delivered: boolean; provider: string } = { delivered: true, provider: "console" };
  try {
    deliveryResult = await sendOtp(normalized, code);
  } catch (err: any) {
    console.error("OTP send failed:", err?.message || err);
    return NextResponse.json(
      { error: "Could not send the verification code. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    loginMethod: "mobile",
    mobile: normalized,
    purpose,
    expiresInSeconds: ttl,
    channel: deliveryResult.provider,
    attemptsUsed: (rateCheck.used ?? 0) + 1,
    maxAttempts: 3,
    windowMinutes: 10,
    ...(isDevDelivery() ? { devCode: code } : {}),
  });
}
