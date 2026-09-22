import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { smartGuardTourOwnerFromAuth } from "@/lib/smart-guard-tour/api-owner";
import { smartGuardTourSessionContext } from "@/lib/smart-guard-tour/session-context";

type Ctx = { params: Promise<{ id: string }> };

const KINDS = new Set(["RADIO", "FLASHLIGHT", "VEHICLE", "OTHER"]);
const STATUSES = new Set(["AVAILABLE", "IN_USE", "MAINTENANCE", "RETIRED"]);

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    if (own.isStaff) return NextResponse.json({ error: "เฉพาะเจ้าของ" }, { status: 403 });
    const { shop } = await smartGuardTourSessionContext(own.ownerId);
    const existing = await prisma.smartGuardAsset.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบอุปกรณ์" }, { status: 404 });
    const body = (await req.json()) as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name.trim().slice(0, 200);
    if (typeof body.kind === "string" && KINDS.has(body.kind)) data.kind = body.kind;
    if (typeof body.status === "string" && STATUSES.has(body.status)) data.status = body.status;
    if (typeof body.assetCode === "string") data.assetCode = body.assetCode.trim().slice(0, 64) || null;
    if (typeof body.note === "string") data.note = body.note.trim().slice(0, 2000) || null;
    const row = await prisma.smartGuardAsset.update({ where: { id }, data });
    return NextResponse.json({
      asset: {
        id: row.id,
        name: row.name,
        kind: row.kind,
        assetCode: row.assetCode,
        status: row.status,
        note: row.note,
      },
    });
  } catch (e) {
    console.error("[smart-guard-tour/assets PATCH]", e);
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
    const existing = await prisma.smartGuardAsset.findFirst({
      where: { id, shopId: shop.id },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบอุปกรณ์" }, { status: 404 });
    await prisma.smartGuardAsset.update({
      where: { id },
      data: { status: "RETIRED" },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[smart-guard-tour/assets DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
