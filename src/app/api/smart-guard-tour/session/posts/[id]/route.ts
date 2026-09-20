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
    const existing = await prisma.smartGuardPost.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบจุด" }, { status: 404 });
    const body = (await req.json()) as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name.trim().slice(0, 200);
    if (body.code === null) data.code = null;
    else if (typeof body.code === "string") data.code = body.code.trim().slice(0, 40) || null;
    if (typeof body.zoneLabel === "string") data.zoneLabel = body.zoneLabel.trim().slice(0, 120) || null;
    if (typeof body.buildingLabel === "string")
      data.buildingLabel = body.buildingLabel.trim().slice(0, 120) || null;
    if (Array.isArray(body.linkedCheckpointIds)) {
      data.linkedCheckpointIdsJson = JSON.stringify(
        (body.linkedCheckpointIds as unknown[])
          .filter((x): x is string => typeof x === "string")
          .slice(0, 40),
      );
    }
    if (typeof body.requiredStaffPerShift === "number" && body.requiredStaffPerShift >= 1) {
      data.requiredStaffPerShift = Math.min(8, Math.floor(body.requiredStaffPerShift));
    }
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    const row = await prisma.smartGuardPost.update({ where: { id }, data });
    return NextResponse.json({
      post: {
        id: row.id,
        name: row.name,
        code: row.code,
        zoneLabel: row.zoneLabel,
        buildingLabel: row.buildingLabel,
        requiredStaffPerShift: row.requiredStaffPerShift,
        isActive: row.isActive,
      },
    });
  } catch (e) {
    console.error("[smart-guard-tour/posts PATCH]", e);
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
    const existing = await prisma.smartGuardPost.findFirst({
      where: { id, shopId: shop.id },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบจุด" }, { status: 404 });
    await prisma.smartGuardPost.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[smart-guard-tour/posts DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
