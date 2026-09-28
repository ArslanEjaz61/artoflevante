import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminScope";
import { canAccessAllBranches } from "@/lib/session";
import { createNotification } from "@/lib/notifications";
import { queueEmailBroadcast } from "@/lib/email";

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

  // Queue automated promotional announcement email broadcast to all registered members
  const discountBadge = Boolean(isPercent) ? `${amount}% OFF` : `AED ${amount} OFF`;
  queueEmailBroadcast({
    campaignName: `Offer: ${offer.name} (${discountBadge})`,
    sentBy: session.id || "Admin",
    batchSize: 50, // 50 recipients per chunk
    delayBetweenBatchesMs: 300, // 300ms gap between batches to prevent spam-block
    concurrencyPerBatch: 5, // 5 parallel sends at a time
    buildSubject: (cust) => `🎉 New Exclusive Offer: ${offer.name} (${discountBadge}) — Bombay Chowpatty`,
    buildHtml: (cust) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF7F4; padding: 24px; border-radius: 20px; border: 1px solid #EAE3DC;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #801313; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">BOMBAY CHOWPATTY</h1>
          <p style="color: #7A6E67; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; font-weight: 700;">Exclusive Loyalty Club</p>
        </div>

        <div style="background: #FFFFFF; padding: 24px; border-radius: 16px; border: 1px solid #EAE3DC; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          ${
            offer.imageUrl
              ? `<div style="text-align: center; margin-bottom: 20px; border-radius: 12px; overflow: hidden; border: 1px solid #EAE3DC; background: #1E1815;">
                  <img src="${offer.imageUrl}" alt="${offer.name}" style="width: 100%; max-height: 280px; object-fit: cover; display: block;" />
                </div>`
              : ""
          }

          <div style="display: inline-block; background: #801313; color: #FFFFFF; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
            ${discountBadge}
          </div>

          <h2 style="font-size: 20px; color: #1E1815; margin: 0 0 10px 0; font-weight: 800; line-height: 1.3;">
            ${offer.name}
          </h2>

          <p style="font-size: 14px; color: #5C504A; line-height: 1.6; margin: 0 0 20px 0;">
            ${offer.description || "We are excited to share a brand new exclusive promotion with all our loyal members! Visit us to savor the authentic taste of Bombay with special savings."}
          </p>

          <div style="background: #FAF7F4; border: 1px solid #EAE3DC; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;">
            <div style="font-size: 11px; color: #7A6E67; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">OFFER DETAILS &amp; VALIDITY</div>
            <div style="font-size: 13px; color: #1E1815; font-weight: 700;">
              📅 Valid ${start ? `from ${start.toLocaleDateString()}` : "immediately"} ${end ? `until ${end.toLocaleDateString()}` : "for a limited time"}
            </div>
            <div style="font-size: 12px; color: #5C504A; margin-top: 4px;">
              📍 Applicable across Bombay Chowpatty UAE branch locations (Dine In &amp; Takeaway)
            </div>
          </div>

          <div style="text-align: center; padding-top: 8px;">
            <p style="font-size: 13px; color: #5C504A; margin: 0 0 14px 0;">
              Simply show your digital loyalty QR card or mobile number at checkout to redeem this promotion!
            </p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #7A6E67; line-height: 1.5;">
          <p style="margin: 0;">Hello <strong>${cust.name || "Valued Member"}</strong>, you received this because you are an active member of Bombay Chowpatty Loyalty Club.</p>
          <p style="margin: 4px 0 0 0;">Your Current Balance: <strong style="color: #801313;">${cust.pointsBalance || 0} Points</strong></p>
          <p style="margin: 4px 0 0 0;">UAE • 14 Outlets • Dine In &amp; Takeaway</p>
        </div>
      </div>
    `,
  });

  return NextResponse.json({
    ok: true,
    offer,
    message: "Offer published successfully and queued for safe background email broadcast.",
  });
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

