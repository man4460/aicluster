/**
 * แม่แบบคำให้การผู้กล่าวหา — พื้นหลัง PNG ราชการจริง + พิกัดช่องพิมพ์ (มม. บน A4 210×297)
 * วัดจาก public/smart-police/statement-complainant-template.png (เส้นตั้งคั่น ≈ 47.3 มม.)
 */

import type { StatementHeaderFields } from "@/lib/smart-police/form-templates/statement-types";

export const STATEMENT_PAGE_W_MM = 210;
export const STATEMENT_PAGE_H_MM = 297;

export type OverlayFieldKey = keyof StatementHeaderFields | "statementBody";

export type OverlayField = {
  key: OverlayFieldKey;
  /** มม. จากขอบซ้าย/บนของหน้า A4 */
  left: number;
  top: number;
  width: number;
  height: number;
  multiline?: boolean;
  /** หน้า 0 = หน้าแรก · หน้าต่อใช้ชุดอื่น */
  page?: "first" | "cont";
};

/** หน้า 1 — ช่องว่างบนจุดไข่ปลา (ไม่ทับป้ายข้อความ) */
export const STATEMENT_COMPLAINANT_OVERLAY_FIELDS: OverlayField[] = [
  // —— แถบซ้าย ——
  { key: "partyName", left: 7, top: 82, width: 38, height: 5.5 },
  { key: "partyRoleLabel", left: 14, top: 90.5, width: 31, height: 5 },
  { key: "partyPhone", left: 7, top: 103, width: 38, height: 5.5 },
  { key: "partyIdCard", left: 7, top: 117, width: 38, height: 5.5 },
  { key: "idIssuedOn", left: 7, top: 129, width: 38, height: 5 },
  { key: "idExpiresOn", left: 7, top: 137.5, width: 38, height: 5 },
  { key: "idIssuedAt", left: 7, top: 146, width: 38, height: 5 },

  // —— สถานี / วันที่ (คอลัมน์ขวา) ——
  { key: "stationName", left: 78, top: 55.5, width: 38, height: 5 },
  { key: "district", left: 128, top: 55.5, width: 28, height: 5 },
  { key: "province", left: 168, top: 55.5, width: 28, height: 5 },
  { key: "dayThai", left: 70, top: 63.5, width: 22, height: 5 },
  { key: "monthThai", left: 108, top: 63.5, width: 36, height: 5 },
  { key: "yearThai", left: 160, top: 63.5, width: 28, height: 5 },

  // —— คดีระหว่าง ——
  { key: "complainantLine", left: 78, top: 74, width: 88, height: 5 },
  { key: "suspectLine", left: 78, top: 82, width: 88, height: 5 },

  // —— ต่อหน้า / สอบสวน ——
  { key: "investigator", left: 72, top: 92, width: 124, height: 5 },
  { key: "commanderLine", left: 52, top: 99.5, width: 144, height: 5 },
  { key: "interviewPlace", left: 78, top: 107, width: 118, height: 5 },

  // —— บุคคล ——
  { key: "partyName", left: 62, top: 115.5, width: 90, height: 5 },
  { key: "partyAge", left: 168, top: 115.5, width: 16, height: 5 },
  { key: "ethnicity", left: 72, top: 123.5, width: 28, height: 5 },
  { key: "partyNationality", left: 118, top: 123.5, width: 28, height: 5 },
  { key: "religion", left: 164, top: 123.5, width: 28, height: 5 },
  { key: "partyOccupation", left: 68, top: 131.5, width: 128, height: 5 },

  // —— ที่อยู่ ——
  { key: "houseNo", left: 88, top: 152, width: 28, height: 5 },
  { key: "moo", left: 130, top: 152, width: 16, height: 5 },
  { key: "tambon", left: 168, top: 152, width: 28, height: 5 },
  { key: "amphoe", left: 78, top: 159.5, width: 48, height: 5 },
  { key: "province", left: 148, top: 159.5, width: 48, height: 5 },
  { key: "villageHead", left: 92, top: 167, width: 42, height: 5 },
  { key: "kamnan", left: 158, top: 167, width: 38, height: 5 },
  { key: "fatherName", left: 72, top: 174.5, width: 48, height: 5 },
  { key: "motherName", left: 148, top: 174.5, width: 48, height: 5 },
  { key: "relationshipNote", left: 118, top: 182, width: 78, height: 5 },

  // —— ข้อความคำให้การ ——
  {
    key: "statementBody",
    left: 50,
    top: 198,
    width: 146,
    height: 78,
    multiline: true,
  },
];

export const STATEMENT_CONTINUATION_OVERLAY_FIELDS: OverlayField[] = [
  { key: "partyName", left: 48, top: 18, width: 100, height: 5.5 },
  {
    key: "statementBody",
    left: 18,
    top: 32,
    width: 174,
    height: 248,
    multiline: true,
    page: "cont",
  },
];

export const STATEMENT_COMPLAINANT_BG = "/smart-police/statement-complainant-template.png";
export const STATEMENT_CONTINUATION_BG = "/smart-police/statement-continuation-template.png";

export function mmBox(f: Pick<OverlayField, "left" | "top" | "width" | "height">) {
  return {
    left: `${f.left}mm`,
    top: `${f.top}mm`,
    width: `${f.width}mm`,
    height: `${f.height}mm`,
  };
}
