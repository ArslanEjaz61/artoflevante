import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffSession } from "@/lib/session";
import { normalizeCode } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const token = normalizeCode(body?.token);
  if (!token) {
    return NextResponse.json({ error: "No code scanned." }, { status: 400 });
  }

  const qr = await prisma.qrToken.findUnique({
    where: { token },
    include: {
      customer: {
        include: {
          homeBranch: { select: { name: true, city: true } },
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
    return NextResponse.json({ error: "Code not recognised. Please check the customer's card." }, { status: 404 });
  }

  const c = qr.customer;
  if (c.isBlocked) {
    return NextResponse.json({ error: "This account is not active." }, { status: 403 });
  }

  const now = new Date();
  const rewards = c.customerRewards.filter((cr) => !cr.expiresAt || cr.expiresAt > now);

  return NextResponse.json({
    ok: true,
    token,
    customer: {
      id: c.id,
      name: c.name,
      mobile: c.mobile,
      pointsBalance: c.pointsBalance,
      visitCount: c.visitCount,
      totalSpend: Number(c.totalSpend),
      lastVisitAt: c.lastVisitAt,
      homeBranch: c.homeBranch,
      memberSince: c.createdAt,
    },
    availableRewards: rewards.map((cr) => ({
      id: cr.id,
      name: cr.reward.name,
      description: cr.reward.description,
      value: Number(cr.reward.value),
      isPercent: cr.reward.isPercent,
      expiresAt: cr.expiresAt,
    })),
  });
}
