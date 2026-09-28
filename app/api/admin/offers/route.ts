import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminScope";
import { canAccessAllBranches } from "@/lib/session";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  const { error, status, session } = await requireAdmin();
  if (error || !session) return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });

  const offers = await prisma.offer.findMany({
    include: { branches: { include: { branch: { select: { id: true, name: true, city: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true, city: true },
    orderBy: [{ code: "asc" }],
  });

  const now = new Date();

  return NextResponse.json({
    ok: true,
    canEdit: canAccessAllBranches(session.role),
    branches,
    offers: offers.map((o) => ({
      id: o.id,
      name: o.name,
      nameAr: o.nameAr,
      description: o.description,
      descriptionAr: o.descriptionAr,
      imageUrl: o.imageUrl,
      bannerText: o.bannerText,
      value: Number(o.discountValue),
      isPercent: o.isPercent,
      segment: o.segment,
      startsAt: o.startsAt,
      endsAt: o.endsAt,
      isActive: o.isActive,
      isLive:
        o.isActive &&
        (!o.startsAt || o.startsAt <= now) &&
        (!o.endsAt || o.endsAt >= now),
      branches: o.branches.map((b) => b.branch),
      createdAt: o.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error || !session) return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  if (!canAccessAllBranches(session.role)) {
    return NextResponse.json({ error: "Only admins can create offers." }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const { name, nameAr, description, descriptionAr, imageUrl, bannerText, value, isPercent, branchIds, startsAt, endsAt, segment } = body || {};

  if (!name || String(name).trim().length < 2) {
    return NextResponse.json({ error: "Please enter an offer / promotion title." }, { status: 400 });
  }
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: "Enter a valid discount value." }, { status: 400 });
  }
  if (isPercent && amount > 100) {
    return NextResponse.json({ error: "A percentage discount cannot exceed 100." }, { status: 400 });
  }

  const start = startsAt ? new Date(startsAt) : null;
  const end = endsAt ? new Date(endsAt) : null;
  if (start && Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: "Invalid start date." }, { status: 400 });
  }
  if (end && Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid end date." }, { status: 400 });
  }
  if (start && end && end < start) {
    return NextResponse.json({ error: "The end date cannot be before the start date." }, { status: 400 });
  }

  const ids = Array.isArray(branchIds) ? branchIds.filter(Boolean) : [];

  const offer = await prisma.offer.create({
    data: {
      name: String(name).trim(),
      nameAr: nameAr ? String(nameAr).trim() : null,
      description: description ? String(description).trim() : null,
      descriptionAr: descriptionAr ? String(descriptionAr).trim() : null,
      imageUrl: imageUrl ? String(imageUrl) : null,
      bannerText: bannerText ? String(bannerText).trim() : null,
      discountValue: amount,
      isPercent: Boolean(isPercent),
      segment: segment ? String(segment).trim() : null,
      startsAt: start,
      endsAt: end,
      isActive: true,
      branches: ids.length ? { create: ids.map((branchId: string) => ({ branchId })) } : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      staffId: session.id,
      action: "offer.create",
      entityType: "Offer",
      entityId: offer.id,
      metadata: { name: offer.name, value: amount, isPercent: Boolean(isPercent), branchIds: ids, hasImage: !!imageUrl },
    },
  });

  // Create admin notification
  await createNotification({
    type: "PROMOTION_CREATED",
    title: `New Promotion Launched: ${offer.name}`,
    message: `Promotion "${offer.name}" (${Boolean(isPercent) ? `${amount}% OFF` : `AED ${amount} OFF`}) is now live for members.`,
    metadata: { offerId: offer.id, offerName: offer.name, hasImage: !!imageUrl },
  });

  return NextResponse.json({ ok: true, offer });
}

export async function PATCH(req: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error || !session) return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  if (!canAccessAllBranches(session.role)) {
    return NextResponse.json({ error: "Only admins can change offers." }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const { id, name, description, imageUrl, bannerText, value, isPercent, isActive, startsAt, endsAt } = body || {};
  if (!id) return NextResponse.json({ error: "Offer ID is required." }, { status: 400 });

  const updateData: any = {};
  if (name !== undefined) updateData.name = String(name).trim();
  if (description !== undefined) updateData.description = description ? String(description).trim() : null;
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl ? String(imageUrl) : null;
  if (bannerText !== undefined) updateData.bannerText = bannerText ? String(bannerText).trim() : null;
  if (value !== undefined) updateData.discountValue = Number(value);
  if (isPercent !== undefined) updateData.isPercent = Boolean(isPercent);
  if (isActive !== undefined) updateData.isActive = Boolean(isActive);
  if (startsAt !== undefined) updateData.startsAt = startsAt ? new Date(startsAt) : null;
  if (endsAt !== undefined) updateData.endsAt = endsAt ? new Date(endsAt) : null;

  const offer = await prisma.offer.update({ where: { id: String(id) }, data: updateData });

  if (Array.isArray(body.branchIds)) {
    await prisma.offerBranch.deleteMany({ where: { offerId: String(id) } });
    if (body.branchIds.length > 0) {
      await prisma.offerBranch.createMany({
        data: body.branchIds.map((branchId: string) => ({
          offerId: String(id),
          branchId: String(branchId),
        })),
        skipDuplicates: true,
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      staffId: session.id,
      action: "offer.update",
      entityType: "Offer",
      entityId: offer.id,
      metadata: { name: offer.name, isActive: offer.isActive, hasImage: !!offer.imageUrl },
    },
  });

  return NextResponse.json({ ok: true, offer });
}

export async function DELETE(req: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error || !session) return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  if (!canAccessAllBranches(session.role)) {
    return NextResponse.json({ error: "Only admins can delete offers." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Offer ID is required." }, { status: 400 });

  const existing = await prisma.offer.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Offer not found." }, { status: 404 });

  await prisma.offer.delete({ where: { id } });

  return NextResponse.json({ ok: true, message: `Offer "${existing.name}" removed.` });
}

