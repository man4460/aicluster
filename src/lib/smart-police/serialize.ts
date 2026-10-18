import type { Prisma } from "@/generated/prisma/client";
import {
  smartPoliceDaysSinceReceived,
  smartPoliceIsOverdue,
} from "@/lib/smart-police/case-ops";
import type {
  SmartPoliceCaseDetail,
  SmartPoliceCaseListItem,
  SmartPoliceEvidenceDto,
  SmartPoliceOfficerDto,
  SmartPolicePartyDto,
} from "@/lib/smart-police/types";

type CaseWithCounts = {
  id: string;
  caseNumber: string;
  title: string;
  caseType: string;
  status: SmartPoliceCaseDetail["status"];
  priority: SmartPoliceCaseDetail["priority"];
  incidentAt: Date | null;
  receivedAt: Date | null;
  sentToProsecutorAt: Date | null;
  investigationResult: SmartPoliceCaseDetail["investigationResult"];
  incidentPlace: string | null;
  summary: string | null;
  printCount: number;
  updatedAt: Date;
  _count?: { parties: number; documents: number };
};

export function mapSmartPoliceOfficer(row: {
  id: string;
  fullName: string;
  rankTitle: string | null;
  position: string | null;
  birthDate: Date | null;
  isDefault: boolean;
  sortOrder: number;
}): SmartPoliceOfficerDto {
  return {
    id: row.id,
    fullName: row.fullName,
    rankTitle: row.rankTitle,
    position: row.position,
    birthDate: row.birthDate?.toISOString() ?? null,
    isDefault: row.isDefault,
    sortOrder: row.sortOrder,
  };
}

export function mapSmartPoliceParty(p: {
  id: string;
  role: SmartPolicePartyDto["role"];
  fullName: string;
  age: number | null;
  nationality: string | null;
  idCard: string | null;
  address: string | null;
  phone: string | null;
  caseRelation: string | null;
  witnessSide: SmartPolicePartyDto["witnessSide"];
  pleaStatus: string | null;
  occupation: string | null;
  workplace: string | null;
  sortOrder: number;
}): SmartPolicePartyDto {
  return {
    id: p.id,
    role: p.role,
    fullName: p.fullName,
    age: p.age,
    nationality: p.nationality,
    idCard: p.idCard,
    address: p.address,
    phone: p.phone,
    caseRelation: p.caseRelation,
    witnessSide: p.witnessSide,
    pleaStatus: p.pleaStatus,
    occupation: p.occupation,
    workplace: p.workplace,
    sortOrder: p.sortOrder,
  };
}

export function mapSmartPoliceEvidence(e: {
  id: string;
  name: string;
  quantityLabel: string | null;
  seizureNo: string | null;
  seizedFrom: string | null;
  ownerName: string | null;
  ownerNote: string | null;
  labReceivedAt: Date | null;
  labResult: string | null;
  sortOrder: number;
}): SmartPoliceEvidenceDto {
  return {
    id: e.id,
    name: e.name,
    quantityLabel: e.quantityLabel,
    seizureNo: e.seizureNo,
    seizedFrom: e.seizedFrom,
    ownerName: e.ownerName,
    ownerNote: e.ownerNote,
    labReceivedAt: e.labReceivedAt?.toISOString() ?? null,
    labResult: e.labResult,
    sortOrder: e.sortOrder,
  };
}

export function mapSmartPoliceCaseListItem(row: CaseWithCounts): SmartPoliceCaseListItem {
  const daysSinceReceived = smartPoliceDaysSinceReceived(row.receivedAt);
  return {
    id: row.id,
    caseNumber: row.caseNumber,
    title: row.title,
    caseType: row.caseType,
    status: row.status,
    priority: row.priority ?? "NORMAL",
    incidentAt: row.incidentAt?.toISOString() ?? null,
    receivedAt: row.receivedAt?.toISOString() ?? null,
    sentToProsecutorAt: row.sentToProsecutorAt?.toISOString() ?? null,
    investigationResult: row.investigationResult ?? "INVESTIGATING",
    daysSinceReceived,
    overdue: smartPoliceIsOverdue(row.priority ?? "NORMAL", daysSinceReceived),
    documentCount: row._count?.documents ?? 0,
    partyCount: row._count?.parties ?? 0,
    printCount: row.printCount,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type SmartPoliceCaseDetailRow = Prisma.SmartPoliceCaseGetPayload<{
  include: { parties: true; documents: true; evidence: true };
}>;

export function mapSmartPoliceCaseDetail(row: SmartPoliceCaseDetailRow): SmartPoliceCaseDetail {
  return {
    ...mapSmartPoliceCaseListItem({
      ...row,
      _count: { parties: row.parties.length, documents: row.documents.length },
    }),
    incidentPlace: row.incidentPlace,
    summary: row.summary,
    courtType: row.courtType,
    chargeText: row.chargeText,
    lawRefs: row.lawRefs,
    receivedAt: row.receivedAt?.toISOString() ?? null,
    receivedTimeHm: row.receivedTimeHm,
    dailyLogNo: row.dailyLogNo,
    custodyMode: row.custodyMode,
    investigatorOfficerId: row.investigatorOfficerId,
    investigationResult: row.investigationResult,
    sentToProsecutorAt: row.sentToProsecutorAt?.toISOString() ?? null,
    behaviorText: row.behaviorText,
    damageNote: row.damageNote,
    detainAt: row.detainAt?.toISOString() ?? null,
    parties: row.parties
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(mapSmartPoliceParty),
    documents: row.documents
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((d) => ({
        id: d.id,
        kind: d.kind,
        title: d.title,
        content: d.content,
        partyId: d.partyId,
        wordFileUrl: d.wordFileUrl,
        wordFileName: d.wordFileName,
        printCount: d.printCount,
        lastPrintedAt: d.lastPrintedAt?.toISOString() ?? null,
        sortOrder: d.sortOrder,
        updatedAt: d.updatedAt.toISOString(),
      })),
    evidence: row.evidence
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(mapSmartPoliceEvidence),
  };
}
