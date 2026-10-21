import { SMART_POLICE_STATEMENT_TEMPLATES } from "@/lib/smart-police/form-templates/statement-catalog";

export type OfficialFormKind =
  | "statement"
  | "property-list"
  | "scene-map"
  | "withdraw-complaint"
  | "compensation-settlement"
  | "victim-rights"
  | "oral-plea";

export type PropertyListTemplateSlug =
  | "property-damaged"
  | "property-damaged-recovered"
  | "property-damaged-unrecovered";

export type SceneMapTemplateSlug = "scene-map";
export type WithdrawComplaintTemplateSlug = "withdraw-complaint";
export type CompensationSettlementTemplateSlug = "compensation-settlement";
export type VictimRightsTemplateSlug = "victim-rights";
export type OralPleaTemplateSlug = "oral-plea";

export type OfficialFormTemplateSlug =
  | "statement-complainant"
  | "statement-suspect"
  | "statement-witness"
  | PropertyListTemplateSlug
  | SceneMapTemplateSlug
  | WithdrawComplaintTemplateSlug
  | CompensationSettlementTemplateSlug
  | VictimRightsTemplateSlug
  | OralPleaTemplateSlug;

export type OfficialFormTemplateMeta = {
  slug: OfficialFormTemplateSlug;
  title: string;
  kind: OfficialFormKind;
  blankFormId: string;
};

export const PROPERTY_DAMAGED_FORM_TITLE = "บัญชีทรัพย์ถูกประทุษร้าย";
export const PROPERTY_DAMAGED_RECOVERED_FORM_TITLE = "บัญชีทรัพย์ถูกประทุษร้ายได้คืน";
export const PROPERTY_DAMAGED_UNRECOVERED_FORM_TITLE = "บัญชีทรัพย์ถูกประทุษร้ายไม่ได้คืน";

export const SMART_POLICE_PROPERTY_LIST_TEMPLATES: OfficialFormTemplateMeta[] = [
  {
    slug: "property-damaged",
    title: PROPERTY_DAMAGED_FORM_TITLE,
    kind: "property-list",
    blankFormId: "4",
  },
  {
    slug: "property-damaged-recovered",
    title: PROPERTY_DAMAGED_RECOVERED_FORM_TITLE,
    kind: "property-list",
    blankFormId: "5",
  },
  {
    slug: "property-damaged-unrecovered",
    title: PROPERTY_DAMAGED_UNRECOVERED_FORM_TITLE,
    kind: "property-list",
    blankFormId: "6",
  },
];

export const SMART_POLICE_PROPERTY_LIST_TEMPLATE = SMART_POLICE_PROPERTY_LIST_TEMPLATES[0]!;

export const SCENE_MAP_FORM_TITLE = "แผนที่สังเขปแสดงสถานที่เกิดเหตุ";
export const SCENE_MAP_TEMPLATE_TITLE = "แผนที่เกิดเหตุ";

export const SMART_POLICE_SCENE_MAP_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "scene-map",
  title: SCENE_MAP_TEMPLATE_TITLE,
  kind: "scene-map",
  blankFormId: "7",
};

export const WITHDRAW_COMPLAINT_FORM_TITLE = "บันทึกถอนการร้องทุกข์ความผิดอันยอมความได้";
export const WITHDRAW_COMPLAINT_TEMPLATE_TITLE = "บันทึกถอนคำร้องทุกข์";

export const SMART_POLICE_WITHDRAW_COMPLAINT_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "withdraw-complaint",
  title: WITHDRAW_COMPLAINT_TEMPLATE_TITLE,
  kind: "withdraw-complaint",
  blankFormId: "8",
};

export const COMPENSATION_SETTLEMENT_FORM_TITLE = "บันทึกการตกลงชดใช้ค่าเสียหาย";
export const COMPENSATION_SETTLEMENT_TEMPLATE_TITLE = "บันทึกการชดใช้ค่าเสียหาย";

export const SMART_POLICE_COMPENSATION_SETTLEMENT_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "compensation-settlement",
  title: COMPENSATION_SETTLEMENT_TEMPLATE_TITLE,
  kind: "compensation-settlement",
  blankFormId: "9",
};

export const VICTIM_RIGHTS_FORM_TITLE_P1 = "บันทึกการแจ้งสิทธิ";
export const VICTIM_RIGHTS_SUBTITLE_P1 =
  "ตามพระราชบัญญัติตอบแทนผู้เสียหาย และค่าทดแทนและค่าใช้จ่ายแก่จำเลยในคดีอาญา พ.ศ. ๒๕๔๔";
export const VICTIM_RIGHTS_FORM_TITLE_P2 = "บันทึกการแจ้งสิทธิของผู้เสียหาย";
export const VICTIM_RIGHTS_TEMPLATE_TITLE = "บันทึกแจ้งสิทธิผู้เสียหาย";

export const SMART_POLICE_VICTIM_RIGHTS_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "victim-rights",
  title: VICTIM_RIGHTS_TEMPLATE_TITLE,
  kind: "victim-rights",
  blankFormId: "10",
};

export const ORAL_PLEA_FORM_TITLE = "บันทึกคำให้การรับสารภาพของผู้ต้องหา ตามมาตรา ๒๐";
export const ORAL_PLEA_FORM_SUBTITLE = "พระราชบัญญัติจัดตั้งศาลแขวง ฯ พ.ศ. ๒๔๙๙";
export const ORAL_PLEA_TEMPLATE_TITLE = "คำให้การผู้ต้องหาฟ้องวาจา";

export const SMART_POLICE_ORAL_PLEA_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "oral-plea",
  title: ORAL_PLEA_TEMPLATE_TITLE,
  kind: "oral-plea",
  blankFormId: "12",
};

export const SMART_POLICE_OFFICIAL_FORM_TEMPLATES: OfficialFormTemplateMeta[] = [
  ...SMART_POLICE_STATEMENT_TEMPLATES.map((t) => ({
    slug: t.slug,
    title: t.title,
    kind: "statement" as const,
    blankFormId: t.blankFormId,
  })),
  ...SMART_POLICE_PROPERTY_LIST_TEMPLATES,
  SMART_POLICE_SCENE_MAP_TEMPLATE,
  SMART_POLICE_WITHDRAW_COMPLAINT_TEMPLATE,
  SMART_POLICE_COMPENSATION_SETTLEMENT_TEMPLATE,
  SMART_POLICE_VICTIM_RIGHTS_TEMPLATE,
  SMART_POLICE_ORAL_PLEA_TEMPLATE,
];

export function getOfficialFormTemplateMeta(
  slug: string,
): OfficialFormTemplateMeta | undefined {
  return SMART_POLICE_OFFICIAL_FORM_TEMPLATES.find((t) => t.slug === slug);
}

export function isStatementFormSlug(
  slug: string,
): slug is Extract<OfficialFormTemplateSlug, `statement-${string}`> {
  return slug.startsWith("statement-");
}

export function isPropertyListFormSlug(slug: string): slug is PropertyListTemplateSlug {
  return SMART_POLICE_PROPERTY_LIST_TEMPLATES.some((t) => t.slug === slug);
}

export function propertyListTitleForSlug(slug: string): string {
  return SMART_POLICE_PROPERTY_LIST_TEMPLATES.find((t) => t.slug === slug)?.title ?? PROPERTY_DAMAGED_FORM_TITLE;
}

export function isSceneMapFormSlug(slug: string): slug is SceneMapTemplateSlug {
  return slug === "scene-map";
}

export function isWithdrawComplaintFormSlug(slug: string): slug is WithdrawComplaintTemplateSlug {
  return slug === "withdraw-complaint";
}

export function isCompensationSettlementFormSlug(
  slug: string,
): slug is CompensationSettlementTemplateSlug {
  return slug === "compensation-settlement";
}

export function isVictimRightsFormSlug(slug: string): slug is VictimRightsTemplateSlug {
  return slug === "victim-rights";
}

export function isOralPleaFormSlug(slug: string): slug is OralPleaTemplateSlug {
  return slug === "oral-plea";
}
