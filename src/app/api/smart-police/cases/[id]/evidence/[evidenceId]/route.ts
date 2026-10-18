import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { mapSmartPoliceEvidence } from "@/lib/smart-police/serialize";

async function loadOwned(ownerUserId: string, caseId: string, evidenceId: string) {
  const c = await prisma.smartPoliceCase.findFirst({ where: { id: caseId, ownerUserId } });
  if (!c) return null;
  return prisma.smartPoliceEvidence.findFirst({ where: { id: evidenceId, caseId } });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string; evidenceId: string }> },
) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { id: caseId, evidenceId } = await ctx.params;
  const existing = await loadOwned(gate.ctx.ownerUserId, caseId, evidenceId);
  if (!existing) return NextResponse.json({ error: "ไม่พบรายการทรัพย์" }, { status: 404 });

  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name.trim() || existing.name;
  if (body.quantityLabel !== undefined) {
    data.quantityLabel = typeof body.quantityLabel === "string" ? body.quantityLabel.trim() || null : null;
  }
  if (body.seizureNo !== undefined) {
    data.seizureNo = typeof body.seizureNo === "string" ? body.seizureNo.trim() || null : null;
  }
  if (body.seizedFrom !== undefined) {
    data.seizedFrom = typeof body.seizedFrom === "string" ? body.seizedFrom.trim() || null : null;
  }
  if (body.ownerName !== undefined) {
    data.ownerName = typeof body.ownerName === "string" ? body.ownerName.trim() || null : null;
  }
  if (body.ownerNote !== undefined) {
    data.ownerNote = typeof body.ownerNote === "string" ? body.ownerNote.trim() || null : null;
  }
  if (body.labResult !== undefined) {
    data.labResult = typeof body.labResult === "string" ? body.labResult.trim() || null : null;
  }
  if (body.labReceivedAt !== undefined) {
    if (body.labReceivedAt === null || body.labReceivedAt === "") data.labReceivedAt = null;
    else if (typeof body.labReceivedAt === "string") data.labReceivedAt = new Date(body.labReceivedAt);
  }

  const updated = await prisma.smartPoliceEvidence.update({ where: { id: evidenceId }, data });
  return NextResponse.json({ evidence: mapSmartPoliceEvidence(updated) });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; evidenceId: string }> },
) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { id: caseId, evidenceId } = await ctx.params;
  const existing = await loadOwned(gate.ctx.ownerUserId, caseId, evidenceId);
  if (!existing) return NextResponse.json({ error: "ไม่พบรายการทรัพย์" }, { status: 404 });
  await prisma.smartPoliceEvidence.delete({ where: { id: evidenceId } });
  return NextResponse.json({ ok: true });
}
