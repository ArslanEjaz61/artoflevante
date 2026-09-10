import { NextResponse } from "next/server";
import { clearCustomerSession } from "@/lib/session";

export async function GET(req: Request) {
  await clearCustomerSession();
  const url = new URL("/login", req.url);
  return NextResponse.redirect(url);
}

export async function POST() {
  await clearCustomerSession();
  return NextResponse.json({ ok: true });
}
