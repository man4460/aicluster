import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { appOriginFromRequest, saveSmartPoliceDocxUpload } from "@/lib/smart-police/word-file";
import { syncStatementLinksIntoNarrative } from "@/lib/smart-police/narrative-links";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string; docId: string }> },
) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { id: caseId, docId } = await ctx.params;

  const doc = await prisma.smartPoliceDocument.findFirst({
    where: { id: docId, caseId, case: { ownerUserId: gate.ctx.ownerUserId } },
  });
  if (!doc) return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
  }

  try {
    const saved = await saveSmartPoliceDocxUpload(gate.ctx.ownerUserId, file);
    const updated = await prisma.smartPoliceDocument.update({
      where: { id: docId },
      data: {
        wordFileUrl: saved.wordFileUrl,
        wordFileName: saved.wordFileName,
      },
    });
    if (doc.kind === "STATEMENT") {
      await syncStatementLinksIntoNarrative(caseId, appOriginFromRequest(req));
    }
    return NextResponse.json({
      document: {
        id: updated.id,
        wordFileUrl: updated.wordFileUrl,
        wordFileName: updated.wordFileName,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
