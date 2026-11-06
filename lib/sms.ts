import { WhatsAppService } from "@/lib/whatsapp";

const PROVIDER = process.env.SMS_PROVIDER || "console";

export function isDevDelivery(): boolean {
  if (WhatsAppService.isConnected()) {
    return false;
  }
  return process.env.NODE_ENV !== "production" && PROVIDER === "console";
}

export async function sendOtp(
  mobile: string,
  code: string
): Promise<{ delivered: boolean; provider: string }> {
  // 1. Primary: WhatsApp Direct Delivery if session is active
  if (WhatsAppService.isConnected()) {
    const waText =
      `*Levante Loyalty Verification Code*\n\n` +
      `Your verification code is: *${code}*\n\n` +
      `This code is valid for 5 minutes. Please do not share this code with anyone.`;

    const res = await WhatsAppService.sendMessage(mobile, waText);
    if (res.success) {
      console.log(`[otp:whatsapp] Successfully sent OTP to ${mobile}`);
      return { delivered: true, provider: "whatsapp" };
    }
    console.warn(`[otp:whatsapp] Failed to send via WhatsApp (${res.error}), falling back to SMS...`);
  }

  // 2. Secondary Fallback: SMS Provider / Console
  switch (PROVIDER) {
    case "console": {
      console.log(`[sms:console] OTP for ${mobile} is ${code}`);
      return { delivered: true, provider: "console" };
    }

    case "http": {
      const url = process.env.SMS_HTTP_URL;
      const key = process.env.SMS_HTTP_KEY;
      const sender = process.env.SMS_SENDER_ID || "Loyalty";
      if (!url || !key) throw new Error("SMS_HTTP_URL and SMS_HTTP_KEY must be set");

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          to: mobile,
          sender,
          message: `${code} is your Levante verification code.`,
        }),
      });
      if (!res.ok) {
        throw new Error(`SMS provider returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
      }
      return { delivered: true, provider: "http" };
    }

    default:
      throw new Error(`Unknown SMS_PROVIDER: ${PROVIDER}`);
  }
}
