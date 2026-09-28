import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminScope";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
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

    // Determine Recipients
    let recipients: Array<{ email: string; name: string; pointsBalance: number }> = [];

    if (targetAudience === "single") {
      if (!recipientEmail || !recipientEmail.includes("@")) {
        return NextResponse.json({ error: "Please enter a valid recipient email address." }, { status: 400 });
      }
      recipients = [{ email: recipientEmail.trim(), name: "Valued Member", pointsBalance: 0 }];
    } else if (targetAudience === "all") {
      const customers = await prisma.customer.findMany({
        where: { email: { not: null, contains: "@" } },
        select: { email: true, name: true, pointsBalance: true },
      });
      recipients = customers
        .filter((c): c is { email: string; name: string; pointsBalance: number } => !!c.email)
        .map((c) => ({ email: c.email!, name: c.name, pointsBalance: c.pointsBalance }));
    } else if (targetAudience === "active") {
      // Visited in last 45 days
      const cutoff = new Date(Date.now() - 45 * 86400_000);
      const customers = await prisma.customer.findMany({
        where: {
          email: { not: null, contains: "@" },
          lastVisitAt: { gte: cutoff },
        },
        select: { email: true, name: true, pointsBalance: true },
      });
      recipients = customers
        .filter((c): c is { email: string; name: string; pointsBalance: number } => !!c.email)
        .map((c) => ({ email: c.email!, name: c.name, pointsBalance: c.pointsBalance }));
    } else if (targetAudience === "birthdays") {
      // Find customers whose birthday falls in current month
      const currentMonth = new Date().getMonth() + 1; // 1-12
      const allWithBirthday = await prisma.customer.findMany({
        where: {
          email: { not: null, contains: "@" },
          birthday: { not: null },
        },
        select: { email: true, name: true, pointsBalance: true, birthday: true },
      });

      recipients = allWithBirthday
        .filter((c) => {
          if (!c.email || !c.birthday) return false;
          const bMonth = new Date(c.birthday).getMonth() + 1;
          return bMonth === currentMonth;
        })
        .map((c) => ({ email: c.email!, name: c.name, pointsBalance: c.pointsBalance }));
    }

    if (recipients.length === 0) {
      return NextResponse.json({
        error: "No matching customers found with registered email addresses for this audience filter.",
      }, { status: 404 });
    }

    if (previewOnly) {
      return NextResponse.json({
        ok: true,
        preview: true,
        recipientCount: recipients.length,
        sampleRecipients: recipients.slice(0, 5),
      });
    }

    // Dispatch Emails
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const r of recipients) {
      // Replace dynamic merge tags
      const personalizedHtml = content
        .replace(/{customer_name}/g, r.name || "Valued Member")
        .replace(/{name}/g, r.name || "Valued Member")
        .replace(/{points_balance}/g, String(r.pointsBalance || 0))
        .replace(/{app_name}/g, "Bombay Chowpatty Loyalty");

      const personalizedSubject = subject
        .replace(/{customer_name}/g, r.name || "Valued Member")
        .replace(/{name}/g, r.name || "Valued Member");

      const res = await sendEmail({
        to: r.email,
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

      if (res.ok) {
        successCount++;
      } else {
        failedCount++;
        if (errors.length < 3 && res.error) errors.push(res.error);
      }
    }

    // Trigger Admin Notification for Email Campaign
    await createNotification({
      type: "EMAIL_SENT",
      title: `Email Campaign Sent: "${subject.slice(0, 30)}..."`,
      message: `Successfully dispatched to ${successCount} recipient${successCount === 1 ? "" : "s"} (${failedCount} failed).`,
      metadata: {
        subject,
        targetAudience,
        successCount,
        failedCount,
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Email broadcast completed! Sent: ${successCount}, Failed: ${failedCount}.`,
      successCount,
      failedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to broadcast email." }, { status: 500 });
  }
}
