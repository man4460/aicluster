/**
 * ตรวจ model SmartPoliceCasePreset + การเติม preset ลงฐานข้อมูล
 * ใช้: npx tsx scripts/smart-police/verify-case-preset-seed.ts
 */

import { prisma } from "../../src/lib/prisma";
import { SMART_POLICE_CASE_PRESETS } from "../../src/lib/smart-police/case-presets/catalog";
import { ensureSmartPoliceCasePresets } from "../../src/lib/smart-police/case-presets/ensure-builtin";

async function main() {
  const owner = await prisma.user.findFirst({ select: { id: true } });
  if (!owner) {
    console.log("ข้าม: ยังไม่มีผู้ใช้ในฐานข้อมูล (ทดสอบเฉพาะ schema)");
    const count = await prisma.smartPoliceCasePreset.count();
    console.log("smart_police_case_presets อ่านได้, rows =", count);
    return;
  }

  const created = await ensureSmartPoliceCasePresets(owner.id);
  const again = await ensureSmartPoliceCasePresets(owner.id);
  const rows = await prisma.smartPoliceCasePreset.findMany({
    where: { ownerUserId: owner.id },
    orderBy: { sortOrder: "asc" },
    select: { key: true, caseType: true, formSlugs: true, starterFieldsJson: true, defaultCustodyMode: true },
  });

  const bad = rows.filter((r) => {
    try {
      const slugs = JSON.parse(r.formSlugs);
      JSON.parse(r.starterFieldsJson);
      return !Array.isArray(slugs) || slugs.length === 0;
    } catch {
      return true;
    }
  });

  console.log(`สร้างใหม่ ${created} · รันซ้ำ ${again} (ต้องเป็น 0) · แถวทั้งหมด ${rows.length}/${SMART_POLICE_CASE_PRESETS.length}`);
  console.log("JSON เพี้ยน:", bad.length);
  for (const r of rows) {
    const slugs = JSON.parse(r.formSlugs) as string[];
    console.log(`  ${r.key.padEnd(10)} ${r.caseType.padEnd(14)} ${String(slugs.length).padStart(2)} ฟอร์ม · ${r.defaultCustodyMode}`);
  }

  const ok = again === 0 && rows.length === SMART_POLICE_CASE_PRESETS.length && bad.length === 0;
  console.log(ok ? "ผล: ผ่าน" : "ผล: ไม่ผ่าน");
  process.exit(ok ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
