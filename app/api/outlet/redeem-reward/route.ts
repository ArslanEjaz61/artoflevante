import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { getOutletSession } from "@/lib/session";
import { formatFullInvoice } from "@/lib/receiptUtils";

export async function POST(req: NextRequest) {
  try {
    const session = await getOutletSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please authenticate your outlet terminal first." },
        { status: 401 }
      );
    }

    const branch = await prisma.branch.findUnique({
      where: { id: session.branchId },
    });

    if (!branch || !branch.isActive) {
      return NextResponse.json(
        { error: "Active outlet branch not found. Please re-authenticate." },
        { status: 401 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const {
      customerId,
      customerRewardId,
      invoiceNumber,
    } = body || {};

    if (!customerId || !customerRewardId) {
      return NextResponse.json({ error: "Customer ID and Reward ID are required." }, { status: 400 });
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
      let updatedVisitCount = customer.visitCount;

      if (custReward.reward.type === "POINTS" && custReward.reward.threshold > 0) {
        // Fetch latest fresh customer record within transaction to prevent race conditions
        const freshCust = await tx.customer.findUnique({ where: { id: customer.id } });
        if (!freshCust || freshCust.pointsBalance < custReward.reward.threshold) {
          throw new Error(`Insufficient points balance. Customer has ${freshCust?.pointsBalance || 0} pts, but ${custReward.reward.threshold} pts are required.`);
        }

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
      } else if (custReward.reward.type === "VISITS") {
        // Milestone reached & gift claimed! Reset visit counter for next cycle
        const thresholdToDeduct =
          custReward.reward.threshold > 0 ? custReward.reward.threshold : customer.visitCount;
        const newVisits = Math.max(0, customer.visitCount - thresholdToDeduct);
        const updatedCust = await tx.customer.update({
          where: { id: customer.id },
          data: { visitCount: newVisits },
        });
        updatedVisitCount = updatedCust.visitCount;
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
            invoiceNumber: invoiceNumber ? formatFullInvoice(String(invoiceNumber).trim(), branch.invoicePrefix || "LV") : null,
          },
        },
      });

      return {
        customerReward: updatedReward,
        pointsBalance: updatedPointsBalance,
        visitCount: updatedVisitCount,
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
        visitCount: result.visitCount,
      },
      availableRewards,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to redeem reward." }, { status: 500 });
  }
}
