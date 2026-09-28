import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { getCustomerId } from "@/lib/session";
import { randomCode, formatCode } from "@/lib/crypto";
import { getNumber, getSettings, pointsToCurrency, newlyEligibleRewards } from "@/lib/loyalty";

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

  // -------------------------------------------------------------
  // Visit Milestone Check & Auto-Issue (Randomized if multiple perks)
  // -------------------------------------------------------------
  const heldVisitRewards = await prisma.customerReward.findMany({
    where: { customerId, status: "AVAILABLE", reward: { type: "VISITS" } },
    include: { reward: true },
  });

  const availableHeldThresholds = heldVisitRewards.map((h) => h.reward.threshold);

  const newlyUnlocked = await newlyEligibleRewards({
    pointsBalance: customer.pointsBalance,
    visitCount: customer.visitCount,
    alreadyHeldRewardIds: heldVisitRewards.map((h) => h.rewardId),
    currentlyAvailableVisitRewardThresholds: availableHeldThresholds,
  });

  if (newlyUnlocked.length > 0) {
    for (const r of newlyUnlocked) {
      await prisma.customerReward.create({
        data: {
          customerId,
          rewardId: r.id,
          status: "AVAILABLE",
          expiresAt: r.validDays ? new Date(Date.now() + r.validDays * 86400_000) : null,
        },
      });
    }
  }

  // -------------------------------------------------------------
  // Birthday Mystery Countdown & Random Gift Unlock Logic
  // -------------------------------------------------------------
  let birthdayStatus: {
    hasBirthday: boolean;
    birthdayDate: string | null;
    isBirthdayMonth: boolean;
    isBirthdayToday: boolean;
    daysUntilBirthday: number | null;
    status: "NONE" | "COUNTDOWN_LOCKED" | "AVAILABLE" | "REDEEMED";
    reward: any | null;
  } = {
    hasBirthday: false,
    birthdayDate: null,
    isBirthdayMonth: false,
    isBirthdayToday: false,
    daysUntilBirthday: null,
    status: "NONE",
    reward: null,
  };

  if (customer.birthday) {
    const today = new Date();
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const bdayRaw = new Date(customer.birthday);
    const bdayThisYear = new Date(today.getFullYear(), bdayRaw.getMonth(), bdayRaw.getDate());
    const isBirthdayMonth = today.getMonth() === bdayRaw.getMonth();
    const isBirthdayToday = today.getMonth() === bdayRaw.getMonth() && today.getDate() === bdayRaw.getDate();

    let daysUntil = Math.ceil((bdayThisYear.getTime() - todayZero.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0 && !isBirthdayMonth) {
      const bdayNextYear = new Date(today.getFullYear() + 1, bdayRaw.getMonth(), bdayRaw.getDate());
      daysUntil = Math.ceil((bdayNextYear.getTime() - todayZero.getTime()) / (1000 * 60 * 60 * 24));
    }

    const existingBirthdayReward = await prisma.customerReward.findFirst({
      where: {
        customerId,
        reward: { type: "BIRTHDAY" },
      },
      include: { reward: true },
      orderBy: { issuedAt: "desc" },
    });

    const thisYear = today.getFullYear();
    const alreadyIssuedThisYear = existingBirthdayReward
      ? new Date(existingBirthdayReward.issuedAt).getFullYear() === thisYear
      : false;

    birthdayStatus.hasBirthday = true;
    birthdayStatus.birthdayDate = customer.birthday.toISOString();
    birthdayStatus.isBirthdayMonth = isBirthdayMonth;
    birthdayStatus.isBirthdayToday = isBirthdayToday;
    birthdayStatus.daysUntilBirthday = Math.max(0, daysUntil);

    if (alreadyIssuedThisYear && existingBirthdayReward) {
      if (existingBirthdayReward.status === "AVAILABLE") {
        birthdayStatus.status = "AVAILABLE";
        birthdayStatus.reward = {
          id: existingBirthdayReward.id,
          name: existingBirthdayReward.reward.name,
          description: existingBirthdayReward.reward.description,
          value: Number(existingBirthdayReward.reward.value),
          isPercent: existingBirthdayReward.reward.isPercent,
          expiresAt: existingBirthdayReward.expiresAt,
          status: "AVAILABLE",
        };
      } else {
        birthdayStatus.status = "REDEEMED";
        birthdayStatus.reward = {
          id: existingBirthdayReward.id,
          name: existingBirthdayReward.reward.name,
          description: existingBirthdayReward.reward.description,
          redeemedAt: existingBirthdayReward.redeemedAt,
          status: "REDEEMED",
        };
      }
    } else {
      const isApproaching = isBirthdayMonth || (daysUntil >= 0 && daysUntil <= 30);

      if (isApproaching) {
        const isExactDayReached = isBirthdayToday || (isBirthdayMonth && today.getDate() >= bdayRaw.getDate());

        if (!isExactDayReached && daysUntil > 0) {
          // Keep surprise gift locked with countdown
          birthdayStatus.status = "COUNTDOWN_LOCKED";
        } else {
          // Exact Birthday Reached -> Pick Randomly from active birthday gifts and unlock!
          const activeBirthdayRewards = await prisma.reward.findMany({
            where: { type: "BIRTHDAY", isActive: true },
          });

          if (activeBirthdayRewards.length > 0) {
            const chosenReward =
              activeBirthdayRewards[Math.floor(Math.random() * activeBirthdayRewards.length)];

            const cr = await prisma.customerReward.create({
              data: {
                customerId,
                rewardId: chosenReward.id,
                status: "AVAILABLE",
                expiresAt: chosenReward.validDays
                  ? new Date(Date.now() + chosenReward.validDays * 86400_000)
                  : new Date(Date.now() + 30 * 86400_000),
              },
              include: { reward: true },
            });

            if (!chosenReward.isPercent && Number(chosenReward.value) > 0 && chosenReward.threshold === 0) {
              const bonusPts = Math.floor(Number(chosenReward.value));
              await prisma.customer.update({
                where: { id: customerId },
                data: { pointsBalance: { increment: bonusPts } },
              });
              await prisma.pointsLedger.create({
                data: {
                  customerId,
                  delta: bonusPts,
                  reason: "birthday",
                  note: `Birthday surprise treat: +${bonusPts} bonus points awarded`,
                },
              });
            }

            birthdayStatus.status = "AVAILABLE";
            birthdayStatus.reward = {
              id: cr.id,
              name: chosenReward.name,
              description: chosenReward.description,
              value: Number(chosenReward.value),
              isPercent: chosenReward.isPercent,
              expiresAt: cr.expiresAt,
              status: "AVAILABLE",
            };
          }
        }
      }
    }
  }

  const allCustRewards = await prisma.customerReward.findMany({
    where: { customerId },
    include: {
      reward: true,
      redeemedTx: { include: { branch: { select: { name: true, city: true } } } },
    },
    orderBy: [{ status: "asc" }, { issuedAt: "desc" }],
    take: 50,
  });

  const availableVisitReward = allCustRewards.find(
    (cr) => cr.status === "AVAILABLE" && cr.reward.type === "VISITS"
  );
  const redeemedVisitRewards = allCustRewards.filter(
    (cr) => cr.status === "REDEEMED" && cr.reward.type === "VISITS"
  );

  const allActiveVisitRewardRules = await prisma.reward.findMany({
    where: { isActive: true, type: "VISITS" },
    orderBy: { threshold: "asc" },
  });

  const primaryThreshold = allActiveVisitRewardRules[0]?.threshold || 5;

  const milestoneProgress = {
    threshold: primaryThreshold,
    visitsInCycle: availableVisitReward
      ? primaryThreshold
      : Math.max(0, (customer.visitCount - redeemedVisitRewards.length * primaryThreshold) % primaryThreshold),
    visitsNeeded: availableVisitReward
      ? 0
      : primaryThreshold - Math.max(0, (customer.visitCount - redeemedVisitRewards.length * primaryThreshold) % primaryThreshold),
    progressPercent: availableVisitReward
      ? 100
      : Math.min(
          100,
          Math.round(
            (Math.max(0, (customer.visitCount - redeemedVisitRewards.length * primaryThreshold) % primaryThreshold) /
              primaryThreshold) *
              100
          )
        ),
    isUnlocked: !!availableVisitReward,
    unlockedReward: availableVisitReward
      ? {
          id: availableVisitReward.id,
          name: availableVisitReward.reward.name,
          description: availableVisitReward.reward.description,
          value: Number(availableVisitReward.reward.value),
        }
      : null,
    redeemedCount: redeemedVisitRewards.length,
    cycleNumber: redeemedVisitRewards.length + 1,
  };

  const transactions = await prisma.transaction.findMany({
    where: { customerId, isReversed: false },
    include: {
      branch: { select: { name: true, city: true } },
      pointsLedger: true,
      customerRewards: { include: { reward: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
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

  const visitTargets = [
    {
      id: "visit_milestone_dynamic",
      name: milestoneProgress.unlockedReward?.name || `Free Gift on ${primaryThreshold} Visits`,
      kind: "visits" as const,
      need: milestoneProgress.visitsNeeded,
      threshold: milestoneProgress.threshold,
      current: milestoneProgress.visitsInCycle,
      progressPercent: milestoneProgress.progressPercent,
      isUnlocked: milestoneProgress.isUnlocked,
      cycleNumber: milestoneProgress.cycleNumber,
    },
  ];

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
    birthdayStatus,
    milestoneProgress,
    rewards: allCustRewards.map((cr) => ({
      id: cr.id,
      name: cr.reward.name,
      description: cr.reward.description,
      type: cr.reward.type,
      status: cr.status,
      value: Number(cr.reward.value),
      isPercent: cr.reward.isPercent,
      expiresAt: cr.expiresAt,
      redeemedAt: cr.redeemedAt,
      redeemedBranch: cr.redeemedTx?.branch?.name || null,
    })),
    transactions: transactions.map((t) => {
      const redeemedLedger = t.pointsLedger.filter((pl) => pl.delta < 0);
      const pointsRedeemed = redeemedLedger.reduce((sum, pl) => sum + Math.abs(pl.delta), 0);
      return {
        id: t.id,
        invoiceNumber: t.invoiceNumber,
        branch: t.branch.name,
        city: t.branch.city,
        amount: Number(t.amount),
        pointsEarned: t.pointsEarned,
        pointsRedeemed,
        discountGiven: Number(t.discountGiven || 0),
        redeemedRewards: t.customerRewards.map((cr) => cr.reward.name),
        createdAt: t.createdAt,
      };
    }),
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
