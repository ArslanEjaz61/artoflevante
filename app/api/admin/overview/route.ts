import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canAccessAllBranches } from "@/lib/session";
import { requireAdmin, branchFilter, scopedCustomerIds } from "@/lib/adminScope";
import { getSettings } from "@/lib/loyalty";

const DAY = 86400_000;

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
  }
  const { session } = auth;

  const { searchParams } = new URL(req.url);
  const branchIdParam = searchParams.get("branchId");
  const dateRangeParam = searchParams.get("dateRange") || "all";

  const all = canAccessAllBranches(session.role);

  // 1. Determine Date Range Filter
  const now = new Date();
  let dateCutoff: Date | null = null;
  if (dateRangeParam === "today") {
    dateCutoff = new Date();
    dateCutoff.setHours(0, 0, 0, 0);
  } else if (dateRangeParam === "7days") {
    dateCutoff = new Date(now.getTime() - 7 * DAY);
  } else if (dateRangeParam === "30days") {
    dateCutoff = new Date(now.getTime() - 30 * DAY);
  }

  // 2. Determine Branch Filter
  let effectiveBranchId: string | undefined = undefined;
  if (!all && session.branchId) {
    effectiveBranchId = session.branchId;
  } else if (branchIdParam && branchIdParam !== "all") {
    effectiveBranchId = branchIdParam;
  }

  // 3. Build Transaction Where Clause
  const txWhere: any = { isReversed: false };
  if (effectiveBranchId) {
    txWhere.branchId = effectiveBranchId;
  }
  if (dateCutoff) {
    txWhere.createdAt = { gte: dateCutoff };
  }

  // Customer filter
  const customerIds = await scopedCustomerIds(prisma, session);
  const custWhere: any = customerIds ? { id: { in: customerIds } } : {};
  if (effectiveBranchId) {
    custWhere.homeBranchId = effectiveBranchId;
  }

  const settings = await getSettings();

  // 4. Run Aggregations & Queries in Parallel
  const past30Cutoff = new Date(now.getTime() - 30 * DAY);
  const past7Cutoff = new Date(now.getTime() - 7 * DAY);

  const [
    totalCustomers,
    new7,
    new30,
    txAgg,
    allTxCount,
    pointsEarnedAgg,
    pointsRedeemedAgg,
    walletFloatAgg,
    returningCount,
    rewardsIssued,
    rewardsRedeemed,
    allBranches,
    recentTx,
    topRewardRows,
    staffRows,
  ] = await Promise.all([
    prisma.customer.count({ where: custWhere }),
    prisma.customer.count({ where: { ...custWhere, createdAt: { gte: past7Cutoff } } }),
    prisma.customer.count({ where: { ...custWhere, createdAt: { gte: past30Cutoff } } }),
    prisma.transaction.aggregate({
      where: txWhere,
      _count: true,
      _sum: { amount: true, pointsEarned: true, discountGiven: true },
    }),
    prisma.transaction.count({
      where: effectiveBranchId ? { branchId: effectiveBranchId, isReversed: false } : { isReversed: false },
    }),
    prisma.pointsLedger.aggregate({
      where: {
        delta: { gt: 0 },
        ...(dateCutoff ? { createdAt: { gte: dateCutoff } } : {}),
      },
      _sum: { delta: true },
    }),
    prisma.pointsLedger.aggregate({
      where: {
        delta: { lt: 0 },
        ...(dateCutoff ? { createdAt: { gte: dateCutoff } } : {}),
      },
      _sum: { delta: true },
    }),
    prisma.customer.aggregate({
      where: custWhere,
      _sum: { pointsBalance: true },
    }),
    prisma.customer.count({
      where: { ...custWhere, visitCount: { gt: 1 } },
    }),
    prisma.customerReward.count({
      where: dateCutoff ? { issuedAt: { gte: dateCutoff } } : undefined,
    }),
    prisma.customerReward.count({
      where: {
        status: "REDEEMED",
        ...(dateCutoff ? { redeemedAt: { gte: dateCutoff } } : {}),
      },
    }),
    prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true, city: true, code: true },
      orderBy: { name: "asc" },
    }),
    prisma.transaction.findMany({
      where: txWhere,
      include: {
        customer: { select: { name: true, mobile: true, email: true } },
        branch: { select: { name: true, code: true, city: true } },
        staff: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.customerReward.groupBy({
      by: ["rewardId"],
      _count: { rewardId: true },
      orderBy: { _count: { rewardId: "desc" } },
      take: 5,
    }),
    prisma.staff.findMany({
      where: all ? {} : { branchId: session.branchId ?? undefined },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        lastLogin: true,
        branch: { select: { name: true } },
      },
      orderBy: { lastLogin: "desc" },
    }),
  ]);

  // Branch Performance / Leaderboard
  const perBranch = await prisma.transaction.groupBy({
    by: ["branchId"],
    where: {
      isReversed: false,
      ...(dateCutoff ? { createdAt: { gte: dateCutoff } } : {}),
    },
    _count: true,
    _sum: { amount: true, pointsEarned: true },
  });
  const branchMap = new Map(perBranch.map((b) => [b.branchId, b]));

  const branchPerformance = allBranches.map((b) => {
    const row = branchMap.get(b.id);
    return {
      id: b.id,
      name: b.name,
      code: b.code,
      city: b.city || "Dubai",
      visits: row?._count ?? 0,
      revenue: Number(row?._sum.amount ?? 0),
      pointsAwarded: row?._sum.pointsEarned ?? 0,
      points: row?._sum.pointsEarned ?? 0,
    };
  }).sort((x, y) => y.revenue - x.revenue);

  // Top reward names mapping
  const rewardNames = await prisma.reward.findMany({
    where: { id: { in: topRewardRows.map((r) => r.rewardId) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(rewardNames.map((r) => [r.id, r.name]));

  // Birthdays this month
  const thisMonth = now.getUTCMonth();
  const withBirthday = await prisma.customer.findMany({
    where: { ...custWhere, birthday: { not: null } },
    select: { id: true, name: true, mobile: true, birthday: true },
  });
  const birthdays = withBirthday
    .filter((c) => c.birthday && new Date(c.birthday).getUTCMonth() === thisMonth)
    .sort((a, b) => new Date(a.birthday!).getUTCDate() - new Date(b.birthday!).getUTCDate())
    .slice(0, 10);

  const visits = txAgg._count ?? 0;
  const revenue = Number(txAgg._sum.amount ?? 0);
  const avgBill = visits > 0 ? Math.round(revenue / visits) : 0;
  const repeatRate = totalCustomers > 0 ? Math.round((returningCount / totalCustomers) * 100) : 0;
  const pointsAwarded = pointsEarnedAgg._sum.delta ?? 0;
  const pointsRedeemed = Math.abs(pointsRedeemedAgg._sum.delta ?? 0);
  const walletFloat = walletFloatAgg._sum.pointsBalance ?? 0;

  // Unified metrics payload matching all key variants
  const metricsPayload = {
    totalRevenue: revenue,
    totalVisits: visits,
    avgBill: avgBill,
    avgTransaction: avgBill,
    totalMembers: totalCustomers,
    totalCustomers: totalCustomers,
    newMembersLast30Days: new30,
    newLast30: new30,
    newLast7: new7,
    repeatRate: repeatRate,
    returnRate: repeatRate,
    rewardsClaimed: rewardsRedeemed,
    rewardsRedeemed: rewardsRedeemed,
    rewardsIssued: rewardsIssued,
    pointsAwarded: pointsAwarded,
    pointsIssued: pointsAwarded,
    pointsRedeemed: pointsRedeemed,
    activeMemberWalletFloat: walletFloat,
    walletFloat: walletFloat,
    discountGiven: Number(txAgg._sum.discountGiven ?? 0),
    returningCustomers: returningCount,
    birthdaysThisMonth: birthdays.length,
  };

  return NextResponse.json({
    ok: true,
    scope: {
      allBranches: all,
      branchId: session.branchId,
      branchName: session.branchId ? allBranches.find((b) => b.id === session.branchId)?.name || null : null,
      role: session.role,
    },
    currency: settings.currency || "AED",
    filters: {
      branchId: effectiveBranchId || "all",
      dateRange: dateRangeParam,
    },
    metrics: metricsPayload,
    kpis: metricsPayload,
    branchLeaderboard: branchPerformance,
    branchPerformance: branchPerformance,
    branches: allBranches,
    topRewards: topRewardRows.map((r) => ({
      name: nameById.get(r.rewardId) || "Loyalty Voucher",
      count: r._count.rewardId,
    })),
    birthdays: birthdays.map((c) => ({
      name: c.name,
      mobile: c.mobile,
      day: new Date(c.birthday!).getUTCDate(),
    })),
    recentTransactions: recentTx.map((t) => ({
      id: t.id,
      customer: t.customer?.name || "Member",
      mobile: t.customer?.mobile || "—",
      branch: t.branch?.name || "Branch",
      staff: t.staff?.name ?? "—",
      invoiceNumber: t.invoiceNumber,
      amount: Number(t.amount),
      pointsEarned: t.pointsEarned,
      points: t.pointsEarned,
      discountGiven: Number(t.discountGiven),
      createdAt: t.createdAt,
    })),
    staff: staffRows.map((s) => ({
      id: s.id,
      name: s.name,
      username: s.username,
      role: s.role,
      branch: s.branch?.name ?? "All branches",
      lastLogin: s.lastLogin,
    })),
  });
}
