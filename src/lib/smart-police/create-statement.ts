import { prisma } from "@/lib/prisma";
import { getOrCreateSmartPoliceProfile } from "@/lib/smart-police/api-owner";
import {
  fillStatementDocument,
  serializeStatementDocument,
  statementDocumentTitle,
  statementDocumentToPlainText,
} from "@/lib/smart-police/form-templates";
import { syncStatementLinksIntoNarrative } from "@/lib/smart-police/narrative-links";
import { buildSmartPolicePrintVars } from "@/lib/smart-police/print";
import { mapSmartPoliceCaseDetail } from "@/lib/smart-police/serialize";
import { resolveInvestigatorName } from "@/lib/smart-police/generate-docs";
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
    include: { parties: true, documents: true, evidence: true },
  });
  if (!row) throw new Error("ไม่พบคดี");

  const party = row.parties.find((p) => p.id === opts.partyId);
  if (!party) throw new Error("ไม่พบบุคคลในคดี");

  const profile = await getOrCreateSmartPoliceProfile(opts.ownerUserId);
  const caseDetail = mapSmartPoliceCaseDetail(row);
  const investigator = await resolveInvestigatorName(
    opts.ownerUserId,
    caseDetail.investigatorOfficerId,
  );
  const vars = buildSmartPolicePrintVars(profile, caseDetail, { investigator });

  const statementDoc = fillStatementDocument({
    role: party.role,
    stationName: profile.stationName,
    stationAddress: profile.stationAddress,
    province: profile.province,
    commanderRank: profile.commanderRank,
    commanderName: profile.commanderName,
    caseNumber: row.caseNumber,
    caseTitle: row.title,
    caseType: caseDetail.caseType,
    chargeText: caseDetail.chargeText,
    lawRefs: caseDetail.lawRefs,
    investigator,
    todayThai: vars.todayThai || formatThaiDate(),
    partyName: party.fullName,
    partyAge: party.age != null ? String(party.age) : "",
    partyNationality: party.nationality,
    partyIdCard: party.idCard,
    partyAddress: party.address,
    partyPhone: party.phone,
    partyOccupation: party.occupation,
    partyWorkplace: party.workplace,
    partyCaseRelation: party.caseRelation,
    partyPleaStatus: party.pleaStatus,
    behaviorHint: caseDetail.behaviorText ?? caseDetail.summary,
  });

  const content = serializeStatementDocument(statementDoc);
  const title = statementDocumentTitle(statementDoc, party.role);
  const plainForWord = statementDocumentToPlainText(statementDoc);

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
      content,
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
      bodyText: plainForWord,
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
