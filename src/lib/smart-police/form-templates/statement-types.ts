import type { SmartPolicePartyRole } from "@/generated/prisma/enums";

export type StatementTemplateSlug =
  | "statement-complainant"
  | "statement-suspect"
  | "statement-witness";

export type StatementQaItem = {
  id: string;
  question: string;
  answer: string;
};

export type StatementPage = {
  id: string;
  /** ข้อความคำให้การแบบพิมพ์บนบรรทัด (เหมือน Word) */
  text: string;
  /** legacy — แปลงเป็น text ตอนเปิดถ้า text ว่าง */
  qa: StatementQaItem[];
};

export type StatementHeaderFields = {
  stationName: string;
  stationAddress: string;
  province: string;
  commanderLine: string;
  caseNumber: string;
  caseTitle: string;
  caseType: string;
  chargeText: string;
  lawRefs: string;
  investigator: string;
  todayThai: string;
  partyName: string;
  partyRoleLabel: string;
  partyAge: string;
  partyNationality: string;
  partyIdCard: string;
  partyAddress: string;
  partyPhone: string;
  partyOccupation: string;
  /** บรรทัดที่ 2 ของอาชีพ (จุดไข่ปลาต่อ) */
  partyOccupationLine2: string;
  partyWorkplace: string;
  partyCaseRelation: string;
  partyPleaStatus: string;
  /** แบบฟอร์มราชการ — ช่องเพิ่ม */
  district: string;
  dayThai: string;
  monthThai: string;
  yearThai: string;
  complainantLine: string;
  suspectLine: string;
  interviewPlace: string;
  ethnicity: string;
  religion: string;
  idIssuedOn: string;
  idExpiresOn: string;
  idIssuedAt: string;
  houseNo: string;
  moo: string;
  tambon: string;
  amphoe: string;
  villageHead: string;
  kamnan: string;
  fatherName: string;
  motherName: string;
  relationshipNote: string;
  /** ผู้ต้องหา — เกิดแขวง/ตำบล · เขต/อำเภอ · จังหวัด */
  birthTambon: string;
  birthAmphoe: string;
  birthProvince: string;
  /** ท้ายคำให้การ — ลงชื่อผู้ให้การ / พงส. */
  signParty: string;
  signOfficer: string;
};

/** v1 — ถาม/ตอบอย่างเดียว (legacy) */
export type StatementDocumentContentV1 = {
  templateSlug: StatementTemplateSlug;
  version: 1;
  header: StatementHeaderFields;
  pages: StatementPage[];
};

/** v2 — HTML จาก Word ทั้งก้อน (legacy) */
export type StatementDocumentContentV2 = {
  templateSlug: StatementTemplateSlug;
  version: 2;
  blankFormId: string;
  blankFormFileName: string;
  blankFormTitle: string;
  header: StatementHeaderFields;
  bodyHtml: string;
};

/**
 * v3 — ฟอร์ม Word จริง + ถาม/ตอบ ในระบบ
 * ลิงก์แบบฟอร์มต้นฉบับ · พรีวิว HTML · พิมพ์ถาม–ตอบ · บันทึกแล้วสร้าง .docx แนบสำนวน
 */
export type StatementDocumentContentV3 = {
  templateSlug: StatementTemplateSlug;
  version: 3;
  blankFormId: string;
  blankFormFileName: string;
  blankFormTitle: string;
  blankFormHref: string;
  header: StatementHeaderFields;
  /** พรีวิวแบบฟอร์ม Word (mammoth) หลังเติมช่องจากคดี */
  formHtml: string;
  pages: StatementPage[];
};

export type StatementDocumentContent =
  | StatementDocumentContentV1
  | StatementDocumentContentV2
  | StatementDocumentContentV3;

export type StatementTemplateMeta = {
  slug: StatementTemplateSlug;
  title: string;
  description: string;
  roles: SmartPolicePartyRole[];
  blankFormId: string;
};

export const STATEMENT_CONTENT_MARKER = '"templateSlug"';

export function isStatementDocumentV2(
  doc: StatementDocumentContent,
): doc is StatementDocumentContentV2 {
  return doc.version === 2 && "bodyHtml" in doc;
}

export function isStatementDocumentV3(
  doc: StatementDocumentContent,
): doc is StatementDocumentContentV3 {
  return doc.version === 3 && "formHtml" in doc && Array.isArray(doc.pages);
}

export function statementDocumentHasPages(
  doc: StatementDocumentContent,
): doc is StatementDocumentContentV1 | StatementDocumentContentV3 {
  return doc.version === 1 || doc.version === 3;
}
