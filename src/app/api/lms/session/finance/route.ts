import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { lmsOwnerFromAuth } from "@/lib/lms/api-owner";
import { lmsOwnerWhere, lmsSessionContext } from "@/lib/lms/session-context";
import { prisma } from "@/lib/prisma";
import { mapLmsFinance } from "@/systems/lms/lib/mappers";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await lmsOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await lmsSessionContext(own.ownerId);
    const url = new URL(req.url);
    const type = url.searchParams.get("type");

    const rows = await prisma.lmsFinanceTransaction.findMany({
      where: {
        profileId: profile.id,
        ...lmsOwnerWhere(own.ownerId, scope.trialSessionId),
        ...(type === "INCOME" || type === "EXPENSE" ? { type } : {}),
      },
      orderBy: { transactedAt: "desc" },
    });

    const income = rows.filter((r) => r.type === "INCOME").reduce((s, r) => s + r.amountBaht, 0);
    const expense = rows.filter((r) => r.type === "EXPENSE").reduce((s, r) => s + r.amountBaht, 0);

    return NextResponse.json({
      summary: { income, expense, balance: income - expense },
      transactions: rows.map(mapLmsFinance),
    });
  } catch (e) {
    console.error("[lms/session/finance GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await lmsOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await lmsSessionContext(own.ownerId);
    const body = (await req.json()) as Record<string, unknown>;
    const type = body.type === "INCOME" || body.type === "EXPENSE" ? body.type : null;
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const amountBaht = typeof body.amountBaht === "number" ? Math.round(body.amountBaht) : NaN;
    const transactedAtRaw = typeof body.transactedAt === "string" ? body.transactedAt : "";
    if (!type || !category || !Number.isFinite(amountBaht) || amountBaht <= 0 || !transactedAtRaw) {
      return NextResponse.json({ error: "กรอกข้อมูลการเงินให้ครบ" }, { status: 400 });
    }
    const transactedAt = new Date(transactedAtRaw);
    if (Number.isNaN(transactedAt.getTime())) {
      return NextResponse.json({ error: "วันที่ไม่ถูกต้อง" }, { status: 400 });
    }

    const row = await prisma.lmsFinanceTransaction.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        profileId: profile.id,
        type,
        category: category.slice(0, 120),
        amountBaht,
        transactedAt,
        note: typeof body.note === "string" ? body.note.slice(0, 500) : "",
        slipUrl: typeof body.slipUrl === "string" ? body.slipUrl.slice(0, 512) : null,
      },
    });

    return NextResponse.json({ transaction: mapLmsFinance(row) });
  } catch (e) {
    console.error("[lms/session/finance POST]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
