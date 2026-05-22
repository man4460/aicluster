import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import type { SmartPoliceDocumentKind } from "@/generated/prisma/enums";

async function loadDoc(ownerUserId: string, caseId: string, docId: string) {
  return prisma.smartPoliceDocument.findFirst({
    where: { id: docId, caseId, case: { ownerUserId } },
  });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string; docId: string }> },
) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { id: caseId, docId } = await ctx.params;
  const existing = await loadDoc(gate.ctx.ownerUserId, caseId, docId);
  if (!existing) return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });

  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title.trim() || existing.title;
  if (typeof body.content === "string") data.content = body.content;
  if (typeof body.kind === "string") {
    const kind = body.kind as SmartPoliceDocumentKind;
    if (["NARRATIVE", "STATEMENT", "WARRANT", "REPORT", "MEMO", "OTHER"].includes(kind)) {
      data.kind = kind;
    }
  }

  const updated = await prisma.smartPoliceDocument.update({ where: { id: docId }, data });
  return NextResponse.json({
    document: {
      id: updated.id,
      kind: updated.kind,
      title: updated.title,
      content: updated.content,
      partyId: updated.partyId,
      wordFileUrl: updated.wordFileUrl,
      wordFileName: updated.wordFileName,
      printCount: updated.printCount,
      lastPrintedAt: updated.lastPrintedAt?.toISOString() ?? null,
      sortOrder: updated.sortOrder,
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; docId: string }> },
) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { id: caseId, docId } = await ctx.params;
  const existing = await loadDoc(gate.ctx.ownerUserId, caseId, docId);
  if (!existing) return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });
  await prisma.smartPoliceDocument.delete({ where: { id: docId } });
  return NextResponse.json({ ok: true });
}
