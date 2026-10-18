import { prisma } from "@/lib/prisma";
import { getOrCreateSmartPoliceProfile } from "@/lib/smart-police/api-owner";
import {
  serializeStatementDocument,
  statementDocumentTitle,
  statementDocumentToPlainText,
} from "@/lib/smart-police/form-templates";
import { fillStatementDocument } from "@/lib/smart-police/form-templates/fill-statement-server";
import { syncStatementLinksIntoNarrative } from "@/lib/smart-police/narrative-links";
import { buildSmartPolicePrintVars } from "@/lib/smart-police/print";
import { mapSmartPoliceCaseDetail, type SmartPoliceCaseDetailRow } from "@/lib/smart-police/serialize";
import {
  SMART_POLICE_CUSTODY_MODE_LABEL,
  SMART_POLICE_INVESTIGATION_RESULT_LABEL,
  SMART_POLICE_PARTY_ROLE_LABEL,
} from "@/lib/smart-police/types";
import { generateStatementDocxFile } from "@/lib/smart-police/word-file";
import type { SmartPoliceDocumentKind } from "@/generated/prisma/enums";

function formatThaiDate(d = new Date()): string {
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}

function formatThaiDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadCase(ownerUserId: string, caseId: string): Promise<SmartPoliceCaseDetailRow | null> {
  return prisma.smartPoliceCase.findFirst({
    where: { id: caseId, ownerUserId },
    include: { parties: true, documents: true, evidence: true },
  });
}

function evidenceSummaryLines(
  evidence: { name: string; quantityLabel: string | null; seizedFrom: string | null; ownerName: string | null }[],
): string {
  if (!evidence.length) return "";
  return evidence
    .map((e, i) => {
      const parts = [`${i + 1}. ${e.name}`];
      if (e.quantityLabel) parts.push(`จำนวน ${e.quantityLabel}`);
      if (e.seizedFrom) parts.push(`ยึดจาก ${e.seizedFrom}`);
      if (e.ownerName) parts.push(`ผู้ถือกรรมสิทธิ์ ${e.ownerName}`);
      return parts.join(" · ");
    })
    .join("\n");
}

async function nextSort(caseId: string): Promise<number> {
  const maxSort = await prisma.smartPoliceDocument.aggregate({
    where: { caseId },
    _max: { sortOrder: true },
  });
  return (maxSort._max.sortOrder ?? -1) + 1;
}

async function upsertSingletonDoc(opts: {
  caseId: string;
  kind: SmartPoliceDocumentKind;
  title: string;
  content: string;
}) {
  const existing = await prisma.smartPoliceDocument.findFirst({
    where: { caseId: opts.caseId, kind: opts.kind, partyId: null },
    orderBy: { sortOrder: "asc" },
  });
  if (existing) {
    return prisma.smartPoliceDocument.update({
      where: { id: existing.id },
      data: { title: opts.title, content: opts.content },
    });
  }
  return prisma.smartPoliceDocument.create({
    data: {
      caseId: opts.caseId,
      kind: opts.kind,
      title: opts.title,
      content: opts.content,
      sortOrder: await nextSort(opts.caseId),
    },
  });
}

export async function resolveInvestigatorName(
  ownerUserId: string,
  investigatorOfficerId: string | null,
): Promise<string> {
  if (investigatorOfficerId) {
    const off = await prisma.smartPoliceOfficer.findFirst({
      where: { id: investigatorOfficerId, ownerUserId },
    });
    if (off) {
      return [off.rankTitle, off.fullName].filter(Boolean).join(" ").trim();
    }
  }
  const profile = await getOrCreateSmartPoliceProfile(ownerUserId);
  return profile.investigatorDefault ?? "";
}

export function buildInvestigatorMemoText(opts: {
  caseNumber: string;
  caseTitle: string;
  stationName: string;
  investigator: string;
  todayThai: string;
  chargeText: string | null;
  lawRefs: string | null;
  receivedAt: string | null;
  receivedTimeHm: string | null;
  dailyLogNo: string | null;
  custodyMode: string | null;
  incidentAt: string | null;
  incidentPlace: string | null;
  behaviorText: string | null;
  summary: string | null;
  partiesList: string;
  evidenceList: string;
}): string {
  return `บันทึกพนักงานสอบสวน

เลขที่คดี ${opts.caseNumber}
เรื่อง ${opts.caseTitle}
${opts.stationName}
วันที่ ${opts.todayThai}

ข้าพเจ้า ${opts.investigator || "……………………"} พนักงานสอบสวน
ได้รับคดีเมื่อ ${formatThaiDateTime(opts.receivedAt)}${opts.receivedTimeHm ? ` เวลา ${opts.receivedTimeHm} น.` : ""}
${opts.dailyLogNo ? `ปจว. ข้อรับคดี ${opts.dailyLogNo}` : ""}
ข้อหา ${opts.chargeText || "—"}
กฎหมายที่อ้าง ${opts.lawRefs || "—"}
การจัดการผู้ต้องหา ${opts.custodyMode || "—"}

วันเวลาเกิดเหตุ ${formatThaiDateTime(opts.incidentAt)}
สถานที่เกิดเหตุ ${opts.incidentPlace || "—"}

พฤติการณ์
${opts.behaviorText || opts.summary || "…………………………………………………………………………………………………………"}

บุคคลที่เกี่ยวข้อง
${opts.partiesList || "—"}

รายการทรัพย์ / ของกลาง
${opts.evidenceList || "—"}

จึงบันทึกไว้เป็นหลักฐาน

ลงชื่อ ………………………………
(${opts.investigator || "……………………"})
พนักงานสอบสวน`;
}

export function buildInvestigationReportText(opts: {
  caseNumber: string;
  caseTitle: string;
  caseType: string;
  stationName: string;
  investigator: string;
  todayThai: string;
  chargeText: string | null;
  lawRefs: string | null;
  investigationResultLabel: string;
  behaviorText: string | null;
  summary: string | null;
  partiesList: string;
  evidenceList: string;
  damageNote: string | null;
}): string {
  return `รายงานการสอบสวน

เลขที่คดี ${opts.caseNumber}
เรื่อง ${opts.caseTitle}
ประเภทคดี ${opts.caseType}
${opts.stationName}
วันที่ ${opts.todayThai}

ข้อหา ${opts.chargeText || "—"}
กฎหมายที่อ้าง ${opts.lawRefs || "—"}
ผลคดีชั้นพนักงานสอบสวน ${opts.investigationResultLabel}

สรุปพฤติการณ์
${opts.behaviorText || opts.summary || "…………………………………………………………………………………………………………"}

${opts.damageNote ? `ความเสียหายที่เกิดขึ้น\n${opts.damageNote}\n` : ""}
บุคคลที่เกี่ยวข้อง
${opts.partiesList || "—"}

บัญชีของกลาง / ทรัพย์
${opts.evidenceList || "—"}

ความเห็นพนักงานสอบสวน
…………………………………………………………………………………………………………

ลงชื่อ ………………………………
(${opts.investigator || "……………………"})
พนักงานสอบสวน`;
}

export function buildPropertyListText(opts: {
  caseNumber: string;
  caseTitle: string;
  stationName: string;
  todayThai: string;
  evidenceLines: string;
}): string {
  return `บัญชีของกลาง / รายการทรัพย์

เลขที่คดี ${opts.caseNumber}
เรื่อง ${opts.caseTitle}
${opts.stationName}
วันที่ ${opts.todayThai}

${opts.evidenceLines || "— ยังไม่มีรายการทรัพย์ —"}

ลงชื่อผู้จัดทำ ………………………………`;
}

export type GenerateDocKind =
  | "STATEMENT_ALL"
  | "MEMO"
  | "INVESTIGATION_REPORT"
  | "PROPERTY_LIST";

export async function generateSmartPoliceDocs(opts: {
  ownerUserId: string;
  caseId: string;
  kinds: GenerateDocKind[];
  appOrigin: string;
  generateWord?: boolean;
  syncNarrative?: boolean;
}) {
  const row = await loadCase(opts.ownerUserId, opts.caseId);
  if (!row) throw new Error("ไม่พบคดี");

  const profile = await getOrCreateSmartPoliceProfile(opts.ownerUserId);
  const caseDetail = mapSmartPoliceCaseDetail(row);
  const investigator = await resolveInvestigatorName(
    opts.ownerUserId,
    caseDetail.investigatorOfficerId,
  );
  const vars = buildSmartPolicePrintVars(profile, caseDetail, { investigator });
  const todayThai = vars.todayThai || formatThaiDate();
  const evidenceList = evidenceSummaryLines(caseDetail.evidence);
  const partiesList = caseDetail.parties
    .map((p, i) => {
      const rel = p.caseRelation ? ` (${p.caseRelation})` : "";
      return `${i + 1}. ${SMART_POLICE_PARTY_ROLE_LABEL[p.role]}${rel} — ${p.fullName}`;
    })
    .join("\n");

  const createdIds: string[] = [];

  if (opts.kinds.includes("PROPERTY_LIST")) {
    const evidenceLines = caseDetail.evidence
      .map((e, i) => {
        const bits = [
          `${i + 1}. ${e.name}`,
          e.quantityLabel ? `จำนวน ${e.quantityLabel}` : null,
          e.seizureNo ? `เลขยึด ${e.seizureNo}` : null,
          e.seizedFrom ? `ยึด/ได้จาก ${e.seizedFrom}` : null,
          e.ownerName ? `ผู้ถือกรรมสิทธิ์ ${e.ownerName}` : null,
          e.ownerNote ? e.ownerNote : null,
          e.labResult ? `ผลตรวจ ${e.labResult}` : null,
        ].filter(Boolean);
        return bits.join(" · ");
      })
      .join("\n");
    const doc = await upsertSingletonDoc({
      caseId: opts.caseId,
      kind: "PROPERTY_LIST",
      title: "บัญชีของกลาง",
      content: buildPropertyListText({
        caseNumber: caseDetail.caseNumber,
        caseTitle: caseDetail.title,
        stationName: profile.stationName,
        todayThai,
        evidenceLines,
      }),
    });
    createdIds.push(doc.id);
  }

  if (opts.kinds.includes("MEMO")) {
    const custodyLabel = caseDetail.custodyMode
      ? SMART_POLICE_CUSTODY_MODE_LABEL[caseDetail.custodyMode]
      : null;
    const doc = await upsertSingletonDoc({
      caseId: opts.caseId,
      kind: "MEMO",
      title: "บันทึกพนักงานสอบสวน",
      content: buildInvestigatorMemoText({
        caseNumber: caseDetail.caseNumber,
        caseTitle: caseDetail.title,
        stationName: profile.stationName,
        investigator,
        todayThai,
        chargeText: caseDetail.chargeText,
        lawRefs: caseDetail.lawRefs,
        receivedAt: caseDetail.receivedAt,
        receivedTimeHm: caseDetail.receivedTimeHm,
        dailyLogNo: caseDetail.dailyLogNo,
        custodyMode: custodyLabel,
        incidentAt: caseDetail.incidentAt,
        incidentPlace: caseDetail.incidentPlace,
        behaviorText: caseDetail.behaviorText,
        summary: caseDetail.summary,
        partiesList,
        evidenceList,
      }),
    });
    createdIds.push(doc.id);
  }

  if (opts.kinds.includes("INVESTIGATION_REPORT")) {
    const doc = await upsertSingletonDoc({
      caseId: opts.caseId,
      kind: "INVESTIGATION_REPORT",
      title: "รายงานการสอบสวน",
      content: buildInvestigationReportText({
        caseNumber: caseDetail.caseNumber,
        caseTitle: caseDetail.title,
        caseType: caseDetail.caseType,
        stationName: profile.stationName,
        investigator,
        todayThai,
        chargeText: caseDetail.chargeText,
        lawRefs: caseDetail.lawRefs,
        investigationResultLabel:
          SMART_POLICE_INVESTIGATION_RESULT_LABEL[caseDetail.investigationResult],
        behaviorText: caseDetail.behaviorText,
        summary: caseDetail.summary,
        partiesList,
        evidenceList,
        damageNote: caseDetail.damageNote,
      }),
    });
    createdIds.push(doc.id);
  }

  if (opts.kinds.includes("STATEMENT_ALL")) {
    for (const party of caseDetail.parties) {
      const statementDoc = await fillStatementDocument({
        role: party.role,
        stationName: profile.stationName,
        stationAddress: profile.stationAddress,
        province: profile.province,
        commanderRank: profile.commanderRank,
        commanderName: profile.commanderName,
        caseNumber: caseDetail.caseNumber,
        caseTitle: caseDetail.title,
        caseType: caseDetail.caseType,
        chargeText: caseDetail.chargeText,
        lawRefs: caseDetail.lawRefs,
        investigator,
        todayThai,
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

      const existing = await prisma.smartPoliceDocument.findFirst({
        where: { caseId: opts.caseId, kind: "STATEMENT", partyId: party.id },
        orderBy: { updatedAt: "desc" },
      });

      let doc;
      if (existing) {
        doc = await prisma.smartPoliceDocument.update({
          where: { id: existing.id },
          data: { title, content },
        });
      } else {
        doc = await prisma.smartPoliceDocument.create({
          data: {
            caseId: opts.caseId,
            partyId: party.id,
            kind: "STATEMENT",
            title,
            content,
            sortOrder: await nextSort(opts.caseId),
          },
        });
      }

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
        await prisma.smartPoliceDocument.update({
          where: { id: doc.id },
          data: { wordFileUrl: word.wordFileUrl, wordFileName: word.wordFileName },
        });
      }
      createdIds.push(doc.id);
    }

    if (opts.syncNarrative !== false) {
      await syncStatementLinksIntoNarrative(opts.caseId, opts.appOrigin);
    }
  }

  return { documentIds: createdIds };
}
