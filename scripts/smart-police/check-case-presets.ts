/**
 * ตรวจว่า slug ทุกตัวใน SMART_POLICE_CASE_PRESETS มีอยู่จริงใน SMART_POLICE_OFFICIAL_FORM_TEMPLATES
 * และ preset ครอบคลุมประเภทคดีที่ฐานคดีเก่าใช้จริง
 *
 * ใช้: npx tsx scripts/smart-police/check-case-presets.ts
 */

import {
  SMART_POLICE_CASE_PRESETS,
  caseTypesWithPresets,
} from "../../src/lib/smart-police/case-presets/catalog";
import { SMART_POLICE_OFFICIAL_FORM_TEMPLATES } from "../../src/lib/smart-police/form-templates/official-form-catalog";

const known = new Set(SMART_POLICE_OFFICIAL_FORM_TEMPLATES.map((t) => t.slug));
const errors: string[] = [];

for (const preset of SMART_POLICE_CASE_PRESETS) {
  if (preset.formSlugs.length === 0) {
    errors.push(`[${preset.key}] ไม่มีฟอร์มในชุดเอกสาร`);
  }
  for (const slug of preset.formSlugs) {
    if (!known.has(slug)) {
      errors.push(`[${preset.key}] slug "${slug}" ไม่มีใน SMART_POLICE_OFFICIAL_FORM_TEMPLATES`);
    }
  }
  const dupes = preset.formSlugs.filter((s, i) => preset.formSlugs.indexOf(s) !== i);
  for (const d of new Set(dupes)) {
    errors.push(`[${preset.key}] slug ซ้ำ: "${d}"`);
  }
  if (!preset.chargeText.trim()) {
    errors.push(`[${preset.key}] ไม่มี chargeText`);
  }
  if (!preset.lawRefs.trim()) {
    errors.push(`[${preset.key}] ไม่มี lawRefs`);
  }
}

const types = caseTypesWithPresets();
for (const required of ["คดีจราจร", "คดียาเสพติด", "คดีทรัพย์"]) {
  if (!types.includes(required as never)) {
    errors.push(`ไม่มี preset ของประเภทคดี "${required}" (มีในฐานคดีเก่า)`);
  }
}

const keys = SMART_POLICE_CASE_PRESETS.map((p) => p.key);
for (const k of new Set(keys.filter((x, i) => keys.indexOf(x) !== i))) {
  errors.push(`key ซ้ำ: "${k}"`);
}

if (errors.length > 0) {
  console.error(`ไม่ผ่าน ${errors.length} ข้อ:`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}

console.log(
  `ผ่าน: ${SMART_POLICE_CASE_PRESETS.length} preset · ${types.length} ประเภทคดี · slug ตรวจครบ ${new Set(SMART_POLICE_CASE_PRESETS.flatMap((p) => p.formSlugs)).size} ตัว`,
);
