import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerId, getStaffSession } from "@/lib/session";
import { getOrRotateBranchDailyCode } from "@/lib/visits";
import { getNumber, getSetting, pointsForAmount, newlyEligibleRewards } from "@/lib/loyalty";

export async function POST(req: NextRequest) {
  // Can be checked in by customer directly or by staff cashier
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
  const cleanInvoice = String(invoiceNumber || "").trim().toUpperCase();
  const rawBill = amount !== undefined && amount !== null && amount !== "" ? amount : billAmount;
  const numAmount = Number(rawBill);

  if (!cleanInvoice) {
    return NextResponse.json({ error: "Please enter the bill invoice number (e.g. INV-1002)." }, { status: 400 });
  }

  if (!Number.isFinite(numAmount) || numAmount <= 0) {
    return NextResponse.json({ error: "Please enter a valid bill payment amount (e.g. 50.00)." }, { status: 400 });
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

    // Check C: DUPLICATE INVOICE NUMBER PREVENTION
    const duplicateInvoice = await prisma.transaction.findFirst({
      where: {
        branchId: matchedBranch.id,
        invoiceNumber: cleanInvoice,
      },
    });

    if (duplicateInvoice) {
      return NextResponse.json({
        error: `Invoice #${cleanInvoice} has already been registered and points issued. Duplicate invoice numbers are not allowed.`,
      }, { status: 409 });
    }

    // 4. Fetch customer
    const customer = await prisma.customer.findUnique({
      where: { id: targetCustomerId },
    });

    if (!customer || customer.isBlocked) {
      return NextResponse.json({ error: "Customer account not found or is blocked." }, { status: 404 });
    }

    // 5. Calculate Points dynamically based on bill amount and loyalty rules
    const pointsEarned = await pointsForAmount(numAmount);
    const currency = (await getSetting("currency")) || "AED";
    const expiryDays = (await getNumber("points_expiry_days")) || 0;

    // 6. Execute atomic database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create Transaction record
      const trx = await tx.transaction.create({
        data: {
          customerId: customer.id,
          branchId: matchedBranch.id,
          staffId: staffSession?.id || null,
          invoiceNumber: cleanInvoice,
          amount: numAmount,
          pointsEarned,
          discountGiven: 0,
        },
      });

      // Create Points Ledger entry
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

      // Create CustomerVisit record
      const visit = await tx.customerVisit.create({
        data: {
          customerId: customer.id,
          branchId: matchedBranch.id,
          couponCode: matchingEntry.dailyCode,
          pointsEarned,
          checkInMethod: staffSession ? "STAFF_POS" : "CUSTOMER_PORTAL",
          note: `Invoice #${cleanInvoice} · Bill: ${currency} ${numAmount.toFixed(2)}`,
        },
      });

      // Increment customer visit count, points balance, and total spend
      const updatedCustomer = await tx.customer.update({
        where: { id: customer.id },
        data: {
          visitCount: { increment: 1 },
          totalSpend: { increment: numAmount },
          pointsBalance: { increment: pointsEarned },
          lastVisitAt: new Date(),
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          staffId: staffSession?.id || null,
          action: "customer.visit_checkin_with_bill",
          entityType: "Transaction",
          entityId: trx.id,
          metadata: {
            customerId: customer.id,
            customerName: customer.name,
            branchId: matchedBranch.id,
            branchName: matchedBranch.name,
            couponCode: matchingEntry.dailyCode,
            invoiceNumber: cleanInvoice,
            amount: numAmount,
            pointsEarned,
            newVisitCount: updatedCustomer.visitCount,
            newPointsBalance: updatedCustomer.pointsBalance,
          },
        },
      });

      return { trx, visit, customer: updatedCustomer };
    });

    // 7. Check for milestone rewards newly unlocked by this visit / points balance
    const held = await prisma.customerReward.findMany({
      where: { customerId: customer.id, status: "AVAILABLE" },
      select: { rewardId: true },
    });

    const unlocked = await newlyEligibleRewards({
      pointsBalance: result.customer.pointsBalance,
      visitCount: result.customer.visitCount,
      alreadyHeldRewardIds: held.map((h) => h.rewardId),
    });

    const issuedRewards: any[] = [];
    for (const r of unlocked) {
      const cr = await prisma.customerReward.create({
        data: {
          customerId: customer.id,
          rewardId: r.id,
          status: "AVAILABLE",
          expiresAt: r.validDays ? new Date(Date.now() + r.validDays * 86400_000) : null,
        },
      });
      issuedRewards.push({ id: cr.id, name: r.name, description: r.description });
    }

    return NextResponse.json({
      ok: true,
      message: `Visit & Bill recorded! You earned +${pointsEarned} points at ${matchedBranch.name}.`,
      branch: {
        id: matchedBranch.id,
        name: matchedBranch.name,
        code: matchedBranch.code,
        city: matchedBranch.city,
      },
      transaction: {
        id: result.trx.id,
        invoiceNumber: cleanInvoice,
        amount: numAmount,
        pointsEarned,
        currency,
      },
      visit: {
        id: result.visit.id,
        couponCode: result.visit.couponCode,
        createdAt: result.visit.createdAt,
      },
      customer: {
        visitCount: result.customer.visitCount,
        pointsBalance: result.customer.pointsBalance,
        totalSpend: Number(result.customer.totalSpend),
      },
      newRewards: issuedRewards,
    });
  } catch (err: any) {
    console.error("POST /api/visits/check-in error:", err);
    return NextResponse.json({ error: err.message || "Failed to check in visit." }, { status: 500 });
  }
}
