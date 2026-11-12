import { NextRequest, NextResponse } from "next/server";
import { generateStampStripImage, type StampTheme, type StampVariant } from "@/lib/wallet-stamps";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stampsEarned = Math.max(0, parseInt(searchParams.get("stamps") || "0", 10));
    const totalStamps = Math.max(1, parseInt(searchParams.get("total") || "5", 10));
    const theme = (searchParams.get("theme") || "white") as StampTheme;
    const variant = (searchParams.get("variant") || "hero") as StampVariant;
    const scale = Math.max(1, Math.min(3, parseFloat(searchParams.get("scale") || "1")));

    const png = await generateStampStripImage({
      stampsEarned,
      totalStamps,
      theme,
      variant,
      scale,
    });

    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      },
    });
  } catch (err: any) {
    console.error("GET /api/card/wallet/stamp-image error:", err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
