import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminScope";
import { WhatsAppService } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await req.json().catch(() => ({}));
    const { phoneNumber } = body || {};
    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Please provide a valid phone number with country code (e.g. +971501234567)." },
        { status: 400 }
      );
    }

    const code = await WhatsAppService.requestPairingCode(phoneNumber);
    return NextResponse.json({ ok: true, pairingCode: code });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to request pairing code" }, { status: 500 });
  }
}
