import { NextResponse } from "next/server";
import { clearCustomerSession } from "@/lib/session";

function getRedirectUrl(req: Request, path: string) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  if (host) {
    return `${proto}://${host}${path}`;
  }
  return new URL(path, req.url).toString();
}

export async function GET(req: Request) {
  await clearCustomerSession();
  return NextResponse.redirect(getRedirectUrl(req, "/login"));
}

export async function POST() {
  await clearCustomerSession();
  return NextResponse.json({ ok: true, redirectTo: "/login" });
}

