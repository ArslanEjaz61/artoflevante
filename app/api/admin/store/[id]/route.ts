import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminScope";
import { getOrRotateBranchDailyCode } from "@/lib/visits";
import { getSettings } from "@/lib/loyalty";

const DAY = 86400_000;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, status, session } = await requireAdmin();
  if (error || !session) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Branch ID or Code is required." }, { status: 400 });
  }

  try {
    // Find branch by ID or Code
    const branch = await prisma.branch.findFirst({
      where: {
        OR: [
          { id: id },
          { code: id },
          { code: { equals: id, mode: "insensitive" } },
        ],
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            isActive: true,
            lastLogin: true,
          },
          orderBy: { lastLogin: "desc" },
        },
        offers: {
          include: {
            offer: true,
          },
        },
      },
    });

    if (!branch) {
      return NextResponse.json({ error: "Store not found." }, { status: 404 });
    }

    // Refresh/rotate daily 24h code if needed
    let dailyCode = branch.dailyCode;
    let dailyCodeExpiresAt = branch.dailyCodeExpiresAt?.toISOString() || null;
    try {
      const codeInfo = await getOrRotateBranchDailyCode(branch);
      dailyCode = codeInfo.dailyCode;
      dailyCodeExpiresAt = codeInfo.dailyCodeExpiresAt.toISOString();
    } catch {}

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const past7Start = new Date(now.getTime() - 7 * DAY);
    const past30Start = new Date(now.getTime() - 30 * DAY);

    // Queries for store metrics
    const [
      allTxAgg,
      todayTxAgg,
      past7TxAgg,
      past30TxAgg,
      totalVisitsCount,
      todayVisitsCount,
      recentTx,
      recentVisits,
      registeredCustomersCount,
      storeCustomers,
      settings,
    ] = await Promise.all([
      // 1. All-time transactions aggregate
      prisma.transaction.aggregate({
        where: { branchId: branch.id, isReversed: false },
        _count: true,
        _sum: { amount: true, pointsEarned: true, discountGiven: true },
      }),
      // 2. Today's transactions
      prisma.transaction.aggregate({
        where: { branchId: branch.id, isReversed: false, createdAt: { gte: todayStart } },
        _count: true,
        _sum: { amount: true, pointsEarned: true, discountGiven: true },
      }),
      // 3. Past 7 days transactions
      prisma.transaction.aggregate({
        where: { branchId: branch.id, isReversed: false, createdAt: { gte: past7Start } },
        _count: true,
        _sum: { amount: true, pointsEarned: true },
      }),
      // 4. Past 30 days transactions
      prisma.transaction.aggregate({
        where: { branchId: branch.id, isReversed: false, createdAt: { gte: past30Start } },
        _count: true,
        _sum: { amount: true, pointsEarned: true },
      }),
      // 5. Total check-in visits count
      prisma.customerVisit.count({
        where: { branchId: branch.id },
      }),
      // 6. Today's check-in visits
      prisma.customerVisit.count({
        where: { branchId: branch.id, createdAt: { gte: todayStart } },
      }),
      // 7. Recent Transactions (last 50)
      prisma.transaction.findMany({
        where: { branchId: branch.id, isReversed: false },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              mobile: true,
              pointsBalance: true,
              visitCount: true,
              totalSpend: true,
            },
          },
          staff: { select: { id: true, name: true, username: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      // 8. Recent Visits check-ins (last 30)
      prisma.customerVisit.findMany({
        where: { branchId: branch.id },
        include: {
          customer: {
            select: { id: true, name: true, mobile: true, pointsBalance: true, visitCount: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      // 9. Registered home customers count
      prisma.customer.count({
        where: {
          OR: [
            { homeBranchId: branch.id },
            { transactions: { some: { branchId: branch.id } } },
            { visits: { some: { branchId: branch.id } } },
          ],
        },
      }),
      // 10. Store Customers List (top 60 by spend / recent)
      prisma.customer.findMany({
        where: {
          OR: [
            { homeBranchId: branch.id },
            { transactions: { some: { branchId: branch.id } } },
            { visits: { some: { branchId: branch.id } } },
          ],
        },
        select: {
          id: true,
          name: true,
          mobile: true,
          email: true,
          pointsBalance: true,
          visitCount: true,
          totalSpend: true,
          lastVisitAt: true,
          createdAt: true,
          birthday: true,
        },
        orderBy: { lastVisitAt: "desc" },
        take: 60,
      }),
      // 11. System settings for currency
      getSettings(),
    ]);

    // Calculate metrics
    const totalVisits = (allTxAgg._count || 0) + totalVisitsCount;
    const totalRevenue = Number(allTxAgg._sum.amount || 0);
    const totalPointsEarned = allTxAgg._sum.pointsEarned || 0;
    const totalDiscounts = Number(allTxAgg._sum.discountGiven || 0);
    const avgBill = allTxAgg._count > 0 ? Math.round(totalRevenue / allTxAgg._count) : 0;

    const todayVisits = (todayTxAgg._count || 0) + todayVisitsCount;
    const todayRevenue = Number(todayTxAgg._sum.amount || 0);
    const todayPoints = todayTxAgg._sum.pointsEarned || 0;

    // Upcoming birthdays this month for this store's customers
    const thisMonth = now.getUTCMonth();
    const birthdays = storeCustomers
      .filter((c) => c.birthday && new Date(c.birthday).getUTCMonth() === thisMonth)
      .sort((a, b) => new Date(a.birthday!).getUTCDate() - new Date(b.birthday!).getUTCDate());

    return NextResponse.json({
      ok: true,
      currency: settings.currency || "AED",
      store: {
        id: branch.id,
        code: branch.code,
        name: branch.name,
        nameAr: branch.nameAr,
        city: branch.city || "Dubai",
        address: branch.address,
        addressAr: branch.addressAr,
        phone: branch.phone,
        hours: branch.hours || "10:00 AM – 11:00 PM",
        isActive: branch.isActive,
        dailyCode,
        dailyCodeExpiresAt,
        createdAt: branch.createdAt,
      },
      metrics: {
        totalRevenue,
        totalVisits,
        totalTransactions: allTxAgg._count || 0,
        totalPointsEarned,
        totalDiscounts,
        avgBill,
        registeredCustomers: registeredCustomersCount,
        // Today
        todayRevenue,
        todayVisits,
        todayTransactions: todayTxAgg._count || 0,
        todayPoints,
        // 7 Days
        past7Revenue: Number(past7TxAgg._sum.amount || 0),
        past7Transactions: past7TxAgg._count || 0,
        // 30 Days
        past30Revenue: Number(past30TxAgg._sum.amount || 0),
        past30Transactions: past30TxAgg._count || 0,
      },
      staff: branch.staff,
      offers: branch.offers.map((o) => o.offer),
      customers: storeCustomers,
      transactions: recentTx.map((t) => ({
        id: t.id,
        invoiceNumber: t.invoiceNumber,
        amount: Number(t.amount),
        pointsEarned: t.pointsEarned,
        discountGiven: Number(t.discountGiven),
        customerName: t.customer?.name || "Walk-in Member",
        customerMobile: t.customer?.mobile || "—",
        customerId: t.customer?.id,
        staffName: t.staff?.name || t.staff?.username || "POS Cashier",
        createdAt: t.createdAt,
      })),
      visits: recentVisits.map((v) => ({
        id: v.id,
        customerName: v.customer?.name || "Member",
        customerMobile: v.customer?.mobile || "—",
        customerId: v.customer?.id,
        source: v.checkInMethod,
        createdAt: v.createdAt,
      })),
      birthdays: birthdays.map((c) => ({
        id: c.id,
        name: c.name,
        mobile: c.mobile,
        day: new Date(c.birthday!).getUTCDate(),
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load store CRM data." }, { status: 500 });
  }
}
