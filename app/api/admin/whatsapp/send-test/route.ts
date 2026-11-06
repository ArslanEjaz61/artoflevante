import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminScope";
import { WhatsAppService } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await req.json().catch(() => ({}));
    const { phoneNumber, message } = body || {};
    if (!phoneNumber) {
      return NextResponse.json({ error: "Please provide destination phone number." }, { status: 400 });
    }

    const text =
      message?.trim() ||
      "Levante Loyalty: WhatsApp Gateway test message successfully delivered! Your WhatsApp OTP engine is operational.";

    const result = await WhatsAppService.sendMessage(phoneNumber, text);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send message" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, messageId: result.messageId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error sending test message" }, { status: 500 });
  }
}
