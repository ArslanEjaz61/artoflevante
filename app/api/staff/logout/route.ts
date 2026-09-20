import { NextResponse } from "next/server";
import { clearStaffSession } from "@/lib/session";

function getRedirectUrl(req: Request, path: string) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  if (host) {
    return `${proto}://${host}${path}`;
  }
  return new URL(path, req.url).toString();
}

export async function GET(req: Request) {
  await clearStaffSession();
  return NextResponse.redirect(getRedirectUrl(req, "/staff/login"));
}

export async function POST() {
  await clearStaffSession();
  return NextResponse.json({ ok: true, redirectTo: "/staff/login" });
}

