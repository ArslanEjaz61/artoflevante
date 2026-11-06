import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerId, getStaffSession } from "@/lib/session";
import { getOrRotateBranchDailyCode } from "@/lib/visits";
import { getNumber, getSetting, pointsForAmount, newlyEligibleRewards } from "@/lib/loyalty";
import { formatFullInvoice } from "@/lib/receipts";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  // Can be checked in by customer directly (visit stamp only) or by staff cashier (with verified bill)
  const customerIdFromCookie = await getCustomerId();
  const staffSession = await getStaffSession();

  if (!customerIdFromCookie && !staffSession) {
    return NextResponse.json({ error: "Please sign in to check in your visit." }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const { couponCode, customerId, invoiceNumber, amount, billAmount } = body || {};

  if (!couponCode || typeof couponCode !== "string") {
    return NextResponse.json({ error: "Please enter the branch 24h visit coupon code." }, { status: 400 });
  }

  const cleanCode = couponCode.trim().toUpperCase().replace(/\s+/g, "");
  const isCustomerPortal = !staffSession && Boolean(customerIdFromCookie);

  const cleanInvoice = String(invoiceNumber || "").trim().toUpperCase();
  const rawBill = amount !== undefined && amount !== null && amount !== "" ? amount : billAmount;
  const numAmount = Number(rawBill);

  // If staff cashier is checking in a bill on behalf of customer:
  if (!isCustomerPortal) {
    if (!cleanInvoice) {
      return NextResponse.json({ error: "Please enter the bill invoice number (e.g. INV-1002)." }, { status: 400 });
    }
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: "Please enter a valid bill payment amount (e.g. 50.00)." }, { status: 400 });
    }
  }

  // Determine target customer
  let targetCustomerId = customerIdFromCookie;
  if (staffSession && customerId) {
    targetCustomerId = customerId;
  }

  if (!targetCustomerId) {
    return NextResponse.json({ error: "Customer account not specified." }, { status: 400 });
  }

  try {
    // 1. Fetch active branches and ensure their codes are up-to-date
    const activeBranches = await prisma.branch.findMany({
      where: { isActive: true },
    });

    if (activeBranches.length === 0) {
      return NextResponse.json({ error: "No active restaurant branches found." }, { status: 400 });
    }

    // Refresh codes if any expired
    const branchesWithFreshCodes = await Promise.all(
      activeBranches.map((b) => getOrRotateBranchDailyCode(b))
    );

    // 2. Find matching branch for the entered code
    const matchingEntry = branchesWithFreshCodes.find((entry) => {
      const bCode = entry.dailyCode.toUpperCase().replace(/\s+/g, "");
      // Match exact code (e.g. "1015-7K9A" or "10157K9A")
      if (bCode === cleanCode || bCode.replace("-", "") === cleanCode.replace("-", "")) {
        return true;
      }
      // Match suffix (e.g. "7K9A" if entered suffix only)
      const suffix = bCode.split("-")[1];
      if (suffix && suffix === cleanCode) {
        return true;
      }
      return false;
    });

    if (!matchingEntry) {
      return NextResponse.json({
        error: "Invalid or expired branch coupon code. Please verify today's active coupon code with the branch cashier.",
      }, { status: 400 });
    }

    const matchedBranch = matchingEntry.branch;

    // 3. Strict Anti-Abuse Checks:
    // Check A: Has customer already applied/redeemed this specific coupon code before?
    const existingCodeUse = await prisma.customerVisit.findFirst({
      where: {
        customerId: targetCustomerId,
        couponCode: matchingEntry.dailyCode,
      },
    });

    if (existingCodeUse) {
      return NextResponse.json({
        error: "You have already used this coupon code. This daily code cannot be applied again to your account.",
      }, { status: 400 });
    }

    // Check B: Has customer already checked into this branch in the past 24 hours?
    const past24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingRecentVisit = await prisma.customerVisit.findFirst({
      where: {
        customerId: targetCustomerId,
        branchId: matchedBranch.id,
        createdAt: { gte: past24Hours },
      },
    });

    if (existingRecentVisit) {
      return NextResponse.json({
        error: `You have already logged a visit at ${matchedBranch.name} in the past 24 hours. Your visit is already recorded!`,
      }, { status: 400 });
    }

    // Check C: For staff cashier checking in bill, duplicate invoice prevention across ALL branches
    let normalizedBillInvoice = cleanInvoice;
    if (!isCustomerPortal && cleanInvoice) {
      normalizedBillInvoice = formatFullInvoice(cleanInvoice, matchedBranch.invoicePrefix || matchedBranch.code);
      const duplicateInvoice = await prisma.transaction.findFirst({
        where: {
          invoiceNumber: { equals: normalizedBillInvoice, mode: "insensitive" },
        },
        include: { branch: true },
      });

      if (duplicateInvoice) {
        return NextResponse.json({
          error: `Invoice #${normalizedBillInvoice} has already been registered and points issued at ${duplicateInvoice.branch?.name || "an outlet"}. Duplicate invoice numbers are not allowed.`,
        }, { status: 409 });
      }
    }

    // 4. Fetch customer
    const customer = await prisma.customer.findUnique({
      where: { id: targetCustomerId },
    });

    if (!customer || customer.isBlocked) {
      return NextResponse.json({ error: "Customer account not found or is blocked." }, { status: 404 });
    }

    // 5. Calculate Points dynamically based on bill amount and loyalty rules
    // Customer Portal check-in gets 0 spend points (spends require receipt scan or POS till)
    const pointsEarned = isCustomerPortal ? 0 : await pointsForAmount(numAmount);
    const currency = (await getSetting("currency")) || "AED";
    const expiryDays = (await getNumber("points_expiry_days")) || 0;

    // 6. Execute atomic database transaction
    const result = await prisma.$transaction(async (tx) => {
      let trx: any = null;

      // Staff Cashier check-in creates transaction
      if (!isCustomerPortal && cleanInvoice && numAmount > 0) {
        trx = await tx.transaction.create({
          data: {
            customerId: customer.id,
            branchId: matchedBranch.id,
            staffId: staffSession?.id || null,
            invoiceNumber: normalizedBillInvoice,
            amount: numAmount,
            pointsEarned,
            discountGiven: 0,
          },
        });

        if (pointsEarned > 0) {
          await tx.pointsLedger.create({
            data: {
              customerId: customer.id,
              transactionId: trx.id,
              delta: pointsEarned,
              reason: "purchase",
              note: `Visit bill payment at ${matchedBranch.name} (Invoice #${cleanInvoice})`,
              expiresAt: expiryDays > 0 ? new Date(Date.now() + expiryDays * 86400_000) : null,
            },
          });
        }
      }

      // Create CustomerVisit record
      const visit = await tx.customerVisit.create({
        data: {
          customerId: customer.id,
          branchId: matchedBranch.id,
          couponCode: matchingEntry.dailyCode,
          pointsEarned,
          checkInMethod: staffSession ? "STAFF_POS" : "CUSTOMER_PORTAL",
          note: isCustomerPortal
            ? `Daily visit check-in at ${matchedBranch.name}`
            : `Invoice #${cleanInvoice} · Bill: ${currency} ${numAmount.toFixed(2)}`,
        },
      });

      // Increment customer visit count, and spend/points only if staff verified
      const updatedCustomer = await tx.customer.update({
        where: { id: customer.id },
        data: {
          visitCount: { increment: 1 },
          ...(isCustomerPortal
            ? {}
            : {
                totalSpend: { increment: numAmount },
                pointsBalance: { increment: pointsEarned },
              }),
          lastVisitAt: new Date(),
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          staffId: staffSession?.id || null,
          action: isCustomerPortal ? "customer.visit_checkin" : "customer.visit_checkin_with_bill",
          entityType: "CustomerVisit",
          entityId: visit.id,
          metadata: {
            customerId: customer.id,
            customerName: customer.name,
            branchId: matchedBranch.id,
            branchName: matchedBranch.name,
            couponCode: matchingEntry.dailyCode,
            invoiceNumber: isCustomerPortal ? null : cleanInvoice,
            amount: isCustomerPortal ? 0 : numAmount,
            pointsEarned,
            newVisitCount: updatedCustomer.visitCount,
            newPointsBalance: updatedCustomer.pointsBalance,
          },
        },
      });

      return { trx, visit, customer: updatedCustomer };
    });

    // Send Admin Notification for Visit Check-in
    await createNotification({
      type: "VISIT_CHECKIN",
      title: `Visit Check-In: ${customer.name || "Customer"}`,
      message: isCustomerPortal
        ? `${customer.name || "Customer"} checked in at ${matchedBranch.name} (Daily Code: ${matchingEntry.dailyCode}).`
        : `${customer.name || "Customer"} checked in at ${matchedBranch.name} (Code: ${matchingEntry.dailyCode}, Bill: AED ${numAmount.toFixed(2)}, Earned: +${pointsEarned} pts).`,
      metadata: {
        customerId: customer.id,
        branchName: matchedBranch.name,
        couponCode: matchingEntry.dailyCode,
        invoiceNumber: isCustomerPortal ? null : cleanInvoice,
        pointsEarned,
        amount: isCustomerPortal ? 0 : numAmount,
      },
    });

    // 7. Check for milestone rewards newly unlocked by this visit
    const held = await prisma.customerReward.findMany({
      where: { customerId: customer.id, status: "AVAILABLE" },
      select: { rewardId: true },
    });

    const unlocked = await newlyEligibleRewards({
      pointsBalance: result.customer.pointsBalance,
      visitCount: result.customer.visitCount,
      alreadyHeldRewardIds: held.map((h) => h.rewardId),
    });

    for (const reward of unlocked) {
      await prisma.customerReward.create({
        data: {
          customerId: customer.id,
          rewardId: reward.id,
          status: "AVAILABLE",
        },
      });

      await createNotification({
        type: "PROMOTION_CREATED",
        title: `Reward Unlocked: ${reward.name}`,
        message: `${customer.name || "A member"} unlocked "${reward.name}" through their visit check-in!`,
        metadata: { customerId: customer.id, rewardId: reward.id },
      });
    }

    return NextResponse.json({
      ok: true,
      message: isCustomerPortal
        ? `Visit recorded at ${matchedBranch.name}! Your visit stamp is updated. To earn points for your dining bill, scan your receipt below or show your Membership QR to the cashier!`
        : `Visit and bill recorded successfully! Points earned: +${pointsEarned} pts.`,
      visit: result.visit,
      transaction: result.trx,
      customer: {
        visitCount: result.customer.visitCount,
        pointsBalance: result.customer.pointsBalance,
      },
      unlockedRewards: unlocked,
    });
  } catch (err: any) {
    console.error("POST /api/visits/check-in error:", err);
    return NextResponse.json({ error: err?.message || "Failed to process visit check-in." }, { status: 500 });
  }
}
