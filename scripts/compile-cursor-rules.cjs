const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const rulesDir = path.join(root, ".cursor", "rules");
const outPath = path.join(root, "PROJECT_RULES_FULL_COPY.md");

const files = fs.readdirSync(rulesDir).filter((f) => f.endsWith(".mdc")).sort();

const lines = [
  "# MAWELL (Ai Cluster) — รวมกฎโปรเจกต์",
  "",
  "ไฟล์นี้รวม `AGENTS.md` + ทุกไฟล์ใน `.cursor/rules/*.mdc` (UTF-8) — เปิดไฟล์นี้แล้ว Select All เพื่อ copy ครั้งเดียวได้",
  "",
  "**แหล่งจริงที่ Cursor ใช้:** ไฟล์ `.mdc` แยกใน `.cursor/rules/` — ถ้าแก้กฎ ให้อัปเดตที่นั่น แล้วรัน `node scripts/compile-cursor-rules.cjs` เพื่อสร้างไฟล์รวมนี้ใหม่",
  "",
  "---",
  "",
  "## AGENTS.md",
  "",
  fs.readFileSync(path.join(root, "AGENTS.md"), "utf8").trimEnd(),
  "",
  "---",
  "",
  "## .cursor/rules",
  "",
];

for (const f of files) {
  lines.push("");
  lines.push("=".repeat(80));
  lines.push(`### .cursor/rules/${f}`);
  lines.push("=".repeat(80));
  lines.push("");
  lines.push(fs.readFileSync(path.join(rulesDir, f), "utf8").trimEnd());
  lines.push("");
}

fs.writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Wrote ${outPath} (${files.length} rules + AGENTS)`);
