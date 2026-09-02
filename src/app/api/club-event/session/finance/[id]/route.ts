import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { clubEventOwnerFromAuth } from "@/lib/club-event/api-owner";
import { clubEventOwnerWhere, clubEventSessionContext } from "@/lib/club-event/session-context";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id } = await ctx.params;
    const { scope } = await clubEventSessionContext(own.ownerId);
    const existing = await prisma.clubEventFinanceTransaction.findFirst({
      where: { id, ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId) },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

    const body = (await req.json()) as Record<string, unknown>;
    const transactedAt =
      typeof body.transactedAt === "string" ? new Date(body.transactedAt) : existing.transactedAt;

    const row = await prisma.clubEventFinanceTransaction.update({
      where: { id },
      data: {
        type: body.type === "INCOME" || body.type === "EXPENSE" ? body.type : existing.type,
        category: typeof body.category === "string" ? body.category.slice(0, 120) : existing.category,
        amountBaht:
          typeof body.amountBaht === "number" && body.amountBaht > 0
            ? Math.round(body.amountBaht)
            : existing.amountBaht,
        transactedAt: Number.isNaN(transactedAt.getTime()) ? existing.transactedAt : transactedAt,
        note: typeof body.note === "string" ? body.note.slice(0, 500) : existing.note,
        slipUrl:
          typeof body.slipUrl === "string"
            ? body.slipUrl.slice(0, 512)
            : body.slipUrl === null
              ? null
              : existing.slipUrl,
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
    console.error("[club-event/session/finance/[id] PATCH]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id } = await ctx.params;
    const { scope } = await clubEventSessionContext(own.ownerId);
    const existing = await prisma.clubEventFinanceTransaction.findFirst({
      where: { id, ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId) },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

    await prisma.clubEventFinanceTransaction.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[club-event/session/finance/[id] DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
