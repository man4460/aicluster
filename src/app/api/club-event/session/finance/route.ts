import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { clubEventOwnerFromAuth } from "@/lib/club-event/api-owner";
import { clubEventOwnerWhere, clubEventSessionContext } from "@/lib/club-event/session-context";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await clubEventSessionContext(own.ownerId);
    const url = new URL(req.url);
    const type = url.searchParams.get("type");

    const rows = await prisma.clubEventFinanceTransaction.findMany({
      where: {
        profileId: profile.id,
        ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId),
        ...(type === "INCOME" || type === "EXPENSE" ? { type } : {}),
      },
      orderBy: { transactedAt: "desc" },
    });

    const income = rows.filter((r) => r.type === "INCOME").reduce((s, r) => s + r.amountBaht, 0);
    const expense = rows.filter((r) => r.type === "EXPENSE").reduce((s, r) => s + r.amountBaht, 0);

    return NextResponse.json({
      summary: { income, expense, balance: income - expense },
      transactions: rows.map((r) => ({
        id: r.id,
        type: r.type,
        category: r.category,
        amountBaht: r.amountBaht,
        transactedAt: r.transactedAt.toISOString(),
        note: r.note,
        slipUrl: r.slipUrl,
      })),
    });
  } catch (e) {
    console.error("[club-event/session/finance GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await clubEventSessionContext(own.ownerId);
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

    const row = await prisma.clubEventFinanceTransaction.create({
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

    return NextResponse.json({
      transaction: {
        id: row.id,
        type: row.type,
        category: row.category,
        amountBaht: row.amountBaht,
        transactedAt: row.transactedAt.toISOString(),
        note: row.note,
        slipUrl: row.slipUrl,
      },
    });
  } catch (e) {
    console.error("[club-event/session/finance POST]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
