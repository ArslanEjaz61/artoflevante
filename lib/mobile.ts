export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  min: number;
  max: number;
}

export const COUNTRIES: CountryOption[] = [
  { code: "971", name: "UAE", flag: "🇦🇪", min: 9, max: 9 },
  { code: "966", name: "Saudi Arabia", flag: "🇸🇦", min: 9, max: 9 },
  { code: "968", name: "Oman", flag: "🇴🇲", min: 8, max: 8 },
  { code: "974", name: "Qatar", flag: "🇶🇦", min: 8, max: 8 },
  { code: "973", name: "Bahrain", flag: "🇧🇭", min: 8, max: 8 },
  { code: "965", name: "Kuwait", flag: "🇰🇼", min: 8, max: 8 },
  { code: "91", name: "India", flag: "🇮🇳", min: 10, max: 10 },
  { code: "92", name: "Pakistan", flag: "🇵🇰", min: 10, max: 10 },
  { code: "880", name: "Bangladesh", flag: "🇧🇩", min: 10, max: 10 },
  { code: "63", name: "Philippines", flag: "🇵🇭", min: 10, max: 10 },
  { code: "94", name: "Sri Lanka", flag: "🇱🇰", min: 9, max: 9 },
  { code: "20", name: "Egypt", flag: "🇪🇬", min: 10, max: 10 },
  { code: "962", name: "Jordan", flag: "🇯🇴", min: 9, max: 9 },
  { code: "961", name: "Lebanon", flag: "🇱🇧", min: 7, max: 8 },
  { code: "44", name: "UK", flag: "🇬🇧", min: 10, max: 10 },
  { code: "1", name: "USA / Canada", flag: "🇺🇸", min: 10, max: 10 },
];

export const DEFAULT_COUNTRY = "971";

export function findCountry(code: string | number): CountryOption | null {
  return COUNTRIES.find((c) => c.code === String(code)) || null;
}

/**
 * @param input       what the customer typed, national or full
 * @param countryCode the dialling code chosen in the dropdown
 * @returns E.164 without the plus, e.g. "971501234567"
 */
export function normalizeMobile(input?: string | null, countryCode = DEFAULT_COUNTRY): string | null {
  const country = findCountry(countryCode);
  if (!country) return null;

  let digits = String(input || "").replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith(country.code) && digits.length > country.max) {
    digits = digits.slice(country.code.length);
  }
  if (digits.startsWith("0")) digits = digits.replace(/^0+/, "");

  if (digits.length < country.min || digits.length > country.max) return null;

  // UAE mobiles always begin with 5 once the prefix is gone
  if (country.code === "971" && !digits.startsWith("5")) return null;

  return country.code + digits;
}

/** Splits stored E.164 back into its parts for display. */
export function splitMobile(e164?: string | null): { countryCode: string; national: string } {
  const value = String(e164 || "");
  const country = COUNTRIES.filter((c) => value.startsWith(c.code)).sort(
    (a, b) => b.code.length - a.code.length
  )[0];
  if (!country) return { countryCode: "", national: value };
  return { countryCode: country.code, national: value.slice(country.code.length) };
}

/** Display form: +971 50 123 4567 */
export function formatMobile(e164?: string | null): string {
  const { countryCode, national } = splitMobile(e164);
  if (!countryCode) return e164 || "";
  const grouped =
    national.length === 9
      ? `${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5)}`
      : national;
  return `+${countryCode} ${grouped}`;
}

export function isValidEmail(value?: string | null): boolean {
  const v = String(value || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}
