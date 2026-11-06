/**
 * Pure utility functions for Levante invoice formatting & receipt validation.
 * Safe for use in both Server and Client ("use client") components.
 */

/**
 * Minimum receipt eligibility date: November 1, 2026 (start of the Levante receipt-scan programme).
 * Receipts printed prior to this date cannot be claimed.
 */
export const MIN_RECEIPT_DATE = "2026-11-01";

/** Official Tax Registration Number (TRN) for Levante UAE */
export const LEVANTE_OFFICIAL_TRN = "104974684300003";

/**
 * Generates the dynamic invoice prefix for a branch.
 * Example: LV-26-
 * The 2-digit year is dynamic based on the provided or current date.
 *
 * @param invoicePrefix Branch prefix (e.g. "LV")
 * @param date Optional date to extract year from (defaults to now)
 */
export function getBranchInvoicePrefix(invoicePrefix?: string | null, date: Date | string = new Date()): string {
  const prefix = (invoicePrefix || "LV").trim().toUpperCase();
  const d = typeof date === "string" ? new Date(date) : date;
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const year2 = validDate.getFullYear().toString().slice(-2);
  return `${prefix}-${year2}-`;
}

/**
 * Extracts the core numeric or alphanumeric serial from an invoice string.
 * Examples:
 * - "4974" -> "4974"
 * - "Bill No : 4974" -> "4974"
 * - "Bill No: 4974" -> "4974"
 * - "LV-26-4974" -> "4974"
 * - "1001-26-4974" -> "4974"
 * - "INV# 4974" -> "4974"
 */
export function extractSerialFromInvoice(input?: string | null): string {
  if (!input) return "";
  let clean = String(input)
    .trim()
    .replace(/^TAX\s*INVOICE\s*[:#\-]?\s*/i, "")
    .replace(/^BILL\s*NO\.?\s*[:#\-]?\s*/i, "")
    .replace(/^BILL\s*#\s*/i, "")
    .replace(/^INV#\s*/i, "")
    .replace(/^INVOICE\s*NO\.?\s*[:#\-]?\s*/i, "")
    .replace(/^INVOICE\s*[:#\-]?\s*/i, "")
    .trim();

  // If formatted as PREFIX-YY-SERIAL (e.g. LV-26-4974 or 1001-26-4974)
  const parts = clean.split("-");
  if (parts.length >= 3 && /^\d+$/.test(parts[parts.length - 1])) {
    return parts[parts.length - 1];
  }

  // Extract trailing digits if preceded by colon/space/etc.
  const match = clean.match(/(\d+)$/);
  if (match) return match[1];

  return clean.replace(/[^A-Z0-9]/gi, "");
}

/**
 * Normalizes an invoice number from user/cashier input or AI scan.
 * Ensures format is always uppercase and consistent with year and branch prefix (e.g. LV-26-4974).
 *
 * @param input Raw input from cashier or user (e.g. "4974", "Bill No : 4974", "LV-26-4974")
 * @param branchInvoicePrefix Branch prefix (e.g. "LV")
 * @param date Optional date for year
 */
export function formatFullInvoice(
  input: string,
  branchInvoicePrefix?: string | null,
  date: Date | string = new Date()
): string {
  if (!input) return "";
  let clean = String(input)
    .trim()
    .toUpperCase()
    .replace(/^TAX\s*INVOICE\s*[:#\-]?\s*/i, "")
    .replace(/^BILL\s*NO\.?\s*[:#\-]?\s*/i, "")
    .replace(/^BILL\s*#\s*/i, "")
    .replace(/^INV#\s*/i, "")
    .replace(/^INVOICE\s*NO\.?\s*[:#\-]?\s*/i, "")
    .replace(/^INVOICE\s*[:#\-]?\s*/i, "")
    .replace(/\s+/g, "");

  if (!clean) return "";

  const prefix = getBranchInvoicePrefix(branchInvoicePrefix, date);

  // If already starts with the branch prefix (e.g. LV-26-4974)
  if (clean.startsWith(prefix)) {
    return clean;
  }

  // If user entered without hyphens (e.g. LV264974)
  const prefixClean = prefix.replace(/-/g, "");
  if (clean.replace(/-/g, "").startsWith(prefixClean)) {
    const serial = clean.replace(/-/g, "").slice(prefixClean.length);
    return `${prefix}${serial}`;
  }

  // If user entered another known prefix with year (e.g. LVM-26-4974 or 1001-26-4974)
  if (/^[A-Z0-9]{2,6}-\d{2}-\d+$/.test(clean)) {
    return clean;
  }

  // Extract pure serial and append prefix
  const serial = extractSerialFromInvoice(clean);
  return `${prefix}${serial || clean.replace(/^[-\s]+/, "")}`;
}
