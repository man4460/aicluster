/**
 * ลบข้อความแบรนด์ «สอบสวน.com» จากไฟล์แบบฟอร์ม Word ใน public/smart-police
 * (ต้นทางใส่ไว้ footer/header โดยแยกเป็น w:t «สอบสวน.» + «com»)
 *
 * รัน: node scripts/strip-smart-police-form-branding.mjs
 */
import fs from "fs";
import path from "path";
import PizZip from "pizzip";

const ROOT = process.cwd();
const DIRS = [
  path.join(ROOT, "public/smart-police/forms"),
  path.join(ROOT, "public/smart-police/templates"),
];

function walkDocx(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const n of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, n.name);
    if (n.isDirectory()) walkDocx(p, acc);
    else if (p.toLowerCase().endsWith(".docx")) acc.push(p);
  }
  return acc;
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

function encodeText(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** ลบแบรนด์ที่อยู่ก้อนเดียวหรือถูกตัดเป็นสอง w:t */
function stripXml(xml) {
  const re = /<w:t([^>]*)>([^<]*)<\/w:t>/g;
  const nodes = [];
  let m;
  while ((m = re.exec(xml))) {
    nodes.push({
      start: m.index,
      end: re.lastIndex,
      attrs: m[1],
      text: decodeEntities(m[2]),
    });
  }

  const drop = new Set();
  const rewrite = new Map();

  for (let i = 0; i < nodes.length; i++) {
    const t = nodes[i].text;
    if (t.includes("สอบสวน.com")) {
      rewrite.set(i, t.replaceAll("สอบสวน.com", "").replaceAll("สอบสวน.COM", ""));
    }
  }
  for (let i = 0; i < nodes.length - 1; i++) {
    if (drop.has(i)) continue;
    const a = rewrite.get(i) ?? nodes[i].text;
    const b = rewrite.get(i + 1) ?? nodes[i + 1].text;
    if (a === "สอบสวน." && b === "com") {
      drop.add(i);
      drop.add(i + 1);
    }
  }

  if (drop.size === 0 && rewrite.size === 0) return { xml, changed: false };

  let out = xml;
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    let next = rewrite.get(i) ?? n.text;
    if (drop.has(i)) next = "";
    if (next === n.text && !drop.has(i)) continue;
    const tag = `<w:t${n.attrs}>${encodeText(next)}</w:t>`;
    out = out.slice(0, n.start) + tag + out.slice(n.end);
  }
  return { xml: out, changed: true };
}

function stripDocx(file) {
  const zip = new PizZip(fs.readFileSync(file));
  let hits = 0;
  for (const name of Object.keys(zip.files)) {
    if (zip.files[name].dir || !name.endsWith(".xml")) continue;
    const orig = zip.file(name).asText();
    const { xml, changed } = stripXml(orig);
    if (!changed) continue;
    zip.file(name, xml);
    hits += 1;
  }
  if (hits === 0) return { file, hits: 0 };
  const out = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
  fs.writeFileSync(file, out);
  return { file, hits };
}

const files = DIRS.flatMap((d) => walkDocx(d));
let changed = 0;
for (const f of files) {
  const r = stripDocx(f);
  if (r.hits) {
    changed += 1;
    console.log("stripped", path.relative(ROOT, f), `(${r.hits} xml)`);
  }
}
console.log(`done: ${changed}/${files.length} docx`);
