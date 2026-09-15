import { randomBytes, scrypt as _scrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt);

/** Hashes a PIN or OTP with a per-value salt. Returns "salt:hash". */
export async function hashSecret(secret: string | number): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(String(secret), salt, 32)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

/** Constant-time check so a wrong PIN cannot be found by timing the response. */
export async function verifySecret(secret: string | number, stored: string | null | undefined): Promise<boolean> {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const derived = (await scrypt(String(secret), salt, 32)) as Buffer;
  const known = Buffer.from(hash, "hex");
  if (known.length !== derived.length) return false;
  return timingSafeEqual(known, derived);
}

/** URL-safe random string, used for session ids. */
export function randomToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** The value inside the QR (8 characters). */
export function randomCode(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

/** Accepts "k7m2-9xpq", "K7M2 9XPQ" or "K7M29XPQ" and returns "K7M29XPQ". */
export function normalizeCode(input?: string | null): string {
  return String(input || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Returns clean uppercase alphanumeric code without any spaces: "K7M29XPQ". */
export function formatCode(code?: string | null): string {
  return normalizeCode(code);
}

/** Six digits, zero-padded. */
export function randomOtp(): string {
  return String(randomBytes(4).readUInt32BE(0) % 1_000_000).padStart(6, "0");
}

export function sha256(value: string | number): string {
  return createHash("sha256").update(String(value)).digest("hex");
}
