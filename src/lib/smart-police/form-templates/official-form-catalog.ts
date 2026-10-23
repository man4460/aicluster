import { SMART_POLICE_STATEMENT_TEMPLATES } from "@/lib/smart-police/form-templates/statement-catalog";

export type OfficialFormKind =
  | "statement"
  | "property-list"
  | "exhibit-list"
  | "scene-map"
  | "withdraw-complaint"
  | "compensation-settlement"
  | "victim-rights"
  | "oral-plea"
  | "arrest-record"
  | "charge-notice"
  | "rights-notice"
  | "case-photo"
  | "photo-id"
  | "lineup-id"
  | "case-cover"
  | "inquiry-report"
  | "inquiry-memo"
  | "inquiry-docket"
  | "scene-inspect"
  | "case-progress"
  | "injury-referral"
  | "forensic-request"
  | "custody-log"
  | "bail-bond"
  | "investigate-notice"
  | "official-memo"
  | "witness-summons";

export type PropertyListTemplateSlug =
  | "property-damaged"
  | "property-damaged-recovered"
  | "property-damaged-unrecovered";

export type ExhibitListTemplateSlug = "exhibit-list";
export type SceneMapTemplateSlug = "scene-map";
export type WithdrawComplaintTemplateSlug = "withdraw-complaint";
export type CompensationSettlementTemplateSlug = "compensation-settlement";
export type VictimRightsTemplateSlug = "victim-rights";
export type OralPleaTemplateSlug = "oral-plea";
export type ArrestRecordTemplateSlug = "arrest-record";
export type ChargeNoticeTemplateSlug = "charge-notice";
export type RightsNoticeTemplateSlug = "rights-notice";
export type CasePhotoTemplateSlug = "case-photo";
export type PhotoIdTemplateSlug = "photo-id";
export type LineupIdTemplateSlug = "lineup-id";
export type CaseCoverTemplateSlug = "case-cover";
export type InquiryReportTemplateSlug = "inquiry-report";
export type InquiryMemoTemplateSlug = "inquiry-memo";
export type InquiryDocketTemplateSlug = "inquiry-docket";
export type SceneInspectTemplateSlug = "scene-inspect";
export type CaseProgressTemplateSlug = "case-progress";
export type InjuryReferralTemplateSlug = "injury-referral";
export type ForensicRequestTemplateSlug = "forensic-request";
export type CustodyLogTemplateSlug = "custody-log";
export type BailBondTemplateSlug = "bail-bond";
export type InvestigateNoticeTemplateSlug = "investigate-notice";
export type OfficialMemoTemplateSlug = "official-memo";
export type WitnessSummonsTemplateSlug = "witness-summons";

export type OfficialFormTemplateSlug =
  | "statement-complainant"
  | "statement-suspect"
  | "statement-witness"
  | PropertyListTemplateSlug
  | ExhibitListTemplateSlug
  | SceneMapTemplateSlug
  | WithdrawComplaintTemplateSlug
  | CompensationSettlementTemplateSlug
  | VictimRightsTemplateSlug
  | OralPleaTemplateSlug
  | ArrestRecordTemplateSlug
  | ChargeNoticeTemplateSlug
  | RightsNoticeTemplateSlug
  | CasePhotoTemplateSlug
  | PhotoIdTemplateSlug
  | LineupIdTemplateSlug
  | CaseCoverTemplateSlug
  | InquiryReportTemplateSlug
  | InquiryMemoTemplateSlug
  | InquiryDocketTemplateSlug
  | SceneInspectTemplateSlug
  | CaseProgressTemplateSlug
  | InjuryReferralTemplateSlug
  | ForensicRequestTemplateSlug
  | CustodyLogTemplateSlug
  | BailBondTemplateSlug
  | InvestigateNoticeTemplateSlug
  | OfficialMemoTemplateSlug
  | WitnessSummonsTemplateSlug;

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

export const EXHIBIT_LIST_FORM_TITLE = "บัญชีทรัพย์ของกลางคดีอาญา";
export const EXHIBIT_LIST_TEMPLATE_TITLE = "บัญชีของกลาง";

export const SMART_POLICE_EXHIBIT_LIST_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "exhibit-list",
  title: EXHIBIT_LIST_TEMPLATE_TITLE,
  kind: "exhibit-list",
  blankFormId: "13",
};

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

export const ARREST_RECORD_FORM_TITLE = "บันทึกการจับกุม";
export const ARREST_RECORD_TEMPLATE_TITLE = "บันทึกจับกุม";

export const SMART_POLICE_ARREST_RECORD_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "arrest-record",
  title: ARREST_RECORD_TEMPLATE_TITLE,
  kind: "arrest-record",
  blankFormId: "14",
};

export const CHARGE_NOTICE_FORM_TITLE = "บันทึกการแจ้งข้อกล่าวหา";
export const CHARGE_NOTICE_TEMPLATE_TITLE = "บันทึกแจ้งข้อหา";

export const SMART_POLICE_CHARGE_NOTICE_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "charge-notice",
  title: CHARGE_NOTICE_TEMPLATE_TITLE,
  kind: "charge-notice",
  blankFormId: "15",
};

export const RIGHTS_NOTICE_FORM_TITLE = "บันทึกการแจ้งสิทธิของผู้ถูกจับหรือผู้ต้องหา";
export const RIGHTS_NOTICE_TEMPLATE_TITLE = "บันทึกแจ้งสิทธิผู้ต้องหา";

export const SMART_POLICE_RIGHTS_NOTICE_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "rights-notice",
  title: RIGHTS_NOTICE_TEMPLATE_TITLE,
  kind: "rights-notice",
  blankFormId: "16",
};

export const CASE_PHOTO_FORM_TITLE = "ภาพถ่ายประกอบคดี";
export const CASE_PHOTO_TEMPLATE_TITLE = "ภาพถ่ายประกอบคดี";

export const SMART_POLICE_CASE_PHOTO_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "case-photo",
  title: CASE_PHOTO_TEMPLATE_TITLE,
  kind: "case-photo",
  blankFormId: "17",
};

export const PHOTO_ID_FORM_TITLE = "บันทึกการชี้รูปผู้ต้องหา";
export const PHOTO_ID_TEMPLATE_TITLE = "บันทึกชี้รูปผู้ต้องหา";

export const SMART_POLICE_PHOTO_ID_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "photo-id",
  title: PHOTO_ID_TEMPLATE_TITLE,
  kind: "photo-id",
  blankFormId: "19",
};

export const LINEUP_ID_FORM_TITLE = "บันทึกการชี้ตัวผู้ต้องหา";
export const LINEUP_ID_TEMPLATE_TITLE = "บันทึกชี้ตัวผู้ต้องหา";

export const SMART_POLICE_LINEUP_ID_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "lineup-id",
  title: LINEUP_ID_TEMPLATE_TITLE,
  kind: "lineup-id",
  blankFormId: "20",
};

export const CASE_COVER_FORM_TITLE = "ปกสำนวน";
export const CASE_COVER_TEMPLATE_TITLE = "ปกสำนวน";

export const SMART_POLICE_CASE_COVER_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "case-cover",
  title: CASE_COVER_TEMPLATE_TITLE,
  kind: "case-cover",
  blankFormId: "21",
};

export const INQUIRY_REPORT_FORM_TITLE = "รายงานการสอบสวน";
export const INQUIRY_REPORT_TEMPLATE_TITLE = "รายงานการสอบสวน";

export const SMART_POLICE_INQUIRY_REPORT_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "inquiry-report",
  title: INQUIRY_REPORT_TEMPLATE_TITLE,
  kind: "inquiry-report",
  blankFormId: "22",
};

export const INQUIRY_MEMO_FORM_TITLE = "บันทึกพนักงานสอบสวน";
export const INQUIRY_MEMO_TEMPLATE_TITLE = "บันทึกพนักงานสอบสวน";

export const SMART_POLICE_INQUIRY_MEMO_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "inquiry-memo",
  title: INQUIRY_MEMO_TEMPLATE_TITLE,
  kind: "inquiry-memo",
  blankFormId: "23",
};

export const INQUIRY_DOCKET_FORM_TITLE = "บัญชีสำนวนการสอบสวน";
export const INQUIRY_DOCKET_TEMPLATE_TITLE = "บัญชีสำนวนการสอบสวน";

export const SMART_POLICE_INQUIRY_DOCKET_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "inquiry-docket",
  title: INQUIRY_DOCKET_TEMPLATE_TITLE,
  kind: "inquiry-docket",
  blankFormId: "24",
};

export const SCENE_INSPECT_FORM_TITLE = "บันทึกตรวจสถานที่เกิดเหตุ";
export const SCENE_INSPECT_TEMPLATE_TITLE = "บันทึกตรวจสถานที่เกิดเหตุ";

export const SMART_POLICE_SCENE_INSPECT_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "scene-inspect",
  title: SCENE_INSPECT_TEMPLATE_TITLE,
  kind: "scene-inspect",
  blankFormId: "25",
};

export const CASE_PROGRESS_FORM_TITLE = "หนังสือแจ้งความคืบหน้าการสอบสวนคดีอาญา";
export const CASE_PROGRESS_TEMPLATE_TITLE = "หนังสือแจ้งความคืบหน้าทางคดี";

export const SMART_POLICE_CASE_PROGRESS_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "case-progress",
  title: CASE_PROGRESS_TEMPLATE_TITLE,
  kind: "case-progress",
  blankFormId: "26",
};

export const INJURY_REFERRAL_FORM_TITLE = "ใบนำส่งผู้บาดเจ็บหรือศพให้แพทย์ตรวจชันสูตร";
export const INJURY_REFERRAL_FORM_TITLE_P2 = "ผลการตรวจชันสูตรบาดแผลหรือศพของแพทย์";
export const INJURY_REFERRAL_TEMPLATE_TITLE = "ใบนำส่งผู้บาดเจ็บหรือศพ";

export const SMART_POLICE_INJURY_REFERRAL_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "injury-referral",
  title: INJURY_REFERRAL_TEMPLATE_TITLE,
  kind: "injury-referral",
  blankFormId: "27",
};

export const FORENSIC_REQUEST_FORM_TITLE = "บันทึกข้อความ";
export const FORENSIC_REQUEST_TEMPLATE_TITLE = "หนังสือส่งตรวจพิสูจน์";

export const SMART_POLICE_FORENSIC_REQUEST_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "forensic-request",
  title: FORENSIC_REQUEST_TEMPLATE_TITLE,
  kind: "forensic-request",
  blankFormId: "28",
};

export const CUSTODY_LOG_FORM_TITLE = "บันทึกการควบคุมผู้ต้องหา";
export const CUSTODY_LOG_TEMPLATE_TITLE = "บันทึกควบคุม";

export const SMART_POLICE_CUSTODY_LOG_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "custody-log",
  title: CUSTODY_LOG_TEMPLATE_TITLE,
  kind: "custody-log",
  blankFormId: "29",
};

export const BAIL_BOND_FORM_TITLE = "คำร้องขอประกัน";
export const BAIL_BOND_FORM_TITLE_P2_APPOINT = "กำหนดวันเวลาให้ส่งผู้ต้องหาต่อผู้ให้ประกัน";
export const BAIL_BOND_FORM_TITLE_P2_ASSET =
  "บัญชีทรัพย์สินของผู้ประกันซึ่งผู้ประกันรับรองว่าเป็นกรรมสิทธิ์ ของผู้ประกันแต่เพียงผู้เดียว และไม่อยู่ในภาระติดพันใด ๆ";
export const BAIL_BOND_TEMPLATE_TITLE = "สัญญาประกัน";

export const SMART_POLICE_BAIL_BOND_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "bail-bond",
  title: BAIL_BOND_TEMPLATE_TITLE,
  kind: "bail-bond",
  blankFormId: "30",
};

export const INVESTIGATE_NOTICE_FORM_TITLE = "บันทึกข้อความ";
export const INVESTIGATE_NOTICE_TEMPLATE_TITLE = "หนังสือแจ้งสืบสวน";

export const SMART_POLICE_INVESTIGATE_NOTICE_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "investigate-notice",
  title: INVESTIGATE_NOTICE_TEMPLATE_TITLE,
  kind: "investigate-notice",
  blankFormId: "31",
};

export const OFFICIAL_MEMO_FORM_TITLE = "บันทึกข้อความ";
export const OFFICIAL_MEMO_TEMPLATE_TITLE = "บันทึกข้อความ";

export const SMART_POLICE_OFFICIAL_MEMO_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "official-memo",
  title: OFFICIAL_MEMO_TEMPLATE_TITLE,
  kind: "official-memo",
  blankFormId: "official-memo",
};

export const WITNESS_SUMMONS_FORM_TITLE = "หมายเรียกพยาน";
export const WITNESS_SUMMONS_TEMPLATE_TITLE = "หมายเรียกพยาน";

export const SMART_POLICE_WITNESS_SUMMONS_TEMPLATE: OfficialFormTemplateMeta = {
  slug: "witness-summons",
  title: WITNESS_SUMMONS_TEMPLATE_TITLE,
  kind: "witness-summons",
  blankFormId: "35",
};

export const SMART_POLICE_OFFICIAL_FORM_TEMPLATES: OfficialFormTemplateMeta[] = [
  ...SMART_POLICE_STATEMENT_TEMPLATES.map((t) => ({
    slug: t.slug,
    title: t.title,
    kind: "statement" as const,
    blankFormId: t.blankFormId,
  })),
  ...SMART_POLICE_PROPERTY_LIST_TEMPLATES,
  SMART_POLICE_EXHIBIT_LIST_TEMPLATE,
  SMART_POLICE_SCENE_MAP_TEMPLATE,
  SMART_POLICE_WITHDRAW_COMPLAINT_TEMPLATE,
  SMART_POLICE_COMPENSATION_SETTLEMENT_TEMPLATE,
  SMART_POLICE_VICTIM_RIGHTS_TEMPLATE,
  SMART_POLICE_ORAL_PLEA_TEMPLATE,
  SMART_POLICE_ARREST_RECORD_TEMPLATE,
  SMART_POLICE_CHARGE_NOTICE_TEMPLATE,
  SMART_POLICE_RIGHTS_NOTICE_TEMPLATE,
  SMART_POLICE_CASE_PHOTO_TEMPLATE,
  SMART_POLICE_PHOTO_ID_TEMPLATE,
  SMART_POLICE_LINEUP_ID_TEMPLATE,
  SMART_POLICE_CASE_COVER_TEMPLATE,
  SMART_POLICE_INQUIRY_REPORT_TEMPLATE,
  SMART_POLICE_INQUIRY_MEMO_TEMPLATE,
  SMART_POLICE_INQUIRY_DOCKET_TEMPLATE,
  SMART_POLICE_SCENE_INSPECT_TEMPLATE,
  SMART_POLICE_CASE_PROGRESS_TEMPLATE,
  SMART_POLICE_INJURY_REFERRAL_TEMPLATE,
  SMART_POLICE_FORENSIC_REQUEST_TEMPLATE,
  SMART_POLICE_CUSTODY_LOG_TEMPLATE,
  SMART_POLICE_BAIL_BOND_TEMPLATE,
  SMART_POLICE_INVESTIGATE_NOTICE_TEMPLATE,
  SMART_POLICE_OFFICIAL_MEMO_TEMPLATE,
  SMART_POLICE_WITNESS_SUMMONS_TEMPLATE,
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

export function isExhibitListFormSlug(slug: string): slug is ExhibitListTemplateSlug {
  return slug === "exhibit-list";
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

export function isArrestRecordFormSlug(slug: string): slug is ArrestRecordTemplateSlug {
  return slug === "arrest-record";
}

export function isChargeNoticeFormSlug(slug: string): slug is ChargeNoticeTemplateSlug {
  return slug === "charge-notice";
}

export function isRightsNoticeFormSlug(slug: string): slug is RightsNoticeTemplateSlug {
  return slug === "rights-notice";
}

export function isCasePhotoFormSlug(slug: string): slug is CasePhotoTemplateSlug {
  return slug === "case-photo";
}

export function isPhotoIdFormSlug(slug: string): slug is PhotoIdTemplateSlug {
  return slug === "photo-id";
}

export function isLineupIdFormSlug(slug: string): slug is LineupIdTemplateSlug {
  return slug === "lineup-id";
}

export function isCaseCoverFormSlug(slug: string): slug is CaseCoverTemplateSlug {
  return slug === "case-cover";
}

export function isInquiryReportFormSlug(slug: string): slug is InquiryReportTemplateSlug {
  return slug === "inquiry-report";
}

export function isInquiryMemoFormSlug(slug: string): slug is InquiryMemoTemplateSlug {
  return slug === "inquiry-memo";
}

export function isInquiryDocketFormSlug(slug: string): slug is InquiryDocketTemplateSlug {
  return slug === "inquiry-docket";
}

export function isSceneInspectFormSlug(slug: string): slug is SceneInspectTemplateSlug {
  return slug === "scene-inspect";
}

export function isCaseProgressFormSlug(slug: string): slug is CaseProgressTemplateSlug {
  return slug === "case-progress";
}

export function isInjuryReferralFormSlug(slug: string): slug is InjuryReferralTemplateSlug {
  return slug === "injury-referral";
}

export function isForensicRequestFormSlug(slug: string): slug is ForensicRequestTemplateSlug {
  return slug === "forensic-request";
}

export function isCustodyLogFormSlug(slug: string): slug is CustodyLogTemplateSlug {
  return slug === "custody-log";
}

export function isBailBondFormSlug(slug: string): slug is BailBondTemplateSlug {
  return slug === "bail-bond";
}

export function isInvestigateNoticeFormSlug(slug: string): slug is InvestigateNoticeTemplateSlug {
  return slug === "investigate-notice";
}

export function isOfficialMemoFormSlug(slug: string): slug is OfficialMemoTemplateSlug {
  return slug === "official-memo";
}

export function isWitnessSummonsFormSlug(slug: string): slug is WitnessSummonsTemplateSlug {
  return slug === "witness-summons";
}
