import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, scopedCustomerIds } from "@/lib/adminScope";

const PAGE_SIZE = 50;

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
  }
  const { session } = auth;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const filter = searchParams.get("filter") || "all";
  const branchFilter = searchParams.get("branchId");

  const ids = await scopedCustomerIds(prisma, session);
  const andConditions: any[] = [];

  if (ids !== null) {
    andConditions.push({ id: { in: ids } });
  } else if (branchFilter && branchFilter !== "all") {
    andConditions.push({
      OR: [
        { homeBranchId: branchFilter },
        { transactions: { some: { branchId: branchFilter } } },
        { visits: { some: { branchId: branchFilter } } },
      ],
    });
  }

  if (q) {
    const digits = q.replace(/\D/g, "");
    andConditions.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        ...(digits ? [{ mobile: { contains: digits } }] : []),
      ],
    });
  }

  let orderBy: any = { createdAt: "desc" };

  if (filter === "inactive") {
    const cutoff = new Date(Date.now() - 60 * 86400_000);
    andConditions.push({
      OR: [{ lastVisitAt: { lt: cutoff } }, { lastVisitAt: null, createdAt: { lt: cutoff } }],
    });
  } else if (filter === "recent") {
    andConditions.push({ lastVisitAt: { not: null } });
    orderBy = { lastVisitAt: "desc" };
  } else if (filter === "highSpend") {
    orderBy = { totalSpend: "desc" };
  } else if (filter === "highPoints") {
    orderBy = { pointsBalance: "desc" };
  } else if (filter === "birthdays") {
    const currentMonthNum = new Date().getUTCMonth() + 1;
    const bdayCustomerIds: Array<{ id: string }> = await prisma.$queryRaw`
      SELECT id FROM "Customer" WHERE birthday IS NOT NULL AND EXTRACT(MONTH FROM birthday) = ${currentMonthNum}
    `;
    const bdayIds = bdayCustomerIds.map((r) => r.id);
    andConditions.push({ id: { in: bdayIds } });
  }

  const where = andConditions.length > 0 ? { AND: andConditions } : {};

  const [total, rows] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      include: { homeBranch: { select: { id: true, name: true, city: true, code: true } } },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  let customers = rows.map((c) => ({
    id: c.id,
    name: c.name,
    mobile: c.mobile,
    email: c.email,
    pointsBalance: c.pointsBalance,
    points: c.pointsBalance,
    visitCount: c.visitCount,
    visits: c.visitCount,
    totalSpend: Number(c.totalSpend),
    spend: Number(c.totalSpend),
    homeBranch: c.homeBranch,
    branch: c.homeBranch?.name ?? "—",
    birthday: c.birthday,
    lastVisitAt: c.lastVisitAt,
    createdAt: c.createdAt,
    joinedAt: c.createdAt,
    isBlocked: c.isBlocked,
    blocked: c.isBlocked,
  }));

  return NextResponse.json({
    customers,
    total,
    page,
    pageSize: PAGE_SIZE,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}
