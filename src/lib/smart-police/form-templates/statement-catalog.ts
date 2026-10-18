import type { SmartPolicePartyRole } from "@/generated/prisma/enums";
import type {
  StatementTemplateMeta,
  StatementTemplateSlug,
} from "@/lib/smart-police/form-templates/statement-types";

/** แม่แบบคำให้การ ↔ ไฟล์แบบฟอร์มเปล่าในคลัง */
export const SMART_POLICE_STATEMENT_TEMPLATES: StatementTemplateMeta[] = [
  {
    slug: "statement-complainant",
    title: "คำให้การผู้กล่าวหา",
    description: "แบบจำลองฟอร์มในคดี — เติมชื่อ·ข้อหา·สถานีอัตโนมัติ แล้วพิมพ์ถาม–ตอบได้ บันทึก·พิมพ์ลงลายเซ็น",
    roles: ["COMPLAINANT"],
    blankFormId: "2",
  },
  {
    slug: "statement-suspect",
    title: "คำให้การผู้ต้องหา",
    description: "แบบจำลองฟอร์มในคดี — เติมชื่อ·ข้อหา·สถานีอัตโนมัติ แล้วพิมพ์ถาม–ตอบได้ บันทึก·พิมพ์ลงลายเซ็น",
    roles: ["SUSPECT"],
    blankFormId: "11",
  },
  {
    slug: "statement-witness",
    title: "คำให้การพยาน",
    description: "แบบจำลองฟอร์มในคดี — เติมชื่อ·ข้อหา·สถานีอัตโนมัติ แล้วพิมพ์ถาม–ตอบได้ บันทึก·พิมพ์ลงลายเซ็น",
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
