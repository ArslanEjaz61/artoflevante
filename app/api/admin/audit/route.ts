import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminScope";

const PAGE_SIZE = 50;

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const action = searchParams.get("action") || "";

  let where: any = {};
  if (action && action !== "all") {
    if (action.endsWith("*")) {
      where = { action: { startsWith: action.replace("*", "") } };
    } else {
      where = { action: { contains: action } };
    }
  }

  const [total, rows, blocked] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: { staff: { select: { name: true, username: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where: { action: "transaction.duplicate_blocked" } }),
  ]);

  const mappedLogs = rows.map((a) => ({
    id: a.id,
    action: a.action,
    staff: a.staff?.name ?? (a.staff?.username ? `@${a.staff.username}` : "System Admin"),
    staffUsername: a.staff?.username ?? null,
    entityType: a.entityType,
    entityId: a.entityId,
    reason: a.reason,
    metadata: a.metadata,
    createdAt: a.createdAt,
  }));

  return NextResponse.json({
    logs: mappedLogs,
    entries: mappedLogs,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    duplicatesBlocked: blocked,
  });
}

