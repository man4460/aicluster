import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";

async function loadOwned(ownerUserId: string, id: string) {
  return prisma.smartPoliceCharge.findFirst({
    where: { id, ownerUserId },
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { id } = await ctx.params;
  const existing = await loadOwned(gate.ctx.ownerUserId, id);
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบข้อหา" }, { status: 404 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof body.chargeText === "string") {
    data.chargeText = body.chargeText.trim() || existing.chargeText;
  }
  if (typeof body.category === "string") data.category = body.category.trim() || existing.category;
  if (body.lawRefs !== undefined) {
    data.lawRefs = typeof body.lawRefs === "string" ? body.lawRefs.trim() || null : null;
  }
  if (body.keywords !== undefined) {
    data.keywords = typeof body.keywords === "string" ? body.keywords.trim() || null : null;
  }
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  const updated = await prisma.smartPoliceCharge.update({ where: { id }, data });
  return NextResponse.json({
    charge: {
      id: updated.id,
      category: updated.category,
      chargeText: updated.chargeText,
      lawRefs: updated.lawRefs,
      keywords: updated.keywords,
      isBuiltin: updated.isBuiltin,
      isActive: updated.isActive,
      sortOrder: updated.sortOrder,
      isOwnerCustom: true,
    },
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { id } = await ctx.params;
  const existing = await loadOwned(gate.ctx.ownerUserId, id);
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบข้อหา" }, { status: 404 });
  }
  await prisma.smartPoliceCharge.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
