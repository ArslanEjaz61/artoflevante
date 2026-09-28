import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeMobile, DEFAULT_COUNTRY } from "@/lib/mobile";
import { verifySecret } from "@/lib/crypto";
import { setCustomerSession } from "@/lib/session";
import { getNumber, getSetting, pointsToCurrency } from "@/lib/loyalty";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { mobile, countryCode, code, mode } = body || {};
  const purpose = mode === "login" ? "login" : "register";
  const normalized = normalizeMobile(mobile, countryCode || DEFAULT_COUNTRY);

  if (!normalized || !code) {
    return NextResponse.json({ error: "Enter the code we sent you." }, { status: 400 });
  }

  const otp = await prisma.otpCode.findFirst({
    where: { mobile: normalized, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return NextResponse.json({ error: "No code was requested. Please start again." }, { status: 400 });
  }
  if (otp.expiresAt < new Date()) {
    return NextResponse.json({ error: "That code has expired. Please request a new one." }, { status: 400 });
  }

  const maxAttempts = (await getNumber("otp_max_attempts")) || 5;
  if (otp.attempts >= maxAttempts) {
    return NextResponse.json(
      { error: "Too many wrong attempts. Please request a new code." },
      { status: 429 }
    );
  }

  const valid = await verifySecret(String(code).trim(), otp.codeHash);
  if (!valid) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    const left = maxAttempts - (otp.attempts + 1);
    return NextResponse.json(
      { error: left > 0 ? `Wrong code. ${left} attempt${left === 1 ? "" : "s"} left.` : "Wrong code." },
      { status: 400 }
    );
  }

  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });

  if (purpose === "login") {
    const customer = await prisma.customer.findUnique({
      where: { mobile: normalized },
      include: { homeBranch: { select: { id: true, name: true, city: true } } },
    });
    if (!customer) {
      return NextResponse.json({ error: "No account found for this number." }, { status: 404 });
    }
    await setCustomerSession(customer.id);

    // Record Customer Sign-In Audit Log & Admin Notification
    try {
      const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
      const userAgent = req.headers.get("user-agent")?.slice(0, 150) || "Mobile Web Portal";
      await prisma.auditLog.create({
        data: {
          action: "customer.login",
          entityType: "Customer",
          entityId: customer.id,
          reason: `Customer sign in via SMS OTP: ${customer.name || "Member"} (${customer.mobile})`,
          metadata: {
            mobile: customer.mobile,
            name: customer.name || "Guest Member",
            pointsBalance: customer.pointsBalance,
            visitCount: customer.visitCount,
            homeBranch: customer.homeBranch?.name || "Not assigned",
            ip,
            userAgent,
          },
        },
      });

      await createNotification({
        type: "CUSTOMER_LOGIN",
        title: `Customer Sign In: ${customer.name || "Member"}`,
        message: `${customer.name || "Customer"} (${customer.mobile}) just logged into the Loyalty Club with ${customer.pointsBalance} pts balance.`,
        metadata: {
          customerId: customer.id,
          mobile: customer.mobile,
          name: customer.name,
          pointsBalance: customer.pointsBalance,
        },
      });
    } catch (auditErr) {
      console.error("Failed to write customer.login audit record:", auditErr);
    }

    return NextResponse.json({ ok: true, customerId: customer.id, isNew: false });
  }

  // Guard against race condition on dual verification
  const alreadyThere = await prisma.customer.findUnique({
    where: { mobile: normalized },
    include: { homeBranch: { select: { id: true, name: true, city: true } } },
  });
  if (alreadyThere) {
    await setCustomerSession(alreadyThere.id);

    try {
      const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
      await prisma.auditLog.create({
        data: {
          action: "customer.login",
          entityType: "Customer",
          entityId: alreadyThere.id,
          reason: `Customer sign in via SMS OTP: ${alreadyThere.name || "Member"} (${alreadyThere.mobile})`,
          metadata: {
            mobile: alreadyThere.mobile,
            name: alreadyThere.name || "Guest Member",
            pointsBalance: alreadyThere.pointsBalance,
            visitCount: alreadyThere.visitCount,
            homeBranch: alreadyThere.homeBranch?.name || "Not assigned",
            ip,
          },
        },
      });

      await createNotification({
        type: "CUSTOMER_LOGIN",
        title: `Customer Sign In: ${alreadyThere.name || "Member"}`,
        message: `${alreadyThere.name || "Customer"} (${alreadyThere.mobile}) signed in with ${alreadyThere.pointsBalance} pts balance.`,
        metadata: {
          customerId: alreadyThere.id,
          mobile: alreadyThere.mobile,
          name: alreadyThere.name,
          pointsBalance: alreadyThere.pointsBalance,
        },
      });
    } catch (auditErr) {
      console.error("Failed to write customer.login audit record:", auditErr);
    }

    return NextResponse.json({ ok: true, customerId: alreadyThere.id, isNew: false });
  }

  // Dynamic Welcome Rules from Settings
  const welcomeBonusPoints = (await getNumber("welcome_bonus_points")) || 50;
  const welcomeDiscountPercent = (await getNumber("welcome_discount_percent")) || 10;
  const currency = (await getSetting("currency")) || "AED";
  const pointsAedValue = await pointsToCurrency(welcomeBonusPoints);

  // Find or create the active WELCOME reward voucher
  let welcomeReward = await prisma.reward.findFirst({
    where: { type: "WELCOME", isActive: true },
  });

  if (!welcomeReward) {
    welcomeReward = await prisma.reward.create({
      data: {
        name: `Welcome ${welcomeDiscountPercent}% Voucher`,
        nameAr: `قسيمة ترحيبية ${welcomeDiscountPercent}%`,
        description: `Enjoy ${welcomeDiscountPercent}% off your first dining order as a new member gift.`,
        type: "WELCOME",
        threshold: 0,
        value: welcomeDiscountPercent,
        isPercent: true,
        validDays: 30,
        isActive: true,
      },
    });
  }

  const customer = await prisma.$transaction(async (tx) => {
    const created = await tx.customer.create({
      data: {
        mobile: normalized,
        name: otp.pendingName || "Guest",
        email: otp.pendingEmail || null,
        birthday: otp.pendingBirthday || null,
        homeBranchId: otp.pendingBranchId || null,
        pointsBalance: welcomeBonusPoints,
      },
    });

    if (welcomeBonusPoints > 0) {
      await tx.pointsLedger.create({
        data: {
          customerId: created.id,
          delta: welcomeBonusPoints,
          reason: "welcome",
          note: `Signup welcome bonus gift: +${welcomeBonusPoints} points credited`,
        },
      });
    }

    if (welcomeReward) {
      await tx.customerReward.create({
        data: {
          customerId: created.id,
          rewardId: welcomeReward.id,
          status: "AVAILABLE",
          expiresAt: welcomeReward.validDays
            ? new Date(Date.now() + welcomeReward.validDays * 86400_000)
            : new Date(Date.now() + 30 * 86400_000),
        },
      });
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    await tx.auditLog.create({
      data: {
        action: "customer.register",
        entityType: "Customer",
        entityId: created.id,
        reason: `New member registered: ${otp.pendingName || "Guest"} (${normalized})`,
        metadata: {
          mobile: normalized,
          name: otp.pendingName || "Guest",
          email: otp.pendingEmail || null,
          branchId: otp.pendingBranchId ?? null,
          welcomeBonusPoints,
          welcomeDiscountPercent,
          ip,
        },
      },
    });

    return created;
  });

  // Trigger Admin Notification for New Member Registration
  await createNotification({
    type: "CUSTOMER_REGISTER",
    title: `New Customer Registered! 🎉`,
    message: `${customer.name} (${customer.mobile}) joined Loyalty Club. Awarded +${welcomeBonusPoints} welcome points.`,
    metadata: {
      customerId: customer.id,
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email,
      pointsBalance: customer.pointsBalance,
    },
  });

  await setCustomerSession(customer.id);

  return NextResponse.json({
    ok: true,
    customerId: customer.id,
    isNew: true,
    welcome: {
      bonusPoints: welcomeBonusPoints,
      discountPercent: welcomeDiscountPercent,
      currency,
      pointsAedValue,
    },
  });
}

