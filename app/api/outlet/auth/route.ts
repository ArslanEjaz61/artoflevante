import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setOutletSession, getOutletSession, clearOutletSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getOutletSession();
    if (!session) {
      return NextResponse.json({ authenticated: false });
    }

    const branch = await prisma.branch.findFirst({
      where: {
        id: session.branchId,
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        city: true,
        address: true,
        hours: true,
        dailyCode: true,
        invoicePrefix: true,
      },
    });

    if (!branch) {
      await clearOutletSession();
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      branch,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to check outlet session." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const rawCode = String(body?.code || "").trim();
    if (!rawCode) {
      return NextResponse.json({ error: "Please enter your outlet code." }, { status: 400 });
    }

    const branch = await prisma.branch.findFirst({
      where: {
        OR: [
          { code: { equals: rawCode, mode: "insensitive" } },
          { dailyCode: { equals: rawCode, mode: "insensitive" } },
        ],
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        city: true,
        address: true,
        hours: true,
        dailyCode: true,
        invoicePrefix: true,
      },
    });

    if (!branch) {
      return NextResponse.json({
        error: "Outlet code not recognized. Please check your branch code.",
      }, { status: 401 });
    }

    await setOutletSession({
      id: branch.id,
      code: branch.code,
      name: branch.name,
    });

    return NextResponse.json({
      ok: true,
      branch,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to authenticate outlet." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await clearOutletSession();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to clear outlet session." }, { status: 500 });
  }
}
