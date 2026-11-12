import { prisma } from "@/lib/db";
import { formatCode } from "@/lib/crypto";
import { getSettings, calculateVisitMilestoneProgress } from "@/lib/loyalty";
import type { StampTheme } from "@/lib/wallet-stamps";

/** Everything shown on a customer's Google / Apple Wallet card. */

function isPublicHttps(url: string | undefined | null): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && !/^(localhost|127\.|10\.|192\.168\.|\[::1\])/.test(u.hostname);
  } catch {
    return false;
  }
}

/** First public https origin among NEXT_PUBLIC_APP_URL and the request origin, else null. */
export function publicOrigin(requestOrigin?: string | null): string | null {
  for (const candidate of [process.env.NEXT_PUBLIC_APP_URL, requestOrigin]) {
    if (isPublicHttps(candidate)) return new URL(candidate).origin;
  }
  return null;
}

export interface WalletCardData {
  customerId: string;
  name: string;
  memberCode: string;
  formattedCode: string;
  points: number;
  totalVisits: number;
  coupon: string;
  stamps: string;
  visitsInCycle: number;
  threshold: number;
  theme: StampTheme;
  branch: string;
  mobile: string | null;
  email: string | null;
}

export async function loadWalletCardData(customerId: string): Promise<WalletCardData | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      homeBranch: { select: { name: true } },
      qrTokens: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!customer) return null;

  let memberCode = customer.qrTokens?.[0]?.token;
  if (!memberCode || !memberCode.startsWith("LP")) {
    memberCode = "LP" + Math.floor(100000 + Math.random() * 900000);
    try {
      await prisma.qrToken.create({
        data: {
          token: memberCode,
          customerId,
          expiresAt: new Date(Date.now() + 10 * 365 * 86400_000),
        },
      });
    } catch {}
  }

  const [txCount, visitCountDb, firstVisitRule, settings] = await Promise.all([
    prisma.transaction.count({ where: { customerId, isReversed: false } }),
    prisma.customerVisit.count({ where: { customerId } }),
    prisma.reward.findFirst({ where: { isActive: true, type: "VISITS" }, orderBy: { threshold: "asc" } }),
    getSettings(),
  ]);
  const totalVisits = Math.max(customer.visitCount || 0, txCount, visitCountDb);
  const threshold = firstVisitRule?.threshold || 5;
  const progress = calculateVisitMilestoneProgress({
    visitCount: totalVisits,
    milestoneThreshold: threshold,
    hasAvailableMilestoneReward: false,
  });

  return {
    customerId,
    name: customer.name || "Member",
    memberCode,
    formattedCode: formatCode(memberCode),
    points: Number(customer.pointsBalance || 0),
    totalVisits,
    coupon: String(progress.completedCycles || 0).padStart(2, "0"),
    stamps: `${progress.visitsInCycle} / ${threshold}`,
    visitsInCycle: progress.visitsInCycle,
    threshold,
    theme: "white",
    branch: customer.homeBranch?.name || "All UAE Outlets",
    mobile: customer.mobile ?? null,
    email: customer.email ?? null,
  };
}

export function stampImageUrl(origin: string, card: WalletCardData) {
  return `${origin}/api/card/wallet/stamp-image?stamps=${card.visitsInCycle}&total=${card.threshold}&theme=${card.theme}&variant=hero&v=2`;
}
