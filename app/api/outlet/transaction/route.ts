import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pointsForAmount, newlyEligibleRewards, getNumber, getSettings } from "@/lib/loyalty";
import { normalizeCode } from "@/lib/crypto";
import { createNotification } from "@/lib/notifications";
import { cookies } from "next/headers";

const OUTLET_COOKIE = "outlet_branch_code";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const branchCode = cookieStore.get(OUTLET_COOKIE)?.value;

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const {
      customerId,
      branchId: explicitBranchId,
      branchCode: explicitBranchCode,
      invoiceNumber,
      amount,
      redeemRewardId,
      pointsToRedeem: rawPointsToRedeem,
      token: rawToken,
    } = body || {};

    const cleanInvoice = String(invoiceNumber || "").trim();
    const value = Number(amount);
    const pointsToRedeem = Math.max(0, parseInt(String(rawPointsToRedeem || 0), 10) || 0);

    if (!cleanInvoice) {
      return NextResponse.json({ error: "Please enter a valid invoice or bill number." }, { status: 400 });
    }
    if (!Number.isFinite(value) || value <= 0) {
      return NextResponse.json({ error: "Please enter a valid bill amount greater than 0." }, { status: 400 });
    }

    // Resolve branch
    const branchSearchCode = explicitBranchCode || branchCode;
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
      return NextResponse.json({ error: "Active outlet branch not found. Please re-enter outlet code." }, { status: 400 });
    }

    // Resolve customer
    let customer: any = null;
    if (customerId) {
      customer = await prisma.customer.findUnique({ where: { id: customerId } });
    } else if (rawToken) {
      const cleanToken = normalizeCode(rawToken);
      const qr = await prisma.qrToken.findUnique({
        where: { token: cleanToken },
        include: { customer: true },
      });
      if (qr) customer = qr.customer;
    }

    if (!customer) {
      return NextResponse.json({ error: "Customer not found. Please scan or enter customer number first." }, { status: 404 });
    }

    if (customer.isBlocked) {
      return NextResponse.json({ error: "Customer account is blocked." }, { status: 403 });
    }

    // Prevent duplicate invoice at this branch
    const duplicate = await prisma.transaction.findFirst({
      where: {
        branchId: branch.id,
        invoiceNumber: cleanInvoice,
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: `Invoice #${cleanInvoice} has already been recorded at ${branch.name}.` },
        { status: 409 }
      );
    }

    const settings = await getSettings();
    const currency = settings.currency || "AED";
    const pointsRequired = Number(settings.points_required_for_redemption || 100);
    const valuePerRedemption = Number(settings.currency_value_per_redemption_points || 5);
    const pointsEarned = await pointsForAmount(value);
    const expiryDays = (await getNumber("points_expiry_days")) || 0;

    let redeeming: any = null;
    let voucherPointsSpent = 0;
    let voucherDiscount = 0;

    // 1. Voucher Redemption
    if (redeemRewardId) {
      redeeming = await prisma.customerReward.findFirst({
        where: {
          id: redeemRewardId,
          customerId: customer.id,
          status: "AVAILABLE",
        },
        include: { reward: true },
      });

      if (!redeeming) {
        return NextResponse.json({ error: "The selected voucher is no longer available." }, { status: 409 });
      }
      if (redeeming.expiresAt && redeeming.expiresAt < new Date()) {
        return NextResponse.json({ error: "The selected voucher has expired." }, { status: 409 });
      }

      if (redeeming.reward.type === "POINTS") {
        voucherPointsSpent = redeeming.reward.threshold;
      }

      voucherDiscount = redeeming.reward.isPercent
        ? Math.round(value * (Number(redeeming.reward.value) / 100) * 100) / 100
        : Number(redeeming.reward.value);
    }

    // 2. Direct Points Redemption (Point conversion to cash discount)
    let directPointsDiscount = 0;
    if (pointsToRedeem > 0) {
      if (pointsRequired <= 0) {
        return NextResponse.json({ error: "Points redemption is currently disabled in program settings." }, { status: 400 });
      }
      directPointsDiscount = Math.round(((pointsToRedeem / pointsRequired) * valuePerRedemption) * 100) / 100;
    }

    const totalPointsSpent = voucherPointsSpent + pointsToRedeem;
    if (totalPointsSpent > customer.pointsBalance) {
      return NextResponse.json(
        {
          error: `Insufficient points balance. Attempted to redeem ${totalPointsSpent} points, but customer only has ${customer.pointsBalance} points.`,
        },
        { status: 409 }
      );
    }

    const totalDiscountGiven = Math.min(value, voucherDiscount + directPointsDiscount);
    const netPayable = Math.max(0, value - totalDiscountGiven);

    // Execute atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const trx = await tx.transaction.create({
        data: {
          customerId: customer.id,
          branchId: branch.id,
          invoiceNumber: cleanInvoice,
          amount: value,
          pointsEarned,
          discountGiven: totalDiscountGiven,
        },
      });

      // 1. Credit earned points to ledger
      if (pointsEarned > 0) {
        await tx.pointsLedger.create({
          data: {
            customerId: customer.id,
            transactionId: trx.id,
            delta: pointsEarned,
            reason: "purchase",
            note: `Earned on invoice #${cleanInvoice} at ${branch.name}`,
            expiresAt: expiryDays > 0 ? new Date(Date.now() + expiryDays * 86400_000) : null,
          },
        });
      }

      // Record customer visit so it appears in Branch Visitors tab & analytics
      await tx.customerVisit.create({
        data: {
          customerId: customer.id,
          branchId: branch.id,
          couponCode: cleanInvoice,
          pointsEarned,
          checkInMethod: "STAFF_POS",
          note: `Invoice #${cleanInvoice} recorded at ${branch.name}`,
        },
      });

      // 2. If voucher redeemed, mark redeemed & ledger
      if (redeeming) {
        await tx.customerReward.update({
          where: { id: redeeming.id },
          data: {
            status: "REDEEMED",
            redeemedAt: new Date(),
            redeemedTxId: trx.id,
          },
        });

        if (voucherPointsSpent > 0) {
          await tx.pointsLedger.create({
            data: {
              customerId: customer.id,
              transactionId: trx.id,
              delta: -voucherPointsSpent,
              reason: "reward_redemption",
              note: `Voucher '${redeeming.reward.name}' redeemed at ${branch.name}`,
            },
          });
        }
      }

      // 3. If direct points redeemed, debit points & ledger
      if (pointsToRedeem > 0) {
        await tx.pointsLedger.create({
          data: {
            customerId: customer.id,
            transactionId: trx.id,
            delta: -pointsToRedeem,
            reason: "points_redemption",
            note: `Redeemed ${pointsToRedeem} points for ${currency} ${directPointsDiscount.toFixed(2)} discount at ${branch.name}`,
          },
        });
      }

      // 4. Update customer stats
      const netPointsDelta = pointsEarned - totalPointsSpent;
      const updatedCustomer = await tx.customer.update({
        where: { id: customer.id },
        data: {
          pointsBalance: { increment: netPointsDelta },
          visitCount: { increment: 1 },
          totalSpend: { increment: value },
          lastVisitAt: new Date(),
        },
      });

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          action: "outlet.transaction.create",
          entityType: "Transaction",
          entityId: trx.id,
          metadata: {
            customerId: customer.id,
            branchId: branch.id,
            branchName: branch.name,
            branchCode: branch.code,
            invoiceNumber: cleanInvoice,
            grossAmount: value,
            discountGiven: totalDiscountGiven,
            netPayable,
            pointsEarned,
            pointsSpent: totalPointsSpent,
            pointsRedeemedDirect: pointsToRedeem,
            pointsRedeemedDiscount: directPointsDiscount,
            voucherRedeemed: redeeming?.reward?.name || null,
          },
        },
      });

      return { trx, customer: updatedCustomer };
    });

    // Send Admin Notification for Points Earned
    if (pointsEarned > 0) {
      await createNotification({
        type: "POINTS_EARNED",
        title: `+${pointsEarned} Points Earned by ${customer.name || "Customer"}`,
        message: `${customer.name} earned +${pointsEarned} pts on bill of ${currency} ${value.toFixed(2)} (Invoice #${cleanInvoice}) at ${branch.name}.`,
        metadata: {
          customerId: customer.id,
          transactionId: result.trx.id,
          branchName: branch.name,
          invoiceNumber: cleanInvoice,
          pointsEarned,
          amount: value,
          newBalance: result.customer.pointsBalance,
        },
      });
    }

    // Send Admin Notification for Points/Reward Redeemed
    if (totalPointsSpent > 0 || totalDiscountGiven > 0) {
      const redeemedDesc = redeeming?.reward?.name
        ? `Voucher: ${redeeming.reward.name}`
        : `${pointsToRedeem} Points (${currency} ${directPointsDiscount.toFixed(2)})`;
      await createNotification({
        type: "POINTS_REDEEMED",
        title: `Reward / Points Redeemed: ${customer.name || "Customer"}`,
        message: `${customer.name} redeemed ${redeemedDesc} for ${currency} ${totalDiscountGiven.toFixed(2)} discount at ${branch.name}.`,
        metadata: {
          customerId: customer.id,
          transactionId: result.trx.id,
          branchName: branch.name,
          discountGiven: totalDiscountGiven,
          pointsSpent: totalPointsSpent,
          newBalance: result.customer.pointsBalance,
        },
      });
    }

    // Check newly unlocked rewards
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

    // Fetch updated remaining available rewards
    const allAvailable = await prisma.customerReward.findMany({
      where: { customerId: customer.id, status: "AVAILABLE" },
      include: { reward: true },
      orderBy: { issuedAt: "asc" },
    });

    const now = new Date();
    const availableRewards = allAvailable
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
      transaction: {
        id: result.trx.id,
        invoiceNumber: cleanInvoice,
        amount: value,
        grossBill: value,
        discountGiven: totalDiscountGiven,
        netPayable,
        amountPaid: netPayable,
        pointsEarned,
        pointsSpent: totalPointsSpent,
        pointsRedeemed: totalPointsSpent,
        pointsRedeemedDirect: pointsToRedeem,
        pointsRedeemedDiscount: directPointsDiscount,
        branchName: branch.name,
        createdAt: result.trx.createdAt,
      },
      customer: {
        id: result.customer.id,
        name: result.customer.name,
        pointsBalance: result.customer.pointsBalance,
        visitCount: result.customer.visitCount,
      },
      redeemedVoucher: redeeming ? { id: redeeming.id, name: redeeming.reward.name, value: voucherDiscount } : null,
      pointsRedeemed: pointsToRedeem > 0 ? { points: pointsToRedeem, discount: directPointsDiscount } : null,
      newlyIssuedRewards,
      availableRewards,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to record transaction." }, { status: 500 });
  }
}
