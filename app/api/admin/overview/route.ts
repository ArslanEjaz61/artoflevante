import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canAccessAllBranches } from "@/lib/session";
import { requireAdmin, branchFilter, scopedCustomerIds } from "@/lib/adminScope";
import { getSettings } from "@/lib/loyalty";

const DAY = 86400_000;

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
  }
  const { session } = auth;

  const all = canAccessAllBranches(session.role);
  const txWhere: any = { ...branchFilter(session), isReversed: false };
  const customerIds = await scopedCustomerIds(prisma, session);
  const custWhere: any = customerIds ? { id: { in: customerIds } } : {};

  const now = new Date();
  const since = (days: number) => new Date(now.getTime() - days * DAY);
  const settings = await getSettings();

  const [
    totalCustomers,
    new7,
    new30,
    txAgg,
    tx30Agg,
    pointsEarned,
    pointsRedeemed,
    activeCount,
    returningCount,
    rewardsIssued,
    rewardsRedeemed,
    branches,
    recentTx,
    topRewardRows,
    staffRows,
  ] = await Promise.all([
    prisma.customer.count({ where: custWhere }),
    prisma.customer.count({ where: { ...custWhere, createdAt: { gte: since(7) } } }),
    prisma.customer.count({ where: { ...custWhere, createdAt: { gte: since(30) } } }),
    prisma.transaction.aggregate({ where: txWhere, _count: true, _sum: { amount: true, pointsEarned: true, discountGiven: true } }),
    prisma.transaction.aggregate({ where: { ...txWhere, createdAt: { gte: since(30) } }, _count: true, _sum: { amount: true } }),
    prisma.pointsLedger.aggregate({ where: { delta: { gt: 0 } }, _sum: { delta: true } }),
    prisma.pointsLedger.aggregate({ where: { delta: { lt: 0 } }, _sum: { delta: true } }),
    prisma.transaction.findMany({
      where: { ...txWhere, createdAt: { gte: since(30) } },
      select: { customerId: true },
      distinct: ["customerId"],
    }),
    prisma.customer.count({ where: { ...custWhere, visitCount: { gt: 1 } } }),
    prisma.customerReward.count(),
    prisma.customerReward.count({ where: { status: "REDEEMED" } }),
    prisma.branch.findMany({ where: { isActive: true }, select: { id: true, name: true, city: true } }),
    prisma.transaction.findMany({
      where: txWhere,
      include: {
        customer: { select: { name: true, mobile: true } },
        branch: { select: { name: true } },
        staff: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.customerReward.groupBy({
      by: ["rewardId"],
      _count: { rewardId: true },
      orderBy: { _count: { rewardId: "desc" } },
      take: 5,
    }),
    prisma.staff.findMany({
      where: all ? {} : { branchId: session.branchId ?? undefined },
      select: { id: true, name: true, username: true, role: true, lastLogin: true, branch: { select: { name: true } } },
      orderBy: { lastLogin: "desc" },
    }),
  ]);

  const perBranch = await prisma.transaction.groupBy({
    by: ["branchId"],
    where: txWhere,
    _count: true,
    _sum: { amount: true, pointsEarned: true },
  });
  const branchMap = new Map(perBranch.map((b) => [b.branchId, b]));

  const branchPerformance = branches
    .filter((b) => all || b.id === session.branchId)
    .map((b) => {
      const row = branchMap.get(b.id);
      return {
        id: b.id,
        name: b.name,
        city: b.city,
        visits: row?._count ?? 0,
        revenue: Number(row?._sum.amount ?? 0),
        points: row?._sum.pointsEarned ?? 0,
      };
    })
    .sort((x, y) => y.revenue - x.revenue);

  const inactive = await prisma.customer.count({
    where: {
      ...custWhere,
      OR: [{ lastVisitAt: { lt: since(60) } }, { lastVisitAt: null, createdAt: { lt: since(60) } }],
    },
  });

  const withBirthday = await prisma.customer.findMany({
    where: { ...custWhere, birthday: { not: null } },
    select: { id: true, name: true, mobile: true, birthday: true },
  });
  const thisMonth = now.getUTCMonth();
  const birthdays = withBirthday
    .filter((c) => c.birthday && new Date(c.birthday).getUTCMonth() === thisMonth)
    .sort((a, b) => new Date(a.birthday!).getUTCDate() - new Date(b.birthday!).getUTCDate())
    .slice(0, 10);

  const rewardNames = await prisma.reward.findMany({
    where: { id: { in: topRewardRows.map((r) => r.rewardId) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(rewardNames.map((r) => [r.id, r.name]));

  const visits = txAgg._count ?? 0;
  const revenue = Number(txAgg._sum.amount ?? 0);

  return NextResponse.json({
    scope: {
      allBranches: all,
      branchId: session.branchId,
      role: session.role,
    },
    currency: settings.currency || "AED",
    kpis: {
      totalCustomers,
      newLast7: new7,
      newLast30: new30,
      totalVisits: visits,
      totalRevenue: revenue,
      avgTransaction: visits ? Math.round(revenue / visits) : 0,
      revenueLast30: Number(tx30Agg._sum.amount ?? 0),
      visitsLast30: tx30Agg._count ?? 0,
      pointsIssued: pointsEarned._sum.delta ?? 0,
      pointsRedeemed: Math.abs(pointsRedeemed._sum.delta ?? 0),
      discountGiven: Number(txAgg._sum.discountGiven ?? 0),
      activeCustomers: activeCount.length,
      returningCustomers: returningCount,
      returnRate: totalCustomers ? Math.round((returningCount / totalCustomers) * 100) : 0,
      inactiveCustomers: inactive,
      rewardsIssued,
      rewardsRedeemed,
    },
    branchPerformance,
    topRewards: topRewardRows.map((r) => ({
      name: nameById.get(r.rewardId) || "Unknown",
      count: r._count.rewardId,
    })),
    birthdays: birthdays.map((c) => ({
      name: c.name,
      mobile: c.mobile,
      day: new Date(c.birthday!).getUTCDate(),
    })),
    recentTransactions: recentTx.map((t) => ({
      id: t.id,
      customer: t.customer.name,
      mobile: t.customer.mobile,
      branch: t.branch.name,
      staff: t.staff?.name ?? "—",
      invoiceNumber: t.invoiceNumber,
      amount: Number(t.amount),
      points: t.pointsEarned,
      discount: Number(t.discountGiven),
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
