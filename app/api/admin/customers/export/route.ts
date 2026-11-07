import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, scopedCustomerIds } from "@/lib/adminScope";

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
  }
  const { session } = auth;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
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

  const customers = await prisma.customer.findMany({
    where,
    include: {
      homeBranch: { select: { name: true, code: true } },
      qrTokens: { take: 1, orderBy: { createdAt: "desc" }, select: { token: true } },
    },
    orderBy,
  });

  const headers = [
    "Customer ID",
    "Full Name",
    "Mobile Number",
    "Email Address",
    "Total Store Visits",
    "Total Spend (AED)",
    "Points Balance",
    "Home Branch",
    "Registration Date",
    "Last Visit Date",
    "Birthday",
    "Account Status",
  ];

  const rows = customers.map((c) => [
    escapeCsv(c.qrTokens[0]?.token || c.id.slice(-8).toUpperCase()),
    escapeCsv(c.name || "Member"),
    escapeCsv(c.mobile || ""),
    escapeCsv(c.email || ""),
    escapeCsv(c.visitCount || 0),
    escapeCsv(Number(c.totalSpend || 0).toFixed(2)),
    escapeCsv(c.pointsBalance || 0),
    escapeCsv(c.homeBranch?.name || "All Branches"),
    escapeCsv(c.createdAt ? new Date(c.createdAt).toISOString().split("T")[0] : ""),
    escapeCsv(c.lastVisitAt ? new Date(c.lastVisitAt).toISOString().split("T")[0] : "Never"),
    escapeCsv(c.birthday ? new Date(c.birthday).toISOString().split("T")[0] : "Not provided"),
    escapeCsv(c.isBlocked ? "Blocked" : "Active"),
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

  const todayStr = new Date().toISOString().split("T")[0];
  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="levante_customers_${todayStr}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
