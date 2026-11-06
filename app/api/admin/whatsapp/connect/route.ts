import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminScope";
import { WhatsAppService } from "@/lib/whatsapp";

export async function POST() {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const data = await WhatsAppService.startConnection({ forceNew: true, waitForQr: true });
    return NextResponse.json({ ok: true, ...data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to initiate WhatsApp connection" }, { status: 500 });
  }
}
