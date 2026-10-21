/**
 * คัดลอกแม่แบบ Word คำให้การผู้กล่าวหา → ผู้ต้องหา / พยาน
 * - ช่อง «เป็น» ด้านซ้าย
 * - ผู้ต้องหา: ชื่อแบบฟอร์ม + แถวเกิดแขวง/ตำบล + ข้อความแจ้งข้อหา (แทนเกี่ยวข้อง/สาบานตน)
 *
 * รัน: node scripts/copy-statement-role-docx.mjs
 */
import fs from "fs";
import path from "path";
import PizZip from "pizzip";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "public/smart-police/forms/คำให้การผู้กล่าวหา.docx");
const ROLE_NEEDLE = "<w:t>ผู้กล่าวหา</w:t>";
const TITLE_FROM = "บันทึกคำให้การของผู้ร้องทุกข์  ผู้กล่าวโทษ  หรือพยาน";
const TITLE_TO = "บันทึกคำให้การของผู้ต้องหา";
const SUSPECT_PREAMBLE =
  "และเจ้าพนักงานได้แจ้งให้ข้าพเจ้าทราบถึงข้อเท็จจริงเกี่ยวกับการกระทำที่กล่าวหาข้าพเจ้า กระทำผิดว่า";

const TARGETS = [
  { file: "คำให้การผู้ต้องหา.docx", role: "ผู้ต้องหา", suspect: true },
  { file: "คำให้การพยาน.docx", role: "พยาน", suspect: false },
];

function patchSuspect(zip) {
  let doc = zip.file("word/document.xml").asText();
  if (!doc.includes(TITLE_FROM)) {
    throw new Error("miss complainant title in document.xml");
  }
  doc = doc.replace(TITLE_FROM, TITLE_TO);
  doc = doc.replace("ไม่เกี่ยวข้อง สาบานตนแล้ว", "");
  zip.file("word/document.xml", doc);

  let header = zip.file("word/header3.xml").asText();
  const relA = "<w:t>เกี่ยว</w:t>";
  const relB = "<w:t>ของเป็นอะไรกับคู่กรณี</w:t>";
  const oath = "<w:t>ของให้ถ้อยคำต่อพนักงานสอบสวนด้วยความสัตย์จริงว่า</w:t>";
  if (!header.includes(relA) || !header.includes(relB) || !header.includes(oath)) {
    throw new Error("miss relationship/oath labels in header3.xml");
  }
  header = header.split(relA).join("<w:t>เกิดแขวง/ตำบล</w:t>");
  header = header.split(relB).join("<w:t xml:space=\"preserve\">  เขต/อำเภอ          จังหวัด</w:t>");
  header = header.split(oath).join(`<w:t>${SUSPECT_PREAMBLE}</w:t>`);
  zip.file("word/header3.xml", header);
}

const buf = fs.readFileSync(SRC);

for (const t of TARGETS) {
  const zip = new PizZip(buf);
  const xml = zip.file("word/document.xml").asText();
  const count = xml.split(ROLE_NEEDLE).length - 1;
  if (count !== 1) {
    throw new Error(`expected exactly 1 left-side ผู้กล่าวหา, found ${count}`);
  }
  zip.file("word/document.xml", xml.replace(ROLE_NEEDLE, `<w:t>${t.role}</w:t>`));
  if (t.suspect) patchSuspect(zip);
  const out = path.join(ROOT, "public/smart-police/forms", t.file);
  const gen = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
  fs.writeFileSync(out, gen);
  console.log("wrote", out, `(${gen.length} bytes)`, "เป็น", t.role, t.suspect ? "+ suspect header" : "");
}
