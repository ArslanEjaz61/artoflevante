import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminScope";
import { prisma } from "@/lib/db";
import { clearSettingsCache } from "@/lib/loyalty";
import { getSmtpConfig, testSmtpConnection } from "@/lib/email";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  const config = await getSmtpConfig();
  // Return masked password for security
  return NextResponse.json({
    ok: true,
    settings: {
      ...config,
      pass: config.pass ? "••••••••••••" : "",
      hasPassword: !!config.pass,
    },
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
      host,
      port,
      secure,
      user,
      pass,
      fromEmail,
      fromName,
      testRecipient,
      action,
    } = body || {};

    // 1. If Action is "test", test SMTP configuration directly
    if (action === "test") {
      if (!testRecipient) {
        return NextResponse.json({ error: "Please enter a test recipient email address." }, { status: 400 });
      }

      // If pass is masked ("••••••••••••"), get existing password from DB
      let finalPass = pass;
      if (!finalPass || finalPass.includes("••••")) {
        const current = await getSmtpConfig();
        finalPass = current.pass;
      }

      const testRes = await testSmtpConnection(testRecipient, {
        host: host?.trim(),
        port: parseInt(String(port || 587), 10),
        secure: secure === true || secure === "true",
        user: user?.trim(),
        pass: finalPass,
        fromEmail: fromEmail?.trim(),
        fromName: fromName?.trim(),
      });

      return NextResponse.json(testRes);
    }

    // 2. Save SMTP settings to database
    const updates: Record<string, string> = {
      smtp_host: String(host || "").trim(),
      smtp_port: String(port || "587").trim(),
      smtp_secure: secure === true || secure === "true" ? "true" : "false",
      smtp_user: String(user || "").trim(),
      smtp_from_email: String(fromEmail || user || "").trim(),
      smtp_from_name: String(fromName || "Bombay Chowpatty Loyalty Club").trim(),
    };

    // Only update password if a new non-empty and unmasked password is provided
    if (pass && !pass.includes("••••")) {
      updates.smtp_pass = String(pass).trim();
    }

    for (const [key, value] of Object.entries(updates)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    clearSettingsCache();

    // Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          staffId: auth.session?.id || null,
          action: "settings.smtp_update",
          reason: `Updated SMTP email configuration (Host: ${updates.smtp_host}, Port: ${updates.smtp_port})`,
          metadata: {
            host: updates.smtp_host,
            port: updates.smtp_port,
            user: updates.smtp_user,
            fromEmail: updates.smtp_from_email,
          },
        },
      });
    } catch {}

    const updatedConfig = await getSmtpConfig();

    return NextResponse.json({
      ok: true,
      message: "SMTP Email settings saved successfully!",
      settings: {
        ...updatedConfig,
        pass: updatedConfig.pass ? "••••••••••••" : "",
        hasPassword: !!updatedConfig.pass,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update SMTP settings." }, { status: 500 });
  }
}
