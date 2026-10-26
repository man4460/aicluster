/**
 * ตรวจ API case-presets โดยเรียก handler ตรง (ข้าม middleware ที่ต้อง login)
 * ใช้: npx tsx scripts/smart-police/verify-case-preset-api.ts
 */

import { NextResponse } from "next/server";
import { prisma } from "../../src/lib/prisma";
import { SMART_POLICE_CASE_PRESETS } from "../../src/lib/smart-police/case-presets/catalog";

/** แทน withSmartPoliceOwner ด้วย owner คนแรกในฐานข้อมูล (ไม่แตะไฟล์ production) */
async function main() {
  const owner = await prisma.user.findFirst({ select: { id: true } });
  if (!owner) {
    console.error("ไม่พบผู้ใช้ในฐานข้อมูล — ทดสอบ API ไม่ได้");
    process.exit(1);
  }

  // เรียก logic เดียวกับ route โดยตรง (route ถูกผูกกับ session ผ่าน middleware)
  const { ensureSmartPoliceCasePresets } = await import(
    "../../src/lib/smart-police/case-presets/ensure-builtin"
  );
  await ensureSmartPoliceCasePresets(owner.id);

  const rows = await prisma.smartPoliceCasePreset.findMany({
    where: { ownerUserId: owner.id, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  const presets = rows.map((r) => {
    const starterFields = JSON.parse(r.starterFieldsJson) as Record<string, string>;
    const formSlugs = JSON.parse(r.formSlugs) as string[];
    return { ...r, starterFields, formSlugs };
  });

  const problems: string[] = [];
  for (const p of presets) {
    if (!Array.isArray(p.formSlugs) || p.formSlugs.length === 0) {
      problems.push(`${p.key}: formSlugs ว่าง`);
    }
    if (typeof p.starterFields !== "object" || p.starterFields === null) {
      problems.push(`${p.key}: starterFields ไม่ใช่ object`);
    }
    if (!p.defaultChargeText?.trim()) problems.push(`${p.key}: ไม่มี defaultChargeText`);
  }

  const byKey = new Map(presets.map((p) => [p.key, p]));
  const single = byKey.get("traffic");
  if (!single) problems.push("ไม่พบ preset key=traffic (กรณี GET [id])");

  console.log(`รายการ: ${presets.length} preset · ประเภทคดี ${new Set(presets.map((p) => p.caseType)).size}`);
  for (const p of presets) {
    console.log(
      `  ${p.key.padEnd(10)} ${p.caseType.padEnd(12)} formSlugs=${String(p.formSlugs.length).padStart(2)} starterFields=${Object.keys(p.starterFields).length}`,
    );
  }
  if (single) {
    console.log(
      `GET [id] (key=traffic) → ${single.formSlugs.length} ฟอร์ม · ข้อหา "${single.defaultChargeText.slice(0, 40)}"`,
    );
  }

  // ตรวจรูปร่าง DTO ที่ API คืน (mapCasePreset ทำงานจริง)
  const { mapCasePreset } = await import("../../src/app/api/smart-police/case-presets/route");
  const dto = mapCasePreset(rows[0], owner.id);
  const dtoOk =
    typeof dto.id === "string" &&
    typeof dto.key === "string" &&
    Array.isArray(dto.formSlugs) &&
    typeof dto.starterFields === "object" &&
    dto.formSlugs.length > 0;
  if (!dtoOk) problems.push("mapCasePreset คืนรูปร่างไม่ถูก");

  const expected = SMART_POLICE_CASE_PRESETS.length;
  const ok = problems.length === 0 && presets.length === expected;
  if (problems.length) {
    console.error("ปัญหา:\n  - " + problems.join("\n  - "));
  }
  console.log(ok ? `ผล: ผ่าน (${presets.length}/${expected} preset, DTO ถูกต้อง)` : "ผล: ไม่ผ่าน");
  void NextResponse;
  process.exit(ok ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
