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
  customerId?: string;
  pointsBalance: number;
  visitCount: number;
  alreadyHeldRewardIds?: string[];
  currentlyAvailableVisitRewardThresholds?: number[];
  totalRedeemedVisitRewardsCountByThreshold?: Record<number, number>;
}

/**
 * Which rewards this customer has just become eligible for.
 * If multiple rewards exist for the same visit milestone threshold,
 * a random one is selected for the customer.
 */
export async function newlyEligibleRewards({
  customerId,
  pointsBalance,
  visitCount,
  alreadyHeldRewardIds = [],
  currentlyAvailableVisitRewardThresholds = [],
  totalRedeemedVisitRewardsCountByThreshold = {},
}: EligibleRewardCriteria) {
  const allRewards = await prisma.reward.findMany({
    where: { isActive: true, type: { in: ["POINTS", "VISITS"] } },
  });

  const unlocked: typeof allRewards = [];

  // 1. Points rewards (if balance threshold met and not already held)
  const pointsRewards = allRewards.filter(
    (r) => r.type === "POINTS" && !alreadyHeldRewardIds.includes(r.id) && pointsBalance >= r.threshold
  );
  unlocked.push(...pointsRewards);

  // 2. Visits rewards: group by threshold and select randomly if multiple exist
  const visitRewards = allRewards.filter((r) => r.type === "VISITS");
  const thresholdGroups: Record<number, typeof allRewards> = {};
  for (const vr of visitRewards) {
    if (!thresholdGroups[vr.threshold]) {
      thresholdGroups[vr.threshold] = [];
    }
    thresholdGroups[vr.threshold].push(vr);
  }

  // If customerId is provided, query all customer rewards to calculate exact issued count
  let customerRewardsInDb: any[] = [];
  if (customerId) {
    customerRewardsInDb = await prisma.customerReward.findMany({
      where: { customerId, reward: { type: "VISITS" } },
      include: { reward: true },
    });
  }

  for (const [threshStr, group] of Object.entries(thresholdGroups)) {
    const thresh = Number(threshStr);
    if (thresh <= 0) continue;

    // Check if customer already holds an available unredeemed reward for this threshold
    const hasAvailable = customerId
      ? customerRewardsInDb.some((cr) => cr.status === "AVAILABLE" && cr.reward.threshold === thresh)
      : currentlyAvailableVisitRewardThresholds.includes(thresh);

    if (hasAvailable) {
      continue;
    }

    // Count how many rewards customer has already earned (redeemed + available) for this threshold
    const totalAlreadyEarned = customerId
      ? customerRewardsInDb.filter((cr) => cr.reward.threshold === thresh).length
      : (totalRedeemedVisitRewardsCountByThreshold[thresh] || 0);

    const requiredVisitsForNext = (totalAlreadyEarned + 1) * thresh;

    // Check if total visit count qualifies for the next milestone in this cycle
    if (visitCount >= requiredVisitsForNext) {
      // Filter out rewards the user already has held (if any)
      const candidates = group.filter((r) => !alreadyHeldRewardIds.includes(r.id));
      const pool = candidates.length > 0 ? candidates : group;

      // Pick ONE reward randomly from the pool
      const randomReward = pool[Math.floor(Math.random() * pool.length)];
      if (randomReward && !unlocked.some((u) => u.id === randomReward.id)) {
        unlocked.push(randomReward);
      }
    }
  }

  return unlocked;
}

/**
 * Calculates current cycle visit progress.
 * When a milestone reward is redeemed, the counter resets for the next cycle.
 */
export function calculateVisitMilestoneProgress({
  totalVisits,
  milestoneThreshold,
  hasAvailableMilestoneReward,
  redeemedMilestonesCount,
}: {
  totalVisits: number;
  milestoneThreshold: number;
  hasAvailableMilestoneReward: boolean;
  redeemedMilestonesCount: number;
}) {
  const threshold = Math.max(1, milestoneThreshold || 5);
  const total = Math.max(0, totalVisits || 0);
  const redeemed = Math.max(0, redeemedMilestonesCount || 0);

  if (hasAvailableMilestoneReward) {
    return {
      threshold,
      visitsInCycle: threshold,
      visitsNeeded: 0,
      progressPercent: 100,
      isUnlocked: true,
      cycleNumber: redeemed + 1,
    };
  }

  // Calculate visits into current cycle after accounting for all redeemed milestones
  const visitsAfterRedeemed = Math.max(0, total - redeemed * threshold);
  const visitsInCycle = visitsAfterRedeemed % threshold;
  const isUnlocked = visitsAfterRedeemed > 0 && visitsInCycle === 0 && total >= (redeemed + 1) * threshold;

  const currentCount = isUnlocked ? threshold : visitsInCycle;
  const needed = isUnlocked ? 0 : threshold - currentCount;
  const progressPercent = isUnlocked ? 100 : Math.min(100, Math.round((currentCount / threshold) * 100));

  return {
    threshold,
    visitsInCycle: currentCount,
    visitsNeeded: needed,
    progressPercent,
    isUnlocked,
    cycleNumber: redeemed + 1,
  };
}

