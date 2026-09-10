const PROVIDER = process.env.SMS_PROVIDER || "console";

export function isDevDelivery(): boolean {
  return PROVIDER === "console";
}

export async function sendOtp(mobile: string, code: string): Promise<{ delivered: boolean; provider: string }> {
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
          message: `${code} is your verification code.`,
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
