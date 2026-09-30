import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminScope";
import { canAccessAllBranches } from "@/lib/session";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";

// Helper to calculate days until next birthday
function getDaysUntilBirthday(birthdayDate: Date | string | null): number | null {
  if (!birthdayDate) return null;
  const b = new Date(birthdayDate);
  if (isNaN(b.getTime())) return null;

  const today = new Date();
  const nextBirthday = new Date(today.getFullYear(), b.getMonth(), b.getDate());

  // If already passed this year, look at next year
  if (nextBirthday.getTime() < new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }

  const diffTime = nextBirthday.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// GET: Fetch all Birthday Gift rules and upcoming birthday celebrants
export async function GET() {
  const { error, status, session } = await requireAdmin();
  if (error || !session) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  }

  try {
    let birthdayRewards = await prisma.reward.findMany({
      where: { type: "BIRTHDAY" },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { customerRewards: true } },
      },
    });

    // Seed default birthday gift rule if none exists
    if (birthdayRewards.length === 0) {
      await prisma.reward.create({
        data: {
          name: "Birthday Special: Free Royal Dessert & 20% Off",
          nameAr: "عرض عيد الميلاد: حلوى ملكية مجانية وخصم 20%",
          description: "Enjoy a complimentary special dessert plus 20% off your entire bill during your birthday month!",
          type: "BIRTHDAY",
          threshold: 0,
          value: 20,
          isPercent: true,
          validDays: 30,
          isActive: true,
        },
      });

      birthdayRewards = await prisma.reward.findMany({
        where: { type: "BIRTHDAY" },
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { customerRewards: true } },
        },
      });
    }

    // Find customers with birthdays recorded
    const allCustomersWithBday = await prisma.customer.findMany({
      where: {
        birthday: { not: null },
        isBlocked: false,
      },
      select: {
        id: true,
        name: true,
        mobile: true,
        email: true,
        birthday: true,
        pointsBalance: true,
        visitCount: true,
        customerRewards: {
          where: {
            reward: { type: "BIRTHDAY" },
          },
          orderBy: { issuedAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            issuedAt: true,
            expiresAt: true,
            reward: { select: { name: true } },
          },
        },
      },
    });

    const thisYear = new Date().getFullYear();

    // Map upcoming celebrants (next 45 days or current month)
    const upcomingCelebrants = allCustomersWithBday
      .map((c) => {
        const daysLeft = getDaysUntilBirthday(c.birthday);
        const lastGift = c.customerRewards[0] || null;
        const alreadyReceivedThisYear = lastGift
          ? new Date(lastGift.issuedAt).getFullYear() === thisYear
          : false;

        return {
          id: c.id,
          name: c.name,
          mobile: c.mobile,
          email: c.email,
          birthday: c.birthday,
          pointsBalance: c.pointsBalance,
          visitCount: c.visitCount,
          daysUntilBirthday: daysLeft,
          alreadyReceivedThisYear,
          lastGift,
        };
      })
      .filter((c) => c.daysUntilBirthday !== null && c.daysUntilBirthday <= 45)
      .sort((a, b) => (a.daysUntilBirthday || 0) - (b.daysUntilBirthday || 0));

    return NextResponse.json({
      ok: true,
      canEdit: canAccessAllBranches(session.role),
      rewards: birthdayRewards.map((r) => ({
        id: r.id,
        name: r.name,
        nameAr: r.nameAr,
        description: r.description,
        descriptionAr: r.descriptionAr,
        threshold: r.threshold,
        value: Number(r.value),
        isPercent: r.isPercent,
        validDays: r.validDays || 30,
        isActive: r.isActive,
        claimCount: r._count.customerRewards,
        createdAt: r.createdAt,
      })),
      upcomingCelebrants,
      totalCelebrantsCount: upcomingCelebrants.length,
    });
  } catch (err: any) {
    console.error("GET /api/admin/birthday-rewards error:", err);
    return NextResponse.json({ error: "Failed to load birthday rewards." }, { status: 500 });
  }
}

// POST: Create a new birthday gift reward rule OR grant treat to customer(s)
export async function POST(req: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error || !session) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  }

  if (!canAccessAllBranches(session.role)) {
    return NextResponse.json({ error: "Only Administrators can modify loyalty birthday rules." }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const { action, customerId, rewardId, name, nameAr, description, descriptionAr, value, isPercent, validDays, isActive, sendEmailNotification } = body || {};

  // 1. Action: "grant" (Issue Birthday Treat to specific customer or all upcoming)
  if (action === "grant") {
    const allActiveBirthdayRewards = await prisma.reward.findMany({
      where: { type: "BIRTHDAY", isActive: true },
    });

    if (allActiveBirthdayRewards.length === 0 && !rewardId) {
      return NextResponse.json({ error: "No active Birthday Reward rule found. Please create or enable one first." }, { status: 400 });
    }

    const explicitReward = rewardId ? await prisma.reward.findUnique({ where: { id: rewardId } }) : null;

    // Target customers: single customerId or "all_upcoming"
    let targetCustomers: any[] = [];
    if (customerId && customerId !== "ALL_UPCOMING") {
      const cust = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!cust) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
      targetCustomers = [cust];
    } else {
      // All customers with birthday in next 45 days who have not yet received this year
      const allWithBday = await prisma.customer.findMany({
        where: { birthday: { not: null }, isBlocked: false },
        include: {
          customerRewards: {
            where: { reward: { type: "BIRTHDAY" } },
            orderBy: { issuedAt: "desc" },
            take: 1,
          },
        },
      });

      const thisYear = new Date().getFullYear();
      targetCustomers = allWithBday.filter((c) => {
        const days = getDaysUntilBirthday(c.birthday);
        const lastGift = c.customerRewards[0];
        const alreadyReceived = lastGift && new Date(lastGift.issuedAt).getFullYear() === thisYear;
        return days !== null && days <= 45 && !alreadyReceived;
      });
    }

    if (targetCustomers.length === 0) {
      return NextResponse.json({ error: "No eligible upcoming birthday celebrants found to dispatch gifts to." }, { status: 400 });
    }

    let grantedCount = 0;
    for (const cust of targetCustomers) {
      // Randomly pick from active birthday gift rules if multiple exist, or use explicit selection
      const activeBirthdayReward = explicitReward ||
        allActiveBirthdayRewards[Math.floor(Math.random() * allActiveBirthdayRewards.length)];

      if (!activeBirthdayReward) continue;

      const expiryDate = activeBirthdayReward.validDays
        ? new Date(Date.now() + activeBirthdayReward.validDays * 86400_000)
        : new Date(Date.now() + 30 * 86400_000);

      await prisma.customerReward.create({
        data: {
          customerId: cust.id,
          rewardId: activeBirthdayReward.id,
          status: "AVAILABLE",
          expiresAt: expiryDate,
        },
      });

      // Also award bonus points if configured
      if (!activeBirthdayReward.isPercent && Number(activeBirthdayReward.value) > 0 && activeBirthdayReward.threshold === 0) {
        const bonusPts = Math.floor(Number(activeBirthdayReward.value));
        await prisma.customer.update({
          where: { id: cust.id },
          data: { pointsBalance: { increment: bonusPts } },
        });
        await prisma.pointsLedger.create({
          data: {
            customerId: cust.id,
            delta: bonusPts,
            reason: "birthday",
            note: `Birthday treat gift: +${bonusPts} bonus points awarded`,
          },
        });
      }

      // Send Email Greeting if customer has an email address
      if (cust.email && sendEmailNotification !== false) {
        try {
          const defaultBdayTpl = await prisma.emailTemplate.findFirst({
            where: { category: "BIRTHDAY", isDefault: true },
          });

          let emailSubject = `🎂 Happy Birthday ${cust.name}! A Special Gift from Levante`;
          let emailHtml = "";

          if (defaultBdayTpl) {
            emailSubject = defaultBdayTpl.subject
              .replace(/{customer_name}/g, cust.name || "Valued Member")
              .replace(/{points_balance}/g, String(cust.pointsBalance || 0))
              .replace(/{reward_name}/g, activeBirthdayReward.name || "Special Birthday Gift")
              .replace(/{reward_description}/g, activeBirthdayReward.description || "")
              .replace(/{expiry_date}/g, expiryDate.toLocaleDateString());

            emailHtml = defaultBdayTpl.content
              .replace(/{customer_name}/g, cust.name || "Valued Member")
              .replace(/{points_balance}/g, String(cust.pointsBalance || 0))
              .replace(/{reward_name}/g, activeBirthdayReward.name || "Special Birthday Gift")
              .replace(/{reward_description}/g, activeBirthdayReward.description || "")
              .replace(/{expiry_date}/g, expiryDate.toLocaleDateString());
          } else {
            emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF7F4; padding: 24px; border-radius: 16px; border: 1px solid #EAE3DC;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h1 style="color: #0E331E; margin: 0; font-size: 24px;">🎉 Happy Birthday, ${cust.name}! 🎂</h1>
                  <p style="color: #7A6E67; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-top: 6px;">Levante Rewards</p>
                </div>
                <div style="background: white; padding: 24px; border-radius: 14px; border: 1px solid #EAE3DC; color: #1E1815; line-height: 1.6;">
                  <p style="font-size: 15px; margin-top: 0;">We wish you a wonderful and delicious birthday filled with joy and sweet memories!</p>
                  <div style="background: #FAF3E6; border: 1px dashed #C68A1E; border-radius: 12px; padding: 18px; margin: 18px 0; text-align: center;">
                    <div style="font-size: 12px; color: #9E690B; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">YOUR BIRTHDAY GIFT VOUCHER</div>
                    <div style="font-size: 18px; color: #0E331E; font-weight: 900; margin: 6px 0;">${activeBirthdayReward.name}</div>
                    <p style="font-size: 13px; color: #5C504A; margin: 4px 0 0 0;">${activeBirthdayReward.description}</p>
                    <div style="margin-top: 10px; font-size: 11px; color: #7A6E67;">Valid until: <strong>${expiryDate.toLocaleDateString()}</strong></div>
                  </div>
                  <p style="font-size: 13px; color: #5C504A; margin-bottom: 0;">Show your digital QR card or phone number at the Levante boutique to redeem your birthday treat!</p>
                </div>
              </div>
            `;
          }

          await sendEmail({
            to: cust.email,
            subject: emailSubject,
            html: emailHtml,
          });
        } catch (mailErr) {
          console.error("Birthday email send error:", mailErr);
        }
      }

      grantedCount++;
    }

    // Trigger Admin Notification
    await createNotification({
      type: "BIRTHDAY_GIFT",
      title: `Birthday Treats Dispatched! 🎂`,
      message: `Issued birthday gifts to ${grantedCount} birthday celebrant${grantedCount === 1 ? "" : "s"}.`,
      metadata: {
        grantedCount,
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Birthday gift successfully dispatched to ${grantedCount} member${grantedCount === 1 ? "" : "s"}!`,
      grantedCount,
    });
  }

  // 2. Action: Create new Birthday Gift Rule
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Please enter a birthday gift title / name." }, { status: 400 });
  }

  const numVal = parseFloat(String(value ?? 0));
  const numValidDays = parseInt(String(validDays ?? 30), 10);

  const newReward = await prisma.reward.create({
    data: {
      name: name.trim(),
      nameAr: nameAr ? String(nameAr).trim() : null,
      description: description ? String(description).trim() : null,
      descriptionAr: descriptionAr ? String(descriptionAr).trim() : null,
      type: "BIRTHDAY",
      threshold: 0,
      value: isNaN(numVal) ? 0 : numVal,
      isPercent: isPercent === true || isPercent === "true",
      validDays: isNaN(numValidDays) ? 30 : numValidDays,
      isActive: isActive !== false,
    },
  });

  return NextResponse.json({
    ok: true,
    message: `Birthday treat rule "${newReward.name}" created successfully!`,
    reward: newReward,
  });
}

// PATCH: Update a Birthday Gift Rule
export async function PATCH(req: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error || !session) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  }

  if (!canAccessAllBranches(session.role)) {
    return NextResponse.json({ error: "Only Administrators can modify birthday rules." }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const { id, name, nameAr, description, descriptionAr, value, isPercent, validDays, isActive } = body || {};

  if (!id) {
    return NextResponse.json({ error: "Reward ID is required." }, { status: 400 });
  }

  const existing = await prisma.reward.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Birthday reward rule not found." }, { status: 404 });
  }

  const updated = await prisma.reward.update({
    where: { id },
    data: {
      name: name !== undefined ? String(name).trim() : undefined,
      nameAr: nameAr !== undefined ? (nameAr ? String(nameAr).trim() : null) : undefined,
      description: description !== undefined ? (description ? String(description).trim() : null) : undefined,
      descriptionAr: descriptionAr !== undefined ? (descriptionAr ? String(descriptionAr).trim() : null) : undefined,
      value: value !== undefined ? parseFloat(String(value)) : undefined,
      isPercent: isPercent !== undefined ? (isPercent === true || isPercent === "true") : undefined,
      validDays: validDays !== undefined ? parseInt(String(validDays), 10) : undefined,
      isActive: isActive !== undefined ? (isActive === true || isActive === "true") : undefined,
    },
  });

  return NextResponse.json({
    ok: true,
    message: `Birthday treat rule "${updated.name}" updated successfully.`,
    reward: updated,
  });
}

// DELETE: Delete a Birthday Gift Rule
export async function DELETE(req: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error || !session) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: status || 401 });
  }

  if (!canAccessAllBranches(session.role)) {
    return NextResponse.json({ error: "Only Administrators can delete birthday rules." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Reward ID is required." }, { status: 400 });
  }

  const existing = await prisma.reward.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Birthday reward rule not found." }, { status: 404 });
  }

  await prisma.reward.delete({ where: { id } });

  return NextResponse.json({
    ok: true,
    message: `Birthday treat rule "${existing.name}" has been deleted.`,
  });
}
