import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminScope";
import { canAccessAllBranches } from "@/lib/session";
import { hashSecret } from "@/lib/crypto";

// GET: Fetch all staff accounts
export async function GET(req: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error || !session) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  }

  try {
    const staffList = await prisma.staff.findMany({
      include: {
        branch: {
          select: {
            id: true,
            code: true,
            name: true,
            nameAr: true,
            city: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    const sanitizedStaff = staffList.map((s) => ({
      id: s.id,
      username: s.username,
      name: s.name,
      role: s.role,
      isActive: s.isActive,
      branchId: s.branchId,
      branch: s.branch,
      createdAt: s.createdAt,
      lastLogin: s.lastLogin,
      transactionCount: s._count.transactions,
    }));

    return NextResponse.json({
      ok: true,
      canEdit: canAccessAllBranches(session.role),
      staff: sanitizedStaff,
    });
  } catch (err: any) {
    console.error("GET /api/admin/staff error:", err);
    return NextResponse.json({ error: "Failed to load staff accounts." }, { status: 500 });
  }
}

// POST: Create a new staff account with login credentials & assigned branch
export async function POST(req: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error || !session) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  }

  if (!canAccessAllBranches(session.role)) {
    return NextResponse.json({ error: "Only administrators can create staff accounts." }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const { username, name, pin, role, branchId, isActive } = body || {};

  if (!username || !name || !pin) {
    return NextResponse.json({ error: "Username, full name, and security PIN / password are required." }, { status: 400 });
  }

  const cleanUsername = String(username).trim().toLowerCase();
  const cleanName = String(name).trim();
  const cleanPin = String(pin).trim();

  if (cleanUsername.length < 3) {
    return NextResponse.json({ error: "Username must be at least 3 characters." }, { status: 400 });
  }

  if (cleanPin.length < 4) {
    return NextResponse.json({ error: "PIN / password must be at least 4 digits." }, { status: 400 });
  }

  const validRoles = ["SUPER_ADMIN", "COMPANY_ADMIN", "BRANCH_MANAGER", "CASHIER"];
  const targetRole = validRoles.includes(role) ? role : "CASHIER";

  try {
    // Check for username collision
    const existing = await prisma.staff.findUnique({
      where: { username: cleanUsername },
    });
    if (existing) {
      return NextResponse.json({ error: `Username '${cleanUsername}' is already taken. Please choose another.` }, { status: 400 });
    }

    // Verify branch if provided
    let cleanBranchId: string | null = branchId ? String(branchId).trim() : null;
    if (cleanBranchId === "all" || cleanBranchId === "") {
      cleanBranchId = null;
    }

    if (cleanBranchId) {
      const branchExists = await prisma.branch.findUnique({
        where: { id: cleanBranchId },
      });
      if (!branchExists) {
        return NextResponse.json({ error: "Selected branch does not exist." }, { status: 400 });
      }
    }

    // Hash the PIN / password
    const pinHash = await hashSecret(cleanPin);

    const newStaff = await prisma.staff.create({
      data: {
        username: cleanUsername,
        name: cleanName,
        pinHash,
        role: targetRole,
        branchId: cleanBranchId,
        isActive: isActive !== false,
      },
      include: {
        branch: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        staffId: session.id,
        action: "staff.create",
        entityType: "staff",
        entityId: newStaff.id,
        metadata: {
          username: newStaff.username,
          name: newStaff.name,
          role: newStaff.role,
          branch: newStaff.branch?.name || "All Branches",
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Staff account '${newStaff.name}' created successfully.`,
      staff: {
        id: newStaff.id,
        username: newStaff.username,
        name: newStaff.name,
        role: newStaff.role,
        isActive: newStaff.isActive,
        branchId: newStaff.branchId,
        branch: newStaff.branch,
        createdAt: newStaff.createdAt,
      },
    });
  } catch (err: any) {
    console.error("POST /api/admin/staff error:", err);
    return NextResponse.json({ error: err.message || "Failed to create staff account." }, { status: 500 });
  }
}

// PUT: Update staff details, assigned branch, and optionally reset PIN / password
export async function PUT(req: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error || !session) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  }

  if (!canAccessAllBranches(session.role)) {
    return NextResponse.json({ error: "Only administrators can modify staff accounts." }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const { id, username, name, pin, role, branchId, isActive } = body || {};

  if (!id) {
    return NextResponse.json({ error: "Staff account ID is required." }, { status: 400 });
  }

  try {
    const existing = await prisma.staff.findUnique({
      where: { id: String(id) },
    });

    if (!existing) {
      return NextResponse.json({ error: "Staff account not found." }, { status: 404 });
    }

    const updateData: any = {};

    if (name !== undefined) {
      const cleanName = String(name).trim();
      if (!cleanName) return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
      updateData.name = cleanName;
    }

    if (username !== undefined) {
      const cleanUsername = String(username).trim().toLowerCase();
      if (cleanUsername.length < 3) {
        return NextResponse.json({ error: "Username must be at least 3 characters." }, { status: 400 });
      }
      if (cleanUsername !== existing.username) {
        const collision = await prisma.staff.findUnique({
          where: { username: cleanUsername },
        });
        if (collision) {
          return NextResponse.json({ error: `Username '${cleanUsername}' is already taken.` }, { status: 400 });
        }
      }
      updateData.username = cleanUsername;
    }

    if (role !== undefined) {
      const validRoles = ["SUPER_ADMIN", "COMPANY_ADMIN", "BRANCH_MANAGER", "CASHIER"];
      if (validRoles.includes(role)) {
        updateData.role = role;
      }
    }

    if (branchId !== undefined) {
      let cleanBranchId: string | null = branchId ? String(branchId).trim() : null;
      if (cleanBranchId === "all" || cleanBranchId === "") {
        cleanBranchId = null;
      }
      if (cleanBranchId) {
        const branchExists = await prisma.branch.findUnique({
          where: { id: cleanBranchId },
        });
        if (!branchExists) {
          return NextResponse.json({ error: "Selected branch does not exist." }, { status: 400 });
        }
      }
      updateData.branchId = cleanBranchId;
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    // Optional PIN / password reset
    if (pin !== undefined && String(pin).trim().length > 0) {
      const cleanPin = String(pin).trim();
      if (cleanPin.length < 4) {
        return NextResponse.json({ error: "PIN / password must be at least 4 digits." }, { status: 400 });
      }
      updateData.pinHash = await hashSecret(cleanPin);
    }

    const updated = await prisma.staff.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        branch: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        staffId: session.id,
        action: "staff.update",
        entityType: "staff",
        entityId: updated.id,
        metadata: {
          username: updated.username,
          name: updated.name,
          role: updated.role,
          branch: updated.branch?.name || "All Branches",
          pinReset: Boolean(pin && String(pin).trim().length > 0),
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Staff account '${updated.name}' updated successfully.`,
      staff: updated,
    });
  } catch (err: any) {
    console.error("PUT /api/admin/staff error:", err);
    return NextResponse.json({ error: err.message || "Failed to update staff account." }, { status: 500 });
  }
}

// DELETE: Deactivate or remove staff account
export async function DELETE(req: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error || !session) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  }

  if (!canAccessAllBranches(session.role)) {
    return NextResponse.json({ error: "Only administrators can delete staff accounts." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Staff account ID is required." }, { status: 400 });
  }

  if (id === session.id) {
    return NextResponse.json({ error: "You cannot delete your own logged-in account." }, { status: 400 });
  }

  try {
    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        _count: {
          select: { transactions: true, auditLogs: true },
        },
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff account not found." }, { status: 404 });
    }

    // If staff has processed transactions or audit entries, deactivate instead of hard delete to preserve history
    if (staff._count.transactions > 0 || staff._count.auditLogs > 0) {
      await prisma.staff.update({
        where: { id },
        data: { isActive: false },
      });

      await prisma.auditLog.create({
        data: {
          staffId: session.id,
          action: "staff.deactivate",
          entityType: "staff",
          entityId: staff.id,
          reason: "Account deactivated (preserved financial transaction history)",
          metadata: { username: staff.username, name: staff.name },
        },
      });

      return NextResponse.json({
        ok: true,
        message: `Staff account '${staff.name}' was deactivated to preserve historical transactions.`,
      });
    }

    // Otherwise safe to hard delete
    await prisma.staff.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        staffId: session.id,
        action: "staff.delete",
        entityType: "staff",
        entityId: staff.id,
        metadata: { username: staff.username, name: staff.name },
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Staff account '${staff.name}' deleted successfully.`,
    });
  } catch (err: any) {
    console.error("DELETE /api/admin/staff error:", err);
    return NextResponse.json({ error: err.message || "Failed to remove staff account." }, { status: 500 });
  }
}
