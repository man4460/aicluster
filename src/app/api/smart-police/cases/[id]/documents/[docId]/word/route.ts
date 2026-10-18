import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import {
  parseStatementDocumentContent,
  statementContentBodyTextForWord,
  statementDocumentHasPages,
} from "@/lib/smart-police/form-templates";
import { generateOfficialStatementDocxFile } from "@/lib/smart-police/form-templates/fill-statement-docx";
import { appOriginFromRequest, generateStatementDocxFile } from "@/lib/smart-police/word-file";
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

  const appOrigin = appOriginFromRequest(req);
  const narrativePageUrl = `${appOrigin}/dashboard/smart-police/cases/${caseId}`;

  const parsed = parseStatementDocumentContent(doc.content);
  let word: { wordFileUrl: string; wordFileName: string };

  try {
    if (parsed && statementDocumentHasPages(parsed)) {
      /** Backend templating — แม่แบบ Word ราชการจริง + docxtemplater */
      word = await generateOfficialStatementDocxFile({
        ownerUserId: gate.ctx.ownerUserId,
        caseId,
        documentId: docId,
        header: parsed.header,
        pages: parsed.pages,
      });
    } else {
      word = await generateStatementDocxFile({
        ownerUserId: gate.ctx.ownerUserId,
        caseId,
        documentId: docId,
        bodyText: statementContentBodyTextForWord(doc.content),
        appOrigin,
        narrativePageUrl,
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "สร้าง Word ไม่สำเร็จ";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const updated = await prisma.smartPoliceDocument.update({
    where: { id: docId },
    data: { wordFileUrl: word.wordFileUrl, wordFileName: word.wordFileName },
  });

  if (doc.kind === "STATEMENT") {
    await syncStatementLinksIntoNarrative(caseId, appOrigin);
  }

  return NextResponse.json({
    document: {
      id: updated.id,
      wordFileUrl: updated.wordFileUrl,
      wordFileName: updated.wordFileName,
      downloadUrl: `${appOrigin}${updated.wordFileUrl}`,
    },
  });
}
