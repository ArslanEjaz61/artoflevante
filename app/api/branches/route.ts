import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/loyalty";

export async function GET() {
  try {
    const [branches, settings] = await Promise.all([
      prisma.branch.findMany({
        where: { isActive: true },
        select: { id: true, code: true, name: true, city: true, address: true, hours: true },
        orderBy: [{ city: "asc" }, { name: "asc" }],
      }),
      getSettings(),
    ]);

    return NextResponse.json({
      branches,
      programInfo: {
        name: settings.program_name || "VIP Loyalty Club",
        currency: settings.currency || "AED",
        welcomeDiscountPercent: Number(settings.welcome_discount_percent || 10),
        welcomeBonusPoints: Number(settings.welcome_bonus_points || 50),
        spendAedForPoints: Number(settings.spend_aed_for_points || 10),
        pointsEarnedPerSpend: Number(settings.points_earned_per_spend || 1),
        pointsRequiredForRedemption: Number(settings.points_required_for_redemption || 100),
        currencyValuePerRedemptionPoints: Number(settings.currency_value_per_redemption_points || 5),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch branches." }, { status: 500 });
  }
}
