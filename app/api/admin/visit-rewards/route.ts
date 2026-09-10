import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminScope";
import { canAccessAllBranches } from "@/lib/session";

// GET: Fetch all visit milestone rewards
export async function GET() {
  const { error, status, session } = await requireAdmin();
  if (error || !session) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  }

  try {
    let visitRewards = await prisma.reward.findMany({
      where: { type: "VISITS" },
      orderBy: { threshold: "asc" },
      include: {
        _count: { select: { customerRewards: true } },
      },
    });

    // If no visit rewards exist yet, seed initial sensible default milestones
    if (visitRewards.length === 0) {
      const defaults = [
        {
          name: "Free Signature Coffee / Beverage",
          description: "Enjoy any complimentary signature beverage on your 5th dining visit!",
          type: "VISITS" as const,
          threshold: 5,
          value: 100,
          isPercent: true,
          validDays: 30,
          isActive: true,
        },
        {
          name: "Free Chef Special Dessert",
          description: "Complimentary artisan dessert or appetizer on your 10th VIP visit!",
          type: "VISITS" as const,
          threshold: 10,
          value: 100,
          isPercent: true,
          validDays: 30,
          isActive: true,
        },
        {
          name: "Free VIP Main Course / Feast",
          description: "Complimentary chef special main course for celebrating 20 visits!",
          type: "VISITS" as const,
          threshold: 20,
          value: 100,
          isPercent: true,
          validDays: 45,
          isActive: true,
        },
      ];

      for (const d of defaults) {
        await prisma.reward.create({ data: d });
      }

      visitRewards = await prisma.reward.findMany({
        where: { type: "VISITS" },
        orderBy: { threshold: "asc" },
        include: {
          _count: { select: { customerRewards: true } },
        },
      });
    }

    return NextResponse.json({
      ok: true,
      canEdit: canAccessAllBranches(session.role),
      rewards: visitRewards.map((r) => ({
        id: r.id,
        name: r.name,
        nameAr: r.nameAr,
        description: r.description,
        descriptionAr: r.descriptionAr,
        threshold: r.threshold,
        value: Number(r.value),
        isPercent: r.isPercent,
        validDays: r.validDays || 30,
        isActive: r.isActive,
        claimCount: r._count.customerRewards,
        createdAt: r.createdAt,
      })),
    });
  } catch (err: any) {
    console.error("GET /api/admin/visit-rewards error:", err);
    return NextResponse.json({ error: "Failed to load visit milestone rewards." }, { status: 500 });
  }
}

// POST: Create a new visit milestone reward
export async function POST(req: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error || !session) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  }

  if (!canAccessAllBranches(session.role)) {
    return NextResponse.json({ error: "Only Super Administrators can create loyalty milestone rules." }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const { name, nameAr, description, threshold, value, isPercent, validDays, isActive } = body || {};

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Please enter a reward / free item name." }, { status: 400 });
  }

  const numThreshold = parseInt(String(threshold), 10);
  if (isNaN(numThreshold) || numThreshold <= 0) {
    return NextResponse.json({ error: "Please enter a valid visit count milestone (e.g. 5, 10, 15 visits)." }, { status: 400 });
  }

  try {
    const reward = await prisma.reward.create({
      data: {
        name: name.trim(),
        nameAr: nameAr ? String(nameAr).trim() : null,
        description: description ? String(description).trim() : `Unlocked on visit #${numThreshold}`,
        type: "VISITS",
        threshold: numThreshold,
        value: value !== undefined ? Number(value) : 100,
        isPercent: isPercent !== undefined ? Boolean(isPercent) : true,
        validDays: validDays ? parseInt(String(validDays), 10) : 30,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    await prisma.auditLog.create({
      data: {
        staffId: session.id,
        action: "reward.create_visit_milestone",
        entityType: "Reward",
        entityId: reward.id,
        metadata: {
          name: reward.name,
          threshold: reward.threshold,
          validDays: reward.validDays,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Visit milestone created! Customers will unlock '${reward.name}' on every ${reward.threshold} visits.`,
      reward,
    });
  } catch (err: any) {
    console.error("POST /api/admin/visit-rewards error:", err);
    return NextResponse.json({ error: err.message || "Failed to create visit milestone reward." }, { status: 500 });
  }
}

// PATCH: Update an existing visit milestone reward
export async function PATCH(req: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error || !session) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  }

  if (!canAccessAllBranches(session.role)) {
    return NextResponse.json({ error: "Only Super Administrators can modify loyalty milestone rules." }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const { id, name, nameAr, description, threshold, value, isPercent, validDays, isActive } = body || {};

  if (!id) {
    return NextResponse.json({ error: "Reward ID is required." }, { status: 400 });
  }

  try {
    const existing = await prisma.reward.findUnique({ where: { id: String(id) } });
    if (!existing) {
      return NextResponse.json({ error: "Reward not found." }, { status: 404 });
    }

    const updated = await prisma.reward.update({
      where: { id: String(id) },
      data: {
        name: name !== undefined ? String(name).trim() : undefined,
        nameAr: nameAr !== undefined ? String(nameAr).trim() : undefined,
        description: description !== undefined ? String(description).trim() : undefined,
        threshold: threshold !== undefined ? parseInt(String(threshold), 10) : undefined,
        value: value !== undefined ? Number(value) : undefined,
        isPercent: isPercent !== undefined ? Boolean(isPercent) : undefined,
        validDays: validDays !== undefined ? parseInt(String(validDays), 10) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        staffId: session.id,
        action: "reward.update_visit_milestone",
        entityType: "Reward",
        entityId: updated.id,
        metadata: {
          name: updated.name,
          threshold: updated.threshold,
          isActive: updated.isActive,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Visit milestone '${updated.name}' updated successfully.`,
      reward: updated,
    });
  } catch (err: any) {
    console.error("PATCH /api/admin/visit-rewards error:", err);
    return NextResponse.json({ error: err.message || "Failed to update visit milestone reward." }, { status: 500 });
  }
}

// DELETE: Delete a visit milestone reward
export async function DELETE(req: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error || !session) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  }

  if (!canAccessAllBranches(session.role)) {
    return NextResponse.json({ error: "Only Super Administrators can delete loyalty milestone rules." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Reward ID is required." }, { status: 400 });
  }

  try {
    const existing = await prisma.reward.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Reward not found." }, { status: 404 });
    }

    await prisma.reward.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        staffId: session.id,
        action: "reward.delete_visit_milestone",
        entityType: "Reward",
        entityId: id,
        metadata: { name: existing.name, threshold: existing.threshold },
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Visit milestone '${existing.name}' has been deleted.`,
    });
  } catch (err: any) {
    console.error("DELETE /api/admin/visit-rewards error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete visit milestone reward." }, { status: 500 });
  }
}
