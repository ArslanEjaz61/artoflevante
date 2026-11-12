import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerId } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const customerId = await getCustomerId();
    if (!customerId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { customerRewardId } = body || {};

    if (!customerRewardId) {
      return NextResponse.json({ error: "Reward ID is required." }, { status: 400 });
    }

    const cr = await prisma.customerReward.findFirst({
      where: {
        id: customerRewardId,
        customerId,
        status: "AVAILABLE",
      },
      include: { reward: true },
    });

    if (!cr) {
      return NextResponse.json(
        { error: "Reward not found or already redeemed/expired." },
        { status: 404 }
      );
    }

    // Mark as requested/activated for POS cashier redemption
    const updated = await prisma.customerReward.update({
      where: { id: cr.id },
      data: {
        isRedeemRequested: true,
        redeemRequestedAt: new Date(),
      },
      include: { reward: true },
    });

    return NextResponse.json({
      ok: true,
      message: `${updated.reward.name} is now ready! Show your card QR code to the cashier to add to your bill.`,
      reward: {
        id: updated.id,
        name: updated.reward.name,
        isRedeemRequested: updated.isRedeemRequested,
        redeemRequestedAt: updated.redeemRequestedAt,
      },
    });
  } catch (err: any) {
    console.error("POST /api/card/redeem-request error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to activate reward." },
      { status: 500 }
    );
  }
}
