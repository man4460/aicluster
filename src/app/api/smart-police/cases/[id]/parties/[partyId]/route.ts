import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { mapSmartPoliceParty } from "@/lib/smart-police/serialize";
import type { SmartPolicePartyRole, SmartPoliceWitnessSide } from "@/generated/prisma/enums";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string; partyId: string }> },
) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { id: caseId, partyId } = await ctx.params;

  const party = await prisma.smartPoliceParty.findFirst({
    where: { id: partyId, case: { id: caseId, ownerUserId: gate.ctx.ownerUserId } },
  });
  if (!party) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof body.fullName === "string") data.fullName = body.fullName.trim() || party.fullName;
  if (typeof body.role === "string") {
    const role = body.role as SmartPolicePartyRole;
    if (["COMPLAINANT", "SUSPECT", "WITNESS", "OFFICER", "OTHER"].includes(role)) data.role = role;
  }
  if (body.age !== undefined) data.age = typeof body.age === "number" ? Math.floor(body.age) : null;
  if (body.nationality !== undefined) {
    data.nationality = typeof body.nationality === "string" ? body.nationality.trim() || null : null;
  }
  if (body.idCard !== undefined) data.idCard = typeof body.idCard === "string" ? body.idCard.trim() || null : null;
  if (body.address !== undefined) data.address = typeof body.address === "string" ? body.address.trim() || null : null;
  if (body.phone !== undefined) data.phone = typeof body.phone === "string" ? body.phone.trim() || null : null;
  if (body.caseRelation !== undefined) {
    data.caseRelation = typeof body.caseRelation === "string" ? body.caseRelation.trim() || null : null;
  }
  if (body.witnessSide !== undefined) {
    if (body.witnessSide === null || body.witnessSide === "") data.witnessSide = null;
    else if (
      typeof body.witnessSide === "string" &&
      ["COMPLAINANT", "SUSPECT"].includes(body.witnessSide)
    ) {
      data.witnessSide = body.witnessSide as SmartPoliceWitnessSide;
    }
  }
  if (body.pleaStatus !== undefined) {
    data.pleaStatus = typeof body.pleaStatus === "string" ? body.pleaStatus.trim() || null : null;
  }
  if (body.occupation !== undefined) {
    data.occupation = typeof body.occupation === "string" ? body.occupation.trim() || null : null;
  }
  if (body.workplace !== undefined) {
    data.workplace = typeof body.workplace === "string" ? body.workplace.trim() || null : null;
  }

  const updated = await prisma.smartPoliceParty.update({ where: { id: partyId }, data });
  return NextResponse.json({ party: mapSmartPoliceParty(updated) });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; partyId: string }> },
) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { id: caseId, partyId } = await ctx.params;

  const party = await prisma.smartPoliceParty.findFirst({
    where: { id: partyId, case: { id: caseId, ownerUserId: gate.ctx.ownerUserId } },
  });
  if (!party) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
  await prisma.smartPoliceParty.delete({ where: { id: partyId } });
  return NextResponse.json({ ok: true });
}
