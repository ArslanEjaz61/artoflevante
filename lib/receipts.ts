import { SignJWT, jwtVerify } from "jose";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSetting } from "./loyalty";

/**
 * Receipt scanning for the customer app.
 *
 * Flow: the customer photographs a bill -> /api/receipts/scan reads it with a vision model and
 * returns what it found plus a signed claim token -> the customer confirms -> /api/receipts/claim
 * awards the points. The amounts come from the signed token, never from the browser, so a customer
 * cannot edit the total before claiming.
 */

export interface ReceiptReading {
  isReceipt: boolean;
  isBrandBill: boolean;
  invoiceNumber: string | null;
  total: number | null;
  currency: string | null;
  date: string | null; // YYYY-MM-DD as printed on the bill
  outletText: string | null;
  branchCode: string | null; // one of the codes we passed in, or null
  confidence: number; // 0..1, the model's own estimate
}

export interface BranchHint {
  code: string;
  name: string;
  city?: string | null;
  address?: string | null;
}

// Tried in order: free vision models get rate-limited upstream now and then, so fall through to the next.
// The first one can be set from Admin > Settings (receipt_vision_model), e.g. a paid model once credit is added.
async function visionModels(): Promise<string[]> {
  const chosen = (await getSetting("receipt_vision_model")).trim() || process.env.RECEIPT_VISION_MODEL || "nvidia/nemotron-3.5-super-vl:free";
  return [chosen, "google/gemma-4-31b-it:free", "google/gemma-4-26b-a4b-it:free"].filter((m, i, all) => all.indexOf(m) === i);
}

const PROMPT = `You read restaurant bills for the Levante loyalty programme (Art of Levante, a Lebanese restaurant in Dubai, UAE).
Look at the photo and answer with ONE JSON object and nothing else:
{
  "isReceipt": boolean,            // is this a printed bill / tax invoice / receipt at all?
  "isBrandBill": boolean,    // was it issued by Levante (name or logo on the bill)?
  "invoiceNumber": string|null,    // the bill / invoice / receipt / order number exactly as printed (not the table, cover or TRN number)
  "total": number|null,            // the FINAL amount the guest paid: grand total / net payable / total incl. VAT. Not the subtotal, not the VAT line.
  "currency": string|null,         // e.g. "AED"
  "date": string|null,             // bill date as YYYY-MM-DD
  "outletText": string|null,       // outlet / branch name or address as printed
  "branchCode": string|null,       // the code from BRANCHES below that matches this outlet, or null if unsure
  "confidence": number             // 0..1: how sure you are about invoiceNumber and total together
}
If a value is not clearly readable, use null rather than guessing.`;

/** Reads a bill photo. Throws if the model is unreachable or returns something unusable. */
export async function readReceipt(image: Buffer, mime: string, branches: BranchHint[]): Promise<ReceiptReading> {
  // Key is managed from Admin > Settings; the env var stays as a fallback.
  const key = (await getSetting("openrouter_api_key")).trim() || process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("Receipt scanning is not configured yet.");

  const branchList = branches
    .map((b) => `${b.code}: ${b.name}${b.city ? `, ${b.city}` : ""}${b.address ? ` (${b.address})` : ""}`)
    .join("\n");

  const content = [
    { type: "text", text: `${PROMPT}\n\nBRANCHES:\n${branchList || "(none)"}` },
    { type: "image_url", image_url: { url: `data:${mime};base64,${image.toString("base64")}` } },
  ];

  let raw: any = null;
  for (const model of await visionModels()) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(40_000),
        body: JSON.stringify({
          model,
          temperature: 0,
          max_tokens: 1200,
          // reasoning models otherwise spend the whole budget thinking and never write the JSON
          reasoning: { enabled: false },
          messages: [{ role: "user", content }],
        }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error("receipt vision error", model, res.status, detail.slice(0, 300));
        continue;
      }
      const data = await res.json();
      const text: string = data?.choices?.[0]?.message?.content ?? "";
      const json = text.match(/\{[\s\S]*\}/)?.[0];
      if (!json) {
        console.error("receipt vision: no JSON from", model, text.slice(0, 200));
        continue;
      }
      raw = JSON.parse(json);
      break;
    } catch (err) {
      console.error("receipt vision failed", model, err);
    }
  }
  if (!raw) throw new Error("Could not read the receipt right now. Please try again in a minute.");

  const total = typeof raw.total === "number" ? raw.total : Number(String(raw.total ?? "").replace(/[^0-9.]/g, ""));
  const invoice = String(raw.invoiceNumber ?? "").trim().toUpperCase().replace(/\s+/g, "");
  const codes = new Set(branches.map((b) => b.code.toUpperCase()));
  const branchCode = raw.branchCode && codes.has(String(raw.branchCode).toUpperCase()) ? String(raw.branchCode).toUpperCase() : null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(raw.date ?? "")) ? String(raw.date) : null;

  return {
    isReceipt: raw.isReceipt === true,
    isBrandBill: raw.isBrandBill === true,
    invoiceNumber: invoice || null,
    total: Number.isFinite(total) && total > 0 ? Math.round(total * 100) / 100 : null,
    currency: raw.currency ? String(raw.currency).toUpperCase().slice(0, 5) : null,
    date,
    outletText: raw.outletText ? String(raw.outletText).slice(0, 160) : null,
    branchCode,
    confidence: Math.max(0, Math.min(1, Number(raw.confidence) || 0)),
  };
}

// ------------------------------------------------------------ signed claim token

export interface ReceiptClaim {
  customerId: string;
  invoiceNumber: string;
  total: number;
  branchId: string | null; // null when the outlet could not be matched; the customer picks one
  receiptDate: string | null;
  imageSha: string;
  outletText: string | null;
}

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FATAL: SESSION_SECRET environment variable is missing in production!");
    }
    return new TextEncoder().encode("default_fallback_session_secret_at_least_32_characters_long");
  }
  return new TextEncoder().encode(value);
}

export async function signReceiptClaim(claim: ReceiptClaim): Promise<string> {
  return new SignJWT({ ...claim, kind: "receipt_claim" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("20m")
    .sign(secret());
}

export async function verifyReceiptClaim(token: string): Promise<ReceiptClaim | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.kind !== "receipt_claim") return null;
    return {
      customerId: String(payload.customerId),
      invoiceNumber: String(payload.invoiceNumber),
      total: Number(payload.total),
      branchId: payload.branchId ? String(payload.branchId) : null,
      receiptDate: payload.receiptDate ? String(payload.receiptDate) : null,
      imageSha: String(payload.imageSha),
      outletText: payload.outletText ? String(payload.outletText) : null,
    };
  } catch {
    return null;
  }
}

// ------------------------------------------------------------ keeping the photo

/** Keeps every scanned bill (outside /public) so a disputed claim can be checked later. */
export async function storeReceiptImage(sha: string, image: Buffer): Promise<void> {
  try {
    const dir = path.join(process.cwd(), "storage", "receipts");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${sha}.jpg`), image);
  } catch (err) {
    console.error("could not store receipt image", err);
  }
}

/** Days between a YYYY-MM-DD bill date and today (UAE time). Negative = future. */
export function receiptAgeDays(date: string): number {
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" }));
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${date}T00:00:00`);
  return Math.round((today.getTime() - d.getTime()) / 86400_000);
}
