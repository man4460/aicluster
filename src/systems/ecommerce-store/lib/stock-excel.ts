import { parseCsvTable } from "@/lib/attendance/roster-import";

function decodeSpreadsheetCellValue(raw: string): string {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .trim();
}

function parseSpreadsheetMlTable(xml: string): string[][] {
  const namedWs =
    /<Worksheet[^>]*ss:Name="สต๊อกสินค้า"[^>]*>([\s\S]*?)<\/Worksheet>/i.exec(xml) ??
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

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cell(value: string, styleId?: string): string {
  const style = styleId ? ` ss:StyleID="${styleId}"` : "";
  return `<Cell${style}><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`;
}

function row(cells: string[], textColIndexes1Based: number[] = []): string {
  const textCols = new Set(textColIndexes1Based);
  return `<Row>${cells
    .map((v, i) => cell(v, textCols.has(i + 1) ? "Text" : undefined))
    .join("")}</Row>`;
}

/** คอลัมน์มาตรฐานแบบฟอร์มสต๊อก */
export const ECOMMERCE_STOCK_EXCEL_HEADERS = [
  "รหัสสินค้า",
  "ชื่อสินค้า*",
  "หมวดหมู่",
  "ราคา",
  "จำนวนสต๊อก*",
  "เปิดใช้งาน",
] as const;

export type EcommerceStockExcelRow = {
  sku: string;
  name: string;
  categoryName: string;
  priceBaht: number | null;
  stockBalance: number;
  isActive: boolean;
};

type StdCol = "sku" | "name" | "categoryName" | "priceBaht" | "stockBalance" | "isActive";

const HEADER_ALIASES: Record<StdCol, string[]> = {
  sku: ["รหัสสินค้า", "sku", "รหัส", "code", "product_code"],
  name: ["ชื่อสินค้า", "ชื่อ", "name", "product", "product_name"],
  categoryName: ["หมวดหมู่", "หมวด", "category", "หมวดสินค้า"],
  priceBaht: ["ราคา", "price", "ราคาบาท", "price_baht"],
  stockBalance: ["จำนวนสต๊อก", "สต๊อก", "stock", "qty", "quantity", "จำนวน"],
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

function parseYesNo(raw: string, defaultYes = true): boolean {
  const t = raw.trim().toLowerCase();
  if (!t) return defaultYes;
  if (["ใช่", "yes", "y", "1", "true", "เปิด", "active"].includes(t)) return true;
  if (["ไม่", "no", "n", "0", "false", "ปิด", "inactive"].includes(t)) return false;
  return defaultYes;
}

function parseNonNegInt(raw: string): number | null {
  const t = raw.trim().replace(/,/g, "");
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

function parseNonNegNumber(raw: string): number | null {
  const t = raw.trim().replace(/,/g, "");
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

function findHeaderRowIndex(table: string[][]): number {
  for (let i = 0; i < Math.min(table.length, 8); i++) {
    const cols = (table[i] ?? []).map((c) => matchStdColumn(String(c ?? "")));
    if (cols.includes("name") && cols.includes("stockBalance")) return i;
    if (cols.includes("name")) return i;
  }
  return -1;
}

function workbookShell(sheetName: string, tableInner: string, guideRows: string): string {
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
  <Style ss:ID="Text"><NumberFormat ss:Format="@"/></Style>
 </Styles>
 <Worksheet ss:Name="${xmlEscape(sheetName)}">
  <Table>
   <Column ss:Index="1" ss:StyleID="Text" ss:Width="120"/>
   <Column ss:Index="5" ss:StyleID="Text" ss:Width="100"/>
${tableInner}
  </Table>
 </Worksheet>
 <Worksheet ss:Name="คำอธิบาย">
  <Table>
${guideRows}
  </Table>
 </Worksheet>
</Workbook>`;
}

const GUIDE_ROWS = [
  row(["คอลัมน์", "รายละเอียด"]),
  row(["รหัสสินค้า", "SKU — ถ้ามีและซ้ำจะอัปเดตแถวเดิม (แนะนำ)"]),
  row(["ชื่อสินค้า*", "ชื่อสินค้า — จำเป็น · ถ้าไม่มี SKU จะจับคู่ด้วยชื่อ"]),
  row(["หมวดหมู่", "ชื่อหมวด — ถ้ายังไม่มีระบบจะสร้างให้อัตโนมัติ"]),
  row(["ราคา", "ราคาขายบาท (ตัวเลข)"]),
  row(["จำนวนสต๊อก*", "จำนวนคงเหลือ (จำนวนเต็ม ≥ 0)"]),
  row(["เปิดใช้งาน", "ใช่ หรือ ไม่"]),
]
  .map((r) => `   ${r}`)
  .join("\n");

export function buildEcommerceStockImportTemplateXls(): string {
  const headers = [...ECOMMERCE_STOCK_EXCEL_HEADERS];
  const examples: string[][] = [
    ["SKU-001", "ครีมบำรุงผิว", "สกินแคร์", "299", "50", "ใช่"],
    ["SKU-002", "สบู่เหลว", "ของใช้", "89", "120", "ใช่"],
  ];
  const note =
    "กรอกใต้หัวคอลัมน์ · * จำเป็น · รหัสสินค้าเป็นข้อความ · ลบแถวตัวอย่างก่อนนำเข้า · สต๊อกจะถูกหักอัตโนมัติเมื่อขายหน้าร้านและเว็บลูกค้า";

  const tableInner = `   <Row ss:StyleID="Note"><Cell ss:MergeAcross="${Math.max(headers.length - 1, 0)}"><Data ss:Type="String">${xmlEscape(note)}</Data></Cell></Row>
   <Row ss:StyleID="Header">${headers.map((h) => cell(h)).join("")}</Row>
   ${examples.map((ex) => row(ex, [1, 5])).join("\n   ")}`;

  return workbookShell("สต๊อกสินค้า", tableInner, GUIDE_ROWS);
}

export function buildEcommerceStockExportXls(
  products: Array<{
    sku: string | null;
    name: string;
    categoryName: string | null;
    priceBaht: string | number;
    stockBalance: number;
    isActive: boolean;
  }>,
): string {
  const headers = [...ECOMMERCE_STOCK_EXCEL_HEADERS];
  const note = `ส่งออก ${products.length} รายการ · ${new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}`;
  const dataRows = products.map((p) =>
    row(
      [
        p.sku ?? "",
        p.name,
        p.categoryName ?? "",
        String(p.priceBaht),
        String(p.stockBalance),
        p.isActive ? "ใช่" : "ไม่",
      ],
      [1, 5],
    ),
  );
  const tableInner = `   <Row ss:StyleID="Note"><Cell ss:MergeAcross="${Math.max(headers.length - 1, 0)}"><Data ss:Type="String">${xmlEscape(note)}</Data></Cell></Row>
   <Row ss:StyleID="Header">${headers.map((h) => cell(h)).join("")}</Row>
   ${dataRows.join("\n   ")}`;
  return workbookShell("สต๊อกสินค้า", tableInner, GUIDE_ROWS);
}

export type EcommerceStockImportResult = {
  rows: EcommerceStockExcelRow[];
  errors: string[];
};

function parseEcommerceStockImportTable(table: string[][]): EcommerceStockImportResult {
  const errors: string[] = [];
  const rows: EcommerceStockExcelRow[] = [];
  if (table.length === 0) return { rows, errors: ["ไฟล์ว่าง"] };

  const headerRowIndex = findHeaderRowIndex(table);
  if (headerRowIndex < 0) {
    return {
      rows,
      errors: ["หัวตารางต้องมีคอลัมน์ «ชื่อสินค้า» — ดาวน์โหลดแบบฟอร์ม Excel แล้วกรอกตามคอลัมน์"],
    };
  }

  const headerRow = (table[headerRowIndex] ?? []).map((h) => String(h ?? "").trim());
  const colMap: Partial<Record<StdCol, number>> = {};
  headerRow.forEach((h, i) => {
    const key = matchStdColumn(h);
    if (key && colMap[key] == null) colMap[key] = i;
  });

  if (colMap.name == null) {
    return { rows, errors: ["ไม่พบคอลัมน์ «ชื่อสินค้า»"] };
  }
  if (colMap.stockBalance == null) {
    return { rows, errors: ["ไม่พบคอลัมน์ «จำนวนสต๊อก»"] };
  }

  for (let ri = headerRowIndex + 1; ri < table.length; ri++) {
    const line = table[ri] ?? [];
    const name = String(line[colMap.name!] ?? "").trim();
    if (!name) continue;
    if (/^ตัวอย่าง|^example/i.test(name)) continue;
    if (name === "ครีมบำรุงผิว" || name === "สบู่เหลว") continue;

    const lineNo = ri + 1;
    const stockRaw = String(line[colMap.stockBalance!] ?? "").trim();
    const stock = parseNonNegInt(stockRaw);
    if (stock == null) {
      errors.push(`แถว ${lineNo}: จำนวนสต๊อกไม่ถูกต้อง`);
      continue;
    }

    const priceRaw =
      colMap.priceBaht != null ? String(line[colMap.priceBaht] ?? "").trim() : "";
    const priceBaht = priceRaw ? parseNonNegNumber(priceRaw) : null;
    if (priceRaw && priceBaht == null) {
      errors.push(`แถว ${lineNo}: ราคาไม่ถูกต้อง`);
      continue;
    }

    rows.push({
      sku: colMap.sku != null ? String(line[colMap.sku] ?? "").trim().slice(0, 64) : "",
      name: name.slice(0, 200),
      categoryName:
        colMap.categoryName != null
          ? String(line[colMap.categoryName] ?? "").trim().slice(0, 120)
          : "",
      priceBaht,
      stockBalance: stock,
      isActive: parseYesNo(
        colMap.isActive != null ? String(line[colMap.isActive] ?? "") : "",
        true,
      ),
    });
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push("ไม่พบแถวข้อมูล — กรอกชื่อสินค้าอย่างน้อย 1 แถว");
  }
  return { rows, errors };
}

function isBinaryXls(buf: Buffer): boolean {
  return buf.length >= 4 && buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0;
}

function isXlsxZip(buf: Buffer): boolean {
  return buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b;
}

export function parseEcommerceStockImportFile(buf: Buffer, filename: string): EcommerceStockImportResult {
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
      ? parseSpreadsheetMlTable(text)
      : parseCsvTable(text);
  return parseEcommerceStockImportTable(table);
}
