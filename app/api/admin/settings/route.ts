import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminScope";
import { canAccessAllBranches } from "@/lib/session";
import { clearSettingsCache, DEFAULTS } from "@/lib/loyalty";

// Default comprehensive system settings with clean category grouping
const SYSTEM_SETTING_DEFINITIONS: Record<
  string,
  { label: string; description: string; category: "general" | "loyalty" | "security"; defaultValue: string; type: "text" | "number" }
> = {
  // General App & Brand Settings
  program_name: {
    label: "Loyalty Program Name",
    description: "Display name shown on customer pass & digital card header",
    category: "general",
    defaultValue: "VIP Loyalty Club",
    type: "text",
  },
  company_name: {
    label: "Company / Group Legal Name",
    description: "Business name printed on digital vouchers & audit exports",
    category: "general",
    defaultValue: "Restaurant Hospitality Group",
    type: "text",
  },
  currency: {
    label: "Program Currency Code",
    description: "Currency symbol used across all receipts and bills (e.g. AED, SAR, USD)",
    category: "general",
    defaultValue: "AED",
    type: "text",
  },
  support_phone: {
    label: "Customer Support Phone / WhatsApp",
    description: "Contact number displayed in customer portal for help",
    category: "general",
    defaultValue: "+971 4 800 LOYALTY",
    type: "text",
  },
  support_email: {
    label: "Customer Support Email",
    description: "Inquiry email address for customer service tickets",
    category: "general",
    defaultValue: "support@loyalty.ae",
    type: "text",
  },
  support_hours: {
    label: "Support Operating Hours",
    description: "Displayed customer service availability window",
    category: "general",
    defaultValue: "Mon - Sun: 9:00 AM – 11:00 PM GST",
    type: "text",
  },

  // Conversion & Earning Engine (used in Calculator)
  spend_aed_for_points: {
    label: "Spend Amount in AED (Earning Rule)",
    description: "The bill spend amount required to earn the configured reward points (e.g. Every 10 AED)",
    category: "loyalty",
    defaultValue: "10",
    type: "number",
  },
  points_earned_per_spend: {
    label: "Points Earned per Spend Step",
    description: "Number of loyalty points awarded for every spend step reached (e.g. 1 Point per 10 AED)",
    category: "loyalty",
    defaultValue: "1",
    type: "number",
  },
  points_required_for_redemption: {
    label: "Points Required for Cash/Discount Value (Redemption Rule)",
    description: "The number of loyalty points needed to unlock the redemption currency amount (e.g. 100 Points)",
    category: "loyalty",
    defaultValue: "100",
    type: "number",
  },
  currency_value_per_redemption_points: {
    label: "AED Value for Required Points",
    description: "The cash discount value in AED awarded for the points above (e.g. 100 pts = AED 5.00)",
    category: "loyalty",
    defaultValue: "5",
    type: "number",
  },

  // General Loyalty Rules
  welcome_discount_percent: {
    label: "Welcome Discount (%)",
    description: "Instant discount percentage unlocked upon member signup",
    category: "loyalty",
    defaultValue: "10",
    type: "number",
  },
  welcome_bonus_points: {
    label: "Welcome Bonus Points",
    description: "Complimentary loyalty points gifted immediately upon account registration",
    category: "loyalty",
    defaultValue: "50",
    type: "number",
  },
  min_bill_for_points: {
    label: "Minimum Spend for Points (AED)",
    description: "Minimum invoice total required before points ledger is credited",
    category: "loyalty",
    defaultValue: "5",
    type: "number",
  },
  points_expiry_days: {
    label: "Points Expiry Policy (Days)",
    description: "Days until unused points expire (0 means points never expire)",
    category: "loyalty",
    defaultValue: "0",
    type: "number",
  },

  // Security & Anti-Fraud Thresholds
  qr_token_ttl_seconds: {
    label: "Dynamic QR Code Lifespan (Seconds)",
    description: "Refresh timer interval for customer digital pass QR code on mobile",
    category: "security",
    defaultValue: "180",
    type: "number",
  },
  otp_ttl_seconds: {
    label: "SMS OTP Code Validity (Seconds)",
    description: "Time before a one-time login/registration SMS code expires",
    category: "security",
    defaultValue: "300",
    type: "number",
  },
  otp_max_attempts: {
    label: "Maximum OTP Verification Attempts",
    description: "Failed attempts before an OTP is locked and invalidated",
    category: "security",
    defaultValue: "5",
    type: "number",
  },
  max_daily_points_per_customer: {
    label: "Daily Points Earning Cap",
    description: "Maximum points a single customer can earn in a 24-hour window",
    category: "security",
    defaultValue: "5000",
    type: "number",
  },
  max_daily_reward_claims: {
    label: "Max Daily Reward Redemptions",
    description: "Maximum rewards a member can redeem at checkout in a single day",
    category: "security",
    defaultValue: "3",
    type: "number",
  },
};

// GET: Fetch all system settings
export async function GET() {
  const { error, status, session } = await requireAdmin();
  if (error || !session) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  }

  try {
    const dbSettings = await prisma.setting.findMany();
    const dbMap = Object.fromEntries(dbSettings.map((s) => [s.key, s.value]));

    const settings = Object.entries(SYSTEM_SETTING_DEFINITIONS).map(([key, meta]) => ({
      key,
      value: dbMap[key] ?? meta.defaultValue,
      label: meta.label,
      description: meta.description,
      category: meta.category,
      type: meta.type,
      updatedAt: dbSettings.find((s) => s.key === key)?.updatedAt || null,
    }));

    return NextResponse.json({
      ok: true,
      canEdit: canAccessAllBranches(session.role),
      settings,
    });
  } catch (err: any) {
    console.error("GET /api/admin/settings error:", err);
    return NextResponse.json({ error: "Failed to load system settings." }, { status: 500 });
  }
}

// POST / PUT: Update system settings
export async function POST(req: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error || !session) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  }

  if (!canAccessAllBranches(session.role)) {
    return NextResponse.json({ error: "Only Super Administrators can modify system configuration." }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const { settings } = body || {};

  if (!settings || typeof settings !== "object") {
    return NextResponse.json({ error: "Settings payload must be a key-value object." }, { status: 400 });
  }

  try {
    const updatedKeys: string[] = [];

    // Derive points_per_currency if spend_aed_for_points and points_earned_per_spend are provided
    if (settings.spend_aed_for_points && settings.points_earned_per_spend) {
      const spend = Number(settings.spend_aed_for_points);
      const earned = Number(settings.points_earned_per_spend);
      if (spend > 0 && earned > 0) {
        settings.points_per_currency = String((earned / spend).toFixed(4));
      }
    }

    for (const [key, val] of Object.entries(settings)) {
      if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
        await prisma.setting.upsert({
          where: { key },
          update: { value: String(val).trim() },
          create: { key, value: String(val).trim() },
        });
        updatedKeys.push(key);
      }
    }

    // Invalidate memory cache so application reflects changes instantly
    clearSettingsCache();

    // Audit log
    await prisma.auditLog.create({
      data: {
        staffId: session.id,
        action: "settings.update",
        entityType: "system_settings",
        metadata: {
          updatedCount: updatedKeys.length,
          keys: updatedKeys,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: "System configuration updated successfully.",
      updatedKeys,
    });
  } catch (err: any) {
    console.error("POST /api/admin/settings error:", err);
    return NextResponse.json({ error: err.message || "Failed to update settings." }, { status: 500 });
  }
}
