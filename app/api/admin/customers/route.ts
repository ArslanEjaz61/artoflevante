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
  const where: any = ids ? { id: { in: ids } } : {};

  if (branchFilter && branchFilter !== "all") {
    where.homeBranchId = branchFilter;
  }

  if (q) {
    const digits = q.replace(/\D/g, "");
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      ...(digits ? [{ mobile: { contains: digits } }] : []),
    ];
  }

  let orderBy: any = { createdAt: "desc" };

  if (filter === "inactive") {
    const cutoff = new Date(Date.now() - 60 * 86400_000);
    where.AND = [
      { OR: [{ lastVisitAt: { lt: cutoff } }, { lastVisitAt: null, createdAt: { lt: cutoff } }] },
    ];
  } else if (filter === "recent") {
    where.lastVisitAt = { not: null };
    orderBy = { lastVisitAt: "desc" };
  } else if (filter === "highSpend") {
    orderBy = { totalSpend: "desc" };
  } else if (filter === "highPoints") {
    orderBy = { pointsBalance: "desc" };
  }

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

  if (filter === "birthdays") {
    const m = new Date().getUTCMonth();
    customers = customers.filter((c) => c.birthday && new Date(c.birthday).getUTCMonth() === m);
  }

  return NextResponse.json({
    customers,
    total,
    page,
    pageSize: PAGE_SIZE,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}
