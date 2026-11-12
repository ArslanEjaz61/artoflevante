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

  const rows = rowLayout(total);
  const maxPerRow = Math.max(...rows);

  const padY = height * 0.1;
  const rowHeight = (height - padY * 2) / rows.length;
  const colWidth = Math.min(width / (maxPerRow + 1), rowHeight * 1.6);
  const radius = Math.floor(Math.min(rowHeight * 0.42, colWidth * 0.42));

  const positions: Array<{ cx: number; cy: number }> = [];
  rows.forEach((count, rowIdx) => {
    const cy = padY + rowHeight * rowIdx + rowHeight / 2;
    const rowWidth = colWidth * (count - 1);
    const startX = width / 2 - rowWidth / 2;
    for (let i = 0; i < count; i++) {
      positions.push({ cx: Math.round(startX + colWidth * i), cy: Math.round(cy) });
    }
  });

  const strokeWidth = Math.max(1.5, radius * 0.05);
  const strokeColor = "#8E7E7C";
  const emptyFill = "rgba(255,255,255,0.7)";

  const iconRadius = Math.round(radius * 0.85);
  const stampIcon = loadStampIcon();
  const resizedStamp = stampIcon
    ? await sharp(stampIcon).resize(iconRadius * 2, iconRadius * 2, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
    : null;

  let svgElements = "";
  const composites: OverlayOptions[] = [];

  positions.forEach((pos, idx) => {
    const isEarned = idx < stampsEarned;
    svgElements += `<circle cx="${pos.cx}" cy="${pos.cy}" r="${radius}" fill="${emptyFill}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
    if (isEarned && resizedStamp) {
      composites.push({ input: resizedStamp, left: pos.cx - iconRadius, top: pos.cy - iconRadius });
    }
  });

  const svgBuffer = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${svgElements}</svg>`
  );
  composites.unshift({ input: svgBuffer, left: 0, top: 0 });

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
