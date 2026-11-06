import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminScope";
import { WhatsAppService } from "@/lib/whatsapp";

export async function GET() {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const data = WhatsAppService.getStatus();
  return NextResponse.json({ ok: true, ...data });
}
