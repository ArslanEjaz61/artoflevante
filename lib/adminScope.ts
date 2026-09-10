import { getStaffSession, canAccessAllBranches, StaffSession } from "./session";
import { PrismaClient } from "../prisma/client";

export async function requireAdmin(): Promise<{ error?: string; status?: number; session?: StaffSession }> {
  const session = await getStaffSession();
  if (!session) return { error: "Please sign in.", status: 401 };
  if (session.role === "CASHIER") {
    return { error: "You do not have access to the dashboard.", status: 403 };
  }
  return { session };
}

/** Prisma `where` fragment limiting transactions to what this role may see. */
export function branchFilter(session: StaffSession) {
  if (canAccessAllBranches(session.role)) return {};
  return { branchId: session.branchId ?? undefined };
}

/** Customer ids that have transacted at this manager's branch. */
export async function scopedCustomerIds(prismaClient: PrismaClient, session: StaffSession): Promise<string[] | null> {
  if (canAccessAllBranches(session.role)) return null; // null = no restriction
  if (!session.branchId) return [];
  const rows = await prismaClient.transaction.findMany({
    where: { branchId: session.branchId },
    select: { customerId: true },
    distinct: ["customerId"],
  });
  return rows.map((r) => r.customerId);
}
