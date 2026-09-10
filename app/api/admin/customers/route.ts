import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, scopedCustomerIds } from "@/lib/adminScope";

const PAGE_SIZE = 25;

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

  const ids = await scopedCustomerIds(prisma, session);
  const where: any = ids ? { id: { in: ids } } : {};

  if (q) {
    const digits = q.replace(/\D/g, "");
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      ...(digits ? [{ mobile: { contains: digits } }] : []),
    ];
  }

  if (filter === "inactive") {
    const cutoff = new Date(Date.now() - 60 * 86400_000);
    where.AND = [
      { OR: [{ lastVisitAt: { lt: cutoff } }, { lastVisitAt: null, createdAt: { lt: cutoff } }] },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      include: { homeBranch: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  let customers = rows.map((c) => ({
    id: c.id,
    name: c.name,
    mobile: c.mobile,
    email: c.email,
    branch: c.homeBranch?.name ?? "—",
    points: c.pointsBalance,
    visits: c.visitCount,
    spend: Number(c.totalSpend),
    birthday: c.birthday,
    lastVisitAt: c.lastVisitAt,
    joinedAt: c.createdAt,
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
