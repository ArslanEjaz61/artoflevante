import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Check common deployment geo headers
  const country =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-country-code") ||
    null;

  return NextResponse.json({ country });
}
