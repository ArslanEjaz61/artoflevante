import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminScope";
import { pointsToCurrency, getSettings } from "@/lib/loyalty";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Customer ID is required." }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      homeBranch: { select: { id: true, name: true, city: true, code: true } },
      transactions: {
        include: {
          branch: { select: { id: true, name: true, city: true, code: true } },
          staff: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      customerRewards: {
        include: { reward: true },
        orderBy: [{ status: "asc" }, { issuedAt: "desc" }],
      },
      visits: {
        include: {
          branch: { select: { id: true, name: true, city: true, code: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      pointsLedger: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      qrTokens: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  }

  const settings = await getSettings();
  const cur = settings.currency || "AED";
  const pointsCashValue = await pointsToCurrency(customer.pointsBalance);

  return NextResponse.json({
    ok: true,
    currency: cur,
    customer: {
      id: customer.id,
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email,
      birthday: customer.birthday,
      language: customer.language,
      isBlocked: customer.isBlocked,
      homeBranch: customer.homeBranch,
      pointsBalance: customer.pointsBalance,
      pointsCashValue,
      visitCount: customer.visitCount,
      totalSpend: Number(customer.totalSpend),
      lastVisitAt: customer.lastVisitAt,
      createdAt: customer.createdAt,
      cardCode: customer.qrTokens[0]?.token || null,
      transactions: customer.transactions.map((t) => ({
        id: t.id,
        invoiceNumber: t.invoiceNumber,
        amount: Number(t.amount),
        pointsEarned: t.pointsEarned,
        discountGiven: Number(t.discountGiven),
        isReversed: t.isReversed,
        branch: t.branch,
        staffName: t.staff?.name || "Staff",
        createdAt: t.createdAt,
      })),
      rewards: customer.customerRewards.map((cr) => ({
        id: cr.id,
        name: cr.reward.name,
        description: cr.reward.description,
        value: Number(cr.reward.value),
        isPercent: cr.reward.isPercent,
        status: cr.status,
        issuedAt: cr.issuedAt,
        expiresAt: cr.expiresAt,
        redeemedAt: cr.redeemedAt,
      })),
      visits: customer.visits.map((v) => ({
        id: v.id,
        branch: v.branch,
        couponCode: v.couponCode,
        pointsEarned: v.pointsEarned,
        checkInMethod: v.checkInMethod,
        createdAt: v.createdAt,
      })),
      ledger: customer.pointsLedger.map((l) => ({
        id: l.id,
        delta: l.delta,
        reason: l.reason,
        note: l.note,
        createdAt: l.createdAt,
      })),
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Customer ID is required." }, { status: 400 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { isBlocked } = body;

  const updated = await prisma.customer.update({
    where: { id },
    data: {
      ...(typeof isBlocked === "boolean" ? { isBlocked } : {}),
    },
  });

  await prisma.auditLog.create({
    data: {
      staffId: auth.session.id,
      action: "customer.update",
      entityType: "Customer",
      entityId: id,
      metadata: { isBlocked },
    },
  });

  return NextResponse.json({ ok: true, customer: updated });
}
