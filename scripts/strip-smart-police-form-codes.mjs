/**
 * ลบรหัสแบบราชการมุมแผ่น เช่น (ส ๕๖ – ๒๖) / (ส ๕๖ - ๔) / (ส ๕๖ - ๓/๑) / ค.๑๘๕ - ต.๗๖๕
 * จากไฟล์ Word ใน public/smart-police (รวมกรณีตัดเป็นหลาย w:t)
 *
 * รัน: node scripts/strip-smart-police-form-codes.mjs
 */
import fs from "fs";
import path from "path";
import PizZip from "pizzip";

const ROOT = process.cwd();
const DIRS = [
  path.join(ROOT, "public/smart-police/forms"),
  path.join(ROOT, "public/smart-police/templates"),
];

const FORM_CODE_RE =
  /\(?\s*ส\.?\s*[๕5][๖6]\s*[-–—‐]\s*[๐-๙0-9]+(?:\/[๐-๙0-9]+)?\s*\)?/;
const PRINT_CODE_RE = /ค\.?\s*[๐-๙0-9]+\s*[-–—]?\s*ต\.?\s*[๐-๙0-9]+/;
const PATTERNS = [FORM_CODE_RE, PRINT_CODE_RE];
const WINDOW = 14;

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

function collectNodes(xml) {
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
  return nodes;
}

function longestPrefixMatch(text) {
  let best = "";
  for (const re of PATTERNS) {
    const m = text.match(re);
    if (m && m.index === 0 && m[0].length > best.length) best = m[0];
  }
  return best;
}

function stripXml(xml) {
  const nodes = collectNodes(xml);
  if (!nodes.length) return { xml, found: [] };

  const next = nodes.map((n) => n.text);
  const found = [];

  for (let i = 0; i < nodes.length; i++) {
    if (!next[i]) continue;
    let joined = "";
    let best = "";
    let bestEnd = i;
    for (let w = 0; w < WINDOW && i + w < nodes.length; w++) {
      joined += next[i + w];
      const hit = longestPrefixMatch(joined);
      if (hit && hit.length > best.length) {
        best = hit;
        bestEnd = i + w;
      }
    }
    if (!best) continue;
    found.push(best);
    let remain = best.length;
    for (let k = i; k <= bestEnd && remain > 0; k++) {
      const t = next[k];
      const take = Math.min(remain, t.length);
      next[k] = t.slice(take);
      remain -= take;
    }
  }

  if (!found.length) return { xml, found };

  let out = xml;
  for (let i = nodes.length - 1; i >= 0; i--) {
    if (next[i] === nodes[i].text) continue;
    const n = nodes[i];
    const tag = `<w:t${n.attrs}>${encodeText(next[i])}</w:t>`;
    out = out.slice(0, n.start) + tag + out.slice(n.end);
  }
  return { xml: out, found };
}

function stripDocx(file) {
  const zip = new PizZip(fs.readFileSync(file));
  const hits = [];
  for (const name of Object.keys(zip.files)) {
    if (zip.files[name].dir || !name.endsWith(".xml")) continue;
    const orig = zip.file(name).asText();
    const { xml, found } = stripXml(orig);
    if (!found.length) continue;
    zip.file(name, xml);
    hits.push(...found.map((t) => `${name}: ${t}`));
  }
  if (hits.length === 0) return { file, hits };
  const out = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
  fs.writeFileSync(file, out);
  return { file, hits };
}

const files = DIRS.flatMap((d) => walkDocx(d));
let changed = 0;
for (const f of files) {
  const r = stripDocx(f);
  if (r.hits.length) {
    changed += 1;
    console.log("stripped", path.relative(ROOT, f));
    for (const h of r.hits) console.log("  -", h);
  }
}
console.log(`done: ${changed}/${files.length} docx`);
