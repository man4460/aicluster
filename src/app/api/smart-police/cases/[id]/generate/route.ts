import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import {
  generateSmartPoliceDocs,
  type GenerateDocKind,
} from "@/lib/smart-police/generate-docs";
import { appOriginFromRequest } from "@/lib/smart-police/word-file";
import { prisma } from "@/lib/prisma";
import { mapSmartPoliceCaseDetail } from "@/lib/smart-police/serialize";

const ALLOWED: GenerateDocKind[] = [
  "STATEMENT_ALL",
  "MEMO",
  "INVESTIGATION_REPORT",
  "PROPERTY_LIST",
];

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { id: caseId } = await ctx.params;

  const body = (await req.json()) as {
    kinds?: string[];
    generateWord?: boolean;
    syncNarrative?: boolean;
  };
  const kinds = (body.kinds ?? []).filter((k): k is GenerateDocKind =>
    ALLOWED.includes(k as GenerateDocKind),
  );
  if (!kinds.length) {
    return NextResponse.json({ error: "ระบุ kinds ของเอกสารที่ต้องการสร้าง" }, { status: 400 });
  }

  try {
    const result = await generateSmartPoliceDocs({
      ownerUserId: gate.ctx.ownerUserId,
      caseId,
      kinds,
      appOrigin: appOriginFromRequest(req),
      generateWord: body.generateWord !== false,
      syncNarrative: body.syncNarrative !== false,
    });

    const row = await prisma.smartPoliceCase.findFirst({
      where: { id: caseId, ownerUserId: gate.ctx.ownerUserId },
      include: { parties: true, documents: true, evidence: true },
    });
    return NextResponse.json({
      ok: true,
      documentIds: result.documentIds,
      case: row ? mapSmartPoliceCaseDetail(row) : null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "สร้างเอกสารไม่สำเร็จ";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
