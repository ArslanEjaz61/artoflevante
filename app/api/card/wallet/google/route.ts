import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerId } from "@/lib/session";
import {
  createGoogleWalletSaveUrl,
  isGoogleWalletConfigured,
  loadWalletCardData,
  publicOrigin,
  stampImageUrl,
} from "@/lib/google-wallet";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const codeParam = searchParams.get("code");
    const redirectMode = searchParams.get("redirect") === "1";

    let customerId = await getCustomerId();
    if (!customerId && codeParam) {
      const tokenRec = await prisma.qrToken.findFirst({
        where: { token: codeParam.replace(/\s+/g, "").toUpperCase() },
        select: { customerId: true },
      });
      customerId = tokenRec?.customerId ?? null;
    }

    const card = customerId ? await loadWalletCardData(customerId) : null;
    if (!card) {
      return NextResponse.json({ error: "Customer not found or not signed in." }, { status: 404 });
    }

    const origin = publicOrigin(req.nextUrl.origin) || req.nextUrl.origin;
    const cardData = { ...card, stampImageUrl: stampImageUrl(origin, card) };

    let saveUrl: string | null = null;
    let walletError: string | null = null;
    if (isGoogleWalletConfigured()) {
      try {
        saveUrl = await createGoogleWalletSaveUrl(card, req.nextUrl.origin);
      } catch (e: any) {
        walletError = String(e?.message || e);
        console.error("Google Wallet save URL failed:", walletError);
      }
    }

    if (redirectMode && saveUrl) {
      return NextResponse.redirect(saveUrl);
    }

    return NextResponse.json({
      success: true,
      hasCredentials: isGoogleWalletConfigured(),
      saveUrl,
      error: walletError,
      stampImageUrl: cardData.stampImageUrl,
      cardData,
    });
  } catch (err: any) {
    console.error("Google Wallet route error:", err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
