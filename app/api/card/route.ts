import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { getCustomerId } from "@/lib/session";
import { randomCode, formatCode } from "@/lib/crypto";
import { getNumber, getSettings, pointsToCurrency } from "@/lib/loyalty";

export async function GET() {
  const customerId = await getCustomerId();
  if (!customerId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { homeBranch: { select: { id: true, name: true, city: true } } },
  });

  if (!customer || customer.isBlocked) {
    return NextResponse.json({ error: "Account not available." }, { status: 403 });
  }

  const ttl = (await getNumber("qr_token_ttl_seconds")) || 180;
  const settings = await getSettings();
  const cur = settings.currency || "AED";
  const pointsCashValue = await pointsToCurrency(customer.pointsBalance);

  // Dynamic Redemption Settings
  const pointsRequired = Number(settings.points_required_for_redemption || 100);
  const valuePerRedemption = Number(settings.currency_value_per_redemption_points || 10);
  const spendAedForPoints = Number(settings.spend_aed_for_points || 10);
  const pointsEarnedPerSpend = Number(settings.points_earned_per_spend || 1);

  // Dynamic Points Redemption Calculations
  const pointsBal = customer.pointsBalance || 0;
  const unlockedTiers = Math.floor(pointsBal / pointsRequired);
  const nextTierPoints = (unlockedTiers + 1) * pointsRequired;
  const pointsNeeded = nextTierPoints - pointsBal;
  const nextTierValue = (unlockedTiers + 1) * valuePerRedemption;
  const currentUnlockedValue = unlockedTiers * valuePerRedemption;
  const progressPercent = Math.min(
    100,
    Math.round(((pointsBal % pointsRequired) / pointsRequired) * 100)
  );

  // Maintain a permanent QR token / card code per customer so it does not constantly change
  let qrRecord = await prisma.qrToken.findFirst({
    where: { customerId },
    orderBy: { createdAt: "desc" },
  });

  let token = qrRecord?.token;
  let expiresAt = qrRecord?.expiresAt || new Date(Date.now() + 10 * 365 * 86400_000);

  if (!token) {
    token = randomCode(8);
    expiresAt = new Date(Date.now() + 10 * 365 * 86400_000);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        await prisma.qrToken.create({ data: { token, customerId, expiresAt } });
        break;
      } catch (e: any) {
        if (e?.code !== "P2002" || attempt === 4) throw e;
        token = randomCode(8);
      }
    }
  }

  const qr = await QRCode.toDataURL(token, {
    margin: 1,
    width: 360,
    errorCorrectionLevel: "M",
    color: { dark: "#141414", light: "#FFFFFF" },
  });

  const rewards = await prisma.customerReward.findMany({
    where: { customerId },
    include: { reward: true },
    orderBy: [{ status: "asc" }, { issuedAt: "desc" }],
    take: 30,
  });

  const transactions = await prisma.transaction.findMany({
    where: { customerId, isReversed: false },
    include: { branch: { select: { name: true, city: true } } },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const allRewards = await prisma.reward.findMany({
    where: { isActive: true, type: { in: ["POINTS", "VISITS"] } },
    orderBy: { threshold: "asc" },
  });

  const now = new Date();
  const offerRows = await prisma.offer.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    include: { branches: { select: { branchId: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const offers = offerRows
    .filter((o) => o.branches.length === 0 || o.branches.some((b) => b.branchId === customer.homeBranchId))
    .map((o) => ({
      id: o.id,
      name: o.name,
      description: o.description,
      value: Number(o.discountValue),
      isPercent: o.isPercent,
      endsAt: o.endsAt,
      everywhere: o.branches.length === 0,
    }));

  // Dynamic nextTargets list (Points Redemption + Visit Milestones)
  const dynamicPointsTarget = {
    id: "points_redemption_dynamic",
    name: `${cur} ${nextTierValue} reward`,
    kind: "points" as const,
    need: pointsNeeded,
    current: pointsBal % pointsRequired,
    threshold: pointsRequired,
    nextTierPoints,
    progressPercent,
    tierValue: nextTierValue,
    unlockedTiers,
    unlockedValue: currentUnlockedValue,
    isReadyToRedeem: unlockedTiers > 0,
  };

  const visitTargets = allRewards
    .filter((r) => r.type === "VISITS")
    .map((r) => {
      const into = customer.visitCount % r.threshold;
      const need = r.threshold - into;
      return {
        id: r.id,
        name: r.name,
        nameAr: r.nameAr,
        kind: "visits" as const,
        need,
        threshold: r.threshold,
        current: into,
        progressPercent: Math.min(100, Math.round((into / r.threshold) * 100)),
      };
    })
    .sort((a, b) => a.need - b.need);

  const nextTargets = [dynamicPointsTarget, ...visitTargets];

  return NextResponse.json({
    customer: {
      id: customer.id,
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email,
      birthday: customer.birthday,
      language: customer.language,
      homeBranch: customer.homeBranch,
      pointsBalance: customer.pointsBalance,
      visitCount: customer.visitCount,
      totalSpend: Number(customer.totalSpend),
      lastVisitAt: customer.lastVisitAt,
      memberSince: customer.createdAt,
    },
    qr: { image: qr, code: formatCode(token), expiresAt, ttlSeconds: 0 },
    rewards: rewards.map((cr) => ({
      id: cr.id,
      name: cr.reward.name,
      description: cr.reward.description,
      status: cr.status,
      value: Number(cr.reward.value),
      isPercent: cr.reward.isPercent,
      expiresAt: cr.expiresAt,
      redeemedAt: cr.redeemedAt,
    })),
    transactions: transactions.map((t) => ({
      id: t.id,
      branch: t.branch.name,
      city: t.branch.city,
      amount: Number(t.amount),
      pointsEarned: t.pointsEarned,
      createdAt: t.createdAt,
    })),
    offers,
    nextTargets,
    redemptionStatus: {
      pointsBalance: pointsBal,
      pointsRequired,
      valuePerRedemption,
      pointsCashValue,
      unlockedTiers,
      unlockedValue: currentUnlockedValue,
      nextTierPoints,
      pointsNeeded,
      nextTierValue,
      progressPercent,
      isReadyToRedeem: unlockedTiers > 0,
    },
    currency: cur,
    loyaltyRules: {
      spendAedForPoints,
      pointsEarnedPerSpend,
      pointsRequiredForRedemption: pointsRequired,
      currencyValuePerRedemptionPoints: valuePerRedemption,
      welcomeDiscountPercent: Number(settings.welcome_discount_percent || 10),
      welcomeBonusPoints: Number(settings.welcome_bonus_points || 50),
      pointsCashValue,
    },
  });
}
