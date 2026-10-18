import type { SmartPolicePartyRole } from "@/generated/prisma/enums";
import type {
  StatementTemplateMeta,
  StatementTemplateSlug,
} from "@/lib/smart-police/form-templates/statement-types";

export const SMART_POLICE_STATEMENT_TEMPLATES: StatementTemplateMeta[] = [
  {
    slug: "statement-complainant",
    title: "คำให้การผู้กล่าวหา",
    description: "แม่แบบ HTML สำหรับสอบปากคำผู้กล่าวหา — เติมข้อมูลคดี/บุคคล แล้วถาม–ตอบได้หลายหน้า",
    roles: ["COMPLAINANT"],
  },
  {
    slug: "statement-suspect",
    title: "คำให้การผู้ต้องหา",
    description: "แม่แบบ HTML สำหรับสอบปากคำผู้ต้องหา — เติมข้อมูลคดี/บุคคล แล้วถาม–ตอบได้หลายหน้า",
    roles: ["SUSPECT"],
  },
  {
    slug: "statement-witness",
    title: "คำให้การพยาน",
    description: "แม่แบบ HTML สำหรับสอบปากคำพยาน — เติมข้อมูลคดี/บุคคล แล้วถาม–ตอบได้หลายหน้า",
    roles: ["WITNESS"],
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
