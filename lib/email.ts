import nodemailer, { Transporter } from "nodemailer";
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
  const host = (await getSetting("smtp_host")) || process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt((await getSetting("smtp_port")) || process.env.SMTP_PORT || "587", 10);
  const secure = ((await getSetting("smtp_secure")) || process.env.SMTP_SECURE || "false") === "true";
  const user = (await getSetting("smtp_user")) || process.env.SMTP_USER || "";
  const pass = (await getSetting("smtp_pass")) || process.env.SMTP_PASS || "";
  const fromEmail = (await getSetting("smtp_from_email")) || process.env.SMTP_FROM_EMAIL || user || "loyalty@artoflevante.ae";
  const fromName = (await getSetting("smtp_from_name")) || process.env.SMTP_FROM_NAME || "Levante Rewards";

  return { host, port, secure, user, pass, fromEmail, fromName };
}

export function createTransporter(config: SmtpConfig, pooled: boolean = false) {
  if (!config.host || !config.user) {
    throw new Error("SMTP configuration is incomplete. Please configure Host and User in Settings.");
  }

  return nodemailer.createTransport({
    pool: pooled,
    maxConnections: pooled ? 5 : undefined,
    maxMessages: pooled ? 100 : undefined,
    rateDelta: pooled ? 1000 : undefined,
    rateLimit: pooled ? 20 : undefined, // Safe 20 emails / sec rate limit per pool
    host: config.host,
    port: config.port,
    secure: config.secure || config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: process.env.SMTP_IGNORE_TLS === "true" || process.env.NODE_ENV !== "production" ? false : true,
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends a single email using the configured SMTP server and records the log
 */
export async function sendEmail(options: SendMailOptions): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  try {
    const config = await getSmtpConfig();
    const transporter = createTransporter(config, false);

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

export interface RecipientInfo {
  id: string;
  name: string | null;
  email: string;
  pointsBalance: number;
}

export interface QueueBroadcastOptions {
  campaignName: string;
  buildSubject: (cust: RecipientInfo) => string;
  buildHtml: (cust: RecipientInfo) => string;
  sentBy?: string;
  batchSize?: number; // Number of customers to query per DB page (default: 50)
  delayBetweenBatchesMs?: number; // Delay gap between batches to prevent spam-block (default: 300ms)
  concurrencyPerBatch?: number; // Simultaneous SMTP connections per batch (default: 5)
  whereClause?: any; // Additional Prisma Customer filter
}

/**
 * High-Capacity Queue & Throttled Email Dispatcher
 * Streams customers in paginated memory-safe chunks, utilizes pooled SMTP keep-alive sockets,
 * limits concurrency, and inserts delay gaps between batches to safely deliver to large audiences.
 */
export async function queueEmailBroadcast(options: QueueBroadcastOptions) {
  const batchSize = Math.max(10, Math.min(options.batchSize || 50, 200));
  const delayBetweenBatches = options.delayBetweenBatchesMs ?? 300;
  const concurrency = Math.max(1, Math.min(options.concurrencyPerBatch || 5, 10));

  // Run in background without blocking caller
  (async () => {
    let pooledTransporter: Transporter | null = null;
    let totalProcessed = 0;
    let totalSent = 0;
    let totalFailed = 0;

    try {
      const config = await getSmtpConfig();
      if (!config.host || !config.user) {
        console.warn("queueEmailBroadcast: SMTP is not configured. Broadcast aborted.");
        return;
      }

      pooledTransporter = createTransporter(config, true);
      const fromAddress = config.fromName ? `"${config.fromName}" <${config.fromEmail}>` : config.fromEmail;

      const baseWhere = {
        email: { not: null, contains: "@" },
        isBlocked: false,
        ...(options.whereClause || {}),
      };

      const totalRecipients = await prisma.customer.count({ where: baseWhere });
      if (totalRecipients === 0) return;

      console.log(`[EmailQueue] Starting broadcast for "${options.campaignName}" to ${totalRecipients} recipients.`);

      let offset = 0;

      while (true) {
        const chunk = await prisma.customer.findMany({
          where: baseWhere,
          select: { id: true, name: true, email: true, pointsBalance: true },
          skip: offset,
          take: batchSize,
          orderBy: { id: "asc" },
        });

        if (!chunk || chunk.length === 0) break;

        const emailLogRecords: Array<{
          recipient: string;
          subject: string;
          body: string;
          status: string;
          error?: string | null;
          sentBy: string;
        }> = [];

        // Process this chunk with controlled concurrency
        for (let i = 0; i < chunk.length; i += concurrency) {
          const subBatch = chunk.slice(i, i + concurrency);

          await Promise.all(
            subBatch.map(async (cust) => {
              if (!cust.email) return;
              const subject = options.buildSubject(cust as RecipientInfo);
              const html = options.buildHtml(cust as RecipientInfo);

              try {
                await pooledTransporter!.sendMail({
                  from: fromAddress,
                  to: cust.email,
                  subject,
                  html,
                });

                totalSent++;
                emailLogRecords.push({
                  recipient: cust.email,
                  subject,
                  body: html,
                  status: "SENT",
                  sentBy: options.sentBy || "Automated System",
                });
              } catch (sendErr: any) {
                totalFailed++;
                emailLogRecords.push({
                  recipient: cust.email,
                  subject,
                  body: html,
                  status: "FAILED",
                  error: sendErr?.message || "SMTP Error",
                  sentBy: options.sentBy || "Automated System",
                });
              }
            })
          );
        }

        // Batch insert email logs for this chunk
        if (emailLogRecords.length > 0) {
          try {
            await prisma.emailLog.createMany({ data: emailLogRecords });
          } catch (logErr) {
            console.error("[EmailQueue] Failed to record batch logs:", logErr);
          }
        }

        totalProcessed += chunk.length;
        offset += chunk.length;

        // Controlled delay gap between batches to protect SMTP IP reputation & avoid rate limits
        if (chunk.length === batchSize) {
          await sleep(delayBetweenBatches);
        }
      }

      // Trigger admin notification upon broadcast completion
      await createNotification({
        type: "EMAIL_SENT",
        title: `Campaign Broadcast: ${options.campaignName}`,
        message: `Successfully delivered to ${totalSent} customer${totalSent === 1 ? "" : "s"} (${totalFailed} failed).`,
        metadata: {
          campaign: options.campaignName,
          totalRecipients,
          totalSent,
          totalFailed,
        },
      });

      console.log(`[EmailQueue] Broadcast completed for "${options.campaignName}". Sent: ${totalSent}, Failed: ${totalFailed}.`);
    } catch (queueErr) {
      console.error("[EmailQueue] Fatal queue error:", queueErr);
    } finally {
      if (pooledTransporter) {
        try {
          pooledTransporter.close();
        } catch {}
      }
    }
  })();
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
    subject: "✅ SMTP Test Email — Levante Rewards",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF7F4; padding: 24px; border-radius: 16px; border: 1px solid #EAE3DC;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #0E331E; margin: 0; font-size: 22px;">Levante Rewards</h2>
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


/**
 * Sends a branded One-Time Passcode (OTP) verification email for customer login
 */
export async function sendOtpEmail(
  email: string,
  code: string,
  customerName?: string
): Promise<{ ok: boolean; provider: string; error?: string }> {
  const brand = process.env.NEXT_PUBLIC_APP_NAME || "Levante Rewards";
  const subject = `${code} is your ${brand} login code`;
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F4; margin: 0; padding: 24px; color: #1E1815;">
      <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #EAE3DC; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.04);">
        <div style="background: linear-gradient(135deg, #0E331E 0%, #0C5B27 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${brand}</h1>
          <p style="margin: 6px 0 0; font-size: 12px; color: #F5EFE0; letter-spacing: 0.8px; text-transform: uppercase; font-weight: 600;">Secure Member Sign-In</p>
        </div>
        <div style="padding: 32px 28px;">
          <p style="font-size: 15px; color: #1E1815; margin: 0 0 14px;">
            Hello${customerName ? ` <strong>${customerName}</strong>` : ""},
          </p>
          <p style="font-size: 14px; color: #5A4E47; line-height: 1.6; margin: 0 0 24px;">
            Use the 6-digit one-time passcode below to securely access your Loyalty Club account:
          </p>
          <div style="background: #FAF7F4; border: 2px dashed #0E331E; border-radius: 16px; padding: 20px 16px; text-align: center; margin: 0 0 24px;">
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #0E331E;">
              ${code}
            </div>
          </div>
          <div style="background: #FFF9F2; border: 1px solid #F3E5D4; border-radius: 12px; padding: 14px 16px; margin: 0 0 24px;">
            <p style="margin: 0; font-size: 12px; color: #8A5A20; line-height: 1.6;">
              ⏱ <strong>Code expires in 5 minutes.</strong><br />
              🔒 For your security, never share this code with anyone. Our staff will never ask for your code.
            </p>
          </div>
          <p style="font-size: 11px; color: #9A8E87; line-height: 1.5; margin: 0; border-top: 1px solid #EAE3DC; padding-top: 16px; text-align: center;">
            Levante • 14 Outlets Across Dubai, Sharjah, Abu Dhabi &amp; Ajman
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const config = await getSmtpConfig();
    if (config.host && config.user) {
      const res = await sendEmail({
        to: email,
        subject,
        html,
        sentBy: "System (Auth OTP)",
      });
      if (res.ok) {
        console.log(`[otp:email] Sent OTP to ${email} via SMTP`);
        return { ok: true, provider: "email" };
      }
      console.warn(`[otp:email] SMTP failed (${res.error}), logging code`);
    } else {
      console.log(`[otp:email] SMTP not configured in Settings. OTP for ${email} is: ${code}`);
    }
  } catch (err: any) {
    console.warn(`[otp:email] SMTP error:`, err?.message || err);
  }

  return { ok: true, provider: "email" };
}
