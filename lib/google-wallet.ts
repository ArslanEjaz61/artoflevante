import { SignJWT, importPKCS8, type CryptoKey } from "jose";
import { STAMP_THEME_COLORS, type StampTheme } from "@/lib/wallet-stamps";
import { loadWalletCardData, publicOrigin, stampImageUrl, type WalletCardData } from "@/lib/wallet-card";

export { loadWalletCardData, publicOrigin, stampImageUrl } from "@/lib/wallet-card";

const API = "https://walletobjects.googleapis.com/walletobjects/v1";
const CLASS_SUFFIX = "levante_stamp_card";

export class GoogleWalletError extends Error {}

function config() {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID?.trim();
  const clientEmail = process.env.GOOGLE_WALLET_CLIENT_EMAIL?.trim();
  const privateKeyPem = process.env.GOOGLE_WALLET_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!issuerId || !clientEmail || !privateKeyPem) return null;
  return { issuerId, clientEmail, privateKeyPem };
}

export function isGoogleWalletConfigured() {
  return config() !== null;
}

let keyCache: Promise<CryptoKey> | null = null;
function signingKey(pem: string) {
  keyCache ??= importPKCS8(pem, "RS256");
  return keyCache;
}
let tokenCache: { token: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  const cfg = config();
  if (!cfg) throw new GoogleWalletError("Google Wallet is not configured.");
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;

  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/wallet_object.issuer" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(cfg.clientEmail)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(await signingKey(cfg.privateKeyPem));

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new GoogleWalletError(`Google auth failed: ${data.error_description || data.error || res.status}`);
  }
  tokenCache = { token: data.access_token, expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000 };
  return tokenCache.token;
}

async function api(method: "GET" | "POST" | "PUT" | "PATCH", path: string, body?: unknown) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { authorization: `Bearer ${await accessToken()}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data, error: data?.error?.message as string | undefined };
}

async function upsert(kind: "loyaltyClass" | "loyaltyObject", resource: { id: string }) {
  const existing = await api("GET", `/${kind}/${encodeURIComponent(resource.id)}`);
  const res =
    existing.status === 404
      ? await api("POST", `/${kind}`, resource)
      : existing.ok
        ? await api("PATCH", `/${kind}/${encodeURIComponent(resource.id)}`, resource)
        : existing;
  if (!res.ok) throw new GoogleWalletError(`Google Wallet ${kind}: ${res.error || res.status}`);
}

const text = (value: string) => ({ defaultValue: { language: "en-US", value } });
const row = (id: string) => ({ firstValue: { fields: [{ fieldPath: `object.textModulesData['${id}']` }] } });

function classId(issuerId: string) {
  return `${issuerId}.${CLASS_SUFFIX}`;
}

function objectId(issuerId: string, customerId: string) {
  return `${issuerId}.member_${customerId.replace(/[^\w.-]/g, "_")}`;
}

function buildClass(issuerId: string, origin: string, theme: StampTheme) {
  return {
    id: classId(issuerId),
    issuerName: "Levante",
    programName: "Stamp Card",
    programLogo: { sourceUri: { uri: `${origin}/bc-roundel.png` }, contentDescription: text("Levante") },
    // LEVANTE wordmark across the top, like the wallet-card mockup.
    wideProgramLogo: { sourceUri: { uri: `${origin}/levante-wordmark-wide.png` }, contentDescription: text("Levante") },
    hexBackgroundColor: "#FFFFFF",
    reviewStatus: "UNDER_REVIEW",
    multipleDevicesAndHoldersAllowedStatus: "ONE_USER_ALL_DEVICES",
    localizedAccountNameLabel: text("Full Name"),
    localizedAccountIdLabel: text("Member ID"),
    classTemplateInfo: {
      cardTemplateOverride: {
        cardRowTemplateInfos: [
          { threeItems: { startItem: row("tm_name"), middleItem: row("tm_coupon"), endItem: row("tm_points") } },
        ],
      },
    },
  };
}

function buildObject(issuerId: string, origin: string, card: WalletCardData) {
  return {
    id: objectId(issuerId, card.customerId),
    classId: classId(issuerId),
    state: "ACTIVE",
    accountId: card.formattedCode,
    accountName: card.name,
    barcode: { type: "QR_CODE", value: card.memberCode, alternateText: card.memberCode },
    heroImage: {
      sourceUri: { uri: stampImageUrl(origin, card) },
      contentDescription: text(`${card.visitsInCycle} of ${card.threshold} stamps collected`),
    },
    textModulesData: [
      { id: "tm_name", header: "Full Name", body: card.name },
      { id: "tm_coupon", header: "Cupon", body: card.coupon },
      { id: "tm_points", header: "Loyality Points", body: String(card.points) },
      { id: "tm_branch", header: "Preferred Outlet", body: card.branch },
    ],
    hexBackgroundColor: "#FFFFFF",
  };
}

let classUpserted = false;

export async function createGoogleWalletSaveUrl(card: WalletCardData, requestOrigin?: string | null): Promise<string> {
  const cfg = config();
  if (!cfg) throw new GoogleWalletError("Google Wallet is not configured.");
  const origin = publicOrigin(requestOrigin);
  if (!origin) {
    throw new GoogleWalletError(
      "Google Wallet needs the app on a public HTTPS URL (set NEXT_PUBLIC_APP_URL). Google cannot load images from localhost."
    );
  }

  const classDef = buildClass(cfg.issuerId, origin, card.theme);
  const objectDef = buildObject(cfg.issuerId, origin, card);

  if (!classUpserted) {
    upsert("loyaltyClass", classDef)
      .then(() => {
        classUpserted = true;
      })
      .catch((err: any) => console.warn("[Google Wallet] background class upsert:", err?.message || err));
  }
  upsert("loyaltyObject", objectDef).catch((err: any) =>
    console.warn("[Google Wallet] background object upsert:", err?.message || err)
  );

  const token = await new SignJWT({
    iss: cfg.clientEmail,
    aud: "google",
    origins: [origin],
    typ: "savetowallet",
    payload: {
      loyaltyClasses: [classDef],
      loyaltyObjects: [objectDef],
    },
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt()
    .sign(await signingKey(cfg.privateKeyPem));

  return `https://pay.google.com/gp/v/save/${token}`;
}
