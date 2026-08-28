/** สร้างแบบฟอร์ม Excel (SpreadsheetML) สำหรับนำเข้ารายชื่อพนักงาน */

export type AttendanceRosterImportBranchRef = {
  code: string;
  name: string;
  address?: string;
};

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

export function buildAttendanceRosterImportTemplateXls(
  branches: AttendanceRosterImportBranchRef[] = [],
): string {
  const headers = ["ชื่อ-นามสกุล*", "เบอร์โทร*", "รหัสสาขา", "กะ (1-5)", "เปิดใช้งาน (ใช่/ไม่)"];
  const mainCode = branches[0]?.code ?? "MAIN";
  const secondCode = branches[1]?.code ?? "";
  const examples: string[][] = [
    ["สมชาย ใจดี", "0812345678", mainCode, "1", "ใช่"],
    ["สมหญิง รักงาน", "0898765432", secondCode, "2", "ใช่"],
  ];

  const note =
    branches.length > 0
      ? "กรอกใต้หัวคอลัมน์ · * จำเป็น · รหัสสาขาดูชีต «รหัสสาขา» · ว่าง = ทุกสาขา · ลบแถวตัวอย่างก่อนนำเข้า"
      : "กรอกใต้หัวคอลัมน์ · * จำเป็น · ตั้งสาขาในเมนูตั้งค่าก่อน แล้วดาวน์โหลดแบบฟอร์มใหม่เพื่อดูรหัสสาขา";

  const branchSheetRows =
    branches.length > 0
      ? [
          row(["รหัสสาขา", "ชื่อสาขา", "ที่อยู่"]),
          ...branches.map((b) => row([b.code, b.name, b.address?.trim() ?? ""])),
          row([]),
          row(["หมายเหตุ", "ใส่รหัสสาขาในชีต «รายชื่อพนักงาน» คอลัมน์ C — ว่าง = พนักงานเช็คได้ทุกสาขา", ""]),
        ].join("\n   ")
      : [
          row(["รหัสสาขา", "ชื่อสาขา", "ที่อยู่"]),
          row(["—", "ยังไม่มีสาขาในระบบ", "ไปที่ ตั้งค่าเช็คอิน › สาขา · จุดเช็ค แล้วบันทึก"]),
          row(["MAIN", "ตัวอย่างหลังสร้างสาขา", ""]),
        ].join("\n   ");

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
 <Worksheet ss:Name="รายชื่อพนักงาน">
  <Table>
   <Row ss:StyleID="Note"><Cell ss:MergeAcross="4"><Data ss:Type="String">${xmlEscape(note)}</Data></Cell></Row>
   <Row ss:StyleID="Header">${headers.map((h) => cell(h)).join("")}</Row>
   ${examples.map((ex) => row(ex)).join("\n   ")}
  </Table>
 </Worksheet>
 <Worksheet ss:Name="รหัสสาขา">
  <Table>
   ${branchSheetRows}
  </Table>
 </Worksheet>
 <Worksheet ss:Name="คำอธิบาย">
  <Table>
   ${row(["คอลัมน์", "รายละเอียด"])}
   ${row(["ชื่อ-นามสกุล*", "ชื่อที่แสดงตอนเช็คอิน"])}
   ${row(["เบอร์โทร*", "9–15 หลัก ไม่ซ้ำในองค์กร — ซ้ำจะอัปเดตแถวเดิม"])}
   ${row(["รหัสสาขา", "รหัสจากชีต «รหัสสาขา» เช่น MAIN, BKK — ว่าง = สังกัดทุกสาขา (เช็คได้ทุกจุด)"])}
   ${row(["กะ (1-5)", "ลำดับกะตามที่ตั้งใน ตั้งค่า › สาขา · จุดเช็ค (ค่าเริ่ม 1)"])}
   ${row(["เปิดใช้งาน", "ใช่ หรือ ไม่ (ค่าเริ่ม ใช่)"])}
   ${row(["หมายเหตุ", "ลงทะเบียนใบหน้า / ลายนิ้วมือ ทำในระบบหลังนำเข้า"])}
  </Table>
 </Worksheet>
</Workbook>`;
}
