import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerId } from "@/lib/session";
import { getApplePassSigner } from "@/lib/apple-pass-signing";
import { buildApplePassForCustomer } from "@/lib/apple-wallet";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { signer, error: signerError } = getApplePassSigner();
    if (!signer) {
      console.error(signerError);
      return NextResponse.json({ error: signerError }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    if (searchParams.get("check") === "1") {
      return NextResponse.json({ configured: true });
    }

    let customerId = await getCustomerId();
    const codeParam = searchParams.get("code");
    if (!customerId && codeParam) {
      const tokenRec = await prisma.qrToken.findFirst({
        where: { token: codeParam.replace(/\s+/g, "").toUpperCase() },
        select: { customerId: true },
      });
      customerId = tokenRec?.customerId ?? null;
    }

    const built = customerId ? await buildApplePassForCustomer(customerId, req.nextUrl.origin) : null;
    if (!built) {
      return NextResponse.json({ error: "Customer not found or not signed in." }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(built.pass), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="Levante-${built.card.memberCode}.pkpass"`,
        "Cache-Control": "no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (err: any) {
    console.error("Apple Wallet pass generation error:", err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
