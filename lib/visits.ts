import { prisma } from "@/lib/db";
import { randomBytes } from "node:crypto";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Generate a clean, high-entropy 4-character random suffix (e.g. 7K9A) */
function generateCodeSuffix(length = 4): string {
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  }
  return result;
}

/** Generate a readable 24-hour daily visit coupon code based on branch code (e.g. "1015-7K9A" or "DXB-8492") */
export function generateBranchDailyCode(branchCode: string): string {
  const cleanPrefix = String(branchCode || "VISIT").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const suffix = generateCodeSuffix(4);
  return `${cleanPrefix}-${suffix}`;
}

/** Returns the active 24-hour daily visit coupon code for a branch, auto-rotating if expired */
export async function getOrRotateBranchDailyCode(branchIdOrRecord: string | any) {
  let branch = typeof branchIdOrRecord === "object" ? branchIdOrRecord : null;

  if (!branch || !branch.code) {
    branch = await prisma.branch.findUnique({
      where: { id: typeof branchIdOrRecord === "string" ? branchIdOrRecord : branchIdOrRecord.id },
    });
  }

  if (!branch) {
    throw new Error("Branch not found");
  }

  const now = new Date();
  const isExpired = !branch.dailyCode || !branch.dailyCodeExpiresAt || new Date(branch.dailyCodeExpiresAt) <= now;

  if (!isExpired) {
    return {
      dailyCode: branch.dailyCode as string,
      dailyCodeExpiresAt: new Date(branch.dailyCodeExpiresAt as Date),
      branch,
    };
  }

  // Auto-generate fresh 24-hour code
  const newCode = generateBranchDailyCode(branch.code);
  const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  const updatedBranch = await prisma.branch.update({
    where: { id: branch.id },
    data: {
      dailyCode: newCode,
      dailyCodeExpiresAt: newExpiresAt,
    },
  });

  return {
    dailyCode: updatedBranch.dailyCode as string,
    dailyCodeExpiresAt: new Date(updatedBranch.dailyCodeExpiresAt as Date),
    branch: updatedBranch,
  };
}

/** Explicitly rotate a branch's 24-hour coupon code immediately */
export async function rotateBranchDailyCode(branchId: string) {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
  });

  if (!branch) {
    throw new Error("Branch not found.");
  }

  const newCode = generateBranchDailyCode(branch.code);
  const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const updatedBranch = await prisma.branch.update({
    where: { id: branch.id },
    data: {
      dailyCode: newCode,
      dailyCodeExpiresAt: newExpiresAt,
    },
  });

  return {
    dailyCode: updatedBranch.dailyCode as string,
    dailyCodeExpiresAt: new Date(updatedBranch.dailyCodeExpiresAt as Date),
    branch: updatedBranch,
  };
}
