import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerId, getStaffSession } from "@/lib/session";
import { getOrRotateBranchDailyCode } from "@/lib/visits";
import { getSetting } from "@/lib/loyalty";

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

  const { couponCode, customerId } = body || {};

  if (!couponCode || typeof couponCode !== "string") {
    return NextResponse.json({ error: "Please enter a valid branch visit coupon code." }, { status: 400 });
  }

  const cleanCode = couponCode.trim().toUpperCase().replace(/\s+/g, "");

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
        error: "Invalid or expired branch coupon code. Please ask the restaurant counter for today's active visit code.",
      }, { status: 400 });
    }

    const matchedBranch = matchingEntry.branch;

    // 3. Strict anti-abuse checks:
    // Check A: Has customer already applied/redeemed this specific coupon code before?
    const existingCodeUse = await prisma.customerVisit.findFirst({
      where: {
        customerId: targetCustomerId,
        couponCode: matchingEntry.dailyCode,
      },
    });

    if (existingCodeUse) {
      return NextResponse.json({
        error: "You have already used this coupon code. This coupon cannot be applied again to your account.",
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
        error: `You have already checked into ${matchedBranch.name} in the past 24 hours. Your visit is already logged!`,
      }, { status: 400 });
    }

    // 4. Fetch customer
    const customer = await prisma.customer.findUnique({
      where: { id: targetCustomerId },
    });

    if (!customer || customer.isBlocked) {
      return NextResponse.json({ error: "Customer account not found or is blocked." }, { status: 404 });
    }

    // Check if visit bonus points are configured
    const bonusSetting = await getSetting("visit_bonus_points");
    const bonusPoints = bonusSetting ? parseInt(bonusSetting, 10) : 0;
    const finalBonus = !isNaN(bonusPoints) && bonusPoints > 0 ? bonusPoints : 0;

    // 5. Create CustomerVisit record
    const visit = await prisma.customerVisit.create({
      data: {
        customerId: customer.id,
        branchId: matchedBranch.id,
        couponCode: matchingEntry.dailyCode,
        pointsEarned: finalBonus,
        checkInMethod: staffSession ? "STAFF_POS" : "CUSTOMER_PORTAL",
      },
    });

    // 6. Update customer visitCount and lastVisitAt
    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        visitCount: { increment: 1 },
        lastVisitAt: new Date(),
        pointsBalance: finalBonus > 0 ? { increment: finalBonus } : undefined,
      },
    });

    // 7. If points earned, log in points ledger
    if (finalBonus > 0) {
      await prisma.pointsLedger.create({
        data: {
          customerId: customer.id,
          delta: finalBonus,
          reason: "visit",
          note: `Daily visit check-in bonus at ${matchedBranch.name}`,
        },
      });
    }

    // 8. Create audit log
    await prisma.auditLog.create({
      data: {
        staffId: staffSession?.id || null,
        action: "customer.visit_checkin",
        entityType: "customer_visit",
        entityId: visit.id,
        metadata: {
          customerId: customer.id,
          customerName: customer.name,
          branchId: matchedBranch.id,
          branchName: matchedBranch.name,
          couponCode: matchingEntry.dailyCode,
          newVisitCount: updatedCustomer.visitCount,
          pointsEarned: finalBonus,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Welcome to ${matchedBranch.name}! Your visit has been successfully recorded.`,
      branch: {
        id: matchedBranch.id,
        name: matchedBranch.name,
        nameAr: matchedBranch.nameAr,
        code: matchedBranch.code,
        city: matchedBranch.city,
      },
      visit: {
        id: visit.id,
        couponCode: visit.couponCode,
        createdAt: visit.createdAt,
        pointsEarned: finalBonus,
      },
      customer: {
        visitCount: updatedCustomer.visitCount,
        pointsBalance: updatedCustomer.pointsBalance,
      },
    });
  } catch (err: any) {
    console.error("POST /api/visits/check-in error:", err);
    return NextResponse.json({ error: err.message || "Failed to check in visit." }, { status: 500 });
  }
}
