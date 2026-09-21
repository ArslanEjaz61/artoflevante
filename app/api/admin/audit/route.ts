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
    if (action === "blocked") {
      where = {
        OR: [
          { action: { contains: "blocked" } },
          { action: { contains: "duplicate" } },
          { action: { contains: "fraud" } },
        ],
      };
    } else if (action === "login") {
      where = {
        OR: [
          { action: { contains: "login" } },
          { action: { contains: "register" } },
        ],
      };
    } else if (action.endsWith("*")) {
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

  // Collect referenced customer IDs and branch IDs to resolve human-readable names
  const customerIds = new Set<string>();
  const branchIds = new Set<string>();

  rows.forEach((r) => {
    if (r.entityType?.toLowerCase() === "customer" && r.entityId) {
      customerIds.add(r.entityId);
    }
    if (r.entityType?.toLowerCase() === "branch" && r.entityId) {
      branchIds.add(r.entityId);
    }
    const meta = r.metadata as Record<string, any> | null;
    if (meta && typeof meta === "object") {
      if (meta.customerId) customerIds.add(String(meta.customerId));
      if (meta.branchId) branchIds.add(String(meta.branchId));
      if (meta.homeBranchId) branchIds.add(String(meta.homeBranchId));
    }
  });

  const [customerList, branchList] = await Promise.all([
    customerIds.size > 0
      ? prisma.customer.findMany({
          where: { id: { in: Array.from(customerIds) } },
          select: { id: true, name: true, mobile: true },
        })
      : [],
    prisma.branch.findMany({
      select: { id: true, name: true, city: true, code: true },
    }),
  ]);

  const customerMap = new Map(customerList.map((c) => [c.id, c]));
  const branchMap = new Map(branchList.map((b) => [b.id, b]));

  const mappedLogs = rows.map((a) => {
    const isCustomerAction = a.action.startsWith("customer.");
    const meta = (a.metadata as Record<string, any>) || {};

    let entityName: string | null = null;
    if (a.entityType?.toLowerCase() === "customer" && a.entityId) {
      entityName = customerMap.get(a.entityId)?.name || meta.name || null;
    } else if (a.entityType?.toLowerCase() === "branch" && a.entityId) {
      entityName = branchMap.get(a.entityId)?.name || null;
    }

    // Translate any branchId in metadata to branchName
    const enrichedMeta: Record<string, any> = { ...meta };
    if (enrichedMeta.branchId) {
      const b = branchMap.get(enrichedMeta.branchId);
      if (b) {
        enrichedMeta.branch = b.name;
        delete enrichedMeta.branchId;
      }
    }
    if (enrichedMeta.homeBranchId) {
      const b = branchMap.get(enrichedMeta.homeBranchId);
      if (b) {
        enrichedMeta.homeBranch = b.name;
        delete enrichedMeta.homeBranchId;
      }
    }
    if (enrichedMeta.customerId && customerMap.has(enrichedMeta.customerId)) {
      enrichedMeta.customer = customerMap.get(enrichedMeta.customerId)?.name;
      delete enrichedMeta.customerId;
    }

    // Determine clean actor name
    let staffName = a.staff?.name ?? (a.staff?.username ? `@${a.staff.username}` : null);
    if (isCustomerAction && !a.staff) {
      staffName = entityName || meta.name || (meta.mobile ? `+${meta.mobile}` : "Customer Member");
    } else if (!staffName) {
      staffName = "System Admin";
    }

    return {
      id: a.id,
      action: a.action,
      staff: staffName,
      staffUsername: a.staff?.username ?? null,
      entityType: a.entityType,
      entityId: a.entityId,
      entityName,
      reason: a.reason,
      metadata: enrichedMeta,
      createdAt: a.createdAt,
    };
  });

  return NextResponse.json({
    logs: mappedLogs,
    entries: mappedLogs,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    duplicatesBlocked: blocked,
  });
}

