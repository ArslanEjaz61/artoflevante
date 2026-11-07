import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerId } from "@/lib/session";
import { getNumber, getSetting, pointsForAmount, newlyEligibleRewards } from "@/lib/loyalty";
import { createNotification } from "@/lib/notifications";
import { verifyReceiptClaim, findExistingInvoice, formatFullInvoice, extractSerialFromInvoice } from "@/lib/receipts";

/**
 * Step 2 of receipt scanning: the customer confirmed what /api/receipts/scan read, so record the
 * bill and add the points. Invoice and total come from the signed token, not from the request.
 */
export async function POST(req: NextRequest) {
  const customerId = await getCustomerId();
  if (!customerId) {
    return NextResponse.json({ error: "Please sign in to claim your points." }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const claim = await verifyReceiptClaim(String(body?.claimToken || ""));
  if (!claim || claim.customerId !== customerId) {
    return NextResponse.json({ error: "This scan has expired. Please scan the receipt again." }, { status: 400 });
  }

  try {
    const branchId = claim.branchId || String(body?.branchId || "");
    const branch = branchId ? await prisma.branch.findUnique({ where: { id: branchId } }) : null;
    if (!branch || !branch.isActive) {
      return NextResponse.json({ error: "Please choose the outlet where you dined." }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || customer.isBlocked) {
      return NextResponse.json({ error: "Customer account not found or is blocked." }, { status: 404 });
    }

    const MIN_RECEIPT_DATE = "2026-11-01";
    if (claim.receiptDate && claim.receiptDate < MIN_RECEIPT_DATE) {
      return NextResponse.json(
        { error: `This receipt is dated ${claim.receiptDate}. Receipts dated before November 1, 2026 are not eligible for points.` },
        { status: 400 }
      );
    }

    const branchPrefix = branch.invoicePrefix || "LV";
    const fullInvoice = formatFullInvoice(claim.invoiceNumber, branchPrefix, claim.receiptDate || undefined);
    const serial = extractSerialFromInvoice(claim.invoiceNumber);

    const samePhoto = await prisma.auditLog.findFirst({
      where: { action: "customer.receipt_claim", metadata: { path: ["imageSha"], equals: claim.imageSha } },
    });
    if (samePhoto) {
      return NextResponse.json({
        error: "This receipt photo has already been used to earn points.",
      }, { status: 409 });
    }

    // Comprehensive duplicate check: matches cashier POS bills, claims, and all serial variations
    const existing = await findExistingInvoice(claim.invoiceNumber, branchPrefix, claim.receiptDate || undefined);
    if (existing) {
      return NextResponse.json({
        error: `Bill #${serial} (${existing.invoiceNumber}) has already been registered and points awarded at ${existing.location}${existing.date ? ` on ${existing.date}` : ""}. Duplicate claims are not permitted.`,
      }, { status: 409 });
    }

    const dailyLimit = (await getNumber("receipt_daily_limit")) || 3;
    const claimedToday = await prisma.customerVisit.count({
      where: { customerId, checkInMethod: "RECEIPT_SCAN", createdAt: { gte: new Date(Date.now() - 86400_000) } },
    });
    if (claimedToday >= dailyLimit) {
      return NextResponse.json(
        { error: `You can claim up to ${dailyLimit} receipts in 24 hours. Please try again later.` },
        { status: 429 }
      );
    }

    const currency = (await getSetting("currency")) || "AED";
    const pointsEarned = await pointsForAmount(claim.total);
    const expiryDays = (await getNumber("points_expiry_days")) || 0;

    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
        const trx = await tx.transaction.create({
          data: {
            customerId,
            branchId: branch.id,
            staffId: null,
            invoiceNumber: fullInvoice,
            amount: claim.total,
            pointsEarned,
            discountGiven: 0,
          },
        });

        if (pointsEarned > 0) {
          await tx.pointsLedger.create({
            data: {
              customerId,
              transactionId: trx.id,
              delta: pointsEarned,
              reason: "purchase",
              note: `Scanned receipt at ${branch.name} (Invoice #${claim.invoiceNumber})`,
              expiresAt: expiryDays > 0 ? new Date(Date.now() + expiryDays * 86400_000) : null,
            },
          });
        }

        const visit = await tx.customerVisit.create({
          data: {
            customerId,
            branchId: branch.id,
            couponCode: claim.invoiceNumber,
            pointsEarned,
            checkInMethod: "RECEIPT_SCAN",
            note: `Receipt scan · Invoice #${claim.invoiceNumber} · Bill: ${currency} ${claim.total.toFixed(2)}`,
          },
        });

        const updatedCustomer = await tx.customer.update({
          where: { id: customerId },
          data: {
            visitCount: { increment: 1 },
            totalSpend: { increment: claim.total },
            pointsBalance: { increment: pointsEarned },
            lastVisitAt: new Date(),
          },
        });

        await tx.auditLog.create({
          data: {
            action: "customer.receipt_claim",
            entityType: "Transaction",
            entityId: trx.id,
            metadata: {
              customerId,
              customerName: customer.name,
              branchId: branch.id,
              branchName: branch.name,
              invoiceNumber: claim.invoiceNumber,
              amount: claim.total,
              receiptDate: claim.receiptDate,
              outletText: claim.outletText,
              branchChosenByCustomer: !claim.branchId,
              imageSha: claim.imageSha,
              imageFile: `storage/receipts/${claim.imageSha}.jpg`,
              pointsEarned,
              newPointsBalance: updatedCustomer.pointsBalance,
            },
          },
        });

        return { trx, visit, customer: updatedCustomer };
      });
    } catch (err: any) {
      // the unique (branchId, invoiceNumber) index caught a race with another claim
      if (err?.code === "P2002") {
        return NextResponse.json({ error: `Invoice #${claim.invoiceNumber} has already been used to earn points.` }, { status: 409 });
      }
      throw err;
    }

    await createNotification({
      type: "POINTS_EARNED",
      title: `+${pointsEarned} Pts & +1 Visit: ${customer.name || "Customer"}`,
      message: `${customer.name || "Customer"} scanned receipt #${claim.invoiceNumber} (${currency} ${claim.total.toFixed(2)}) at ${branch.name}. Earned +${pointsEarned} pts and +1 visit stamp.`,
      metadata: {
        customerId,
        transactionId: result.trx.id,
        branchName: branch.name,
        invoiceNumber: claim.invoiceNumber,
        pointsEarned,
        amount: claim.total,
        newBalance: result.customer.pointsBalance,
        newVisitCount: result.customer.visitCount,
        source: "receipt_scan",
      },
    });

    await createNotification({
      type: "VISIT_CHECKIN",
      title: `Visit Check-In: ${customer.name || "Customer"}`,
      message: `${customer.name || "Customer"} checked in via scanned receipt at ${branch.name} (Invoice #${claim.invoiceNumber}, ${currency} ${claim.total.toFixed(2)}).`,
      metadata: {
        customerId,
        branchName: branch.name,
        invoiceNumber: claim.invoiceNumber,
        pointsEarned,
        amount: claim.total,
        visitCount: result.customer.visitCount,
      },
    });

    const held = await prisma.customerReward.findMany({
      where: { customerId, status: "AVAILABLE" },
      select: { rewardId: true },
    });
    const unlocked = await newlyEligibleRewards({
      customerId,
      pointsBalance: result.customer.pointsBalance,
      visitCount: result.customer.visitCount,
      alreadyHeldRewardIds: held.map((h) => h.rewardId),
    });
    const newRewards: { id: string; name: string; description: string | null }[] = [];
    for (const r of unlocked) {
      const cr = await prisma.customerReward.create({
        data: {
          customerId,
          rewardId: r.id,
          status: "AVAILABLE",
          expiresAt: r.validDays ? new Date(Date.now() + r.validDays * 86400_000) : null,
        },
      });
      newRewards.push({ id: cr.id, name: r.name, description: r.description });

      await createNotification({
        type: "PROMOTION_CREATED",
        title: `Reward Unlocked: ${r.name}`,
        message: `${customer.name || "A member"} unlocked "${r.name}" through their receipt visit & points!`,
        metadata: { customerId, rewardId: r.id },
      });
    }

    return NextResponse.json({
      ok: true,
      message: `+${pointsEarned} points and +1 visit stamp added from invoice #${claim.invoiceNumber} at ${branch.name}.`,
      transaction: {
        id: result.trx.id,
        invoiceNumber: claim.invoiceNumber,
        amount: claim.total,
        pointsEarned,
        currency,
        branchName: branch.name,
      },
      customer: {
        pointsBalance: result.customer.pointsBalance,
        visitCount: result.customer.visitCount,
      },
      newRewards,
    });
  } catch (err: any) {
    console.error("POST /api/receipts/claim error:", err);
    return NextResponse.json({ error: "Could not add the points. Please try again." }, { status: 500 });
  }
}
