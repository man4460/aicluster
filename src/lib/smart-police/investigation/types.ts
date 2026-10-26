/** ชุดข้อมูลงานสืบสวน — ชนิดที่ใช้ร่วมระหว่าง API และหน้าเว็บ */

import type { SuspectPhotoDto } from "@/lib/smart-police/investigation/photo-types";

export const SUSPECT_RISK_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
export type SuspectRiskLevel = (typeof SUSPECT_RISK_LEVELS)[number];

export const SUSPECT_STATUSES = ["ACTIVE", "WATCH", "CLEARED", "ARCHIVED"] as const;
export type SuspectStatus = (typeof SUSPECT_STATUSES)[number];

export const ADDRESS_KINDS = ["HOME", "WORK", "HIDEOUT", "SEEN", "OTHER"] as const;
export type AddressKind = (typeof ADDRESS_KINDS)[number];

export const LOG_ACTIVITIES = [
  "SUMMARY",
  "SURVEILLANCE",
  "INTERVIEW",
  "CHECKPOINT",
  "OTHER",
] as const;
export type LogActivity = (typeof LOG_ACTIVITIES)[number];

export const LINK_KINDS = [
  "FAMILY",
  "KNOWN",
  "GANG",
  "MONEY",
  "PHONE",
  "CO_SUSPECT",
  "OTHER",
] as const;
export type LinkKind = (typeof LINK_KINDS)[number];

export const LINK_KIND_LABELS: Record<LinkKind, string> = {
  FAMILY: "ญาติ / เครือญาติ",
  KNOWN: "รู้จักกัน",
  GANG: "แก๊งเดียวกัน",
  MONEY: "เส้นทางการเงิน",
  PHONE: "ติดต่อทางโทรศัพท์",
  CO_SUSPECT: "ผู้ต้องหาคดีเดียวกัน",
  OTHER: "อื่น ๆ",
};

export const ADDRESS_KIND_LABELS: Record<AddressKind, string> = {
  HOME: "บ้าน",
  WORK: "ที่ทำงาน",
  HIDEOUT: "ที่ซ่อนตัว",
  SEEN: "จุดพบเห็น",
  OTHER: "อื่น ๆ",
};

export const LOG_ACTIVITY_LABELS: Record<LogActivity, string> = {
  SUMMARY: "สรุปการสืบ",
  SURVEILLANCE: "สะกดรอย",
  INTERVIEW: "สอบถาม/สัมภาษณ์",
  CHECKPOINT: "ตั้งจุดตรวจ",
  OTHER: "อื่น ๆ",
};

export type SuspectAddressDto = {
  id: string;
  kind: AddressKind;
  label: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  source: string | null;
  verifiedAt: string | null;
};

export type SuspectDto = {
  id: string;
  fullName: string;
  alias: string | null;
  nickname: string | null;
  nationalId: string | null;
  birthDate: string | null;
  gender: string | null;
  photoUrl: string | null;
  phone: string | null;
  occupation: string | null;
  description: string | null;
  riskLevel: SuspectRiskLevel;
  status: SuspectStatus;
  notes: string | null;
  addresses: SuspectAddressDto[];
  photos: SuspectPhotoDto[];
  caseIds: string[];
  linkCount: number;
  logCount: number;
  updatedAt: string;
};

export type InvestigationLogDto = {
  id: string;
  caseId: string | null;
  suspectId: string | null;
  suspectName: string | null;
  occurredAt: string;
  place: string | null;
  latitude: number | null;
  longitude: number | null;
  officerName: string | null;
  activity: LogActivity;
  result: string | null;
};

export type InvestigationReportDto = {
  id: string;
  caseId: string | null;
  title: string;
  reportNo: string | null;
  reportedAt: string;
  officerName: string | null;
  summary: string | null;
  body: string;
  finding: string | null;
  attachmentUrl: string | null;
};

export type LinkDto = {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  kind: LinkKind;
  label: string | null;
  weight: number;
  strength: number;
  directed: boolean;
  caseId: string | null;
  notes: string | null;
};

/** โหนดในผังเชื่อมโยง */
export type GraphNodeDto = {
  id: string;
  type: "SUSPECT" | "CASE" | "LOCATION";
  label: string;
  sublabel: string | null;
  /** จำนวนเส้นที่ต่อกับโหนดนี้ */
  degree: number;
  riskLevel?: SuspectRiskLevel;
  caseNumber?: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type GraphEdgeDto = {
  id: string;
  source: string;
  target: string;
  kind: LinkKind;
  label: string;
  weight: number;
  directed: boolean;
  caseId: string | null;
};

export type InvestigationGraphDto = {
  nodes: GraphNodeDto[];
  edges: GraphEdgeDto[];
  stats: {
    suspects: number;
    cases: number;
    locations: number;
    links: number;
    /** ค่าเฉลี่ยจำนวนเส้นต่อโหนด */
    avgDegree: number;
    /** โหนดที่มีดีกรีสูงสุด */
    topHubs: Array<{ id: string; label: string; degree: number }>;
  };
};
