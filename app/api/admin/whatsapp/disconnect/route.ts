import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminScope";
import { WhatsAppService } from "@/lib/whatsapp";

export async function POST() {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    await WhatsAppService.disconnect();
    return NextResponse.json({ ok: true, message: "WhatsApp disconnected successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to disconnect WhatsApp" }, { status: 500 });
  }
}
