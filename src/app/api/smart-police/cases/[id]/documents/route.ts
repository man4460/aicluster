import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import type { SmartPoliceDocumentKind } from "@/generated/prisma/enums";

async function assertCase(ownerUserId: string, caseId: string) {
  return prisma.smartPoliceCase.findFirst({ where: { id: caseId, ownerUserId } });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { id: caseId } = await ctx.params;
  const c = await assertCase(gate.ctx.ownerUserId, caseId);
  if (!c) return NextResponse.json({ error: "ไม่พบคดี" }, { status: 404 });

  const body = (await req.json()) as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content : "";
  if (!title) return NextResponse.json({ error: "กรุณาระบุชื่อเอกสาร" }, { status: 400 });

  const kind = (typeof body.kind === "string" ? body.kind : "OTHER") as SmartPoliceDocumentKind;
  if (!["NARRATIVE", "STATEMENT", "WARRANT", "REPORT", "MEMO", "OTHER"].includes(kind)) {
    return NextResponse.json({ error: "ประเภทเอกสารไม่ถูกต้อง" }, { status: 400 });
  }

  const maxSort = await prisma.smartPoliceDocument.aggregate({
    where: { caseId },
    _max: { sortOrder: true },
  });

  const partyId = typeof body.partyId === "string" ? body.partyId.trim() || null : null;

  const doc = await prisma.smartPoliceDocument.create({
    data: {
      caseId,
      kind,
      title,
      content,
      partyId,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json(
    {
      document: {
        id: doc.id,
        kind: doc.kind,
        title: doc.title,
        content: doc.content,
        partyId: doc.partyId,
        wordFileUrl: doc.wordFileUrl,
        wordFileName: doc.wordFileName,
        printCount: doc.printCount,
        lastPrintedAt: doc.lastPrintedAt?.toISOString() ?? null,
        sortOrder: doc.sortOrder,
        updatedAt: doc.updatedAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
