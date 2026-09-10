import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminScope";
import { getOrRotateBranchDailyCode, rotateBranchDailyCode } from "@/lib/visits";

// GET: Fetch customer visit records, analytics, and active daily branch coupon codes
export async function GET(req: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error || !session) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  }

  const { searchParams } = new URL(req.url);
  const branchFilter = searchParams.get("branchId");
  const dateRange = searchParams.get("dateRange") || "all";
  const q = searchParams.get("q") || "";

  try {
    // 1. Ensure all active branches have an active 24-hour daily coupon code
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    const branchCodes = await Promise.all(
      branches.map(async (b) => {
        const { dailyCode, dailyCodeExpiresAt } = await getOrRotateBranchDailyCode(b);
        return {
          branchId: b.id,
          branchName: b.name,
          branchCode: b.code,
          city: b.city || "Dubai",
          dailyCode,
          dailyCodeExpiresAt,
        };
      })
    );

    // 2. Build where filter for CustomerVisit
    const where: any = {};

    if (branchFilter && branchFilter !== "all") {
      where.branchId = branchFilter;
    }

    if (dateRange === "today") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      where.createdAt = { gte: startOfToday };
    } else if (dateRange === "7days") {
      const past7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: past7 };
    } else if (dateRange === "30days") {
      const past30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: past30 };
    }

    if (q.trim()) {
      const cleanQ = q.trim().toLowerCase();
      where.OR = [
        { customer: { name: { contains: cleanQ, mode: "insensitive" } } },
        { customer: { mobile: { contains: cleanQ } } },
        { branch: { name: { contains: cleanQ, mode: "insensitive" } } },
        { couponCode: { contains: cleanQ, mode: "insensitive" } },
      ];
    }

    // 3. Fetch visits
    const visits = await prisma.customerVisit.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            mobile: true,
            pointsBalance: true,
            visitCount: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    // 4. Calculate metrics
    const totalVisitsCount = await prisma.customerVisit.count();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayVisits = await prisma.customerVisit.findMany({
      where: { createdAt: { gte: startOfToday } },
      select: { customerId: true, branchId: true },
    });

    const todayCount = todayVisits.length;
    const uniqueCustomersToday = new Set(todayVisits.map((v) => v.customerId)).size;

    // Top visited branch
    const branchVisitCounts = await prisma.customerVisit.groupBy({
      by: ["branchId"],
      _count: { _all: true },
      orderBy: { _count: { branchId: "desc" } },
      take: 1,
    });

    let topBranchName = "None";
    if (branchVisitCounts.length > 0) {
      const topB = branches.find((b) => b.id === branchVisitCounts[0].branchId);
      if (topB) {
        topBranchName = `${topB.name} (${branchVisitCounts[0]._count._all} visits)`;
      }
    }

    return NextResponse.json({
      ok: true,
      visits,
      branchCodes,
      metrics: {
        totalVisits: totalVisitsCount,
        todayVisits: todayCount,
        uniqueCustomersToday,
        topBranchName,
      },
    });
  } catch (err: any) {
    console.error("GET /api/admin/visits error:", err);
    return NextResponse.json({ error: "Failed to load branch visit records." }, { status: 500 });
  }
}

// POST: Rotate / regenerate branch 24-hour daily visit code on demand
export async function POST(req: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error || !session) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const { branchId, action } = body || {};

  if (!branchId) {
    return NextResponse.json({ error: "Branch ID is required." }, { status: 400 });
  }

  try {
    const rotated = await rotateBranchDailyCode(String(branchId));

    await prisma.auditLog.create({
      data: {
        staffId: session.id,
        action: "branch.code_rotate",
        entityType: "branch",
        entityId: branchId,
        metadata: {
          newCode: rotated.dailyCode,
          expiresAt: rotated.dailyCodeExpiresAt,
          branchName: rotated.branch.name,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: `24-Hour Visit Code for '${rotated.branch.name}' refreshed to ${rotated.dailyCode}`,
      branchCode: {
        branchId: rotated.branch.id,
        branchName: rotated.branch.name,
        branchCode: rotated.branch.code,
        dailyCode: rotated.dailyCode,
        dailyCodeExpiresAt: rotated.dailyCodeExpiresAt,
      },
    });
  } catch (err: any) {
    console.error("POST /api/admin/visits error:", err);
    return NextResponse.json({ error: err.message || "Failed to rotate branch coupon code." }, { status: 500 });
  }
}
