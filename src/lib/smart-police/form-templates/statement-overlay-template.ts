/**
 * แม่แบบคำให้การผู้กล่าวหา — PNG ราชการ + ช่องพิมพ์ (มม. บน A4 210×297)
 * ช่องเตี้ย · ระยะบรรทัดคำให้การ 7.25 มม. — ตัวอักษรอยู่บนจุดไข่ปลา ไม่คร่อมแถว
 */

import type { StatementHeaderFields } from "@/lib/smart-police/form-templates/statement-types";

export const STATEMENT_PAGE_W_MM = 210;
export const STATEMENT_PAGE_H_MM = 297;

export const OVERLAY_FIELD_H = 3.8;
export const OVERLAY_STMT_LINE_H = 7.25;
export const OVERLAY_FONT_PT = "10pt";
export const OVERLAY_STMT_FONT_PT = "11pt";

export type OverlayFieldKey = keyof StatementHeaderFields | "statementBody";

export type OverlayField = {
  key: OverlayFieldKey;
  left: number;
  top: number;
  width: number;
  height: number;
  multiline?: boolean;
  page?: "first" | "cont";
};

export const STATEMENT_COMPLAINANT_OVERLAY_FIELDS: OverlayField[] = [
  // —— แถบซ้าย ——
  { key: "partyName", left: 7, top: 81.2, width: 37, height: OVERLAY_FIELD_H },
  { key: "partyRoleLabel", left: 16, top: 88.8, width: 28, height: OVERLAY_FIELD_H },
  { key: "partyPhone", left: 7, top: 101.2, width: 37, height: OVERLAY_FIELD_H },
  { key: "partyIdCard", left: 7, top: 114.8, width: 37, height: OVERLAY_FIELD_H },
  { key: "idIssuedOn", left: 7, top: 126.8, width: 37, height: OVERLAY_FIELD_H },
  { key: "idExpiresOn", left: 7, top: 135.0, width: 37, height: OVERLAY_FIELD_H },
  { key: "idIssuedAt", left: 7, top: 143.2, width: 37, height: OVERLAY_FIELD_H },

  // —— สถานี / วันที่ (ขยับลงให้ชิดจุดไข่ปลาแถวจังหวัด) ——
  { key: "stationName", left: 80, top: 58.8, width: 36, height: OVERLAY_FIELD_H },
  { key: "district", left: 130, top: 58.8, width: 26, height: OVERLAY_FIELD_H },
  { key: "province", left: 170, top: 58.8, width: 26, height: OVERLAY_FIELD_H },
  { key: "dayThai", left: 70, top: 66.2, width: 20, height: OVERLAY_FIELD_H },
  { key: "monthThai", left: 108, top: 66.2, width: 34, height: OVERLAY_FIELD_H },
  { key: "yearThai", left: 160, top: 66.2, width: 26, height: OVERLAY_FIELD_H },

  // —— คดีระหว่าง ——
  { key: "complainantLine", left: 80, top: 72.8, width: 84, height: OVERLAY_FIELD_H },
  { key: "suspectLine", left: 80, top: 80.6, width: 84, height: OVERLAY_FIELD_H },

  // —— ต่อหน้า / สอบสวน ——
  { key: "investigator", left: 74, top: 90.4, width: 120, height: OVERLAY_FIELD_H },
  { key: "commanderLine", left: 52, top: 97.6, width: 142, height: OVERLAY_FIELD_H },
  { key: "interviewPlace", left: 80, top: 105.2, width: 114, height: OVERLAY_FIELD_H },

  // —— บุคคล ——
  { key: "partyName", left: 64, top: 113.6, width: 86, height: OVERLAY_FIELD_H },
  { key: "partyAge", left: 170, top: 113.6, width: 14, height: OVERLAY_FIELD_H },
  { key: "ethnicity", left: 74, top: 121.2, width: 26, height: OVERLAY_FIELD_H },
  { key: "partyNationality", left: 120, top: 121.2, width: 26, height: OVERLAY_FIELD_H },
  { key: "religion", left: 166, top: 121.2, width: 26, height: OVERLAY_FIELD_H },
  { key: "partyOccupation", left: 70, top: 128.6, width: 124, height: OVERLAY_FIELD_H },

  // —— ที่อยู่ ——
  { key: "houseNo", left: 90, top: 144.2, width: 26, height: OVERLAY_FIELD_H },
  { key: "moo", left: 132, top: 144.2, width: 14, height: OVERLAY_FIELD_H },
  { key: "tambon", left: 170, top: 144.2, width: 26, height: OVERLAY_FIELD_H },
  { key: "amphoe", left: 80, top: 151.4, width: 46, height: OVERLAY_FIELD_H },
  { key: "province", left: 150, top: 151.4, width: 46, height: OVERLAY_FIELD_H },
  { key: "villageHead", left: 94, top: 158.6, width: 40, height: OVERLAY_FIELD_H },
  { key: "kamnan", left: 160, top: 158.6, width: 36, height: OVERLAY_FIELD_H },
  { key: "fatherName", left: 74, top: 165.6, width: 46, height: OVERLAY_FIELD_H },
  { key: "motherName", left: 150, top: 165.6, width: 46, height: OVERLAY_FIELD_H },
  { key: "relationshipNote", left: 122, top: 172.4, width: 74, height: OVERLAY_FIELD_H },

  // —— คำให้การ (บรรทัดจุด ≈ 7.25 มม.) ——
  {
    key: "statementBody",
    left: 51,
    top: 179.5,
    width: 144,
    height: 98,
    multiline: true,
  },
];

export const STATEMENT_CONTINUATION_OVERLAY_FIELDS: OverlayField[] = [
  { key: "partyName", left: 50, top: 17.5, width: 96, height: OVERLAY_FIELD_H },
  {
    key: "statementBody",
    left: 16,
    top: 30,
    width: 176,
    height: 250,
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
