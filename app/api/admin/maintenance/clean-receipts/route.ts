import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminScope";
import { cleanOldReceiptImages } from "@/lib/receipts";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

async function isAuthorized(req: NextRequest) {
  // Allow system cron via secret header if configured
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") || req.headers.get("x-cron-secret") || "";
  if (cronSecret && (authHeader === cronSecret || authHeader === `Bearer ${cronSecret}`)) {
    return true;
  }

  // Otherwise require an active Admin session
  const auth = await requireAdmin();
  return !auth.error && Boolean(auth.session);
}

export async function GET(req: NextRequest) {
  const authorized = await isAuthorized(req);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const maxDays = Math.max(1, parseInt(searchParams.get("days") || "10", 10) || 10);

  const dir = path.join(process.cwd(), "storage", "receipts");
  let totalFiles = 0;
  let olderThanMaxDays = 0;
  let totalSizeBytes = 0;

  try {
    const files = await readdir(dir);
    const now = Date.now();
    const maxAgeMs = maxDays * 24 * 60 * 60 * 1000;

    for (const file of files) {
      if (!file.endsWith(".jpg") && !file.endsWith(".png") && !file.endsWith(".jpeg")) continue;
      totalFiles += 1;
      try {
        const s = await stat(path.join(dir, file));
        totalSizeBytes += s.size;
        if (now - s.mtimeMs > maxAgeMs) {
          olderThanMaxDays += 1;
        }
      } catch {
        // file may have been moved, ignore
      }
    }
  } catch {
    // Directory might not exist yet
  }

  return NextResponse.json({
    ok: true,
    storageDirectory: "storage/receipts",
    retentionDays: maxDays,
    totalReceiptImages: totalFiles,
    imagesEligibleForCleanup: olderThanMaxDays,
    totalSizeBytes,
    totalSizeMB: (totalSizeBytes / (1024 * 1024)).toFixed(2),
  });
}

export async function POST(req: NextRequest) {
  const authorized = await isAuthorized(req);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let days = parseInt(searchParams.get("days") || "10", 10) || 10;
  try {
    const body = await req.json();
    if (body?.days) days = parseInt(String(body.days), 10) || days;
  } catch {
    // No json body, use query param
  }

  const result = await cleanOldReceiptImages(days);

  return NextResponse.json({
    ok: true,
    message: `Receipt cleanup completed. Deleted ${result.deleted} image(s) older than ${days} days.`,
    retentionDays: days,
    deleted: result.deleted,
    scanned: result.scanned,
  });
}
