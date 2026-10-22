import type { SmartPolicePartyRole } from "@/generated/prisma/enums";
import type {
  StatementTemplateMeta,
  StatementTemplateSlug,
} from "@/lib/smart-police/form-templates/statement-types";

/** ชื่อแบบฟอร์มผู้กล่าวหา / พยาน */
export const SMART_POLICE_STATEMENT_FORM_TITLE =
  "บันทึกคำให้การของผู้ร้องทุกข์ ผู้กล่าวโทษ หรือพยาน";

/** ชื่อแบบฟอร์มคำให้การผู้ต้องหา */
export const SMART_POLICE_STATEMENT_SUSPECT_FORM_TITLE = "บันทึกคำให้การของผู้ต้องหา";

export const SMART_POLICE_STATEMENT_COMPLAINANT_PREAMBLE =
  "ขอให้ถ้อยคำต่อพนักงานสอบสวนด้วยความสัตย์จริงว่า";

/** ตามแบบราชการผู้ต้องหา — แทนแถวเกี่ยวข้อง + สาบานตน */
export const SMART_POLICE_STATEMENT_SUSPECT_PREAMBLE =
  "และเจ้าพนักงานได้แจ้งให้ข้าพเจ้าทราบถึงข้อเท็จจริงเกี่ยวกับการกระทำที่กล่าวหาข้าพเจ้า กระทำผิดว่า";

export function statementPartyRoleLabelForSlug(slug: StatementTemplateSlug): string {
  if (slug === "statement-suspect") return "ผู้ต้องหา";
  if (slug === "statement-witness") return "พยาน";
  return "ผู้กล่าวหา";
}

export function statementFormTitleForSlug(slug: StatementTemplateSlug): string {
  if (slug === "statement-suspect") return SMART_POLICE_STATEMENT_SUSPECT_FORM_TITLE;
  return SMART_POLICE_STATEMENT_FORM_TITLE;
}

export function statementPreambleForSlug(slug: StatementTemplateSlug): string {
  if (slug === "statement-suspect") return SMART_POLICE_STATEMENT_SUSPECT_PREAMBLE;
  return SMART_POLICE_STATEMENT_COMPLAINANT_PREAMBLE;
}

export function statementShowsBirthPlaceRow(slug: StatementTemplateSlug): boolean {
  return slug === "statement-suspect";
}

/** แม่แบบคำให้การ ↔ ไฟล์แบบฟอร์มเปล่าในคลัง */
export const SMART_POLICE_STATEMENT_TEMPLATES: StatementTemplateMeta[] = [
  {
    slug: "statement-complainant",
    title: "คำให้การผู้กล่าวหา",
    description:
      "ชุดเดียวกับผู้ต้องหา/พยาน — ต่างกันที่ช่อง «เป็น» ด้านซ้าย · พิมพ์ถาม–ตอบบนฟอร์ม · บันทึกแล้วได้ Word ในสำนวน",
    roles: ["COMPLAINANT"],
    blankFormId: "2",
  },
  {
    slug: "statement-suspect",
    title: "คำให้การผู้ต้องหา",
    description:
      "ฟอร์มผู้กล่าวหาปรับหัวข้อเป็นบันทึกคำให้การของผู้ต้องหา · แถวเกิดแขวง/ตำบลแทนเกี่ยวข้อง · แจ้งข้อหาก่อนถาม–ตอบ",
    roles: ["SUSPECT"],
    blankFormId: "11",
  },
  {
    slug: "statement-witness",
    title: "คำให้การพยาน",
    description:
      "คัดลอกแม่แบบผู้กล่าวหา — ช่อง «เป็น» ด้านซ้ายเป็นพยาน · พิมพ์ถาม–ตอบบนฟอร์ม · บันทึกแล้วได้ Word ในสำนวน",
    roles: ["WITNESS"],
    blankFormId: "18",
  },
];

export function statementTemplateSlugForRole(role: SmartPolicePartyRole): StatementTemplateSlug {
  if (role === "COMPLAINANT") return "statement-complainant";
  if (role === "SUSPECT") return "statement-suspect";
  return "statement-witness";
}

export function getStatementTemplateMeta(slug: StatementTemplateSlug): StatementTemplateMeta {
  const found = SMART_POLICE_STATEMENT_TEMPLATES.find((t) => t.slug === slug);
  if (found) return found;
  return SMART_POLICE_STATEMENT_TEMPLATES[2]!;
}

export function statementTemplateMetaForRole(role: SmartPolicePartyRole): StatementTemplateMeta {
  return getStatementTemplateMeta(statementTemplateSlugForRole(role));
}
