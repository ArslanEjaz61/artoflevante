import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { getCustomerId } from "@/lib/session";
import { getNumber, getSetting, pointsForAmount } from "@/lib/loyalty";
import { readReceipt, receiptAgeDays, signReceiptClaim, storeReceiptImage } from "@/lib/receipts";

const MAX_BYTES = 6 * 1024 * 1024;
const SCANS_PER_HOUR = 15; // keeps the vision bill bounded if someone hammers the button

/**
 * Step 1 of receipt scanning: read the photo and say what we found. Nothing is awarded here; the
 * response carries a signed claim token that /api/receipts/claim redeems once the customer confirms.
 */
export async function POST(req: NextRequest) {
  const customerId = await getCustomerId();
  if (!customerId) {
    return NextResponse.json({ error: "Please sign in to scan a receipt." }, { status: 401 });
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("image");
    if (f && typeof f !== "string") file = f;
  } catch {
    return NextResponse.json({ error: "Please attach a photo of your receipt." }, { status: 400 });
  }
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "Please attach a photo of your receipt." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "That photo is too large. Please try again." }, { status: 413 });
  }
  const mime = file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";

  try {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || customer.isBlocked) {
      return NextResponse.json({ error: "Customer account not found or is blocked." }, { status: 404 });
    }

    const recentScans = await prisma.auditLog.count({
      where: {
        action: "customer.receipt_scan",
        entityId: customerId,
        createdAt: { gte: new Date(Date.now() - 3600_000) },
      },
    });
    if (recentScans >= SCANS_PER_HOUR) {
      return NextResponse.json({ error: "Too many scans in the last hour. Please try again a bit later." }, { status: 429 });
    }

    const image = Buffer.from(await file.arrayBuffer());
    const imageSha = createHash("sha256").update(image).digest("hex");
    await storeReceiptImage(imageSha, image);

    const samePhoto = await prisma.auditLog.findFirst({
      where: { action: "customer.receipt_claim", metadata: { path: ["imageSha"], equals: imageSha } },
    });
    if (samePhoto) {
      return NextResponse.json({ error: "This receipt photo has already been used to earn points." }, { status: 409 });
    }

    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true, city: true, address: true },
      orderBy: { name: "asc" },
    });

    const reading = await readReceipt(image, mime, branches);

    await prisma.auditLog.create({
      data: {
        action: "customer.receipt_scan",
        entityType: "Customer",
        entityId: customerId,
        metadata: { imageSha, ...reading },
      },
    });

    const fail = (error: string, status = 422) => NextResponse.json({ error, reading }, { status });

    if (!reading.isReceipt) return fail("We couldn't find a bill in that photo. Please photograph the whole printed receipt.");
    if (!reading.isBrandBill) return fail("This doesn't look like a Levante receipt. Only our bills earn points.");
    if (!reading.invoiceNumber || !reading.total || reading.confidence < 0.5) {
      return fail("We couldn't read the invoice number and total clearly. Please retake the photo in good light, flat and in focus.");
    }

    if (reading.date) {
      const age = receiptAgeDays(reading.date);
      const maxAge = (await getNumber("receipt_max_age_days")) || 7;
      if (age < -1) return fail("The date on this receipt is in the future. Please check the photo.");
      if (age > maxAge) return fail(`This receipt is ${age} days old. Bills can be claimed within ${maxAge} days of your visit.`);
    }

    let branch = reading.branchCode ? branches.find((b) => b.code.toUpperCase() === reading.branchCode) ?? null : null;
    if (!branch && branches.length === 1) branch = branches[0];

    // the same bill must not earn twice: same invoice at that outlet, or same invoice + same total anywhere
    const duplicate = await prisma.transaction.findFirst({
      where: {
        invoiceNumber: reading.invoiceNumber,
        ...(branch ? { branchId: branch.id } : {}),
      },
    });
    if (duplicate) {
      return fail(`Invoice #${reading.invoiceNumber} has already been used to earn points.`, 409);
    }

    await storeReceiptImage(imageSha, image);

    const claimToken = await signReceiptClaim({
      customerId,
      invoiceNumber: reading.invoiceNumber,
      total: reading.total,
      branchId: branch?.id ?? null,
      receiptDate: reading.date,
      imageSha,
      outletText: reading.outletText,
    });

    return NextResponse.json({
      ok: true,
      receipt: {
        invoiceNumber: reading.invoiceNumber,
        total: reading.total,
        currency: reading.currency || (await getSetting("currency")) || "AED",
        date: reading.date,
        outletText: reading.outletText,
      },
      branch: branch ? { id: branch.id, name: branch.name, city: branch.city } : null,
      // only needed when we could not tell which outlet issued the bill
      branches: branch ? [] : branches.map((b) => ({ id: b.id, name: b.name, city: b.city })),
      pointsToEarn: await pointsForAmount(reading.total),
      claimToken,
    });
  } catch (err: any) {
    console.error("POST /api/receipts/scan error:", err);
    return NextResponse.json({ error: err?.message || "Could not read the receipt." }, { status: 500 });
  }
}
