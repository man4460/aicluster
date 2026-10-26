import type { Prisma } from "@/generated/prisma/client";
import { mapSuspectPhoto } from "@/lib/smart-police/investigation/photo-serialize";
import type {
  AddressKind,
  InvestigationLogDto,
  InvestigationReportDto,
  LinkDto,
  LinkKind,
  LogActivity,
  SuspectAddressDto,
  SuspectDto,
  SuspectRiskLevel,
  SuspectStatus,
} from "@/lib/smart-police/investigation/types";

type SuspectRow = Prisma.SmartPoliceSuspectGetPayload<{
  include: {
    addresses: true;
    photos: { orderBy: { createdAt: "asc" } };
    cases: { select: { caseId: true } };
    _count: { select: { linksFrom: true; linksTo: true; logs: true } };
  };
}>;

export function mapSuspectAddress(row: Prisma.SmartPoliceSuspectAddressGetPayload<object>): SuspectAddressDto {
  return {
    id: row.id,
    kind: row.kind as AddressKind,
    label: row.label,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    accuracyM: row.accuracyM,
    source: row.source,
    verifiedAt: row.verifiedAt?.toISOString() ?? null,
  };
}

export function mapSmartPoliceSuspect(row: SuspectRow): SuspectDto {
  return {
    id: row.id,
    fullName: row.fullName,
    alias: row.alias,
    nickname: row.nickname,
    nationalId: row.nationalId,
    birthDate: row.birthDate?.toISOString() ?? null,
    gender: row.gender,
    photoUrl: row.photoUrl,
    phone: row.phone,
    occupation: row.occupation,
    description: row.description,
    riskLevel: row.riskLevel as SuspectRiskLevel,
    status: row.status as SuspectStatus,
    notes: row.notes,
    addresses: row.addresses.map(mapSuspectAddress),
    photos: row.photos.map(mapSuspectPhoto),
    caseIds: row.cases.map((c) => c.caseId),
    linkCount: row._count.linksFrom + row._count.linksTo,
    logCount: row._count.logs,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapInvestigationLog(
  row: Prisma.SmartPoliceInvestigationLogGetPayload<{ include: { suspect: { select: { fullName: true } } } }>,
): InvestigationLogDto {
  return {
    id: row.id,
    caseId: row.caseId,
    suspectId: row.suspectId,
    suspectName: row.suspect?.fullName ?? null,
    occurredAt: row.occurredAt.toISOString(),
    place: row.place,
    latitude: row.latitude,
    longitude: row.longitude,
    officerName: row.officerName,
    activity: row.activity as LogActivity,
    result: row.result,
  };
}

export function mapInvestigationReport(
  row: Prisma.SmartPoliceInvestigationReportGetPayload<object>,
): InvestigationReportDto {
  return {
    id: row.id,
    caseId: row.caseId,
    title: row.title,
    reportNo: row.reportNo,
    reportedAt: row.reportedAt.toISOString(),
    officerName: row.officerName,
    summary: row.summary,
    body: row.body,
    finding: row.finding,
    attachmentUrl: row.attachmentUrl,
  };
}

export function mapLink(
  row: Prisma.SmartPoliceLinkGetPayload<{ include: { from: true; to: true } }>,
): LinkDto {
  return {
    id: row.id,
    fromId: row.fromId,
    fromName: row.from.fullName,
    toId: row.toId,
    toName: row.to.fullName,
    kind: row.kind as LinkKind,
    label: row.label,
    weight: row.weight,
    strength: row.strength,
    directed: row.directed,
    caseId: row.caseId,
    notes: row.notes,
  };
}
