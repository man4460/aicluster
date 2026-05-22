import { prisma } from "@/lib/prisma";
import { getOrCreateSmartPoliceProfile } from "@/lib/smart-police/api-owner";
import { syncStatementLinksIntoNarrative } from "@/lib/smart-police/narrative-links";
import { buildSmartPolicePrintVars } from "@/lib/smart-police/print";
import { mapSmartPoliceCaseDetail } from "@/lib/smart-police/serialize";
import {
  buildOfficialStatementFormText,
  statementTitleForRole,
  type StatementFormContext,
} from "@/lib/smart-police/statement-form";
import { appOriginFromRequest, generateStatementDocxFile } from "@/lib/smart-police/word-file";

function formatThaiDate(d = new Date()): string {
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}

export async function createStatementForParty(opts: {
  ownerUserId: string;
  caseId: string;
  partyId: string;
  appOrigin: string;
  syncNarrative: boolean;
  generateWord: boolean;
}) {
  const row = await prisma.smartPoliceCase.findFirst({
    where: { id: opts.caseId, ownerUserId: opts.ownerUserId },
    include: { parties: true, documents: true },
  });
  if (!row) throw new Error("ไม่พบคดี");

  const party = row.parties.find((p) => p.id === opts.partyId);
  if (!party) throw new Error("ไม่พบบุคคลในคดี");

  const profile = await getOrCreateSmartPoliceProfile(opts.ownerUserId);
  const caseDetail = mapSmartPoliceCaseDetail(row);
  const vars = buildSmartPolicePrintVars(profile, caseDetail);

  const ctx: StatementFormContext = {
    caseNumber: row.caseNumber,
    caseTitle: row.title,
    stationName: profile.stationName,
    investigator: profile.investigatorDefault ?? "",
    todayThai: vars.todayThai || formatThaiDate(),
    party: {
      fullName: party.fullName,
      role: party.role,
      age: party.age,
      nationality: party.nationality,
      idCard: party.idCard,
      address: party.address,
      phone: party.phone,
    },
  };

  const bodyText = buildOfficialStatementFormText(ctx);
  const title = `${statementTitleForRole(party.role)} — ${party.fullName}`;

  const maxSort = await prisma.smartPoliceDocument.aggregate({
    where: { caseId: opts.caseId },
    _max: { sortOrder: true },
  });

  const doc = await prisma.smartPoliceDocument.create({
    data: {
      caseId: opts.caseId,
      partyId: party.id,
      kind: "STATEMENT",
      title,
      content: bodyText,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  let wordFileUrl: string | null = null;
  let wordFileName: string | null = null;

  if (opts.generateWord) {
    const narrativePageUrl = `${opts.appOrigin}/dashboard/smart-police/cases/${opts.caseId}`;
    const word = await generateStatementDocxFile({
      ownerUserId: opts.ownerUserId,
      caseId: opts.caseId,
      documentId: doc.id,
      bodyText,
      appOrigin: opts.appOrigin,
      narrativePageUrl,
    });
    wordFileUrl = word.wordFileUrl;
    wordFileName = word.wordFileName;
    await prisma.smartPoliceDocument.update({
      where: { id: doc.id },
      data: { wordFileUrl, wordFileName },
    });
  }

  let narrativeSync = { narrativeId: null as string | null, updated: false };
  if (opts.syncNarrative) {
    narrativeSync = await syncStatementLinksIntoNarrative(opts.caseId, opts.appOrigin);
  }

  return {
    document: {
      id: doc.id,
      kind: doc.kind,
      title: doc.title,
      content: doc.content,
      partyId: doc.partyId,
      wordFileUrl,
      wordFileName,
      printCount: doc.printCount,
      lastPrintedAt: doc.lastPrintedAt?.toISOString() ?? null,
      sortOrder: doc.sortOrder,
      updatedAt: doc.updatedAt.toISOString(),
    },
    narrativeSync,
  };
}

export { appOriginFromRequest };
