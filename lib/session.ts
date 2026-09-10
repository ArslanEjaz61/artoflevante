import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { cookies } from "next/headers";

const CUSTOMER_COOKIE = "loyalty_customer";
const STAFF_COOKIE = "loyalty_staff";
const CUSTOMER_DAYS = 90;
const STAFF_HOURS = 12;

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET || "default_fallback_session_secret_at_least_32_characters_long";
  return new TextEncoder().encode(value);
}

async function sign(payload: JWTPayload, expiresIn: string): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret());
}

async function read(cookieName: string): Promise<JWTPayload | null> {
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}

const baseCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

// ------------------------------------------------------------------ customer

export async function setCustomerSession(customerId: string): Promise<void> {
  const token = await sign({ sub: customerId, kind: "customer" }, `${CUSTOMER_DAYS}d`);
  const store = await cookies();
  store.set(CUSTOMER_COOKIE, token, { ...baseCookie, maxAge: CUSTOMER_DAYS * 86400 });
}

export async function getCustomerId(): Promise<string | null> {
  const payload = await read(CUSTOMER_COOKIE);
  return payload?.kind === "customer" ? (payload.sub as string) : null;
}

export async function clearCustomerSession(): Promise<void> {
  const store = await cookies();
  store.delete(CUSTOMER_COOKIE);
}

// --------------------------------------------------------------------- staff

export interface StaffSession {
  id: string;
  role: string;
  branchId: string | null;
}

export async function setStaffSession(staff: { id: string; role: string; branchId?: string | null }): Promise<void> {
  const token = await sign(
    { sub: staff.id, kind: "staff", role: staff.role, branchId: staff.branchId ?? null },
    `${STAFF_HOURS}h`
  );
  const store = await cookies();
  store.set(STAFF_COOKIE, token, { ...baseCookie, maxAge: STAFF_HOURS * 3600 });
}

export async function getStaffSession(): Promise<StaffSession | null> {
  const payload = await read(STAFF_COOKIE);
  if (payload?.kind !== "staff") return null;
  return {
    id: payload.sub as string,
    role: payload.role as string,
    branchId: (payload.branchId as string) ?? null,
  };
}

export async function clearStaffSession(): Promise<void> {
  const store = await cookies();
  store.delete(STAFF_COOKIE);
}

// --------------------------------------------------------------- permissions

export function canAccessAllBranches(role?: string): boolean {
  return role === "SUPER_ADMIN" || role === "COMPANY_ADMIN";
}

export function canAccessBranch(session: StaffSession | null, branchId: string): boolean {
  if (!session) return false;
  if (canAccessAllBranches(session.role)) return true;
  return session.branchId === branchId;
}
