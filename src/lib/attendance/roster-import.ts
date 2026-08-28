export type AttendanceRosterImportRow = {
  displayName: string;
  phone: string;
  rosterShiftIndex: number;
  isActive: boolean;
  /** รหัสสาขาจากไฟล์ — ว่าง = ไม่ระบุสาขาประจำ */
  branchCode: string;
};

export type AttendanceRosterImportResult = {
  rows: AttendanceRosterImportRow[];
  errors: string[];
};

type RosterImportColumnKey = "displayName" | "phone" | "shift" | "active" | "branch";

const HEADER_ALIASES: Record<RosterImportColumnKey, string[]> = {
  displayName: ["ชื่อ", "ชื่อ-นามสกุล", "name", "display_name", "displayname", "ชื่อพนักงาน"],
  phone: ["เบอร์", "เบอร์โทร", "phone", "tel", "mobile", "โทรศัพท์"],
  shift: ["กะ", "shift", "roster_shift_index", "กะที่"],
  active: ["เปิดใช้งาน", "active", "is_active", "สถานะ"],
  branch: ["รหัสสาขา", "branch", "branch_code", "สาขา", "branchcode"],
};

/** ทำให้หัวคอลัมน์จากแบบฟอร์ม (เช่น ชื่อ-นามสกุล* · กะ (1-5)) ตรงกับ alias */
function normalizeHeader(h: string): string {
  return h
    .trim()
    .replace(/\*+$/, "")
    .replace(/\([^)]*\)/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function matchColumn(header: string): RosterImportColumnKey | null {
  const n = normalizeHeader(header);
  if (!n) return null;
  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.some((a) => normalizeHeader(a) === n)) return key as RosterImportColumnKey;
  }
  return null;
}

function buildColumnMap(headerRow: string[]): Partial<Record<RosterImportColumnKey, number>> {
  const colMap: Partial<Record<RosterImportColumnKey, number>> = {};
  headerRow.forEach((h, i) => {
    const key = matchColumn(String(h ?? "").trim());
    if (key != null && colMap[key] == null) colMap[key] = i;
  });
  return colMap;
}

/** หาแถวหัวตาราง — แบบฟอร์มมีแถวหมายเหตุก่อนหัวคอลัมน์ */
function findHeaderRowIndex(table: string[][]): number {
  const limit = Math.min(table.length, 20);
  for (let i = 0; i < limit; i++) {
    const colMap = buildColumnMap(table[i] ?? []);
    if (colMap.displayName != null && colMap.phone != null) return i;
  }
  return -1;
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

function parseActive(raw: string): boolean {
  const t = raw.trim().toLowerCase();
  if (!t || t === "ใช่" || t === "yes" || t === "y" || t === "1" || t === "true" || t === "เปิด") return true;
  if (t === "ไม่" || t === "no" || t === "n" || t === "0" || t === "false" || t === "ปิด") return false;
  return true;
}

function parseShift(raw: string, maxShifts: number): number {
  const n = Number(String(raw).trim());
  if (!Number.isFinite(n) || n < 1) return 0;
  return Math.min(maxShifts, Math.max(1, Math.floor(n))) - 1;
}

function decodeSpreadsheetCellValue(raw: string): string {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .trim();
}

function extractSpreadsheetImportScope(xml: string): string {
  const namedWs = /<Worksheet[^>]*ss:Name="รายชื่อพนักงาน"[^>]*>([\s\S]*?)<\/Worksheet>/i.exec(xml);
  const wsBody = namedWs?.[1] ?? /<Worksheet[^>]*>([\s\S]*?)<\/Worksheet>/i.exec(xml)?.[1];
  if (!wsBody) return xml;
  const table = /<Table>([\s\S]*?)<\/Table>/i.exec(wsBody);
  return table?.[1] ?? wsBody;
}

/** แยกแถว CSV — รองรับ BOM และฟิลด์ในเครื่องหมายคำพูด */
export function parseCsvTable(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

/** ดึงค่าจาก SpreadsheetML (.xls XML) — ชีต «รายชื่อพนักงาน» เท่านั้น */
export function parseSpreadsheetMlTable(xml: string): string[][] {
  const scope = extractSpreadsheetImportScope(xml);
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

export function parseAttendanceRosterImportTable(
  table: string[][],
  maxShifts: number,
): AttendanceRosterImportResult {
  const errors: string[] = [];
  const rows: AttendanceRosterImportRow[] = [];
  if (table.length === 0) {
    return { rows, errors: ["ไฟล์ว่าง"] };
  }

  const headerRowIndex = findHeaderRowIndex(table);
  if (headerRowIndex < 0) {
    return {
      rows,
      errors: [
        "หัวตารางต้องมี «ชื่อ-นามสกุล» และ «เบอร์โทร» — ดาวน์โหลดแบบฟอร์ม Excel แล้วกรอกตามคอลัมน์",
      ],
    };
  }

  const headerRow = table[headerRowIndex]!.map((h) => String(h ?? "").trim());
  const colMap = buildColumnMap(headerRow);

  for (let ri = headerRowIndex + 1; ri < table.length; ri++) {
    const line = table[ri]!;
    const displayName = String(line[colMap.displayName!] ?? "").trim();
    const phoneRaw = String(line[colMap.phone!] ?? "").trim();
    if (!displayName && !phoneRaw) continue;
    if (/^ตัวอย่าง|^example/i.test(displayName)) continue;
    if (/^0812345678$|^0898765432$/.test(normalizePhone(phoneRaw)) && /^(สมชาย|สมหญิง)/.test(displayName)) continue;

    const lineNo = ri + 1;
    if (!displayName) {
      errors.push(`แถว ${lineNo}: ไม่มีชื่อ`);
      continue;
    }
    const phone = normalizePhone(phoneRaw);
    if (phone.length < 9) {
      errors.push(`แถว ${lineNo}: เบอร์ไม่ถูกต้อง (${phoneRaw || "ว่าง"})`);
      continue;
    }
    const shiftRaw = colMap.shift != null ? String(line[colMap.shift] ?? "") : "1";
    const activeRaw = colMap.active != null ? String(line[colMap.active] ?? "") : "ใช่";
    const branchRaw = colMap.branch != null ? String(line[colMap.branch] ?? "").trim() : "";

    rows.push({
      displayName: displayName.slice(0, 100),
      phone,
      rosterShiftIndex: parseShift(shiftRaw, maxShifts),
      isActive: parseActive(activeRaw),
      branchCode: branchRaw.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 20),
    });
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push("ไม่พบแถวข้อมูล — กรอกชื่อและเบอร์อย่างน้อย 1 แถว");
  }

  return { rows, errors };
}

function isBinaryXls(buf: Buffer): boolean {
  return buf.length >= 4 && buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0;
}

function isXlsxZip(buf: Buffer): boolean {
  return buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b;
}

export function parseAttendanceRosterImportFile(
  buf: Buffer,
  filename: string,
  maxShifts: number,
): AttendanceRosterImportResult {
  const lower = filename.toLowerCase();

  if (isXlsxZip(buf) || lower.endsWith(".xlsx")) {
    return {
      rows: [],
      errors: [
        "ไฟล์ .xlsx ยังไม่รองรับ — ใช้ไฟล์ .xls จากปุ่ม «ดาวน์โหลดแบบฟอร์ม Excel» โดยไม่ต้อง Save As เป็นรูปแบบอื่น หรือส่งออกเป็น .csv",
      ],
    };
  }

  if (isBinaryXls(buf)) {
    return {
      rows: [],
      errors: [
        "ไฟล์ Excel รูปแบบเก่า (binary) — ใช้ไฟล์ .xls จากปุ่ม «ดาวน์โหลดแบบฟอร์ม Excel» โดยตรง หรือบันทึกเป็น .csv แล้วอัปโหลด",
      ],
    };
  }

  const text = buf.toString("utf8");

  if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
    return parseAttendanceRosterImportTable(parseCsvTable(text), maxShifts);
  }
  if (lower.endsWith(".xls") || text.includes("urn:schemas-microsoft-com:office:spreadsheet")) {
    return parseAttendanceRosterImportTable(parseSpreadsheetMlTable(text), maxShifts);
  }
  return { rows: [], errors: ["รองรับเฉพาะไฟล์ .xls (จากแบบฟอร์ม) หรือ .csv"] };
}
