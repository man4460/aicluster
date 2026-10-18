import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { mapSmartPoliceOfficer } from "@/lib/smart-police/serialize";

async function loadOwned(ownerUserId: string, id: string) {
  return prisma.smartPoliceOfficer.findFirst({ where: { id, ownerUserId } });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { id } = await ctx.params;
  const existing = await loadOwned(gate.ctx.ownerUserId, id);
  if (!existing) return NextResponse.json({ error: "ไม่พบพนักงานสอบสวน" }, { status: 404 });

  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof body.fullName === "string") data.fullName = body.fullName.trim() || existing.fullName;
  if (body.rankTitle !== undefined) {
    data.rankTitle = typeof body.rankTitle === "string" ? body.rankTitle.trim() || null : null;
  }
  if (body.position !== undefined) {
    data.position = typeof body.position === "string" ? body.position.trim() || null : null;
  }
  if (body.birthDate !== undefined) {
    if (body.birthDate === null || body.birthDate === "") data.birthDate = null;
    else if (typeof body.birthDate === "string") data.birthDate = new Date(body.birthDate);
  }
  if (body.isDefault === true) {
    await prisma.smartPoliceOfficer.updateMany({
      where: { ownerUserId: gate.ctx.ownerUserId },
      data: { isDefault: false },
    });
    data.isDefault = true;
  } else if (body.isDefault === false) {
    data.isDefault = false;
  }

  const updated = await prisma.smartPoliceOfficer.update({ where: { id }, data });
  if (updated.isDefault) {
    await prisma.smartPoliceProfile.updateMany({
      where: { ownerUserId: gate.ctx.ownerUserId },
      data: {
        investigatorDefault: [updated.rankTitle, updated.fullName].filter(Boolean).join(" ").trim(),
      },
    });
  }
  return NextResponse.json({ officer: mapSmartPoliceOfficer(updated) });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { id } = await ctx.params;
  const existing = await loadOwned(gate.ctx.ownerUserId, id);
  if (!existing) return NextResponse.json({ error: "ไม่พบพนักงานสอบสวน" }, { status: 404 });
  await prisma.smartPoliceOfficer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
