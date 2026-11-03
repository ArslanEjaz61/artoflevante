import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminScope";
import { testAIConnection } from "@/lib/receipts";
import { getSetting } from "@/lib/loyalty";

export async function POST(req: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error || !session) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  }

  try {
    const body = await req.json();
    const { provider, apiKey, model } = body || {};

    if (!provider || !["gemini", "openai", "openrouter"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider. Choose gemini, openai, or openrouter." }, { status: 400 });
    }

    // If key not provided in body (or masked), fallback to saved setting or env
    let keyToUse = (apiKey || "").trim();
    if (!keyToUse || keyToUse.startsWith("••••")) {
      if (provider === "gemini") {
        keyToUse = (await getSetting("gemini_api_key")) || process.env.GEMINI_API_KEY || "";
      } else if (provider === "openai") {
        keyToUse = (await getSetting("openai_api_key")) || process.env.OPENAI_API_KEY || "";
      } else if (provider === "openrouter") {
        keyToUse = (await getSetting("openrouter_api_key")) || process.env.OPENROUTER_API_KEY || "";
      }
    }

    if (!keyToUse) {
      return NextResponse.json(
        { error: `No API key provided for ${provider}. Please enter a valid API key first.` },
        { status: 400 }
      );
    }

    const result = await testAIConnection(provider, keyToUse, model);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || "Failed to test AI connection." }, { status: 500 });
  }
}
