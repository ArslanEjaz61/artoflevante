import nodemailer from "nodemailer";
import { prisma } from "./db";
import { getSetting } from "./loyalty";
import { createNotification } from "./notifications";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
}

export async function getSmtpConfig(): Promise<SmtpConfig> {
  const host = (await getSetting("smtp_host")) || process.env.SMTP_HOST || "";
  const port = parseInt((await getSetting("smtp_port")) || process.env.SMTP_PORT || "587", 10);
  const secure = ((await getSetting("smtp_secure")) || process.env.SMTP_SECURE || "false") === "true";
  const user = (await getSetting("smtp_user")) || process.env.SMTP_USER || "";
  const pass = (await getSetting("smtp_pass")) || process.env.SMTP_PASS || "";
  const fromEmail = (await getSetting("smtp_from_email")) || process.env.SMTP_FROM_EMAIL || user || "loyalty@bombaychowpatty.com";
  const fromName = (await getSetting("smtp_from_name")) || process.env.SMTP_FROM_NAME || "Bombay Chowpatty Loyalty Club";

  return { host, port, secure, user, pass, fromEmail, fromName };
}

export function createTransporter(config: SmtpConfig) {
  if (!config.host || !config.user) {
    throw new Error("SMTP configuration is incomplete. Please configure Host and User in Settings.");
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure || config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false, // Prevents self-signed cert errors on dev/custom mail servers
    },
  });
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  sentBy?: string;
}

/**
 * Sends a single email using the configured SMTP server and records the log
 */
export async function sendEmail(options: SendMailOptions): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  try {
    const config = await getSmtpConfig();
    const transporter = createTransporter(config);

    const fromAddress = config.fromName
      ? `"${config.fromName}" <${config.fromEmail}>`
      : config.fromEmail;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      text: options.text || options.html?.replace(/<[^>]*>?/gm, ""),
      html: options.html,
    });

    // Record in EmailLog
    await prisma.emailLog.create({
      data: {
        recipient: options.to,
        subject: options.subject,
        body: options.html || options.text || "",
        status: "SENT",
        sentBy: options.sentBy || "Admin",
      },
    });

    return { ok: true, messageId: info.messageId };
  } catch (err: any) {
    console.error("sendEmail Error:", err);

    // Record failure in EmailLog
    try {
      await prisma.emailLog.create({
        data: {
          recipient: options.to,
          subject: options.subject,
          body: options.html || options.text || "",
          status: "FAILED",
          error: err.message || "Unknown SMTP Error",
          sentBy: options.sentBy || "Admin",
        },
      });
    } catch {}

    return { ok: false, error: err.message || "Failed to send email." };
  }
}

/**
 * Tests SMTP credentials by attempting connection and sending a verification email
 */
export async function testSmtpConnection(
  testRecipient: string,
  overrides?: Partial<SmtpConfig>
): Promise<{ ok: boolean; message: string }> {
  const current = await getSmtpConfig();
  const config: SmtpConfig = { ...current, ...overrides };

  if (!config.host || !config.user || !config.pass) {
    throw new Error("Please provide SMTP Host, Username, and Password.");
  }

  const transporter = createTransporter(config);

  // 1. Verify connection
  await transporter.verify();

  // 2. Send test email
  const fromAddress = config.fromName ? `"${config.fromName}" <${config.fromEmail}>` : config.fromEmail;
  const info = await transporter.sendMail({
    from: fromAddress,
    to: testRecipient,
    subject: "✅ SMTP Test Email — Bombay Chowpatty Loyalty Club",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF7F4; padding: 24px; border-radius: 16px; border: 1px solid #EAE3DC;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #801313; margin: 0; font-size: 22px;">Bombay Chowpatty Loyalty</h2>
          <p style="color: #7A6E67; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">SMTP Connection Verified</p>
        </div>
        <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #EAE3DC;">
          <p style="font-size: 15px; color: #1E1815; font-weight: bold; margin-top: 0;">Congratulations! 🎉</p>
          <p style="font-size: 13px; color: #4A3F39; line-height: 1.6;">
            Your SMTP email settings have been verified and connected successfully. Your Loyalty Club can now send automated promotional offers, birthday gift vouchers, and customer receipts.
          </p>
          <div style="background: #EAF5EE; border: 1px solid #C8E6D3; border-radius: 8px; padding: 12px; margin: 16px 0;">
            <p style="margin: 0; font-size: 12px; color: #1E7A4D; font-weight: bold;">
              Connected Host: <span style="font-family: monospace;">${config.host}:${config.port}</span>
            </p>
          </div>
          <p style="font-size: 11px; color: #7A6E67; margin-bottom: 0;">
            Sent at: ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    `,
  });

  return {
    ok: true,
    message: `Test email sent successfully to ${testRecipient}! (Message ID: ${info.messageId})`,
  };
}
