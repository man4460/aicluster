import type {
  SmartPoliceCasePriority,
  SmartPoliceCaseStatus,
  SmartPoliceCustodyMode,
  SmartPoliceDocumentKind,
  SmartPoliceInvestigationResult,
  SmartPolicePartyRole,
  SmartPoliceWitnessSide,
} from "@/generated/prisma/enums";

export type { SmartPoliceCasePriority };

export type SmartPoliceProfileDto = {
  id: string;
  stationName: string;
  stationAddress: string | null;
  province: string | null;
  commanderRank: string | null;
  commanderName: string | null;
  commanderTitle: string | null;
  headOfWorkRank: string | null;
  headOfWorkName: string | null;
  investigatorDefault: string | null;
  caseNumberPrefix: string;
  printFooter: string | null;
};

export type SmartPoliceOfficerDto = {
  id: string;
  fullName: string;
  rankTitle: string | null;
  position: string | null;
  birthDate: string | null;
  isDefault: boolean;
  sortOrder: number;
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
  caseRelation: string | null;
  witnessSide: SmartPoliceWitnessSide | null;
  pleaStatus: string | null;
  occupation: string | null;
  workplace: string | null;
  sortOrder: number;
};

export type SmartPoliceEvidenceDto = {
  id: string;
  name: string;
  quantityLabel: string | null;
  seizureNo: string | null;
  seizedFrom: string | null;
  ownerName: string | null;
  ownerNote: string | null;
  labReceivedAt: string | null;
  labResult: string | null;
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
  priority: SmartPoliceCasePriority;
  incidentAt: string | null;
  receivedAt: string | null;
  sentToProsecutorAt: string | null;
  investigationResult: SmartPoliceInvestigationResult;
  daysSinceReceived: number | null;
  overdue: boolean;
  /** ชื่อผู้กล่าวหาหลัก (+ และอีก N ถ้ามีหลายคน) */
  complainantName: string | null;
  /** ชื่อผู้ต้องหาหลัก (+ และอีก N ถ้ามีหลายคน) */
  suspectName: string | null;
  documentCount: number;
  partyCount: number;
  printCount: number;
  updatedAt: string;
};

export type SmartPoliceCaseDetail = SmartPoliceCaseListItem & {
  incidentPlace: string | null;
  summary: string | null;
  courtType: string | null;
  chargeText: string | null;
  lawRefs: string | null;
  receivedAt: string | null;
  receivedTimeHm: string | null;
  dailyLogNo: string | null;
  custodyMode: SmartPoliceCustodyMode | null;
  investigatorOfficerId: string | null;
  investigationResult: SmartPoliceInvestigationResult;
  sentToProsecutorAt: string | null;
  behaviorText: string | null;
  damageNote: string | null;
  detainAt: string | null;
  parties: SmartPolicePartyDto[];
  documents: SmartPoliceDocumentDto[];
  evidence: SmartPoliceEvidenceDto[];
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

export type SmartPoliceChargeDto = {
  id: string;
  category: string;
  chargeText: string;
  lawRefs: string | null;
  keywords: string | null;
  isBuiltin: boolean;
  isActive: boolean;
  sortOrder: number;
  isOwnerCustom: boolean;
};

export type SmartPoliceCasePresetDto = {
  id: string;
  key: string;
  caseType: string;
  title: string;
  chargeId: string | null;
  defaultChargeText: string;
  defaultLawRefs: string | null;
  defaultCourtType: string | null;
  defaultCustodyMode: string | null;
  /** ค่าตั้งต้นที่เติมให้ฟอร์ม: { "form.field.key": "ค่า" } */
  starterFields: Record<string, string>;
  /** slug ฟอร์มที่คดีประเภทนี้ต้องทำ (เรียงตามลำดับงาน) */
  formSlugs: string[];
  isBuiltin: boolean;
  isActive: boolean;
  sortOrder: number;
  isOwnerCustom: boolean;
};

/** หมวดคลังข้อหา — จัดตามกลุ่มข้อหาที่พงส./อัยการใช้บ่อย */
export const SMART_POLICE_CHARGE_CATEGORIES = [
  "ชีวิตและร่างกาย",
  "เพศ",
  "ทรัพย์",
  "เอกสาร",
  "ยาเสพติด",
  "อาวุธ",
  "จราจร",
  "การพนัน",
  "ป่าไม้",
  "ความสงบเรียบร้อย",
  "ทั่วไป",
] as const;

export const SMART_POLICE_CASE_STATUS_LABEL: Record<SmartPoliceCaseStatus, string> = {
  OPEN: "เปิดคดี",
  IN_PROGRESS: "สอบสวน",
  CLOSED: "ปิดคดี",
};

export const SMART_POLICE_CASE_PRIORITY_LABEL: Record<SmartPoliceCasePriority, string> = {
  LOW: "ต่ำ",
  NORMAL: "ปกติ",
  HIGH: "สูง",
  URGENT: "ด่วน",
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
  MEMO: "บันทึกพนักงานสอบสวน",
  PROPERTY_LIST: "บัญชีของกลาง",
  INVESTIGATION_REPORT: "รายงานการสอบสวน",
  OTHER: "อื่น ๆ",
};

export const SMART_POLICE_CUSTODY_MODE_LABEL: Record<SmartPoliceCustodyMode, string> = {
  DETAIN_REMAND: "ผัดฟ้องฝากขัง",
  NOT_ARRESTED: "ไม่ได้ตัว",
  UNKNOWN: "ไม่รู้ตัว",
  SURRENDER_RELEASE: "มอบตัวปล่อยตัว",
  SURRENDER_DETAIN: "มอบตัวฝากขัง",
  OTHER: "อื่น ๆ",
};

export const SMART_POLICE_INVESTIGATION_RESULT_LABEL: Record<SmartPoliceInvestigationResult, string> = {
  INVESTIGATING: "อยู่ระหว่างสอบสวน",
  PROSECUTE: "สั่งฟ้อง",
  NOT_PROSECUTE: "สั่งไม่ฟ้อง",
};

export const SMART_POLICE_WITNESS_SIDE_LABEL: Record<SmartPoliceWitnessSide, string> = {
  COMPLAINANT: "ฝ่ายผู้กล่าวหา",
  SUSPECT: "ฝ่ายผู้ต้องหา",
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

export const SMART_POLICE_COURT_TYPES = [
  "จังหวัด",
  "เยาวชน",
  "ทหาร",
  "ทรัพย์จังหวัด",
  "ทรัพย์แขวง",
] as const;

/** เกี่ยวกับคดี — ใช้สร้างคำให้การอัตโนมัติ (ตามคู่มือ SmartPolice) */
export const SMART_POLICE_CASE_RELATIONS = [
  "ผู้จับกุมผู้ต้องหาและยึดของกลาง",
  "ผู้ร่วมจับกุมผู้ต้องหาและยึดของกลาง",
  "ผู้ถือกรรมสิทธิ์ในทรัพย์ของกลาง",
  "ผู้รับมอบอำนาจจากผู้ถือกรรมสิทธิ์ในทรัพย์ของกลาง",
  "นายประกัน",
  "ผู้ตาย",
  "ผู้รู้เห็นหรือเกี่ยวข้องกับคดี",
] as const;

export const SMART_POLICE_PLEA_OPTIONS = [
  "รับสารภาพตลอดข้อหา",
  "ปฏิเสธตลอดข้อหา",
  "รับสารภาพในข้อหา ปฏิเสธในข้อหา",
  "ตาย",
  "หลบหนี",
] as const;

/** ข้อหา seed สำหรับเคสตัวอย่างยาบ้า */
export const SMART_POLICE_SAMPLE_CHARGES = [
  {
    chargeText: "มียาเสพติดให้โทษประเภท 1(ยาบ้า) ไว้ในครอบครองโดยฝ่าฝืนกฎหมาย",
    lawRefs: "พ.ร.บ.ยาเสพติดให้โทษ พ.ศ. 2522",
  },
] as const;

export const SMART_POLICE_SAMPLE_BEHAVIORS = [
  "ยาบ้าครอบครอง ผู้ต้องหาขับขี่รถจักรยานยนต์ ยึดรถของกลาง",
] as const;
