import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { smartGuardTourOwnerFromAuth } from "@/lib/smart-guard-tour/api-owner";
import { smartGuardTourSessionContext } from "@/lib/smart-guard-tour/session-context";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    if (own.isStaff) return NextResponse.json({ error: "เฉพาะเจ้าของ" }, { status: 403 });
    const { shop } = await smartGuardTourSessionContext(own.ownerId);
    const existing = await prisma.smartGuardContact.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบผู้ติดต่อ" }, { status: 404 });
    const body = (await req.json()) as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    if (typeof body.displayName === "string") data.displayName = body.displayName.trim().slice(0, 200);
    if (typeof body.phone === "string") data.phone = body.phone.trim().slice(0, 32) || null;
    if (typeof body.lineId === "string") data.lineId = body.lineId.trim().slice(0, 120) || null;
    if (typeof body.note === "string") data.note = body.note.trim().slice(0, 2000) || null;
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    const row = await prisma.smartGuardContact.update({ where: { id }, data });
    return NextResponse.json({
      contact: {
        id: row.id,
        displayName: row.displayName,
        phone: row.phone,
        lineId: row.lineId,
        isActive: row.isActive,
        note: row.note,
      },
    });
  } catch (e) {
    console.error("[smart-guard-tour/contacts PATCH]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    if (own.isStaff) return NextResponse.json({ error: "เฉพาะเจ้าของ" }, { status: 403 });
    const { shop } = await smartGuardTourSessionContext(own.ownerId);
    const existing = await prisma.smartGuardContact.findFirst({
      where: { id, shopId: shop.id },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบผู้ติดต่อ" }, { status: 404 });
    await prisma.smartGuardContact.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[smart-guard-tour/contacts DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
