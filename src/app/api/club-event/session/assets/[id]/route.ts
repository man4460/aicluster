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
    const existing = await prisma.clubEventAsset.findFirst({
      where: { id, ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId) },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบทรัพย์สิน" }, { status: 404 });

    const body = (await req.json()) as Record<string, unknown>;
    const row = await prisma.clubEventAsset.update({
      where: { id },
      data: {
        name: typeof body.name === "string" ? body.name.trim().slice(0, 200) : existing.name,
        quantity:
          typeof body.quantity === "number" && body.quantity > 0
            ? Math.round(body.quantity)
            : existing.quantity,
        status:
          body.status === "AVAILABLE" ||
          body.status === "IN_USE" ||
          body.status === "DAMAGED" ||
          body.status === "RETIRED"
            ? body.status
            : existing.status,
        note: typeof body.note === "string" ? body.note.slice(0, 500) : existing.note,
      },
    });

    return NextResponse.json({
      asset: {
        id: row.id,
        name: row.name,
        quantity: row.quantity,
        status: row.status,
        note: row.note,
      },
    });
  } catch (e) {
    console.error("[club-event/session/assets/[id] PATCH]", e);
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
    const existing = await prisma.clubEventAsset.findFirst({
      where: { id, ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId) },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบทรัพย์สิน" }, { status: 404 });

    await prisma.clubEventAsset.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[club-event/session/assets/[id] DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
