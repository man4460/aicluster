/**
 * สร้างแม่แบบ Word ติดแท็ก {{...}} จากไฟล์ราชการจริง
 * → public/smart-police/templates/statement-complainant.tagged.docx
 *
 * รัน: node scripts/build-statement-docx-template.mjs
 */
import fs from "fs";
import path from "path";
import PizZip from "pizzip";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "public/smart-police/forms/คำให้การผู้กล่าวหา.docx");
const OUT_DIR = path.join(ROOT, "public/smart-police/templates");
const OUT = path.join(OUT_DIR, "statement-complainant.tagged.docx");

/** แทรกแท็กหลังข้อความป้าย (ทั้งก้อนต้องอยู่ใน w:t เดียว) */
function insertTagAfterExactText(xml, label, tag, { every = true } = {}) {
  const needle = `>${label}</w:t>`;
  const run = `<w:r><w:rPr><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t xml:space="preserve">{{${tag}}}</w:t></w:r>`;
  if (!xml.includes(needle)) {
    console.warn("  miss label:", label, "→", tag);
    return xml;
  }
  if (every) return xml.split(needle).join(`>${label}</w:t></w:r>${run}<w:r><w:t>`);
  // first only — but split/join already broken structure if we close/reopen wrong
  // safer: replace sequentially with placeholder then restore
  let done = false;
  return xml.replace(needle, (m) => {
    if (done && !every) return m;
    done = true;
    // insert run after this w:t's parent w:r — simplest: after </w:t> still inside same run is BAD for docxtemplater
    // so close current run and open new
    return `>${label}</w:t></w:r>${run}<w:r><w:rPr/><w:t>`;
  });
}

/**
 * แทรกหลังป้ายโดยหา `>LABEL</w:t></w:r>` แล้วต่อ run ใหม่ (ไม่ทำลาย run เดิม)
 */
function appendTagRunAfterLabel(xml, label, tag) {
  const needle = `>${label}</w:t></w:r>`;
  const run = `<w:r><w:rPr><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t xml:space="preserve"> {{${tag}}}</w:t></w:r>`;
  if (!xml.includes(needle)) {
    // sometimes no immediate </w:r> (props between)
    const loose = new RegExp(
      `>(${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})</w:t>(\\s*<\\/w:r>)`,
      "g",
    );
    if (!loose.test(xml)) {
      console.warn("  miss:", label, "→", tag);
      return xml;
    }
    return xml.replace(loose, `>$1</w:t>$2${run}`);
  }
  const count = xml.split(needle).length - 1;
  console.log(`  + ${tag} after "${label}" ×${count}`);
  return xml.split(needle).join(`>${label}</w:t></w:r>${run}`);
}

function replaceExactText(xml, from, to) {
  const needle = `>${from}</w:t>`;
  if (!xml.includes(needle)) {
    console.warn("  miss replace:", from);
    return xml;
  }
  console.log(`  ~ replace "${from}" → {{${to}}}`);
  return xml.split(needle).join(`>{{${to}}}</w:t>`);
}

function tagHeader(xml) {
  let x = xml;
  const pairs = [
    ["สถานีตำรวจ", "stationName"],
    ["วันที่", "dayThai"],
    ["เดือน", "monthThai"],
    ["พ.ศ.", "yearThai"],
    ["ต่อหน้า", "investigator"],
    ["สอบสวนที่", "interviewPlace"],
    ["ชื่อ", "partyName"],
    ["อายุ", "partyAge"],
    ["เชื้อชาติ", "ethnicity"],
    ["สัญชาติ", "partyNationality"],
    ["ศาสนา", "religion"],
    ["อาชีพ", "partyOccupation"],
    ["อยู่บ้านเลขที่", "houseNo"],
    ["หมู่ที่", "moo"],
    ["ชื่อผู้ใหญ่บ้าน", "villageHead"],
    ["ชื่อกำนัน", "kamnan"],
    ["ชื่อบิดา", "fatherName"],
    ["ชื่อมารดา", "motherName"],
  ];
  for (const [label, tag] of pairs) x = appendTagRunAfterLabel(x, label, tag);

  // เขต /อำเภอ แยก run
  x = appendTagRunAfterLabel(x, "/อำเภอ", "district");
  x = appendTagRunAfterLabel(x, "ตำบล", "tambon");
  x = appendTagRunAfterLabel(x, "เขต/อำเภอ", "amphoe");

  // จังหวัด โผล่ 2 จุดต่อฟอร์ม — ใช้ province ทั้งคู่ (สถานี + ที่อยู่)
  x = appendTagRunAfterLabel(x, "จังหวัด", "province");

  // ชื่อคู่กรณีก่อนป้ายผู้กล่าวหา/ผู้ต้องหา
  x = appendTagRunBeforeLabel(x, "ผู้กล่าวหา", "complainantLine");
  x = appendTagRunBeforeLabel(x, "ผู้ต้องหา", "suspectLine");

  // เกี่ยวข้อง…
  x = appendTagRunAfterLabel(x, "ของเป็นอะไรกับคู่กรณี", "relationshipNote");

  return x;
}

function appendTagRunBeforeLabel(xml, label, tag) {
  const needle = `>${label}</w:t></w:r>`;
  /** แทนข้อความป้ายชั่วคราวด้วยแท็ก แล้วเปิด run ใหม่ใส่ป้ายเดิม */
  const replacement = `>{{${tag}}} </w:t></w:r><w:r><w:rPr><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t>${label}</w:t></w:r>`;
  if (!xml.includes(needle)) {
    console.warn("  miss before:", label, "→", tag);
    return xml;
  }
  const count = xml.split(needle).length - 1;
  console.log(`  + ${tag} before "${label}" ×${count}`);
  return xml.split(needle).join(replacement);
}

function tagDocument(xml) {
  let x = xml;
  x = appendTagRunAfterLabel(x, "คำให้การของ", "partyName");
  x = appendTagRunAfterLabel(x, "หมายเลขโทรศัพท์", "partyPhone");
  x = appendTagRunAfterLabel(x, "บัตรประจำตัวประชาชน", "partyIdCard");
  x = appendTagRunAfterLabel(x, "ออกเมื่อ", "idIssuedOn");
  x = appendTagRunAfterLabel(x, "หมดอายุ", "idExpiresOn");
  x = appendTagRunAfterLabel(x, "ออกให้ ณ", "idIssuedAt");
  x = replaceExactText(x, "กรุงเทพมหานคร", "province");
  x = replaceExactText(x, "ผู้กล่าวหา", "partyRoleLabel");
  x = replaceExactText(x, "ไม่เกี่ยวข้อง สาบานตนแล้ว", "relationshipNote");

  // ข้อความคำให้การ — ใส่ในย่อหน้าว่างแรกหลังตาราง
  const afterTbl = "</w:tbl>";
  const idx = x.indexOf(afterTbl);
  if (idx >= 0) {
    const insertAt = idx + afterTbl.length;
    const bodyRun = `<w:p><w:pPr><w:spacing w:line="276" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t>{{statementBody}}</w:t></w:r></w:p>`;
    x = x.slice(0, insertAt) + bodyRun + x.slice(insertAt);
    console.log("  + statementBody after table");
  }

  return x;
}

function tagContinuationHeader(xml) {
  let x = xml;
  x = appendTagRunAfterLabel(x, " ของ", "partyName");
  x = appendTagRunAfterLabel(x, "แผ่นที่", "pageNo");
  return x;
}

const buf = fs.readFileSync(SRC);
const zip = new PizZip(buf);

console.log("tag word/header3.xml");
zip.file("word/header3.xml", tagHeader(zip.file("word/header3.xml").asText()));

console.log("tag word/document.xml");
zip.file("word/document.xml", tagDocument(zip.file("word/document.xml").asText()));

if (zip.file("word/header2.xml")) {
  console.log("tag word/header2.xml (ใบต่อ)");
  zip.file("word/header2.xml", tagContinuationHeader(zip.file("word/header2.xml").asText()));
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const out = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
fs.writeFileSync(OUT, out);
console.log("wrote", OUT, `(${out.length} bytes)`);
