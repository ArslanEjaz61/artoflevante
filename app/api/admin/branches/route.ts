import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminScope";
import { canAccessAllBranches } from "@/lib/session";
import { getOrRotateBranchDailyCode, generateBranchDailyCode } from "@/lib/visits";

// GET: List all branches with rich metrics (staff count, customer count, transaction count, revenue, and live 24h coupon code)
export async function GET() {
  const { error, status, session } = await requireAdmin();
  if (error || !session) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  }

  try {
    const branches = await prisma.branch.findMany({
      include: {
        _count: {
          select: {
            staff: true,
            homeCustomers: true,
            transactions: true,
            offers: true,
            visits: true,
          },
        },
        transactions: {
          where: { isReversed: false },
          select: { amount: true, pointsEarned: true },
        },
      },
      orderBy: [{ isActive: "desc" }, { code: "asc" }],
    });

    const formattedBranches = await Promise.all(
      branches.map(async (b) => {
        const totalRevenue = b.transactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);
        const totalPoints = b.transactions.reduce((acc, t) => acc + Number(t.pointsEarned || 0), 0);
        
        let dailyCode = b.dailyCode;
        let dailyCodeExpiresAt = b.dailyCodeExpiresAt ? b.dailyCodeExpiresAt.toISOString() : null;
        try {
          const codeInfo = await getOrRotateBranchDailyCode(b);
          dailyCode = codeInfo.dailyCode;
          dailyCodeExpiresAt = codeInfo.dailyCodeExpiresAt.toISOString();
        } catch {
          // fallback if error
        }

        return {
          id: b.id,
          code: b.code,
          name: b.name,
          nameAr: b.nameAr,
          city: b.city || "Dubai",
          address: b.address,
          addressAr: b.addressAr,
          phone: b.phone,
          hours: b.hours,
          isActive: b.isActive,
          createdAt: b.createdAt,
          staffCount: b._count.staff,
          customerCount: b._count.homeCustomers,
          transactionCount: b._count.transactions,
          visitCount: b._count.visits,
          activeOffersCount: b._count.offers,
          totalRevenue,
          totalPoints,
          dailyCode,
          dailyCodeExpiresAt,
        };
      })
    );

    return NextResponse.json({
      ok: true,
      canEdit: canAccessAllBranches(session.role),
      branches: formattedBranches,
    });
  } catch (err: any) {
    console.error("GET /api/admin/branches error:", err);
    return NextResponse.json({ error: "Failed to fetch branches." }, { status: 500 });
  }
}

// POST: Create a new branch
export async function POST(req: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error || !session) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  }

  if (!canAccessAllBranches(session.role)) {
    return NextResponse.json({ error: "Only Super Administrators can create new branches." }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { code, name, nameAr, city, address, addressAr, phone, hours, isActive, dailyCode, dailyCodeExpiresAt } = body || {};

  if (!code || String(code).trim().length < 2) {
    return NextResponse.json({ error: "Branch code is required (e.g. 1015)." }, { status: 400 });
  }

  if (!name || String(name).trim().length < 2) {
    return NextResponse.json({ error: "Branch name is required." }, { status: 400 });
  }

  const cleanCode = String(code).trim().toUpperCase();

  // Check unique code
  const existing = await prisma.branch.findUnique({
    where: { code: cleanCode },
  });
  if (existing) {
    return NextResponse.json({ error: `Branch code '${cleanCode}' is already in use by '${existing.name}'.` }, { status: 409 });
  }

  const initialCode = dailyCode ? String(dailyCode).trim().toUpperCase() : generateBranchDailyCode(cleanCode);
  const initialExpiresAt = dailyCodeExpiresAt ? new Date(dailyCodeExpiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000);

  try {
    const branch = await prisma.branch.create({
      data: {
        code: cleanCode,
        name: String(name).trim(),
        nameAr: nameAr ? String(nameAr).trim() : null,
        city: city ? String(city).trim() : "Dubai",
        address: address ? String(address).trim() : null,
        addressAr: addressAr ? String(addressAr).trim() : null,
        phone: phone ? String(phone).trim() : null,
        hours: hours ? String(hours).trim() : null,
        isActive: isActive !== false,
        dailyCode: initialCode,
        dailyCodeExpiresAt: initialExpiresAt,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        staffId: session.id,
        action: "branch.create",
        entityType: "branch",
        entityId: branch.id,
        metadata: {
          code: branch.code,
          name: branch.name,
          city: branch.city,
          dailyCode: branch.dailyCode,
          dailyCodeExpiresAt: branch.dailyCodeExpiresAt,
        },
      },
    });

    return NextResponse.json({ ok: true, branch });
  } catch (err: any) {
    console.error("POST /api/admin/branches error:", err);
    return NextResponse.json({ error: err.message || "Failed to create branch." }, { status: 500 });
  }
}

// PUT / PATCH: Update an existing branch
export async function PUT(req: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error || !session) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  }

  if (!canAccessAllBranches(session.role)) {
    return NextResponse.json({ error: "Only Super Administrators can modify branch details." }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { id, code, name, nameAr, city, address, addressAr, phone, hours, isActive, dailyCode, dailyCodeExpiresAt, rotateCode } = body || {};

  if (!id) {
    return NextResponse.json({ error: "Branch ID is required." }, { status: 400 });
  }

  const branch = await prisma.branch.findUnique({
    where: { id: String(id) },
  });

  if (!branch) {
    return NextResponse.json({ error: "Branch not found." }, { status: 404 });
  }

  // If code is changing, check uniqueness
  let cleanCode = branch.code;
  if (code && String(code).trim().toUpperCase() !== branch.code) {
    cleanCode = String(code).trim().toUpperCase();
    const existing = await prisma.branch.findUnique({
      where: { code: cleanCode },
    });
    if (existing && existing.id !== branch.id) {
      return NextResponse.json({ error: `Branch code '${cleanCode}' is already taken.` }, { status: 409 });
    }
  }

  let newDailyCode = branch.dailyCode;
  let newExpiresAt = branch.dailyCodeExpiresAt;

  if (rotateCode) {
    newDailyCode = generateBranchDailyCode(cleanCode);
    newExpiresAt = dailyCodeExpiresAt ? new Date(dailyCodeExpiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  } else {
    if (dailyCode !== undefined && String(dailyCode).trim() !== "") {
      newDailyCode = String(dailyCode).trim().toUpperCase();
    }
    if (dailyCodeExpiresAt !== undefined && dailyCodeExpiresAt) {
      newExpiresAt = new Date(dailyCodeExpiresAt);
    }
  }

  try {
    const updated = await prisma.branch.update({
      where: { id: branch.id },
      data: {
        code: cleanCode,
        name: name !== undefined ? String(name).trim() : branch.name,
        nameAr: nameAr !== undefined ? (nameAr ? String(nameAr).trim() : null) : branch.nameAr,
        city: city !== undefined ? (city ? String(city).trim() : null) : branch.city,
        address: address !== undefined ? (address ? String(address).trim() : null) : branch.address,
        addressAr: addressAr !== undefined ? (addressAr ? String(addressAr).trim() : null) : branch.addressAr,
        phone: phone !== undefined ? (phone ? String(phone).trim() : null) : branch.phone,
        hours: hours !== undefined ? (hours ? String(hours).trim() : null) : branch.hours,
        isActive: isActive !== undefined ? Boolean(isActive) : branch.isActive,
        dailyCode: newDailyCode,
        dailyCodeExpiresAt: newExpiresAt,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        staffId: session.id,
        action: "branch.update",
        entityType: "branch",
        entityId: updated.id,
        metadata: {
          code: updated.code,
          name: updated.name,
          isActive: updated.isActive,
          dailyCode: updated.dailyCode,
        },
      },
    });

    return NextResponse.json({ ok: true, branch: updated });
  } catch (err: any) {
    console.error("PUT /api/admin/branches error:", err);
    return NextResponse.json({ error: err.message || "Failed to update branch." }, { status: 500 });
  }
}

// DELETE: Delete or deactivate branch
export async function DELETE(req: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error || !session) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  }

  if (!canAccessAllBranches(session.role)) {
    return NextResponse.json({ error: "Only Super Administrators can delete branches." }, { status: 403 });
  }

  let id = req.nextUrl.searchParams.get("id");
  if (!id) {
    try {
      const body = await req.json();
      id = body?.id;
    } catch {}
  }

  if (!id) {
    return NextResponse.json({ error: "Branch ID is required." }, { status: 400 });
  }

  const branch = await prisma.branch.findUnique({
    where: { id: String(id) },
    include: {
      _count: {
        select: {
          transactions: true,
          staff: true,
          homeCustomers: true,
        },
      },
    },
  });

  if (!branch) {
    return NextResponse.json({ error: "Branch not found." }, { status: 404 });
  }

  // If transactions or records exist, perform safe deactivation instead of hard SQL constraint crash
  const hasHistory = branch._count.transactions > 0 || branch._count.homeCustomers > 0;

  if (hasHistory) {
    // Soft delete / deactivate to protect financial and customer data integrity
    await prisma.branch.update({
      where: { id: branch.id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        staffId: session.id,
        action: "branch.deactivate",
        entityType: "branch",
        entityId: branch.id,
        reason: "Deactivated branch (has existing transaction/customer history)",
        metadata: {
          name: branch.name,
          code: branch.code,
          transactionCount: branch._count.transactions,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      deactivated: true,
      message: `Branch '${branch.name}' has historical sales data and has been safely deactivated instead of deleted.`,
    });
  }

  // Hard delete if clean
  try {
    // Remove offer links first
    await prisma.offerBranch.deleteMany({ where: { branchId: branch.id } });
    // Remove staff branch references
    await prisma.staff.updateMany({ where: { branchId: branch.id }, data: { branchId: null } });
    
    await prisma.branch.delete({
      where: { id: branch.id },
    });

    await prisma.auditLog.create({
      data: {
        staffId: session.id,
        action: "branch.delete",
        entityType: "branch",
        entityId: branch.id,
        metadata: {
          name: branch.name,
          code: branch.code,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      deleted: true,
      message: `Branch '${branch.name}' was completely deleted.`,
    });
  } catch (err: any) {
    console.error("DELETE /api/admin/branches error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete branch." }, { status: 500 });
  }
}
