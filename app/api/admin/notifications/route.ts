import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminScope";
import {
  getAdminNotifications,
  markNotificationsAsRead,
  clearAdminNotifications,
} from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "40", 10);

  const data = await getAdminNotifications(limit);
  return NextResponse.json({ ok: true, ...data });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const body = await req.json();
    const { action, id } = body || {};

    if (action === "mark_read" && id) {
      await markNotificationsAsRead(id);
    } else if (action === "mark_all_read" || id === "ALL") {
      await markNotificationsAsRead();
    } else {
      await markNotificationsAsRead(id);
    }

    const data = await getAdminNotifications();
    return NextResponse.json({ ok: true, ...data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update notification" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";

    await clearAdminNotifications(!all);
    const data = await getAdminNotifications();
    return NextResponse.json({ ok: true, ...data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to clear notifications" }, { status: 500 });
  }
}
