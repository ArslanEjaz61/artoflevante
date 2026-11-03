import { SignJWT, jwtVerify } from "jose";
import { mkdir, writeFile } from "node:fs/promises";
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

export { MIN_RECEIPT_DATE, getBranchInvoicePrefix, formatFullInvoice } from "./receiptUtils";

const BRAND_PROMPT = `You are a specialist receipt verification AI for Levante (Art of Levante: a Dubai, UAE brand selling coffee, flowers and chocolates).

Inspect the uploaded image thoroughly and extract the data as a single JSON object.

CRITICAL AUTHENTICITY CHECKS:
1. Is it a printed receipt / tax invoice / bill?
   - If not a receipt at all (e.g. random photo, selfie, furniture, scenery, fake graphic), set "isReceipt": false, "isBrandBill": false, and explain in "rejectionReason".
2. Is it genuinely issued by LEVANTE?
   - Look for the name "Levante" or "Art of Levante" (or the Levante logo with "Coffee · Flowers · Chocolates") at the top of the bill.
   - If this receipt belongs to ANY other merchant (e.g. Carrefour, Lulu, McDonald's, KFC, Starbucks, petrol station, or another cafe or flower shop), you MUST set "isBrandBill": false and "rejectionReason": "This receipt is from another store/brand. Only authentic Levante receipts are accepted."

FIELD EXTRACTION RULES:
- invoiceNumber: The TAX INVOICE / bill number printed on the bill (not the table number, order token or TRN). Extract the unique identifier exactly as printed. Strip any surrounding labels, leave just the clean invoice code.
- total: The FINAL net payable amount paid by customer (grand total including 5% VAT in AED).
  Examples:
  - If bill shows "Total AED 31.00", return 31.00.
  - If bill shows "Total AED 44.00", return 44.00.
  - If bill shows "Total AED 10.00", return 10.00.
  - If bill shows "Total AED 55.00", return 55.00.
  - If bill shows "Total AED 4.00", return 4.00.
  DO NOT return Sub Total, Net Amount, VAT Amount, or Amount Received / Balance. Return ONLY the final Total amount.
- currency: Currency code (e.g. "AED").
- date: Date printed on the receipt in YYYY-MM-DD format. Convert any printed date format (for example "01-Nov-2026") to "2026-11-01".
- outletText: The outlet / branch name or staff location printed on the bill (for example "Levante - Al Jaddaf").
- branchCode: Compare outletText with the BRANCHES list below and match the exact branch code if recognized, otherwise null.
- trn: The Tax Registration Number printed on the bill, or null.
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
