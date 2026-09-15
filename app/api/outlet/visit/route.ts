import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { newlyEligibleRewards, getNumber, getSettings } from "@/lib/loyalty";
import { cookies } from "next/headers";

const OUTLET_COOKIE = "outlet_branch_code";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const branchCodeCookie = cookieStore.get(OUTLET_COOKIE)?.value;

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const { customerId, branchId: explicitBranchId, branchCode: explicitBranchCode } = body || {};

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required." }, { status: 400 });
    }

    // Resolve branch
    const branchSearchCode = explicitBranchCode || branchCodeCookie;
    let branch: any = null;

    if (explicitBranchId) {
      branch = await prisma.branch.findUnique({ where: { id: explicitBranchId } });
    } else if (branchSearchCode) {
      branch = await prisma.branch.findFirst({
        where: {
          OR: [
            { code: { equals: branchSearchCode, mode: "insensitive" } },
            { id: branchSearchCode },
          ],
        },
      });
    }

    if (!branch || !branch.isActive) {
      return NextResponse.json({ error: "Active outlet branch not found." }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    if (customer.isBlocked) {
      return NextResponse.json({ error: "Customer account is blocked." }, { status: 403 });
    }

    const settings = await getSettings();
    const visitPoints = Number(settings.visit_checkin_points || 0);

    // Atomic transaction: Create visit record & increment visit count
    const result = await prisma.$transaction(async (tx) => {
      const visit = await tx.customerVisit.create({
        data: {
          customerId: customer.id,
          branchId: branch.id,
          couponCode: branch.dailyCode || "OUTLET_POS",
          pointsEarned: visitPoints,
          checkInMethod: "STAFF_POS",
          note: `Outlet visit recorded at ${branch.name}`,
        },
      });

      if (visitPoints > 0) {
        await tx.pointsLedger.create({
          data: {
            customerId: customer.id,
            delta: visitPoints,
            reason: "visit",
            note: `Visit check-in points at ${branch.name}`,
          },
        });
      }

      const updatedCustomer = await tx.customer.update({
        where: { id: customer.id },
        data: {
          visitCount: { increment: 1 },
          pointsBalance: { increment: visitPoints },
          lastVisitAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          action: "outlet.visit.record",
          entityType: "CustomerVisit",
          entityId: visit.id,
          metadata: {
            customerId: customer.id,
            customerName: customer.name,
            branchId: branch.id,
            branchName: branch.name,
            pointsEarned: visitPoints,
            newVisitCount: updatedCustomer.visitCount,
          },
        },
      });

      return { visit, customer: updatedCustomer };
    });

    // Check newly unlocked rewards based on new visit count & points
    const held = await prisma.customerReward.findMany({
      where: { customerId: customer.id, status: "AVAILABLE" },
      select: { rewardId: true },
    });

    const unlocked = await newlyEligibleRewards({
      pointsBalance: result.customer.pointsBalance,
      visitCount: result.customer.visitCount,
      alreadyHeldRewardIds: held.map((h) => h.rewardId),
    });

    const newlyIssuedRewards: any[] = [];
    for (const r of unlocked) {
      const cr = await prisma.customerReward.create({
        data: {
          customerId: customer.id,
          rewardId: r.id,
          status: "AVAILABLE",
          expiresAt: r.validDays ? new Date(Date.now() + r.validDays * 86400_000) : null,
        },
      });
      newlyIssuedRewards.push({
        id: cr.id,
        name: r.name,
        description: r.description,
      });
    }

    return NextResponse.json({
      ok: true,
      message: `Visit successfully recorded at ${branch.name}.`,
      visit: result.visit,
      customer: {
        id: result.customer.id,
        name: result.customer.name,
        pointsBalance: result.customer.pointsBalance,
        visitCount: result.customer.visitCount,
      },
      pointsEarned: visitPoints,
      newlyIssuedRewards,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to record visit." }, { status: 500 });
  }
}
