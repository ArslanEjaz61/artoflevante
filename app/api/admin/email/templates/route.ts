import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminScope";
import { prisma } from "@/lib/db";

const DEFAULT_BIRTHDAY_TEMPLATE = {
  name: "🎂 Royal Birthday Celebration & Treat",
  category: "BIRTHDAY",
  subject: "🎂 Happy Birthday {customer_name}! A Special Gift from Bombay Chowpatty",
  isDefault: true,
  content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF7F4; padding: 28px; border-radius: 20px; border: 1px solid #EAE3DC;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #801313; margin: 0; font-size: 26px; font-weight: 900;">🎉 Happy Birthday, {customer_name}! 🎂</h1>
    <p style="color: #7A6E67; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px; font-weight: bold;">Bombay Chowpatty Loyalty Club</p>
  </div>
  
  <div style="background: white; padding: 26px; border-radius: 16px; border: 1px solid #EAE3DC; color: #1E1815; line-height: 1.6;">
    <p style="font-size: 15px; margin-top: 0;">We are thrilled to celebrate your special day with you! To make your celebration unforgettable, we have added a special birthday treat to your loyalty card.</p>
    
    <div style="background: #FAF3E6; border: 2px dashed #C68A1E; border-radius: 14px; padding: 20px; margin: 20px 0; text-align: center;">
      <div style="font-size: 12px; color: #9E690B; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px;">YOUR EXCLUSIVE BIRTHDAY REWARD</div>
      <div style="font-size: 20px; color: #801313; font-weight: 900; margin: 8px 0;">{reward_name}</div>
      <p style="font-size: 13px; color: #5C504A; margin: 6px 0 0 0;">{reward_description}</p>
      <div style="margin-top: 12px; font-size: 11px; color: #7A6E67; font-weight: bold;">Valid for 30 Days Across All 14 UAE Outlets</div>
    </div>
    
    <div style="background: #FAF7F4; border-radius: 10px; padding: 12px 16px; margin-bottom: 18px; display: flex; justify-content: space-between;">
      <span style="font-size: 13px; color: #7A6E67;">Your Loyalty Points Balance:</span>
      <strong style="font-size: 14px; color: #801313;">{points_balance} Points</strong>
    </div>

    <p style="font-size: 13px; color: #5C504A; margin-bottom: 0;">Simply present your digital loyalty card or phone number at checkout to redeem your complimentary birthday treat!</p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #8C7F78;">
    <p style="margin: 0;">Bombay Chowpatty UAE • Dubai • Sharjah • Ajman</p>
  </div>
</div>`,
};

const DEFAULT_OFFERS_TEMPLATE = {
  name: "🔥 VIP Exclusive Deals & Special Promotions",
  category: "OFFERS",
  subject: "🔥 Exclusive Deal for {customer_name}: Special Treat at Bombay Chowpatty!",
  isDefault: true,
  content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF7F4; padding: 28px; border-radius: 20px; border: 1px solid #EAE3DC;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #801313; margin: 0; font-size: 26px; font-weight: 900;">🔥 Special Member Treat Awaits You! 🌟</h1>
    <p style="color: #7A6E67; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px; font-weight: bold;">Bombay Chowpatty Loyalty Club Exclusive</p>
  </div>
  
  <div style="background: white; padding: 26px; border-radius: 16px; border: 1px solid #EAE3DC; color: #1E1815; line-height: 1.6;">
    <p style="font-size: 15px; margin-top: 0;">Hello <strong>{customer_name}</strong>,</p>
    <p style="font-size: 14px; color: #5C504A;">We have launched a limited-time promotional deal exclusively for our Loyalty Club members. Enjoy delicious savings and earn extra points on your next dining visit!</p>
    
    <div style="background: #EAF5EE; border: 2px dashed #1E7A4D; border-radius: 14px; padding: 20px; margin: 20px 0; text-align: center;">
      <div style="font-size: 12px; color: #1E7A4D; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px;">LIMITED TIME PROMOTIONAL OFFER</div>
      <div style="font-size: 22px; color: #801313; font-weight: 900; margin: 8px 0;">{offer_title}</div>
      <p style="font-size: 13px; color: #355E44; margin: 6px 0 0 0;">Valid across all Bombay Chowpatty UAE locations.</p>
    </div>
    
    <div style="background: #FAF7F4; border-radius: 10px; padding: 12px 16px; margin-bottom: 18px;">
      <span style="font-size: 13px; color: #7A6E67;">Your Available Points: </span>
      <strong style="font-size: 14px; color: #801313;">{points_balance} Points</strong>
    </div>

    <p style="font-size: 13px; color: #5C504A; margin-bottom: 0;">Visit your nearest Bombay Chowpatty branch or show your digital card to enjoy this exclusive offer today.</p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #8C7F78;">
    <p style="margin: 0;">Bombay Chowpatty UAE • Authentic Indian Street Food & Sweets</p>
  </div>
</div>`,
};

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    let templates = await prisma.emailTemplate.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    // Auto-seed default templates if none exist
    if (templates.length === 0) {
      const t1 = await prisma.emailTemplate.create({ data: DEFAULT_BIRTHDAY_TEMPLATE });
      const t2 = await prisma.emailTemplate.create({ data: DEFAULT_OFFERS_TEMPLATE });
      templates = [t1, t2];
    }

    const defaultBirthday = templates.find((t) => t.category === "BIRTHDAY" && t.isDefault) || templates.find((t) => t.category === "BIRTHDAY");
    const defaultOffers = templates.find((t) => t.category === "OFFERS" && t.isDefault) || templates.find((t) => t.category === "OFFERS");

    return NextResponse.json({
      ok: true,
      templates,
      defaultBirthdayId: defaultBirthday?.id || null,
      defaultOffersId: defaultOffers?.id || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load email templates." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const body = await req.json();
    const { name, category, subject, content, isDefault } = body || {};

    if (!name?.trim()) return NextResponse.json({ error: "Template name is required." }, { status: 400 });
    if (!subject?.trim()) return NextResponse.json({ error: "Email subject line is required." }, { status: 400 });
    if (!content?.trim()) return NextResponse.json({ error: "Email HTML message body is required." }, { status: 400 });

    const cleanCategory = ["BIRTHDAY", "OFFERS", "GENERAL"].includes(category) ? category : "GENERAL";
    const willBeDefault = Boolean(isDefault);

    if (willBeDefault) {
      await prisma.emailTemplate.updateMany({
        where: { category: cleanCategory },
        data: { isDefault: false },
      });
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name: String(name).trim(),
        category: cleanCategory,
        subject: String(subject).trim(),
        content: String(content).trim(),
        isDefault: willBeDefault,
      },
    });

    return NextResponse.json({ ok: true, template });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create email template." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const body = await req.json();
    const { id, name, category, subject, content, isDefault, action } = body || {};

    if (!id) return NextResponse.json({ error: "Template ID is required." }, { status: 400 });

    const existing = await prisma.emailTemplate.findUnique({ where: { id: String(id) } });
    if (!existing) return NextResponse.json({ error: "Template not found." }, { status: 404 });

    // Handle Quick "Set as Default" Action
    if (action === "set_default") {
      await prisma.emailTemplate.updateMany({
        where: { category: existing.category },
        data: { isDefault: false },
      });
      const updated = await prisma.emailTemplate.update({
        where: { id: existing.id },
        data: { isDefault: true },
      });
      return NextResponse.json({ ok: true, template: updated });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (category !== undefined && ["BIRTHDAY", "OFFERS", "GENERAL"].includes(category)) {
      updateData.category = category;
    }
    if (subject !== undefined) updateData.subject = String(subject).trim();
    if (content !== undefined) updateData.content = String(content).trim();

    if (isDefault !== undefined) {
      const willBeDefault = Boolean(isDefault);
      updateData.isDefault = willBeDefault;
      if (willBeDefault) {
        const cat = updateData.category || existing.category;
        await prisma.emailTemplate.updateMany({
          where: { category: cat },
          data: { isDefault: false },
        });
      }
    }

    const template = await prisma.emailTemplate.update({
      where: { id: String(id) },
      data: updateData,
    });

    return NextResponse.json({ ok: true, template });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update email template." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Template ID is required." }, { status: 400 });

    await prisma.emailTemplate.delete({ where: { id } });
    return NextResponse.json({ ok: true, message: "Template deleted successfully." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete email template." }, { status: 500 });
  }
}
