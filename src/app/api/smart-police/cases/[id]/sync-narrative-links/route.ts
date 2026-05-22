import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { appOriginFromRequest } from "@/lib/smart-police/word-file";
import { syncStatementLinksIntoNarrative } from "@/lib/smart-police/narrative-links";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { id: caseId } = await ctx.params;

  const c = await prisma.smartPoliceCase.findFirst({
    where: { id: caseId, ownerUserId: gate.ctx.ownerUserId },
  });
  if (!c) return NextResponse.json({ error: "ไม่พบคดี" }, { status: 404 });

  const narrativeSync = await syncStatementLinksIntoNarrative(caseId, appOriginFromRequest(req));
  return NextResponse.json({ ok: true, ...narrativeSync });
}
