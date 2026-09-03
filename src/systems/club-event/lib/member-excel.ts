import { parseCsvTable } from "@/lib/attendance/roster-import";
import type { ClubMemberCustomField } from "@/systems/club-event/lib/mappers";

function decodeSpreadsheetCellValue(raw: string): string {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .trim();
}

function parseClubMemberSpreadsheetMlTable(xml: string): string[][] {
  const namedWs =
    /<Worksheet[^>]*ss:Name="สมาชิกชมรม"[^>]*>([\s\S]*?)<\/Worksheet>/i.exec(xml) ??
    /<Worksheet[^>]*>([\s\S]*?)<\/Worksheet>/i.exec(xml);
  const wsBody = namedWs?.[1] ?? xml;
  const table = /<Table>([\s\S]*?)<\/Table>/i.exec(wsBody);
  const scope = table?.[1] ?? wsBody;
  const rows: string[][] = [];
  const rowRe = /<Row[^>]*>([\s\S]*?)<\/Row>/gi;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRe.exec(scope)) !== null) {
    const rowXml = rowMatch[1] ?? "";
    const cells: string[] = [];
    const cellRe = /<Cell([^>]*)>([\s\S]*?)<\/Cell>/gi;
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRe.exec(rowXml)) !== null) {
      const attrs = cellMatch[1] ?? "";
      const inner = cellMatch[2] ?? "";
      const indexMatch = /ss:Index="(\d+)"/i.exec(attrs);
      if (indexMatch) {
        const target = Number(indexMatch[1]) - 1;
        while (cells.length < target) cells.push("");
      }
      const dataMatch = /<Data[^>]*>([\s\S]*?)<\/Data>/i.exec(inner);
      cells.push(decodeSpreadsheetCellValue(dataMatch?.[1] ?? ""));
    }
    if (cells.some((c) => c.trim() !== "")) rows.push(cells);
  }
  return rows;
}

export const CLUB_EVENT_MEMBER_GENDER_OPTIONS = [
  { value: "", label: "ไม่ระบุ" },
  { value: "MALE", label: "ชาย" },
  { value: "FEMALE", label: "หญิง" },
  { value: "OTHER", label: "อื่นๆ" },
] as const;

export type ClubEventMemberGender = (typeof CLUB_EVENT_MEMBER_GENDER_OPTIONS)[number]["value"];

export function clubEventMemberGenderLabel(gender: string | null | undefined): string {
  const g = (gender ?? "").trim().toUpperCase();
  if (g === "MALE" || g === "ชาย") return "ชาย";
  if (g === "FEMALE" || g === "หญิง") return "หญิง";
  if (g === "OTHER" || g === "อื่นๆ" || g === "อื่น") return "อื่นๆ";
  return "ไม่ระบุ";
}

export function normalizeClubEventMemberGender(raw: string | null | undefined): ClubEventMemberGender {
  const t = (raw ?? "").trim().toLowerCase();
  if (!t) return "";
  if (t === "male" || t === "m" || t === "ชาย" || t === "ช") return "MALE";
  if (t === "female" || t === "f" || t === "หญิง" || t === "ญ") return "FEMALE";
  if (t === "other" || t === "อื่นๆ" || t === "อื่น" || t === "o") return "OTHER";
  if (t === "male" || t === "female" || t === "other") return t.toUpperCase() as ClubEventMemberGender;
  const u = (raw ?? "").trim().toUpperCase();
  if (u === "MALE" || u === "FEMALE" || u === "OTHER") return u;
  return "";
}

export function composeClubEventMemberDisplayName(firstName: string, lastName: string, fallback = ""): string {
  const full = `${firstName.trim()} ${lastName.trim()}`.trim();
  return (full || fallback).slice(0, 160);
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cell(value: string): string {
  return `<Cell><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`;
}

function row(cells: string[]): string {
  return `<Row>${cells.map((v) => cell(v)).join("")}</Row>`;
}

/** คอลัมน์มาตรฐานของแบบฟอร์มสมาชิก */
export const CLUB_EVENT_MEMBER_EXCEL_HEADERS = [
  "ชื่อ*",
  "นามสกุล*",
  "ชื่อเล่น",
  "เพศ",
  "โทรศัพท์",
  "ตำแหน่ง",
  "อีเมล",
  "โซเชียล",
  "รหัสสมาชิก",
  "ยินยอมเก็บข้อมูล",
  "เปิดใช้งาน",
] as const;

export type ClubEventMemberExcelRow = {
  firstName: string;
  lastName: string;
  nickname: string;
  gender: ClubEventMemberGender;
  phone: string;
  position: string;
  email: string;
  social: string;
  memberCode: string;
  dataConsent: boolean;
  isActive: boolean;
  customFields: ClubMemberCustomField[];
};

type StdCol =
  | "firstName"
  | "lastName"
  | "nickname"
  | "gender"
  | "phone"
  | "position"
  | "email"
  | "social"
  | "memberCode"
  | "dataConsent"
  | "isActive";

const HEADER_ALIASES: Record<StdCol, string[]> = {
  firstName: ["ชื่อ", "firstname", "first_name", "ชื่อจริง"],
  lastName: ["นามสกุล", "lastname", "last_name", "สกุล"],
  nickname: ["ชื่อเล่น", "nickname", "nick"],
  gender: ["เพศ", "gender", "sex"],
  phone: ["โทรศัพท์", "เบอร์", "เบอร์โทร", "phone", "tel", "mobile"],
  position: ["ตำแหน่ง", "position", "role", "role_title"],
  email: ["อีเมล", "email", "e-mail"],
  social: ["โซเชียล", "social", "line", "facebook", "ig"],
  memberCode: ["รหัสสมาชิก", "membercode", "member_code", "รหัส"],
  dataConsent: ["ยินยอมเก็บข้อมูล", "ยินยอม", "data_consent", "consent", "pdpa"],
  isActive: ["เปิดใช้งาน", "สถานะ", "active", "is_active"],
};

function normalizeHeader(h: string): string {
  return h
    .trim()
    .replace(/\*+$/, "")
    .replace(/\([^)]*\)/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function matchStdColumn(header: string): StdCol | null {
  const n = normalizeHeader(header);
  if (!n) return null;
  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.some((a) => normalizeHeader(a) === n)) return key as StdCol;
  }
  return null;
}

function parseYesNo(raw: string, defaultYes = false): boolean {
  const t = raw.trim().toLowerCase();
  if (!t) return defaultYes;
  if (["ใช่", "yes", "y", "1", "true", "ยินยอม", "เปิด", "active"].includes(t)) return true;
  if (["ไม่", "no", "n", "0", "false", "ไม่ยินยอม", "ปิด", "inactive"].includes(t)) return false;
  return defaultYes;
}

function slugKey(label: string, index: number): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || `custom_${index + 1}`;
}

export function buildClubEventMemberImportTemplateXls(customFieldLabels: string[] = []): string {
  const extra = customFieldLabels.map((l) => l.trim()).filter(Boolean).slice(0, 12);
  const headers = [...CLUB_EVENT_MEMBER_EXCEL_HEADERS, ...extra];
  const examples: string[][] = [
    ["สมชาย", "ใจดี", "ต้น", "ชาย", "0812345678", "สมาชิก", "somchai@example.com", "@somchai", "M001", "ใช่", "ใช่", ...extra.map(() => "")],
    ["สมหญิง", "รักงาน", "มิ้น", "หญิง", "0898765432", "กรรมการ", "somying@example.com", "line:somying", "M002", "ใช่", "ใช่", ...extra.map(() => "")],
  ];
  const note =
    "กรอกใต้หัวคอลัมน์ · * จำเป็น · เพศ: ชาย/หญิง/อื่นๆ · ยินยอม/เปิดใช้งาน: ใช่ หรือ ไม่ · คอลัมน์พิเศษหลัง «เปิดใช้งาน» = ฟิลด์เพิ่มเติม · ลบแถวตัวอย่างก่อนนำเข้า";

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#ECEBFF" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Note"><Font ss:Italic="1" ss:Color="#66638C"/></Style>
 </Styles>
 <Worksheet ss:Name="สมาชิกชมรม">
  <Table>
   <Row ss:StyleID="Note"><Cell ss:MergeAcross="${Math.max(headers.length - 1, 0)}"><Data ss:Type="String">${xmlEscape(note)}</Data></Cell></Row>
   <Row ss:StyleID="Header">${headers.map((h) => cell(h)).join("")}</Row>
   ${examples.map((ex) => row(ex.slice(0, headers.length))).join("\n   ")}
  </Table>
 </Worksheet>
 <Worksheet ss:Name="คำอธิบาย">
  <Table>
   ${row(["คอลัมน์", "รายละเอียด"])}
   ${row(["ชื่อ*", "ชื่อจริง"])}
   ${row(["นามสกุล*", "นามสกุล"])}
   ${row(["ชื่อเล่น", "ชื่อเล่น (ถ้ามี)"])}
   ${row(["เพศ", "ชาย / หญิง / อื่นๆ / ว่าง"])}
   ${row(["โทรศัพท์", "เบอร์ติดต่อ"])}
   ${row(["ตำแหน่ง", "ตำแหน่งในชมรม"])}
   ${row(["อีเมล", "อีเมล"])}
   ${row(["โซเชียล", "LINE / Facebook / Instagram ฯลฯ"])}
   ${row(["รหัสสมาชิก", "รหัสไม่ซ้ำ — ถ้ามีและซ้ำจะอัปเดตแถวเดิม"])}
   ${row(["ยินยอมเก็บข้อมูล", "ใช่ หรือ ไม่"])}
   ${row(["เปิดใช้งาน", "ใช่ หรือ ไม่"])}
   ${row(["คอลัมน์พิเศษ", "ชื่อหัวคอลัมน์ = ป้ายฟิลด์เพิ่ม · ค่าในแถว = ค่าของสมาชิก"])}
  </Table>
 </Worksheet>
</Workbook>`;
}

export function buildClubEventMemberExportXls(
  members: Array<{
    firstName: string;
    lastName: string;
    nickname: string;
    gender: string;
    phone: string;
    position: string;
    email: string;
    social: string;
    memberCode: string;
    dataConsent: boolean;
    isActive: boolean;
    customFields: ClubMemberCustomField[];
  }>,
): string {
  const customLabels: string[] = [];
  for (const m of members) {
    for (const cf of m.customFields) {
      const label = cf.label.trim();
      if (label && !customLabels.includes(label)) customLabels.push(label);
    }
  }
  const headers = [...CLUB_EVENT_MEMBER_EXCEL_HEADERS, ...customLabels];
  const body = members.map((m) => {
    const map = new Map(m.customFields.map((cf) => [cf.label.trim(), cf.value]));
    return [
      m.firstName,
      m.lastName,
      m.nickname,
      clubEventMemberGenderLabel(m.gender),
      m.phone,
      m.position,
      m.email,
      m.social,
      m.memberCode,
      m.dataConsent ? "ใช่" : "ไม่",
      m.isActive ? "ใช่" : "ไม่",
      ...customLabels.map((l) => map.get(l) ?? ""),
    ];
  });

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="สมาชิกชมรม">
  <Table>
   <Row>${headers.map((h) => cell(h)).join("")}</Row>
   ${body.map((r) => row(r)).join("\n   ")}
  </Table>
 </Worksheet>
</Workbook>`;
}

function findHeaderRowIndex(table: string[][]): number {
  const limit = Math.min(table.length, 25);
  for (let i = 0; i < limit; i++) {
    const map = buildColumnMap(table[i] ?? []);
    if (map.std.firstName != null) return i;
  }
  return -1;
}

function buildColumnMap(headerRow: string[]): {
  std: Partial<Record<StdCol, number>>;
  custom: Array<{ index: number; label: string }>;
} {
  const std: Partial<Record<StdCol, number>> = {};
  const custom: Array<{ index: number; label: string }> = [];
  headerRow.forEach((h, i) => {
    const label = String(h ?? "").trim();
    if (!label) return;
    const key = matchStdColumn(label);
    if (key != null && std[key] == null) {
      std[key] = i;
      return;
    }
    if (key == null) custom.push({ index: i, label: label.replace(/\*+$/, "").trim() });
  });
  return { std, custom };
}

export type ClubEventMemberImportResult = {
  rows: ClubEventMemberExcelRow[];
  errors: string[];
};

export function parseClubEventMemberImportTable(table: string[][]): ClubEventMemberImportResult {
  const errors: string[] = [];
  const rows: ClubEventMemberExcelRow[] = [];
  if (table.length === 0) return { rows, errors: ["ไฟล์ว่าง"] };

  const headerRowIndex = findHeaderRowIndex(table);
  if (headerRowIndex < 0) {
    return { rows, errors: ["หัวตารางต้องมีคอลัมน์ «ชื่อ» — ดาวน์โหลดแบบฟอร์ม Excel แล้วกรอกตามคอลัมน์"] };
  }

  const headerRow = (table[headerRowIndex] ?? []).map((h) => String(h ?? "").trim());
  const { std, custom } = buildColumnMap(headerRow);

  for (let ri = headerRowIndex + 1; ri < table.length; ri++) {
    const line = table[ri] ?? [];
    const firstName = String(line[std.firstName!] ?? "").trim();
    const lastName = std.lastName != null ? String(line[std.lastName] ?? "").trim() : "";
    if (!firstName && !lastName) continue;
    if (/^ตัวอย่าง|^example/i.test(firstName)) continue;
    if (firstName === "สมชาย" && lastName === "ใจดี") continue;
    if (firstName === "สมหญิง" && lastName === "รักงาน") continue;

    const lineNo = ri + 1;
    if (!firstName) {
      errors.push(`แถว ${lineNo}: ไม่มีชื่อ`);
      continue;
    }

    const customFields: ClubMemberCustomField[] = custom
      .map((c, idx) => ({
        key: slugKey(c.label, idx),
        label: c.label.slice(0, 80),
        value: String(line[c.index] ?? "").trim().slice(0, 500),
      }))
      .filter((cf) => cf.label.length > 0);

    rows.push({
      firstName: firstName.slice(0, 80),
      lastName: lastName.slice(0, 80),
      nickname: std.nickname != null ? String(line[std.nickname] ?? "").trim().slice(0, 80) : "",
      gender: normalizeClubEventMemberGender(
        std.gender != null ? String(line[std.gender] ?? "") : "",
      ),
      phone: std.phone != null ? String(line[std.phone] ?? "").replace(/\D/g, "").slice(0, 32) : "",
      position: std.position != null ? String(line[std.position] ?? "").trim().slice(0, 120) : "",
      email: std.email != null ? String(line[std.email] ?? "").trim().slice(0, 200) : "",
      social: std.social != null ? String(line[std.social] ?? "").trim().slice(0, 300) : "",
      memberCode: std.memberCode != null ? String(line[std.memberCode] ?? "").trim().slice(0, 64) : "",
      dataConsent: parseYesNo(std.dataConsent != null ? String(line[std.dataConsent] ?? "") : "", false),
      isActive: parseYesNo(std.isActive != null ? String(line[std.isActive] ?? "") : "", true),
      customFields,
    });
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push("ไม่พบแถวข้อมูล — กรอกชื่ออย่างน้อย 1 แถว");
  }
  return { rows, errors };
}

function isBinaryXls(buf: Buffer): boolean {
  return buf.length >= 4 && buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0;
}

function isXlsxZip(buf: Buffer): boolean {
  return buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b;
}

export function parseClubEventMemberImportFile(buf: Buffer, filename: string): ClubEventMemberImportResult {
  const lower = filename.toLowerCase();
  if (isXlsxZip(buf) || lower.endsWith(".xlsx")) {
    return {
      rows: [],
      errors: [
        "ไฟล์ .xlsx ยังไม่รองรับ — ใช้ไฟล์ .xls จากปุ่มดาวน์โหลดแบบฟอร์ม โดยไม่ต้อง Save As เป็นรูปแบบอื่น หรือส่งออกเป็น .csv",
      ],
    };
  }
  if (isBinaryXls(buf)) {
    return {
      rows: [],
      errors: ["ไฟล์ Excel แบบไบนารีเก่าไม่รองรับ — ดาวน์โหลดแบบฟอร์ม .xls จากระบบแล้วกรอก"],
    };
  }
  const text = buf.toString("utf8");
  const table =
    text.includes("<Workbook") || text.includes("<Worksheet")
      ? parseClubMemberSpreadsheetMlTable(text)
      : parseCsvTable(text);
  return parseClubEventMemberImportTable(table);
}
