import type { SmartPoliceCustodyMode } from "@/generated/prisma/enums";
import type { OfficialFormTemplateSlug } from "@/lib/smart-police/form-templates/official-form-catalog";

/** ค่าใน SmartPoliceCase.caseType เป็น string อิสระ (ดู SMART_POLICE_CASE_TYPES) */
export type SmartPoliceCasePresetType = "คดีจราจร" | "คดียาเสพติด" | "คดีทรัพย์" | "คดีอาญา";

/**
 * แม่แบบตั้งต้นคดี (case preset)
 *
 * ที่มาของข้อมูล: ฐานคดีเก่า D:\Data\14-พฤศจิกายน-2555 (48 คดี / 332 เอกสาร)
 *   - chargeText / lawRefs  = ข้อความ "ฐานความผิด" ที่พนักงานสอบสวนใช้จริงในเอกสารปกสำนวน
 *   - formSlugs             = ชุดเอกสารที่คดีประเภทนั้นมีจริง (นับจาก docKinds ต่อประเภท)
 *   - defaultCustodyMode    = ดูจากว่าคดีนั้นมีคำร้องฝากขัง / มอบตัว หรือไม่
 *
 * ตัวเลขในวงเล็บ = จำนวนคดีในฐานข้อมูลเก่าที่มีเอกสารชนิดนั้น
 */

export type SmartPoliceCasePreset = {
  /** key คงที่ ใช้ผูกกับ seed/DB */
  key: string;
  caseType: SmartPoliceCasePresetType;
  /** ชื่อข้อหาตั้งต้น (ข้อความยาวที่ใช้บนเอกสาร) */
  chargeText: string;
  /** ฐานความผิด/กฎหมายอ้างอิง */
  lawRefs: string;
  defaultCustodyMode: SmartPoliceCustodyMode;
  /** ชุดเอกสารที่คดีประเภทนี้ต้องทำ (เรียงตามลำดับงานจริง) */
  formSlugs: OfficialFormTemplateSlug[];
  /** ฟิลด์ที่เติมล่วงหน้าให้ฟอร์ม (ค่าคงที่ของประเภทคดี) */
  starterFields: Record<string, string>;
  /** ลำดับการแสดงในหน้าเลือกประเภทคดี */
  sortOrder: number;
};

/** เอกสารแกนกลางที่มีในทุกคดี (จากฐานเก่า: case-cover 11, inquiry-report 8, ...) */
const CORE_FORMS: OfficialFormTemplateSlug[] = [
  "case-cover",
  "scene-inspect",
  "case-photo",
  "statement-complainant",
  "statement-witness",
  "statement-suspect",
  "suspect-summons",
  "witness-summons",
  "inquiry-memo",
  "inquiry-docket",
  "inquiry-report",
];

/** คดีที่จับกุมตัวผู้ต้องหาได้ — เพิ่มชุดควบคุมตัว/ฝากขัง */
const CUSTODY_FORMS: OfficialFormTemplateSlug[] = [
  "arrest-record",
  "charge-notice",
  "rights-notice",
  "custody-log",
  "detention-request",
  "detention-round2",
  "bail-bond",
];

export const SMART_POLICE_CASE_PRESETS: SmartPoliceCasePreset[] = [
  {
    key: "traffic",
    caseType: "คดีจราจร",
    chargeText:
      "ขับรถโดยประมาท เป็นเหตุให้ทรัพย์สินของผู้อื่นได้รับความเสียหาย",
    lawRefs:
      "พระราชบัญญัติจราจรทางบก พ.ศ. 2522 มาตรา 43, 52, 53, 157",
    defaultCustodyMode: "SURRENDER_RELEASE",
    formSlugs: [
      ...CORE_FORMS,
      "scene-map",
      "forensic-request",
      "injury-referral",
      "compensation-settlement",
      "arrest-record",
      "charge-notice",
      "bail-bond",
      "official-memo",
    ],
    starterFields: {
      "case.categoryLabel": "คดีจราจร",
      "scene.inspect.roadSurface": "",
      "scene.inspect.weather": "",
      "statement.complainant.preamble": "เหตุเกิดจากการใช้รถใช้ถนน",
    },
    sortOrder: 10,
  },
  {
    key: "narcotics",
    caseType: "คดียาเสพติด",
    chargeText:
      "มียาเสพติดให้โทษประเภท 1 (เมทแอมเฟตามีน) ไว้ในครอบครองโดยผิดกฎหมาย และเสพยาเสพติดให้โทษ",
    lawRefs:
      "พระราชบัญญัติยาเสพติดให้โทษ พ.ศ. 2522 มาตรา 15, 57, 67, 91/1",
    defaultCustodyMode: "DETAIN_REMAND",
    formSlugs: [
      ...CORE_FORMS,
      ...CUSTODY_FORMS,
      "forensic-request",
      "exhibit-list",
      "case-progress",
      "official-memo",
    ],
    starterFields: {
      "case.categoryLabel": "คดียาเสพติด",
      "forensic.request.type": "ตรวจปัสสาวะผู้ต้องหา",
      "exhibit.list.year": "",
      "case.progress.officerNote": "อยู่ระหว่างรอผลตรวจพิสูจน์",
    },
    sortOrder: 20,
  },
  {
    key: "property",
    caseType: "คดีทรัพย์",
    chargeText: "ลักทรัพย์ในเวลากลางคืน",
    lawRefs: "ประมวลกฎหมายอาญา มาตรา 334, 335",
    defaultCustodyMode: "DETAIN_REMAND",
    formSlugs: [
      ...CORE_FORMS,
      ...CUSTODY_FORMS,
      "scene-map",
      "property-damaged",
      "property-damaged-recovered",
      "property-damaged-unrecovered",
      "exhibit-list",
      "forensic-request",
      "arrest-warrant-request",
      "arrest-warrant",
    ],
    starterFields: {
      "case.categoryLabel": "คดีทรัพย์",
      "property.damaged.preamble": "ทรัพย์ที่ถูกประทุษร้ายในคดีนี้",
      "scene.inspect.wall": "",
      "scene.inspect.door": "",
    },
    sortOrder: 30,
  },
  {
    key: "violent",
    caseType: "คดีอาญา",
    chargeText: "ทำร้ายร่างกายผู้อื่นจนเป็นเหตุให้เกิดอันตรายแก่กายหรือจิตใจ",
    lawRefs: "ประมวลกฎหมายอาญา มาตรา 295",
    defaultCustodyMode: "DETAIN_REMAND",
    formSlugs: [
      ...CORE_FORMS,
      ...CUSTODY_FORMS,
      "scene-map",
      "injury-referral",
      "forensic-request",
      "compensation-settlement",
      "investigate-notice",
    ],
    starterFields: {
      "case.categoryLabel": "คดีชีวิตร่างกาย",
      "forensic.request.type": "ตรวจชันสูตรบาดแผลผู้บาดเจ็บ",
      "scene.inspect.bodyMark": "",
    },
    sortOrder: 40,
  },
  {
    key: "weapon",
    caseType: "คดีอาญา",
    chargeText:
      "มีอาวุธปืนและเครื่องกระสุนปืนไว้ในครอบครองโดยไม่ได้รับอนุญาต และพาอาวุธปืนไปในเมือง หมู่บ้าน หรือทางสาธารณะโดยไม่มีเหตุสมควร",
    lawRefs:
      "พระราชบัญญัติอาวุธปืน เครื่องกระสุนปืน วัตถุระเบิด ดอกไม้เพลิง และสิ่งเทียมอาวุธปืน พ.ศ. 2490 มาตรา 7, 8, 72, 8 ทวิ",
    defaultCustodyMode: "DETAIN_REMAND",
    formSlugs: [
      ...CORE_FORMS,
      ...CUSTODY_FORMS,
      "forensic-request",
      "exhibit-list",
      "photo-id",
      "lineup-id",
    ],
    starterFields: {
      "case.categoryLabel": "คดีอาวุธปืน",
      "forensic.request.type": "ส่งอาวุธปืนและเครื่องกระสุนปืนตรวจ",
      "exhibit.list.itemType": "อาวุธปืน เครื่องกระสุน",
    },
    sortOrder: 50,
  },
  {
    key: "juvenile",
    caseType: "คดีอาญา",
    chargeText: "กระทำความผิดในขณะมีอายุไม่เกิน 18 ปี บริบูรณ์",
    lawRefs:
      "พระราชบัญญัติศาลเยาวชนและครอบครัวและวิธีพิจารณาคดีเยาวชนและครอบครัว พ.ศ. 2553",
    defaultCustodyMode: "SURRENDER_DETAIN",
    formSlugs: [
      ...CORE_FORMS,
      ...CUSTODY_FORMS,
      "case-progress",
      "official-memo",
      "compensation-settlement",
    ],
    starterFields: {
      "case.categoryLabel": "คดีเด็กและเยาวชน",
      "case.courtType": "เยาวชน",
      "case.progress.officerNote": "ประสานสถานพินิจและคุ้มครองเด็กและเยาวชน",
    },
    sortOrder: 60,
  },
];

export function casePresetsForType(
  caseType: SmartPoliceCasePresetType,
): SmartPoliceCasePreset[] {
  return SMART_POLICE_CASE_PRESETS.filter((p) => p.caseType === caseType).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

export function casePresetByKey(key: string): SmartPoliceCasePreset | undefined {
  return SMART_POLICE_CASE_PRESETS.find((p) => p.key === key);
}

/** ประเภทคดีที่มีแม่แบบตั้งต้น (unique, เรียงตาม sortOrder ของ preset แรก) */
export function caseTypesWithPresets(): SmartPoliceCasePresetType[] {
  const seen = new Set<SmartPoliceCasePresetType>();
  const out: SmartPoliceCasePresetType[] = [];
  for (const p of [...SMART_POLICE_CASE_PRESETS].sort((a, b) => a.sortOrder - b.sortOrder)) {
    if (seen.has(p.caseType)) continue;
    seen.add(p.caseType);
    out.push(p.caseType);
  }
  return out;
}
