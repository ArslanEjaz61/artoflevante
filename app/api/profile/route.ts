import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerId } from "@/lib/session";
import { normalizeMobile, isValidEmail, DEFAULT_COUNTRY } from "@/lib/mobile";

export async function PATCH(req: NextRequest) {
  try {
    const customerId = await getCustomerId();
    if (!customerId) {
      return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, mobile, countryCode, email, birthday, language, homeBranchId } = body || {};
    const data: Record<string, any> = {};

    const currentCust = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, name: true, mobile: true, email: true, birthday: true },
    });

    if (!currentCust) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    // 1. Update Name
    if (name !== undefined) {
      const trimmed = String(name || "").trim();
      if (trimmed.length < 2) {
        return NextResponse.json({ error: "Please enter a valid full name (at least 2 characters)." }, { status: 400 });
      }
      data.name = trimmed;
    }

    // 2. Update Mobile Number (Login & Points Identity)
    if (mobile !== undefined) {
      const rawMobile = String(mobile || "").trim();
      if (!rawMobile) {
        return NextResponse.json({ error: "Mobile number cannot be empty." }, { status: 400 });
      }
      const normalizedMobile = normalizeMobile(rawMobile, countryCode || DEFAULT_COUNTRY);
      if (!normalizedMobile) {
        return NextResponse.json(
          { error: "Please enter a valid mobile number for the country selected." },
          { status: 400 }
        );
      }

      // Check duplicate mobile in another account
      if (normalizedMobile !== currentCust.mobile) {
        const duplicateMobile = await prisma.customer.findUnique({
          where: { mobile: normalizedMobile },
        });
        if (duplicateMobile && duplicateMobile.id !== customerId) {
          return NextResponse.json(
            { error: "This mobile number is already registered to another loyalty account." },
            { status: 409 }
          );
        }
        data.mobile = normalizedMobile;
      }
    }

    // 3. Update Email Address (Email Login & Digital Receipts)
    if (email !== undefined) {
      const trimmed = String(email || "").trim().toLowerCase();
      if (trimmed) {
        if (!isValidEmail(trimmed)) {
          return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
        }
        // Check duplicate email in another account
        if (trimmed !== (currentCust.email || "").toLowerCase()) {
          const duplicateEmail = await prisma.customer.findFirst({
            where: {
              email: { equals: trimmed, mode: "insensitive" },
              NOT: { id: customerId },
            },
          });
          if (duplicateEmail) {
            return NextResponse.json(
              { error: "This email address is already linked to another loyalty account." },
              { status: 409 }
            );
          }
          data.email = trimmed;
        }
      } else {
        data.email = null;
      }
    }

    // 4. Update Birthday (Surprise gifts - locked once set)
    if (birthday !== undefined) {
      if (currentCust.birthday) {
        const requestedDate = birthday ? new Date(birthday).toISOString().slice(0, 10) : "";
        const existingDate = currentCust.birthday.toISOString().slice(0, 10);
        if (requestedDate !== existingDate) {
          return NextResponse.json(
            { error: "Date of birth is already registered and locked. Please contact customer support if you need to update it." },
            { status: 400 }
          );
        }
      }

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

    // 5. Update Language Preference
    if (language !== undefined) {
      const lang = String(language || "").trim().toLowerCase();
      if (lang && ["en", "ar"].includes(lang)) {
        data.language = lang;
      }
    }

    // 6. Update Home Branch
    if (homeBranchId !== undefined && homeBranchId) {
      data.homeBranchId = String(homeBranchId);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No changes detected to update." }, { status: 400 });
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data,
      select: {
        id: true,
        name: true,
        mobile: true,
        email: true,
        birthday: true,
        language: true,
        homeBranchId: true,
      },
    });

    // Record Security Audit Log
    try {
      const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
      const userAgent = req.headers.get("user-agent")?.slice(0, 150) || "Customer Portal";
      await prisma.auditLog.create({
        data: {
          action: "customer.profile_update",
          entityType: "Customer",
          entityId: customerId,
          reason: `Customer updated profile fields: ${Object.keys(data).join(", ")}`,
          metadata: {
            changedFields: Object.keys(data),
            previous: {
              mobile: currentCust.mobile,
              email: currentCust.email,
              name: currentCust.name,
            },
            updated: {
              mobile: updatedCustomer.mobile,
              email: updatedCustomer.email,
              name: updatedCustomer.name,
            },
            ip,
            userAgent,
          },
        },
      });
    } catch (auditErr) {
      console.error("Failed to write profile update audit log:", auditErr);
    }

    return NextResponse.json({
      ok: true,
      customer: updatedCustomer,
      message: "Profile updated successfully!",
    });
  } catch (err: any) {
    console.error("Profile update error:", err);
    return NextResponse.json({ error: err.message || "Failed to update profile." }, { status: 500 });
  }
}
