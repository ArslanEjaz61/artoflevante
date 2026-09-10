import { NextResponse } from "next/server";
import { clearStaffSession } from "@/lib/session";

export async function GET(req: Request) {
  await clearStaffSession();
  const url = new URL("/staff/login", req.url);
  return NextResponse.redirect(url);
}

export async function POST() {
  await clearStaffSession();
  return NextResponse.json({ ok: true, redirectTo: "/staff/login" });
}
