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
  partyWorkplace: string;
  partyCaseRelation: string;
  partyPleaStatus: string;
};

/** v1 — ถาม/ตอบแยกหน้า (legacy) */
export type StatementDocumentContentV1 = {
  templateSlug: StatementTemplateSlug;
  version: 1;
  header: StatementHeaderFields;
  pages: StatementPage[];
};

/**
 * v2 — ฟอร์ม HTML จากแบบฟอร์ม Word จริง
 * แก้ได้เหมือนพิมพ์บน Word / กรอก PDF แล้วบันทึก·พิมพ์ลงลายเซ็น
 */
export type StatementDocumentContentV2 = {
  templateSlug: StatementTemplateSlug;
  version: 2;
  blankFormId: string;
  blankFormFileName: string;
  blankFormTitle: string;
  header: StatementHeaderFields;
  /** เนื้อหาแบบฟอร์ม HTML (mammoth + ช่องที่เติมแล้ว) */
  bodyHtml: string;
};

export type StatementDocumentContent = StatementDocumentContentV1 | StatementDocumentContentV2;

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
