/**
 * Pure utility functions for Levante invoice formatting & receipt validation.
 * Safe for use in both Server and Client ("use client") components.
 */

/**
 * Minimum receipt eligibility date: November 1, 2026 (start of the Levante receipt-scan programme).
 * Receipts printed prior to this date cannot be claimed.
 */
export const MIN_RECEIPT_DATE = "2026-11-01";

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
 * Normalizes an invoice number from user/cashier input or AI scan.
 * Ensures format is always uppercase and consistent (e.g. LV-26-88280).
 *
 * @param input Raw input from cashier or user (e.g. "88280", "LV-26-88280", "INV# LV-26-88280")
 * @param branchInvoicePrefix Branch prefix (e.g. "LV")
 * @param date Optional date for year
 */
export function formatFullInvoice(
  input: string,
  branchInvoicePrefix?: string | null,
  date: Date | string = new Date()
): string {
  let clean = String(input || "").trim().toUpperCase().replace(/^INV#\s*/i, "").replace(/\s+/g, "");
  if (!clean) return "";

  const prefix = getBranchInvoicePrefix(branchInvoicePrefix, date);

  // If already starts with the branch prefix (e.g. LV-26-88280)
  if (clean.startsWith(prefix)) {
    return clean;
  }

  // If user entered without hyphens (e.g. LV2688280)
  const prefixClean = prefix.replace(/-/g, "");
  if (clean.replace(/-/g, "").startsWith(prefixClean)) {
    const serial = clean.replace(/-/g, "").slice(prefixClean.length);
    return `${prefix}${serial}`;
  }

  // If user entered another known prefix with year (e.g. LVM-26-64615)
  if (/^[A-Z]{2,6}-\d{2}-\d+$/.test(clean)) {
    return clean;
  }

  // If user only entered the serial number (e.g. "88280")
  return `${prefix}${clean.replace(/^[-\s]+/, "")}`;
}
