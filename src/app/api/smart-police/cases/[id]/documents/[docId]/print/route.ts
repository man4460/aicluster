import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { getOrCreateSmartPoliceProfile } from "@/lib/smart-police/api-owner";
import { mapSmartPoliceCaseDetail } from "@/lib/smart-police/serialize";
import { buildSmartPoliceA4PreviewFromCase } from "@/lib/smart-police/document-a4-preview";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string; docId: string }> },
) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { id: caseId, docId } = await ctx.params;

  const row = await prisma.smartPoliceCase.findFirst({
    where: { id: caseId, ownerUserId: gate.ctx.ownerUserId },
    include: { parties: true, documents: true },
  });
  if (!row) return NextResponse.json({ error: "ไม่พบคดี" }, { status: 404 });

  const doc = row.documents.find((d) => d.id === docId);
  if (!doc) return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });

  const profile = await getOrCreateSmartPoliceProfile(gate.ctx.ownerUserId);
  const caseDetail = mapSmartPoliceCaseDetail(row);
  const document = caseDetail.documents.find((d) => d.id === docId);
  if (!document) return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });

  const { printHtml: html } = buildSmartPoliceA4PreviewFromCase({
    profile,
    caseDetail,
    document,
  });

  await prisma.$transaction([
    prisma.smartPoliceDocument.update({
      where: { id: docId },
      data: { printCount: { increment: 1 }, lastPrintedAt: new Date() },
    }),
    prisma.smartPoliceCase.update({
      where: { id: caseId },
      data: { printCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ html });
}
