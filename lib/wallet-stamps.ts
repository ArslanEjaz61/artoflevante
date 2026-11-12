import fs from "node:fs";
import path from "node:path";
import sharp, { type OverlayOptions } from "sharp";

export type StampTheme = "forest" | "beige" | "white";

/**
 * "hero"  → Google Wallet hero image (1032 x 336, shown at the bottom of the pass under the QR).
 * "strip" → Apple Wallet storeCard strip.png (375 x 123 pt; use scale 2/3 for @2x/@3x).
 */
export type StampVariant = "hero" | "strip";

export interface StampImageOptions {
  stampsEarned: number;
  totalStamps?: number;
  theme?: StampTheme;
  scale?: number;
  variant?: StampVariant;
}

export const STAMP_THEME_COLORS: Record<StampTheme, { hex: string; rgb: { r: number; g: number; b: number } }> = {
  forest: { hex: "#0D331C", rgb: { r: 13, g: 51, b: 28 } },
  beige: { hex: "#EFEBE0", rgb: { r: 239, g: 235, b: 224 } },
  white: { hex: "#FFFFFF", rgb: { r: 255, g: 255, b: 255 } },
};

const BASE_SIZE: Record<StampVariant, { width: number; height: number }> = {
  hero: { width: 1032, height: 336 },
  strip: { width: 375, height: 123 },
};

/** Splits stamps into rows the same way the physical card / Google stamp cards do (e.g. 5 → 5 in 1 row or 3 + 2). */
function rowLayout(total: number): number[] {
  if (total <= 5) return [total];
  const top = Math.ceil(total / 2);
  return [top, total - top];
}

const CARD_W = 1057;
const STAMP_D = 126;
const STAMP_ROW_Y = 352;
const WM_RIGHT = 1053;
const WM_TOP = 128;
const WM_H = 1225;

let watermarkCache: Buffer | null | undefined;
function loadWatermark(): Buffer | null {
  if (watermarkCache !== undefined) return watermarkCache;
  const p = path.join(process.cwd(), "public", "watermark-top.png");
  watermarkCache = fs.existsSync(p) ? fs.readFileSync(p) : null;
  return watermarkCache;
}

let stampIconCache: Buffer | null | undefined;
function loadStampIcon(): Buffer | null {
  if (stampIconCache !== undefined) return stampIconCache;
  const p = path.join(process.cwd(), "public", "levante-stamp.png");
  stampIconCache = fs.existsSync(p) ? fs.readFileSync(p) : null;
  return stampIconCache;
}

/**
 * Generates the stamp-circle PNG used by Google Wallet (hero image) and Apple Wallet (strip image).
 * Earned stamps get the Levante teardrop stamp icon, empty ones are clean outlined circles.
 */
export async function generateStampStripImage(options: StampImageOptions): Promise<Buffer> {
  const {
    stampsEarned,
    totalStamps = 5,
    theme = "white",
    scale = 1,
    variant = "hero",
  } = options;

  const total = Math.max(1, Math.min(totalStamps, 10));
  const width = Math.round(BASE_SIZE[variant].width * scale);
  const height = Math.round(BASE_SIZE[variant].height * scale);

  // Layout of the 1057-unit-wide wallet-card mockup: one row of 126-unit circles,
  // 51 / 52 units from the card edges, centred on card y = 352, with the "A" watermark behind.
  const s = width / CARD_W;
  const cardTop = STAMP_ROW_Y - height / s / 2; // card y shown at the top edge of the image

  const positions: Array<{ cx: number; cy: number }> = [];
  let radius: number;
  if (total <= 5) {
    radius = (STAMP_D / 2) * s;
    const first = 51 + STAMP_D / 2;
    const last = CARD_W - 52 - STAMP_D / 2;
    const step = (last - first) / 4; // keep the 5-stamp spacing for shorter cards too
    const startX = total === 5 ? first : CARD_W / 2 - (step * (total - 1)) / 2;
    for (let i = 0; i < total; i++) positions.push({ cx: Math.round((startX + step * i) * s), cy: Math.round(height / 2) });
  } else {
    const rows = rowLayout(total);
    const maxPerRow = Math.max(...rows);
    const padY = height * 0.08;
    const rowHeight = (height - padY * 2) / rows.length;
    const colWidth = Math.min(width / (maxPerRow + 0.6), rowHeight * 1.6);
    radius = Math.min(rowHeight * 0.44, colWidth * 0.42);
    rows.forEach((count, rowIdx) => {
      const cy = padY + rowHeight * rowIdx + rowHeight / 2;
      const startX = width / 2 - (colWidth * (count - 1)) / 2;
      for (let i = 0; i < count; i++) positions.push({ cx: Math.round(startX + colWidth * i), cy: Math.round(cy) });
    });
  }

  const strokeWidth = Math.max(1, (radius * 3.2) / (STAMP_D / 2));
  const iconSize = Math.max(2, Math.round(radius * 2 * 0.62));
  const stampIcon = loadStampIcon();
  const resizedStamp = stampIcon
    ? await sharp(stampIcon).resize(iconSize, iconSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: "lanczos3" }).png().toBuffer()
    : null;

  const composites: OverlayOptions[] = [];

  // faded "A" watermark (same placement as on the card: right edge at x=1053, top at y=128, 1225 tall)
  const wm = loadWatermark();
  if (wm && theme === "white") {
    const wmH = Math.round(WM_H * s);
    const wmImg = await sharp(wm).resize({ height: wmH }).png().toBuffer();
    const wmW = (await sharp(wmImg).metadata()).width || 0;
    const left = Math.round(WM_RIGHT * s) - wmW;
    const top = Math.round((WM_TOP - cardTop) * s);
    // crop the part that falls inside the image
    const cropTop = Math.max(0, -top);
    const cropLeft = Math.max(0, -left);
    const cropH = Math.min(wmH - cropTop, height - Math.max(0, top));
    const cropW = Math.min(wmW - cropLeft, width - Math.max(0, left));
    if (cropH > 0 && cropW > 0) {
      const piece = await sharp(wmImg).extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH }).png().toBuffer();
      composites.push({ input: piece, left: Math.max(0, left), top: Math.max(0, top) });
    }
  }

  let svgElements = "";
  positions.forEach((pos) => {
    svgElements += `<circle cx="${pos.cx}" cy="${pos.cy}" r="${(radius - strokeWidth / 2).toFixed(2)}" fill="#FFFFFF" stroke="#1A1A1A" stroke-width="${strokeWidth.toFixed(2)}" />`;
  });
  composites.push({
    input: Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${svgElements}</svg>`),
    left: 0,
    top: 0,
  });
  positions.forEach((pos, idx) => {
    if (idx < stampsEarned && resizedStamp) {
      composites.push({ input: resizedStamp, left: Math.round(pos.cx - iconSize / 2), top: Math.round(pos.cy - iconSize / 2) });
    }
  });

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { ...STAMP_THEME_COLORS[theme].rgb, alpha: 1 },
    },
  })
    .composite(composites)
    .png({ compressionLevel: 8 })
    .toBuffer();
}
