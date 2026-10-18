import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { mapSmartPoliceEvidence } from "@/lib/smart-police/serialize";

async function assertCase(ownerUserId: string, caseId: string) {
  return prisma.smartPoliceCase.findFirst({ where: { id: caseId, ownerUserId } });
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { id: caseId } = await ctx.params;
  const c = await assertCase(gate.ctx.ownerUserId, caseId);
  if (!c) return NextResponse.json({ error: "ไม่พบคดี" }, { status: 404 });
  const rows = await prisma.smartPoliceEvidence.findMany({
    where: { caseId },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ evidence: rows.map(mapSmartPoliceEvidence) });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { id: caseId } = await ctx.params;
  const c = await assertCase(gate.ctx.ownerUserId, caseId);
  if (!c) return NextResponse.json({ error: "ไม่พบคดี" }, { status: 404 });

  const body = (await req.json()) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "กรุณาระบุชื่อรายการ" }, { status: 400 });

  const maxSort = await prisma.smartPoliceEvidence.aggregate({
    where: { caseId },
    _max: { sortOrder: true },
  });

  const row = await prisma.smartPoliceEvidence.create({
    data: {
      caseId,
      name,
      quantityLabel: typeof body.quantityLabel === "string" ? body.quantityLabel.trim() || null : null,
      seizureNo: typeof body.seizureNo === "string" ? body.seizureNo.trim() || null : null,
      seizedFrom: typeof body.seizedFrom === "string" ? body.seizedFrom.trim() || null : null,
      ownerName: typeof body.ownerName === "string" ? body.ownerName.trim() || null : null,
      ownerNote: typeof body.ownerNote === "string" ? body.ownerNote.trim() || null : null,
      labReceivedAt:
        typeof body.labReceivedAt === "string" && body.labReceivedAt
          ? new Date(body.labReceivedAt)
          : null,
      labResult: typeof body.labResult === "string" ? body.labResult.trim() || null : null,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({ evidence: mapSmartPoliceEvidence(row) }, { status: 201 });
}
