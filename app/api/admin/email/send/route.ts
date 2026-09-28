import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminScope";
import { prisma } from "@/lib/db";
import { sendEmail, queueEmailBroadcast } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const [logs, totalSent, totalFailed] = await Promise.all([
    prisma.emailLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.emailLog.count({ where: { status: "SENT" } }),
    prisma.emailLog.count({ where: { status: "FAILED" } }),
  ]);

  return NextResponse.json({
    ok: true,
    logs,
    stats: { totalSent, totalFailed, totalCount: totalSent + totalFailed },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const body = await req.json();
    const {
      targetAudience, // "single" | "all" | "active" | "birthdays"
      recipientEmail, // For single
      subject,
      content, // HTML / text content
      previewOnly,
    } = body || {};

    if (!subject?.trim()) {
      return NextResponse.json({ error: "Please enter an email subject line." }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: "Please enter the email message body." }, { status: 400 });
    }

    // Single recipient dispatch
    if (targetAudience === "single") {
      if (!recipientEmail || !recipientEmail.includes("@")) {
        return NextResponse.json({ error: "Please enter a valid recipient email address." }, { status: 400 });
      }

      if (previewOnly) {
        return NextResponse.json({
          ok: true,
          preview: true,
          recipientCount: 1,
          sampleRecipients: [{ email: recipientEmail.trim(), name: "Valued Member", pointsBalance: 0 }],
        });
      }

      const personalizedHtml = content
        .replace(/{customer_name}/g, "Valued Member")
        .replace(/{name}/g, "Valued Member")
        .replace(/{points_balance}/g, "0")
        .replace(/{app_name}/g, "Bombay Chowpatty Loyalty");

      const personalizedSubject = subject
        .replace(/{customer_name}/g, "Valued Member")
        .replace(/{name}/g, "Valued Member");

      const res = await sendEmail({
        to: recipientEmail.trim(),
        subject: personalizedSubject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF7F4; padding: 24px; border-radius: 16px; border: 1px solid #EAE3DC;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #801313; margin: 0; font-size: 22px;">Bombay Chowpatty</h2>
              <p style="color: #7A6E67; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Exclusive Loyalty Club</p>
            </div>
            <div style="background: white; padding: 24px; border-radius: 14px; border: 1px solid #EAE3DC; color: #1E1815; line-height: 1.6;">
              ${personalizedHtml}
            </div>
            <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #7A6E67;">
              <p style="margin: 0;">You received this because you are a registered member of Bombay Chowpatty Loyalty Club.</p>
              <p style="margin: 4px 0 0 0;">UAE • Dine In • Takeaway • Rewards</p>
            </div>
          </div>
        `,
        sentBy: auth.session?.id || "Admin",
      });

      if (!res.ok) {
        return NextResponse.json({ error: res.error || "Failed to send email." }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: `Email successfully delivered to ${recipientEmail}!`,
        successCount: 1,
        failedCount: 0,
      });
    }

    // Mass Audience Filter Clause
    let whereClause: any = {};
    if (targetAudience === "active") {
      const cutoff = new Date(Date.now() - 45 * 86400_000);
      whereClause = { lastVisitAt: { gte: cutoff } };
    } else if (targetAudience === "birthdays") {
      whereClause = { birthday: { not: null } };
    }

    const totalAudienceCount = await prisma.customer.count({
      where: {
        email: { not: null, contains: "@" },
        isBlocked: false,
        ...whereClause,
      },
    });

    if (totalAudienceCount === 0) {
      return NextResponse.json({
        error: "No matching customers found with registered email addresses for this audience filter.",
      }, { status: 404 });
    }

    if (previewOnly) {
      const sample = await prisma.customer.findMany({
        where: { email: { not: null, contains: "@" }, isBlocked: false, ...whereClause },
        take: 5,
        select: { email: true, name: true, pointsBalance: true },
      });
      return NextResponse.json({
        ok: true,
        preview: true,
        recipientCount: totalAudienceCount,
        sampleRecipients: sample,
      });
    }

    // Queue safe, high-volume throttled background broadcast
    queueEmailBroadcast({
      campaignName: subject,
      sentBy: auth.session?.id || "Admin",
      batchSize: 50,
      delayBetweenBatchesMs: 300,
      concurrencyPerBatch: 5,
      whereClause,
      buildSubject: (cust) => {
        const cName = cust.name || "Valued Member";
        return subject.replace(/{customer_name}/g, cName).replace(/{name}/g, cName);
      },
      buildHtml: (cust) => {
        const cName = cust.name || "Valued Member";
        const personalizedHtml = content
          .replace(/{customer_name}/g, cName)
          .replace(/{name}/g, cName)
          .replace(/{points_balance}/g, String(cust.pointsBalance || 0))
          .replace(/{app_name}/g, "Bombay Chowpatty Loyalty");

        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF7F4; padding: 24px; border-radius: 16px; border: 1px solid #EAE3DC;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #801313; margin: 0; font-size: 22px;">Bombay Chowpatty</h2>
              <p style="color: #7A6E67; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Exclusive Loyalty Club</p>
            </div>
            <div style="background: white; padding: 24px; border-radius: 14px; border: 1px solid #EAE3DC; color: #1E1815; line-height: 1.6;">
              ${personalizedHtml}
            </div>
            <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #7A6E67;">
              <p style="margin: 0;">You received this because you are a registered member of Bombay Chowpatty Loyalty Club.</p>
              <p style="margin: 4px 0 0 0;">UAE • Dine In • Takeaway • Rewards</p>
            </div>
          </div>
        `;
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Email broadcast queued for ${totalAudienceCount} recipients. Sending in throttled background batches.`,
      recipientCount: totalAudienceCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to broadcast email." }, { status: 500 });
  }
}
