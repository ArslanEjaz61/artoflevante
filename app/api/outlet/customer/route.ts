import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeMobile } from "@/lib/mobile";
import { normalizeCode } from "@/lib/crypto";
import { getSettings } from "@/lib/loyalty";

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const { mobile, countryCode, token } = body || {};

    let customer: any = null;
    let qrTokenUsed: string | null = null;

    if (token) {
      const cleanToken = normalizeCode(token);
      if (!cleanToken) {
        return NextResponse.json({ error: "Please provide a valid QR code token." }, { status: 400 });
      }

      const qr = await prisma.qrToken.findUnique({
        where: { token: cleanToken },
        include: {
          customer: {
            include: {
              homeBranch: { select: { id: true, name: true, city: true } },
              customerRewards: {
                where: { status: "AVAILABLE" },
                include: { reward: true },
                orderBy: { issuedAt: "asc" },
              },
            },
          },
        },
      });

      if (!qr) {
        // Also check if token is customer ID or direct mobile
        const directCustomer = await prisma.customer.findFirst({
          where: {
            OR: [
              { id: cleanToken },
              { mobile: cleanToken.replace(/\D/g, "") },
            ],
          },
          include: {
            homeBranch: { select: { id: true, name: true, city: true } },
            customerRewards: {
              where: { status: "AVAILABLE" },
              include: { reward: true },
              orderBy: { issuedAt: "asc" },
            },
          },
        });

        if (!directCustomer) {
          return NextResponse.json({
            error: "Membership QR code not recognized or expired. Please check customer card.",
          }, { status: 404 });
        }
        customer = directCustomer;
      } else {
        customer = qr.customer;
        qrTokenUsed = qr.token;
      }
    } else if (mobile) {
      const e164 = normalizeMobile(mobile, countryCode || "971");
      const digitsOnly = String(mobile).replace(/\D/g, "");

      // Try exact E.164 first, then partial digits match
      customer = await prisma.customer.findFirst({
        where: {
          isBlocked: false,
          OR: [
            ...(e164 ? [{ mobile: e164 }] : []),
            ...(digitsOnly.length >= 7 ? [{ mobile: { endsWith: digitsOnly } }] : []),
            ...(digitsOnly.length >= 7 ? [{ mobile: { contains: digitsOnly } }] : []),
          ],
        },
        include: {
          homeBranch: { select: { id: true, name: true, city: true } },
          customerRewards: {
            where: { status: "AVAILABLE" },
            include: { reward: true },
            orderBy: { issuedAt: "asc" },
          },
        },
        orderBy: { lastVisitAt: "desc" },
      });

      if (!customer) {
        return NextResponse.json({
          error: "No registered customer found with this mobile number.",
        }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: "Please enter a mobile number or scan a QR code." }, { status: 400 });
    }

    if (customer.isBlocked) {
      return NextResponse.json({ error: "This customer account is blocked or inactive." }, { status: 403 });
    }

    const now = new Date();
    const settings = await getSettings();

    // Filter unexpired available rewards
    const validRewards = (customer.customerRewards || [])
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

    // Fetch recent 5 transactions for reference
    const recentTransactions = await prisma.transaction.findMany({
      where: { customerId: customer.id },
      include: {
        branch: { select: { name: true, city: true } },
        customerRewards: { include: { reward: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      ok: true,
      tokenUsed: qrTokenUsed,
      customer: {
        id: customer.id,
        name: customer.name,
        mobile: customer.mobile,
        pointsBalance: customer.pointsBalance,
        visitCount: customer.visitCount,
        totalSpend: Number(customer.totalSpend),
        lastVisitAt: customer.lastVisitAt,
        homeBranch: customer.homeBranch,
        memberSince: customer.createdAt,
      },
      availableRewards: validRewards,
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        invoiceNumber: t.invoiceNumber,
        amount: Number(t.amount),
        pointsEarned: t.pointsEarned,
        discountGiven: Number(t.discountGiven || 0),
        redeemedRewards: t.customerRewards.map((cr) => cr.reward.name),
        branchName: t.branch?.name,
        createdAt: t.createdAt,
      })),
      loyaltyRules: {
        currency: settings.currency || "AED",
        spendAedForPoints: Number(settings.spend_aed_for_points || 10),
        pointsEarnedPerSpend: Number(settings.points_earned_per_spend || 1),
        pointsRequiredForRedemption: Number(settings.points_required_for_redemption || 100),
        currencyValuePerRedemptionPoints: Number(settings.currency_value_per_redemption_points || 5),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to look up customer." }, { status: 500 });
  }
}
