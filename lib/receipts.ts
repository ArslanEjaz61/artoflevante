import { prisma } from "./db";
import { SignJWT, jwtVerify } from "jose";
import { mkdir, writeFile, readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { getSetting } from "./loyalty";

/**
 * Receipt scanning & AI Vision Engine for Levante Rewards.
 *
 * Supports 3 primary AI vision providers:
 * 1. Google Gemini (Recommended - lowest latency, high accuracy)
 * 2. OpenAI (GPT-4o / GPT-4o-mini)
 * 3. OpenRouter (Unified multi-provider access)
 *
 * Authenticity verification:
 * - Validates Levante brand presence (name or "Coffee · Flowers · Chocolates" logo on the bill)
 * - Automatically rejects receipts belonging to other brands or stores
 * - Extracts the printed invoice number, date, total payable, and outlet
 */

export interface ReceiptReading {
  isReceipt: boolean;
  isBrandBill: boolean;
  rejectionReason: string | null;
  trn: string | null;
  invoiceNumber: string | null;
  total: number | null;
  currency: string | null;
  date: string | null; // YYYY-MM-DD as printed on the bill
  outletText: string | null;
  branchCode: string | null; // matched branch code or null
  confidence: number; // 0..1
  providerUsed?: string;
  modelUsed?: string;
}

export interface BranchHint {
  code: string;
  name: string;
  city?: string | null;
  address?: string | null;
  invoicePrefix?: string | null;
}

export { MIN_RECEIPT_DATE, LEVANTE_OFFICIAL_TRN, getBranchInvoicePrefix, formatFullInvoice, extractSerialFromInvoice } from "./receiptUtils";

const BRAND_PROMPT = `You are a specialist receipt verification AI for Levante (Art of Levante: a Dubai, UAE restaurant & cafe brand selling artisan coffee, fresh flowers and luxury chocolates).

Inspect the uploaded image thoroughly and extract the data as a single JSON object.

CRITICAL AUTHENTICITY & BRAND VALIDATION CHECKS (STRICT BRAND ENFORCEMENT):
1. Is it a printed receipt / tax invoice / bill?
   - If not a printed physical or digital receipt (e.g. random photo, selfie, furniture, scenery, fake graphic, menu card), set "isReceipt": false, "isBrandBill": false, and explain in "rejectionReason".
2. MUST BE AN AUTHENTIC LEVANTE RECEIPT:
   - The receipt MUST be genuinely issued by "Levante" (or "Art of Levante").
   - Official hallmarks of an authentic Levante receipt:
     * Header: "Levante" or "Levante, Boutique XII Building - Jaddaf Waterfront - Dubai - United Arab Emirates"
     * Contact: "042412288"
     * Tax Registration Number (TRN): "104974684300003"
     * Footer Slogan: "Fresh Flowers • Artisan Coffee • Chocolates"
     * POS System: "Powered by TMBill"
   - If this receipt belongs to ANY other merchant or brand (e.g. Carrefour, Lulu, McDonald's, KFC, Starbucks, Costa, petrol station, supermarket, or ANY other cafe/restaurant), you MUST set:
     "isBrandBill": false,
     "rejectionReason": "This receipt does not belong to Levante. Only authentic Levante receipts are accepted."

FIELD EXTRACTION RULES:
- invoiceNumber: The printed TAX INVOICE / bill number (e.g. "4974" from "Bill No : 4974"). Extract ONLY the numeric or alphanumeric serial, strip prefixes like "Bill No :".
- total: The FINAL net payable Grand Total paid by customer in AED (e.g. 53.00 from "Grand Total : AED 53.00"). DO NOT return Sub Total, Net Amount, VAT Amount, or Amount Received / Balance. Return ONLY the final Grand Total.
- currency: Currency code (must be "AED" for Levante Dubai).
- date: The date printed on the receipt in YYYY-MM-DD format (for example "06 November 2026" or "06-Nov-2026" -> "2026-11-06").
- outletText: The outlet / branch name or address printed on the bill (for example "Levante - Al Jaddaf Waterfront").
- branchCode: Compare outletText with the BRANCHES list below and match the exact branch code if recognized, otherwise null.
- trn: The Tax Registration Number printed on the bill (for Levante: "104974684300003"), or null.
- confidence: A float between 0.0 and 1.0 indicating clarity and confidence in invoiceNumber + total.

Respond with ONLY this JSON structure (no markdown fences, no explanation text outside JSON):
{
  "isReceipt": boolean,
  "isBrandBill": boolean,
  "rejectionReason": string | null,
  "trn": string | null,
  "invoiceNumber": string | null,
  "total": number | null,
  "currency": string | null,
  "date": string | null,
  "outletText": string | null,
  "branchCode": string | null,
  "confidence": number
}`;

/** Call Google Gemini Vision REST API directly */
async function callGemini(
  image: Buffer,
  mime: string,
  promptText: string,
  apiKey: string,
  model: string
): Promise<{ raw: any; modelUsed: string }> {
  const chosenModel = model.trim() || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: promptText },
          {
            inline_data: {
              mime_type: mime,
              data: image.toString("base64"),
            },
          },
        ],
      },
    ],
    generationConfig: {
      response_mime_type: "application/json",
      temperature: 0.1,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini API error (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonMatch) {
    throw new Error(`Gemini returned non-JSON response: ${text.slice(0, 200)}`);
  }

  return { raw: JSON.parse(jsonMatch), modelUsed: chosenModel };
}

/** Call OpenAI Vision REST API */
async function callOpenAI(
  image: Buffer,
  mime: string,
  promptText: string,
  apiKey: string,
  model: string
): Promise<{ raw: any; modelUsed: string }> {
  const chosenModel = model.trim() || "gpt-4o-mini";
  const url = "https://api.openai.com/v1/chat/completions";

  const payload = {
    model: chosenModel,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: promptText },
          {
            type: "image_url",
            image_url: { url: `data:${mime};base64,${image.toString("base64")}` },
          },
        ],
      },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI API error (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonMatch) {
    throw new Error(`OpenAI returned non-JSON response: ${text.slice(0, 200)}`);
  }

  return { raw: JSON.parse(jsonMatch), modelUsed: chosenModel };
}

/** Call OpenRouter Vision REST API */
async function callOpenRouter(
  image: Buffer,
  mime: string,
  promptText: string,
  apiKey: string,
  model: string
): Promise<{ raw: any; modelUsed: string }> {
  const chosenModel = model.trim() || "google/gemini-2.5-flash";
  const url = "https://openrouter.ai/api/v1/chat/completions";

  const payload = {
    model: chosenModel,
    temperature: 0.1,
    max_tokens: 1500,
    reasoning: { enabled: false },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: promptText },
          {
            type: "image_url",
            image_url: { url: `data:${mime};base64,${image.toString("base64")}` },
          },
        ],
      },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenRouter API error (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonMatch) {
    throw new Error(`OpenRouter returned non-JSON response: ${text.slice(0, 200)}`);
  }

  return { raw: JSON.parse(jsonMatch), modelUsed: chosenModel };
}

/**
 * Reads a bill photo using the active AI provider configured in Admin > Settings.
 * Automatically fails over to other configured providers if primary fails.
 */
export async function readReceipt(
  image: Buffer,
  mime: string,
  branches: BranchHint[]
): Promise<ReceiptReading> {
  const activeProvider = ((await getSetting("receipt_ai_provider")) || "gemini").trim().toLowerCase();

  // Load credentials for all three providers from settings or env
  const geminiKey = ((await getSetting("gemini_api_key")) || process.env.GEMINI_API_KEY || "").trim();
  const geminiModel = ((await getSetting("gemini_model")) || "gemini-2.5-flash").trim();

  const openAIKey = ((await getSetting("openai_api_key")) || process.env.OPENAI_API_KEY || "").trim();
  const openAIModel = ((await getSetting("openai_model")) || "gpt-4o-mini").trim();

  const openRouterKey = (
    (await getSetting("openrouter_api_key")) ||
    process.env.OPENROUTER_API_KEY ||
    ""
  ).trim();
  const openRouterModel = (
    (await getSetting("openrouter_model")) ||
    (await getSetting("receipt_vision_model")) ||
    "google/gemini-2.5-flash"
  ).trim();

  const branchList = branches
    .map((b) => `${b.code}: ${b.name}${b.city ? `, ${b.city}` : ""}${b.address ? ` (${b.address})` : ""}`)
    .join("\n");

  const fullPrompt = `${BRAND_PROMPT}\n\nREGISTERED RESTAURANT BRANCHES:\n${branchList || "(none)"}`;

  // Form provider execution queue based on active choice
  const providersQueue: Array<{
    name: "gemini" | "openai" | "openrouter";
    key: string;
    model: string;
  }> = [];

  if (activeProvider === "openai") {
    if (openAIKey) providersQueue.push({ name: "openai", key: openAIKey, model: openAIModel });
    if (geminiKey) providersQueue.push({ name: "gemini", key: geminiKey, model: geminiModel });
    if (openRouterKey) providersQueue.push({ name: "openrouter", key: openRouterKey, model: openRouterModel });
  } else if (activeProvider === "openrouter") {
    if (openRouterKey) providersQueue.push({ name: "openrouter", key: openRouterKey, model: openRouterModel });
    if (geminiKey) providersQueue.push({ name: "gemini", key: geminiKey, model: geminiModel });
    if (openAIKey) providersQueue.push({ name: "openai", key: openAIKey, model: openAIModel });
  } else {
    // Default to Gemini
    if (geminiKey) providersQueue.push({ name: "gemini", key: geminiKey, model: geminiModel });
    if (openAIKey) providersQueue.push({ name: "openai", key: openAIKey, model: openAIModel });
    if (openRouterKey) providersQueue.push({ name: "openrouter", key: openRouterKey, model: openRouterModel });
  }

  if (providersQueue.length === 0) {
    throw new Error(
      "No AI vision key configured. Please configure Google Gemini, OpenAI, or OpenRouter in Admin > Settings > AI Receipt Models."
    );
  }

  let raw: any = null;
  let successfulProvider = "";
  let successfulModel = "";
  let lastError: any = null;

  for (const provider of providersQueue) {
    try {
      if (provider.name === "gemini") {
        const res = await callGemini(image, mime, fullPrompt, provider.key, provider.model);
        raw = res.raw;
        successfulModel = res.modelUsed;
        successfulProvider = "Google Gemini";
        break;
      } else if (provider.name === "openai") {
        const res = await callOpenAI(image, mime, fullPrompt, provider.key, provider.model);
        raw = res.raw;
        successfulModel = res.modelUsed;
        successfulProvider = "OpenAI GPT";
        break;
      } else if (provider.name === "openrouter") {
        const res = await callOpenRouter(image, mime, fullPrompt, provider.key, provider.model);
        raw = res.raw;
        successfulModel = res.modelUsed;
        successfulProvider = "OpenRouter";
        break;
      }
    } catch (err: any) {
      console.error(`AI Vision failed with ${provider.name}:`, err?.message || err);
      lastError = err;
    }
  }

  if (!raw) {
    throw new Error(
      lastError?.message ||
        "Could not analyze the receipt with AI models. Please verify API keys in Admin Settings."
    );
  }

  // Parse and normalize output
  const total =
    typeof raw.total === "number"
      ? raw.total
      : Number(String(raw.total ?? "").replace(/[^0-9.]/g, ""));

  let invoice = String(raw.invoiceNumber ?? "")
    .trim()
    .toUpperCase()
    .replace(/^INV#\s*/i, "")
    .replace(/\s+/g, "");

  const codes = new Set(branches.map((b) => b.code.toUpperCase()));
  const branchCode =
    raw.branchCode && codes.has(String(raw.branchCode).toUpperCase())
      ? String(raw.branchCode).toUpperCase()
      : null;

  let date: string | null = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(raw.date ?? ""))) {
    date = String(raw.date);
  } else if (typeof raw.date === "string") {
    // Try parsing date string like 01-Nov-2026
    const parsed = new Date(raw.date);
    if (!isNaN(parsed.getTime())) {
      date = parsed.toISOString().split("T")[0];
    }
  }

  return {
    isReceipt: raw.isReceipt === true,
    isBrandBill: raw.isBrandBill === true,
    rejectionReason: raw.rejectionReason ? String(raw.rejectionReason) : null,
    trn: raw.trn ? String(raw.trn) : null,
    invoiceNumber: invoice || null,
    total: Number.isFinite(total) && total > 0 ? Math.round(total * 100) / 100 : null,
    currency: raw.currency ? String(raw.currency).toUpperCase().slice(0, 5) : "AED",
    date,
    outletText: raw.outletText ? String(raw.outletText).slice(0, 160) : null,
    branchCode,
    confidence: Math.max(0, Math.min(1, Number(raw.confidence) || 0)),
    providerUsed: successfulProvider,
    modelUsed: successfulModel,
  };
}

/** Lightweight API connection test */
export async function testAIConnection(
  provider: "gemini" | "openai" | "openrouter",
  apiKey: string,
  model?: string
): Promise<{ ok: boolean; latencyMs: number; message: string }> {
  const start = Date.now();
  const trimmedKey = (apiKey || "").trim();
  if (!trimmedKey) {
    return { ok: false, latencyMs: 0, message: "API Key cannot be blank." };
  }

  try {
    if (provider === "gemini") {
      const chosenModel = (model || "gemini-2.5-flash").trim();
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${trimmedKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(15_000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: "ping" }] }],
            generationConfig: { maxOutputTokens: 5 },
          }),
        }
      );
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        return { ok: false, latencyMs: Date.now() - start, message: `Gemini error ${res.status}: ${t.slice(0, 150)}` };
      }
      return { ok: true, latencyMs: Date.now() - start, message: `Connected to Gemini (${chosenModel}) successfully!` };
    }

    if (provider === "openai") {
      const chosenModel = (model || "gpt-4o-mini").trim();
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${trimmedKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(15_000),
        body: JSON.stringify({
          model: chosenModel,
          max_tokens: 5,
          messages: [{ role: "user", content: "ping" }],
        }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        return { ok: false, latencyMs: Date.now() - start, message: `OpenAI error ${res.status}: ${t.slice(0, 150)}` };
      }
      return { ok: true, latencyMs: Date.now() - start, message: `Connected to OpenAI (${chosenModel}) successfully!` };
    }

    if (provider === "openrouter") {
      const chosenModel = (model || "google/gemini-2.5-flash").trim();
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${trimmedKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(15_000),
        body: JSON.stringify({
          model: chosenModel,
          max_tokens: 5,
          messages: [{ role: "user", content: "ping" }],
        }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        return { ok: false, latencyMs: Date.now() - start, message: `OpenRouter error ${res.status}: ${t.slice(0, 150)}` };
      }
      return { ok: true, latencyMs: Date.now() - start, message: `Connected to OpenRouter (${chosenModel}) successfully!` };
    }

    return { ok: false, latencyMs: 0, message: "Unsupported provider." };
  } catch (err: any) {
    return { ok: false, latencyMs: Date.now() - start, message: err?.message || "Connection timed out." };
  }
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

// ------------------------------------------------------------ keeping the photo & auto-cleanup

let lastCleanupAt = 0;

/**
 * Automatically cleans up scanned receipt photos older than maxAgeDays (default: 10 days).
 * Keeps server storage lightweight and prevents disk space exhaustion.
 */
export async function cleanOldReceiptImages(maxAgeDays = 10): Promise<{ deleted: number; scanned: number }> {
  let deleted = 0;
  let scanned = 0;
  try {
    const dir = path.join(process.cwd(), "storage", "receipts");
    let files: string[] = [];
    try {
      files = await readdir(dir);
    } catch {
      return { deleted: 0, scanned: 0 };
    }

    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (const file of files) {
      if (!file.endsWith(".jpg") && !file.endsWith(".png") && !file.endsWith(".jpeg")) continue;
      scanned += 1;
      const filePath = path.join(dir, file);
      try {
        const fileStat = await stat(filePath);
        const ageMs = now - fileStat.mtimeMs;
        if (ageMs > maxAgeMs) {
          await unlink(filePath);
          deleted += 1;
        }
      } catch {
        // file might have been removed concurrently, ignore
      }
    }
  } catch (err) {
    console.error("cleanOldReceiptImages failed:", err);
  }
  return { deleted, scanned };
}

// ------------------------------------------------------------ keeping the photo

/** Keeps every scanned bill (outside /public) so a disputed claim can be checked later. */
export async function storeReceiptImage(sha: string, image: Buffer): Promise<void> {
  try {
    const dir = path.join(process.cwd(), "storage", "receipts");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${sha}.jpg`), image);

    const now = Date.now();
    if (now - lastCleanupAt > 12 * 60 * 60 * 1000) {
      lastCleanupAt = now;
      cleanOldReceiptImages(10).catch(() => {});
    }
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


export interface DuplicateInvoiceResult {
  isDuplicate: boolean;
  location: string;
  invoiceNumber: string;
  date: string | null;
  amount: number | null;
  customerId: string | null;
  source: "TRANSACTION" | "VISIT";
}

/**
 * Searches across Transaction and CustomerVisit for any prior use of this invoice or bill number.
 * Matches:
 * 1. Full formatted invoice (e.g. LV-26-4974)
 * 2. Raw serial number (e.g. 4974)
 * 3. Suffix / ending with serial (e.g. -4974)
 * 4. Variations with INV# or RCPT-
 */
export async function findExistingInvoice(
  invoiceInput: string,
  branchInvoicePrefix?: string | null,
  receiptDate?: Date | string | null
): Promise<DuplicateInvoiceResult | null> {
  const { extractSerialFromInvoice, formatFullInvoice } = await import("./receiptUtils");
  const serial = extractSerialFromInvoice(invoiceInput);
  const fullInvoice = formatFullInvoice(invoiceInput, branchInvoicePrefix || "LV", receiptDate || new Date());

  const searchInvoices = new Set<string>();
  if (fullInvoice) searchInvoices.add(fullInvoice.toUpperCase());
  if (serial) {
    searchInvoices.add(serial);
    searchInvoices.add(`LV-26-${serial}`);
    searchInvoices.add(`1001-26-${serial}`);
    searchInvoices.add(`INV# ${serial}`);
    searchInvoices.add(`INV# ${fullInvoice}`);
  }

  // 1. Check Transaction table
  const txConditions: any[] = Array.from(searchInvoices).map((inv) => ({
    invoiceNumber: { equals: inv, mode: "insensitive" },
  }));
  if (serial) {
    txConditions.push({ invoiceNumber: { endsWith: `-${serial}`, mode: "insensitive" } });
  }

  const existingTx = await prisma.transaction.findFirst({
    where: { OR: txConditions },
    include: { branch: true, customer: true, staff: true },
  });

  if (existingTx) {
    return {
      isDuplicate: true,
      location: existingTx.branch?.name || "Levante",
      invoiceNumber: existingTx.invoiceNumber,
      date: existingTx.createdAt ? existingTx.createdAt.toISOString().split("T")[0] : null,
      amount: Number(existingTx.amount) || null,
      customerId: existingTx.customerId,
      source: "TRANSACTION",
    };
  }

  // 2. Check CustomerVisit table
  const visitConditions: any[] = [];
  Array.from(searchInvoices).forEach((inv) => {
    visitConditions.push(
      { couponCode: { equals: inv, mode: "insensitive" } },
      { couponCode: { equals: `RCPT-${inv}`, mode: "insensitive" } }
    );
  });
  if (serial) {
    visitConditions.push(
      { couponCode: { endsWith: `-${serial}`, mode: "insensitive" } }
    );
  }

  const existingVisit = await prisma.customerVisit.findFirst({
    where: { OR: visitConditions },
    include: { branch: true, customer: true },
  });

  if (existingVisit) {
    return {
      isDuplicate: true,
      location: existingVisit.branch?.name || "Levante",
      invoiceNumber: existingVisit.couponCode,
      date: existingVisit.createdAt ? existingVisit.createdAt.toISOString().split("T")[0] : null,
      amount: null,
      customerId: existingVisit.customerId,
      source: "VISIT",
    };
  }

  return null;
}
