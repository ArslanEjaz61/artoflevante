import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
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

    const { customerId, customerRewardId, branchId: explicitBranchId, branchCode: explicitBranchCode } = body || {};

    if (!customerId || !customerRewardId) {
      return NextResponse.json({ error: "Customer ID and Reward ID are required." }, { status: 400 });
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

    const custReward = await prisma.customerReward.findFirst({
      where: {
        id: customerRewardId,
        customerId: customer.id,
        status: "AVAILABLE",
      },
      include: {
        reward: true,
      },
    });

    if (!custReward) {
      return NextResponse.json({ error: "Reward offer is either not found, already redeemed, or not available." }, { status: 404 });
    }

    if (custReward.expiresAt && custReward.expiresAt < new Date()) {
      await prisma.customerReward.update({
        where: { id: custReward.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ error: "This reward offer has expired." }, { status: 400 });
    }

    // Redeem reward
    const result = await prisma.$transaction(async (tx) => {
      const updatedReward = await tx.customerReward.update({
        where: { id: custReward.id },
        data: {
          status: "REDEEMED",
          redeemedAt: new Date(),
        },
      });

      // If it is a POINTS redemption reward where points are deducted upon redemption:
      let updatedPointsBalance = customer.pointsBalance;
      if (custReward.reward.type === "POINTS" && custReward.reward.threshold > 0) {
        if (customer.pointsBalance >= custReward.reward.threshold) {
          const updatedCust = await tx.customer.update({
            where: { id: customer.id },
            data: { pointsBalance: { decrement: custReward.reward.threshold } },
          });
          updatedPointsBalance = updatedCust.pointsBalance;

          await tx.pointsLedger.create({
            data: {
              customerId: customer.id,
              delta: -custReward.reward.threshold,
              reason: "reward_redemption",
              note: `Redeemed ${custReward.reward.name} at ${branch.name}`,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          action: "outlet.reward.redeem",
          entityType: "CustomerReward",
          entityId: custReward.id,
          metadata: {
            customerId: customer.id,
            customerName: customer.name,
            rewardName: custReward.reward.name,
            rewardType: custReward.reward.type,
            branchId: branch.id,
            branchName: branch.name,
          },
        },
      });

      return {
        customerReward: updatedReward,
        pointsBalance: updatedPointsBalance,
      };
    });

    // Send Admin Notification for Reward Handover / Redemption
    await createNotification({
      type: "POINTS_REDEEMED",
      title: `Voucher Redeemed: ${customer.name || "Customer"}`,
      message: `${customer.name || "Customer"} successfully redeemed voucher "${custReward.reward.name}" at ${branch.name}.`,
      metadata: {
        customerId: customer.id,
        rewardName: custReward.reward.name,
        rewardType: custReward.reward.type,
        branchName: branch.name,
        newPointsBalance: result.pointsBalance,
      },
    });

    // Fetch updated remaining available rewards
    const remaining = await prisma.customerReward.findMany({
      where: { customerId: customer.id, status: "AVAILABLE" },
      include: { reward: true },
      orderBy: { issuedAt: "asc" },
    });

    const now = new Date();
    const availableRewards = remaining
      .filter((cr: any) => !cr.expiresAt || cr.expiresAt > now)
      .map((cr: any) => ({
        id: cr.id,
        rewardId: cr.rewardId,
        name: cr.reward.name,
        description: cr.reward.description,
        value: Number(cr.reward.value),
        isPercent: cr.reward.isPercent,
        type: cr.reward.type,
        threshold: cr.reward.threshold,
        expiresAt: cr.expiresAt,
      }));

    return NextResponse.json({
      ok: true,
      message: `Successfully redeemed and handed over "${custReward.reward.name}" at ${branch.name}.`,
      redeemedReward: {
        id: custReward.id,
        name: custReward.reward.name,
        description: custReward.reward.description,
        value: Number(custReward.reward.value),
        type: custReward.reward.type,
      },
      customer: {
        id: customer.id,
        name: customer.name,
        pointsBalance: result.pointsBalance,
        visitCount: customer.visitCount,
      },
      availableRewards,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to redeem reward." }, { status: 500 });
  }
}
