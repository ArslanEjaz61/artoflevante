import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerId } from "@/lib/session";
import { isValidEmail } from "@/lib/mobile";

export async function PATCH(req: NextRequest) {
  try {
    const customerId = await getCustomerId();
    if (!customerId) {
      return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, email, birthday, language, homeBranchId } = body || {};
    const data: Record<string, any> = {};

    if (name !== undefined) {
      const trimmed = String(name || "").trim();
      if (trimmed.length < 2) {
        return NextResponse.json({ error: "Please enter a valid full name (at least 2 characters)." }, { status: 400 });
      }
      data.name = trimmed;
    }

    if (email !== undefined) {
      const trimmed = String(email || "").trim();
      if (trimmed) {
        if (!isValidEmail(trimmed)) {
          return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
        }
        data.email = trimmed;
      } else {
        data.email = null;
      }
    }

    if (birthday !== undefined) {
      if (!birthday || String(birthday).trim() === "") {
        data.birthday = null;
      } else {
        const parsed = new Date(birthday);
        if (Number.isNaN(parsed.getTime())) {
          return NextResponse.json({ error: "Please enter a valid date of birth." }, { status: 400 });
        }
        if (parsed > new Date()) {
          return NextResponse.json({ error: "Date of birth cannot be in the future." }, { status: 400 });
        }
        data.birthday = parsed;
      }
    }

    if (language !== undefined) {
      const lang = String(language || "").trim().toLowerCase();
      if (lang && ["en", "ar"].includes(lang)) {
        data.language = lang;
      }
    }

    if (homeBranchId !== undefined && homeBranchId) {
      data.homeBranchId = String(homeBranchId);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No changes detected to update." }, { status: 400 });
    }

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data,
      select: { id: true, name: true, email: true, birthday: true, language: true, homeBranchId: true },
    });

    return NextResponse.json({ ok: true, customer, message: "Profile updated successfully!" });
  } catch (err: any) {
    console.error("Profile update error:", err);
    return NextResponse.json({ error: err.message || "Failed to update profile." }, { status: 500 });
  }
}
