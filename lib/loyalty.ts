import { prisma } from "./db";

export const DEFAULTS: Record<string, string> = {
  currency: "AED",
  // Earning Rule: Spend X AED = Earn Y Points
  spend_aed_for_points: "10", // Spend 10 AED
  points_earned_per_spend: "1", // Earn 1 Point
  points_per_currency: "0.1", // 1 Point per 10 AED (0.1 pt/AED)

  // Redemption Rule: X Points = Y AED Cash / Discount Value
  points_required_for_redemption: "100", // 100 Points
  currency_value_per_redemption_points: "5", // = AED 5.00 Value (1 pt = 0.05 AED)

  welcome_discount_percent: "10",
  welcome_bonus_points: "50",
  min_bill_for_points: "5",
  points_expiry_days: "0", // 0 = never
  qr_token_ttl_seconds: "180",
  otp_ttl_seconds: "300",
  otp_max_attempts: "5",
};

let cache: Record<string, string> | null = null;
let cachedAt = 0;
const CACHE_MS = 30_000;

export async function getSettings(): Promise<Record<string, string>> {
  if (cache && Date.now() - cachedAt < CACHE_MS) return cache;

  try {
    const rows = await prisma.setting.findMany();
    const fromDb = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    cache = { ...DEFAULTS, ...fromDb };
    cachedAt = Date.now();
    return cache;
  } catch {
    return DEFAULTS;
  }
}

export function clearSettingsCache(): void {
  cache = null;
}

export async function getSetting(key: string): Promise<string> {
  const s = await getSettings();
  return s[key] ?? DEFAULTS[key] ?? "";
}

export async function getNumber(key: string): Promise<number> {
  return Number(await getSetting(key));
}

/** Points for a bill. Floored — partial points are not awarded. */
export async function pointsForAmount(amount: number | string): Promise<number> {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return 0;

  const minBill = (await getNumber("min_bill_for_points")) || 0;
  if (value < minBill) return 0;

  const spendStep = (await getNumber("spend_aed_for_points")) || 1;
  const pointsEarned = (await getNumber("points_earned_per_spend")) || 1;

  if (spendStep > 0 && pointsEarned > 0) {
    return Math.floor((value / spendStep) * pointsEarned);
  }

  const rate = (await getNumber("points_per_currency")) || 1;
  return Math.floor(value * rate);
}

/** Calculate AED cash / discount value for a given points balance */
export async function pointsToCurrency(points: number | string): Promise<number> {
  const pts = Number(points);
  if (!Number.isFinite(pts) || pts <= 0) return 0;

  const reqPoints = (await getNumber("points_required_for_redemption")) || 100;
  const aedVal = (await getNumber("currency_value_per_redemption_points")) || 5;

  if (reqPoints <= 0 || aedVal <= 0) return 0;
  return Number(((pts / reqPoints) * aedVal).toFixed(2));
}

export interface EligibleRewardCriteria {
  pointsBalance: number;
  visitCount: number;
  alreadyHeldRewardIds?: string[];
}

/**
 * Which rewards this customer has just become eligible for.
 */
export async function newlyEligibleRewards({
  pointsBalance,
  visitCount,
  alreadyHeldRewardIds = [],
}: EligibleRewardCriteria) {
  const rewards = await prisma.reward.findMany({
    where: { isActive: true, type: { in: ["POINTS", "VISITS"] } },
  });

  return rewards.filter((r) => {
    if (alreadyHeldRewardIds.includes(r.id)) return false;
    if (r.type === "POINTS") return pointsBalance >= r.threshold;
    if (r.type === "VISITS") return visitCount > 0 && visitCount % r.threshold === 0;
    return false;
  });
}
