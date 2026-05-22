import type {
  SmartPoliceCaseStatus,
  SmartPoliceDocumentKind,
  SmartPolicePartyRole,
} from "@/generated/prisma/enums";

export type SmartPoliceProfileDto = {
  id: string;
  stationName: string;
  stationAddress: string | null;
  province: string | null;
  commanderRank: string | null;
  commanderName: string | null;
  investigatorDefault: string | null;
  caseNumberPrefix: string;
  printFooter: string | null;
};

export type SmartPolicePartyDto = {
  id: string;
  role: SmartPolicePartyRole;
  fullName: string;
  age: number | null;
  nationality: string | null;
  idCard: string | null;
  address: string | null;
  phone: string | null;
  sortOrder: number;
};

export type SmartPoliceDocumentDto = {
  id: string;
  kind: SmartPoliceDocumentKind;
  title: string;
  content: string;
  partyId: string | null;
  wordFileUrl: string | null;
  wordFileName: string | null;
  printCount: number;
  lastPrintedAt: string | null;
  sortOrder: number;
  updatedAt: string;
};

export type SmartPoliceCaseListItem = {
  id: string;
  caseNumber: string;
  title: string;
  caseType: string;
  status: SmartPoliceCaseStatus;
  incidentAt: string | null;
  documentCount: number;
  partyCount: number;
  printCount: number;
  updatedAt: string;
};

export type SmartPoliceCaseDetail = SmartPoliceCaseListItem & {
  incidentPlace: string | null;
  summary: string | null;
  parties: SmartPolicePartyDto[];
  documents: SmartPoliceDocumentDto[];
};

export type SmartPoliceTemplateDto = {
  id: string;
  kind: SmartPoliceDocumentKind;
  name: string;
  content: string;
  isBuiltin: boolean;
  isActive: boolean;
  sortOrder: number;
};

export const SMART_POLICE_CASE_STATUS_LABEL: Record<SmartPoliceCaseStatus, string> = {
  OPEN: "เปิดคดี",
  IN_PROGRESS: "สอบสวน",
  CLOSED: "ปิดคดี",
};

export const SMART_POLICE_PARTY_ROLE_LABEL: Record<SmartPolicePartyRole, string> = {
  COMPLAINANT: "ผู้กล่าวหา",
  SUSPECT: "ผู้ต้องหา",
  WITNESS: "พยาน",
  OFFICER: "พนักงานสอบสวน",
  OTHER: "อื่น ๆ",
};

export const SMART_POLICE_DOCUMENT_KIND_LABEL: Record<SmartPoliceDocumentKind, string> = {
  NARRATIVE: "สำนวนคดี",
  STATEMENT: "คำให้การ",
  WARRANT: "หมายเรียก/หมายจับ",
  REPORT: "รายงาน",
  MEMO: "บันทึก",
  OTHER: "อื่น ๆ",
};

export const SMART_POLICE_CASE_TYPES = [
  "คดีอาญา",
  "คดีอาญาพิเศษ",
  "คดีแพ่ง",
  "คดีจราจร",
  "คดียาเสพติด",
  "คดีทรัพย์",
  "อื่น ๆ",
] as const;
