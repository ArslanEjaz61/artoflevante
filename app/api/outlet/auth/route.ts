import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

const OUTLET_COOKIE = "outlet_branch_code";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sampleOnly = searchParams.get("sampleOnly") === "true";

    const cookieStore = await cookies();
    const branchCode = cookieStore.get(OUTLET_COOKIE)?.value;

    if (sampleOnly || !branchCode) {
      // Provide sample active branch info for the entry screen helper
      const sampleBranch = await prisma.branch.findFirst({
        where: { isActive: true },
        select: { code: true, name: true, city: true },
        orderBy: { code: "asc" },
      });
      return NextResponse.json({ authenticated: false, sampleBranch });
    }

    const branch = await prisma.branch.findFirst({
      where: {
        OR: [
          { code: { equals: branchCode, mode: "insensitive" } },
          { id: branchCode },
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
      },
    });

    if (!branch) {
      cookieStore.delete(OUTLET_COOKIE);
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
          { id: rawCode },
          { name: { equals: rawCode, mode: "insensitive" } },
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
      },
    });

    if (!branch) {
      return NextResponse.json({
        error: "Outlet code not recognized. Please check your branch code.",
      }, { status: 404 });
    }

    const cookieStore = await cookies();
    cookieStore.set(OUTLET_COOKIE, branch.code, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
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
    const cookieStore = await cookies();
    cookieStore.delete(OUTLET_COOKIE);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to clear outlet session." }, { status: 500 });
  }
}
