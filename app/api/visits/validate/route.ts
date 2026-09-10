import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerId, getStaffSession } from "@/lib/session";
import { getOrRotateBranchDailyCode } from "@/lib/visits";

export async function POST(req: NextRequest) {
  const customerIdFromCookie = await getCustomerId();
  const staffSession = await getStaffSession();

  if (!customerIdFromCookie && !staffSession) {
    return NextResponse.json({ error: "Please sign in to verify your coupon." }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const { couponCode, customerId } = body || {};

  if (!couponCode || typeof couponCode !== "string" || !couponCode.trim()) {
    return NextResponse.json({ error: "Please enter a valid branch visit coupon code." }, { status: 400 });
  }

  const cleanCode = couponCode.trim().toUpperCase().replace(/\s+/g, "");

  let targetCustomerId = customerIdFromCookie;
  if (staffSession && customerId) {
    targetCustomerId = customerId;
  }

  if (!targetCustomerId) {
    return NextResponse.json({ error: "Customer account not identified." }, { status: 400 });
  }

  try {
    // 1. Fetch active branches and ensure daily codes are up-to-date
    const activeBranches = await prisma.branch.findMany({
      where: { isActive: true },
    });

    if (activeBranches.length === 0) {
      return NextResponse.json({ error: "No active restaurant branches found." }, { status: 400 });
    }

    const branchesWithFreshCodes = await Promise.all(
      activeBranches.map((b) => getOrRotateBranchDailyCode(b))
    );

    // 2. Find matching branch for the entered code
    const matchingEntry = branchesWithFreshCodes.find((entry) => {
      const bCode = entry.dailyCode.toUpperCase().replace(/\s+/g, "");
      if (bCode === cleanCode || bCode.replace("-", "") === cleanCode.replace("-", "")) {
        return true;
      }
      const suffix = bCode.split("-")[1];
      if (suffix && suffix === cleanCode) {
        return true;
      }
      return false;
    });

    if (!matchingEntry) {
      return NextResponse.json({
        error: "Invalid or expired branch coupon code. Please verify today's 24H code with the restaurant cashier.",
      }, { status: 400 });
    }

    const matchedBranch = matchingEntry.branch;

    // 3. Strict Anti-Abuse Checks
    // Check A: Has customer already applied/redeemed this specific coupon code?
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
        error: `You have already recorded a visit at ${matchedBranch.name} in the past 24 hours. Your visit is already logged!`,
      }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      valid: true,
      message: `Coupon verified for ${matchedBranch.name}!`,
      branch: {
        id: matchedBranch.id,
        name: matchedBranch.name,
        code: matchedBranch.code,
        city: matchedBranch.city,
      },
      couponCode: matchingEntry.dailyCode,
    });
  } catch (err: any) {
    console.error("POST /api/visits/validate error:", err);
    return NextResponse.json({ error: err.message || "Failed to validate coupon code." }, { status: 500 });
  }
}
