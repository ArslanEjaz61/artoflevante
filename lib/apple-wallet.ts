import crypto from "node:crypto";
import fs from "node:fs";
import http2 from "node:http2";
import path from "node:path";
import JSZip from "jszip";
import sharp from "sharp";
import { prisma } from "@/lib/db";
import { getApplePassSigner, type ApplePassSigner } from "@/lib/apple-pass-signing";
import { loadWalletCardData, publicOrigin, type WalletCardData } from "@/lib/wallet-card";
import { generateStampStripImage } from "@/lib/wallet-stamps";

export const APPLE_WEB_SERVICE_PATH = "/api/wallet/apple";

function authSecret(): string {
  return process.env.APPLE_PASS_AUTH_SECRET || process.env.APPLE_PASS_KEY || "";
}

export function appleAuthToken(serialNumber: string): string {
  return crypto.createHmac("sha256", authSecret()).update(`apple-pass:${serialNumber}`).digest("base64url");
}

export function isValidAppleAuth(authorization: string | null, serialNumber: string): boolean {
  const match = /^ApplePass\s+(.+)$/.exec(authorization?.trim() || "");
  if (!match || !authSecret()) return false;
  const given = Buffer.from(match[1]);
  const expected = Buffer.from(appleAuthToken(serialNumber));
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

const publicDir = path.join(process.cwd(), "public");
function readAsset(...names: string[]): Buffer {
  for (const name of names) {
    try {
      const p = path.join(publicDir, name);
      if (fs.existsSync(p)) return fs.readFileSync(p);
    } catch {}
  }
  return Buffer.alloc(0);
}

async function resizePng(src: Buffer, size: number) {
  if (!src.length) return src;
  return sharp(src).resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
}

function buildPassJson(card: WalletCardData, signer: ApplePassSigner, origin: string | null) {
  const barcode = {
    format: "PKBarcodeFormatQR",
    message: card.memberCode,
    messageEncoding: "iso-8859-1",
    altText: card.memberCode,
  };

  return {
    formatVersion: 1,
    passTypeIdentifier: signer.passTypeIdentifier,
    serialNumber: card.customerId,
    teamIdentifier: signer.teamIdentifier,
    organizationName: "Levante",
    description: "Levante Loyalty Stamp Card",
    logoText: "LEVANTE",
    foregroundColor: "rgb(30, 24, 21)",
    backgroundColor: "rgb(255, 255, 255)",
    labelColor: "rgb(122, 110, 103)",
    ...(origin
      ? { webServiceURL: `${origin}${APPLE_WEB_SERVICE_PATH}`, authenticationToken: appleAuthToken(card.customerId) }
      : {}),
    barcodes: [barcode],
    barcode,
    storeCard: {
      headerFields: [
        {
          key: "stamps",
          label: "STAMPS",
          value: card.stamps,
          textAlignment: "PKTextAlignmentRight",
          changeMessage: "Stamps: %@",
        },
      ],
      primaryFields: [],
      secondaryFields: [
        { key: "member", label: "FULL NAME", value: card.name },
        {
          key: "coupon",
          label: "COUPON",
          value: card.coupon,
          textAlignment: "PKTextAlignmentRight",
          changeMessage: "Coupons: %@",
        },
        {
          key: "points",
          label: "LOYALTY POINTS",
          value: card.points,
          textAlignment: "PKTextAlignmentRight",
          changeMessage: "Loyalty points: %@",
        },
      ],
      auxiliaryFields: [],
      backFields: [
        { key: "member_id", label: "MEMBER ID", value: card.formattedCode },
        { key: "branch", label: "PREFERRED BRANCH", value: card.branch },
        ...(card.mobile ? [{ key: "mobile", label: "REGISTERED MOBILE", value: `+${card.mobile}` }] : []),
        ...(card.email ? [{ key: "email", label: "REGISTERED EMAIL", value: card.email }] : []),
        {
          key: "rules",
          label: "TERMS & CONDITIONS",
          value:
            "Collect stamps on every visit to unlock exclusive milestone gifts and redeem member discounts. Present this digital pass at checkout.",
        },
      ],
    },
  };
}

export async function buildApplePass(
  card: WalletCardData,
  signer: ApplePassSigner,
  requestOrigin?: string | null
): Promise<Buffer> {
  const passJson = Buffer.from(JSON.stringify(buildPassJson(card, signer, publicOrigin(requestOrigin)), null, 2), "utf8");

  const iconSrc = readAsset("apple-touch-icon.png", "icon-192.png", "favicon.png", "bc-roundel.png");
  const roundel = readAsset("bc-roundel.png", "brand_logo.png", "logo.png");
  const strip = { stampsEarned: card.visitsInCycle, totalStamps: card.threshold, theme: card.theme, variant: "strip" as const };

  const [icon, icon2x, logo, logo2x, stripImg, strip2x] = await Promise.all([
    resizePng(iconSrc, 29),
    resizePng(iconSrc, 58),
    resizePng(roundel, 50),
    resizePng(roundel, 100),
    generateStampStripImage({ ...strip, scale: 1 }),
    generateStampStripImage({ ...strip, scale: 2 }),
  ]);

  const files: Record<string, Buffer> = {
    "pass.json": passJson,
    "icon.png": icon,
    "icon@2x.png": icon2x,
    "logo.png": logo,
    "logo@2x.png": logo2x,
    "strip.png": stripImg,
    "strip@2x.png": strip2x,
  };

  const zip = new JSZip();
  const manifest: Record<string, string> = {};
  for (const [name, buf] of Object.entries(files)) {
    if (!buf.length) continue;
    zip.file(name, buf);
    manifest[name] = crypto.createHash("sha1").update(buf).digest("hex");
  }
  const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2), "utf8");
  zip.file("manifest.json", manifestBuffer);
  zip.file("signature", signer.sign(manifestBuffer));

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 9 } });
}

export async function buildApplePassForCustomer(customerId: string, requestOrigin?: string | null) {
  const { signer, error } = getApplePassSigner();
  if (!signer) throw new Error(error || "Apple Wallet is not configured.");
  const card = await loadWalletCardData(customerId);
  if (!card) return null;
  return { card, pass: await buildApplePass(card, signer, requestOrigin) };
}
