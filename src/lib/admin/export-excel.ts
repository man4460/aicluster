/**
 * Export ตารางแอดมินเป็นไฟล์ Excel (SpreadsheetML .xls)
 * เปิดด้วย Microsoft Excel / Google Sheets ได้โดยไม่ต้องพึ่งไลบรารี xlsx
 */

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cellXml(value: string | number | null | undefined): string {
  if (value == null) {
    return `<Cell><Data ss:Type="String"></Data></Cell>`;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${xmlEscape(String(value))}</Data></Cell>`;
}

export type AdminExcelDownloadInput = {
  /** ชื่อไฟล์ไม่มีนามสกุล — จะต่อ .xls ให้ */
  filename: string;
  sheetName?: string;
  headers: string[];
  rows: Array<Array<string | number | null | undefined>>;
};

/** ดาวน์โหลดชีต Excel จากแถวที่มองเห็นอยู่บนหน้า (เช่นหลังกรอง) */
export function downloadAdminExcel({
  filename,
  sheetName = "Sheet1",
  headers,
  rows,
}: AdminExcelDownloadInput): void {
  if (typeof window === "undefined") return;

  const safeSheet = xmlEscape(sheetName.slice(0, 31) || "Sheet1");
  const headerRow = `<Row>${headers.map((h) => cellXml(h)).join("")}</Row>`;
  const bodyRows = rows.map((r) => `<Row>${r.map((c) => cellXml(c)).join("")}</Row>`).join("");

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="${safeSheet}">
  <Table>
   ${headerRow}
   ${bodyRows}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  const base = filename.replace(/\.xls$/i, "").trim() || "export";
  a.href = url;
  a.download = `${base}-${stamp}.xls`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
