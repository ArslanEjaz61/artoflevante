import { NextResponse } from "next/server";
import { clearStaffSession } from "@/lib/session";

export async function GET(req: Request) {
  await clearStaffSession();
  const url = new URL("/admin/login", req.url);
  return NextResponse.redirect(url);
}

export async function POST() {
  await clearStaffSession();
  return NextResponse.json({ ok: true, redirectTo: "/admin/login" });
}
